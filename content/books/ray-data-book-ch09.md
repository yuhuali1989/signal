---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第9章: 与 Daft 的横向对比——架构、潜力与社区投入"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "9"
chapterTitle: "与 Daft 的横向对比：架构、潜力与社区投入"
description: "从架构（Swordfish/Flotilla vs StreamingExecutor）、查询优化器、多模态类型、基准争议（Daft 2-7x vs Anyscale 反超）、社区与资本投入（Eventual 2750 万美元 vs Ray/Anyscale 生态）、以及二者并非替代而是共生的 DREAM 栈视角，全面对比 Ray Data 与 Daft"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Ray Data"
  - "Daft"
  - "Eventual"
  - "Swordfish"
  - "Flotilla"
  - "多模态数据引擎"
  - "基准对比"
  - "社区投入"
type: "book"
---

## 9.1 先厘清一个常见误解：Daft 不是 Ray Data 的"敌人"

在深入技术对比之前，必须先拆掉一个认知陷阱：**Daft 的分布式后端本身就是 Ray**。

Daft 的单机执行引擎叫 **Swordfish**（Rust 实现、Morsel-driven 流式）；当数据规模超出单机，只需一行切换：

```python
import daft
daft.context.set_runner_ray(address="ray://my-cluster:10001")
```

此时 Daft 的分布式执行器 **Flotilla**（也称 Ray Runner）会把 Physical Plan 的 Task 下发到每个节点上的 Swordfish Worker，而**跨节点的数据交换默认走的就是 Ray 的 Object Store** ——和 Ray Data 用的是同一套底层传输。换句话说：

> **Daft 是"长在 Ray 之上的、更聪明的 DataFrame 引擎"；Ray Data 是"Ray 原生附带的、够用的数据管道组件"。**

二者真正的竞争发生在 **DataFrame/ETL API 层**，而不是分布式运行时层。理解了这一点，后面所有对比才站得住。CloudKitchens 把整套基础设施命名为 **DREAM 栈**（Daft + Ray + poEtry + Argo + Metaflow），正是"用 Daft 做 DataFrame，用 Ray 做计算"的共生范式。

---

## 9.2 架构解剖：两条不同的设计哲学

### 9.2.1 Daft 的双引擎结构

| 层 | 组件 | 技术要点 |
|---|---|---|
| 用户接口 | DataFrame API / SQL（PostgreSQL 方言） | 全惰性（Lazy），操作只记录进 LogicalPlan |
| 查询优化 | RBO + CBO 优化器 | 谓词下推、列裁剪、Limit 下推、自动重排 |
| 单机执行 | **Swordfish**（Rust） | Morsel-driven 流式、Arrow 列式、SIMD 向量化、tokio 异步 I/O |
| 分布式执行 | **Flotilla**（Ray Runner） | Driver/Worker 架构，Ray Object Store Shuffle + Arrow Flight Shuffle（Beta） |
| 内存模型 | Apache Arrow | 列式内存，PyTorch/NumPy 零拷贝共享指针 |
| 类型系统 | 多模态一等公民 | Image / Video / Audio / URL / Tensor / Embedding 直接作为列类型 |

Daft 的核心卖点一句话概括：**用 Rust 的执行效率消除 PySpark 的 JVM↔Python 序列化开销，把多模态数据当成普通列处理**。看一个原生多模态流水线：

```python
import daft
df = daft.from_glob_path("s3://bucket/laion/*")
df = df.with_column("image", df["path"].url.download().image.decode())
df = df.with_column("resized", df["image"].image.resize(32, 32))
df.show(3)
```

图像下载、解码、resize 全部在 Arrow 内存里以列运算完成，**无需把图片当 Python 对象或 bytes blob 在进程间反复序列化**。

### 9.2.2 Ray Data 的结构（回顾第 3–4 章）

Ray Data 没有独立的查询优化器，它的执行模型是 **LogicalPlan → PhysicalPlan（算子融合）→ StreamingExecutor 流式调度**。关键差异：

- **没有 CBO**：不会自动做谓词下推/列裁剪的代价重排，依赖用户手动 `.filter()` 顺序与 `.repartition()`。
- **没有多模态类型**：图像在 Ray Data 里是 `bytes` 或 Python 对象，要自己写 `map_batches` 把 bytes 解码成 tensor。
- **背压靠 StreamingExecutor 的 out-queue 水位**：第 5 章讲过，靠逐算子资源预留 + 最小 out-queue 优先调度来防 OOM，没有 Arrow 列式带来的"天然"内存紧凑性。
- **与 Ray Train/Serve 深度耦合**：`.iter_torch_batches()` 直接喂给 Train，这是 Daft 没有的生态位。

### 9.2.3 一张表看懂本质差异

| 维度 | Ray Data | Daft |
|---|---|---|
| 实现语言 | Python + Ray Core（C++ 调度） | Rust 核心 + Python 绑定 |
| 查询优化器 | 无（仅算子融合规则） | RBO + CBO 完整优化器 |
| 内存格式 | 对象（Arrow block 但非列式计算） | Arrow 列式，SIMD 向量化 |
| 多模态类型 | 需手动 bytes→tensor | Image/Video/Audio/Tensor 一等公民 |
| 单机引擎 | 无独立引擎（直接 Ray task） | Swordfish（Morsel-driven 流式） |
| 分布式后端 | Ray 原生 | Ray（Flotilla/Ray Runner） |
| shuffle | 基础、需手动调 | Object Store + Arrow Flight 双通道 |
| 与训练框架 | Ray Train/Serve 原生 | 需自行桥接 |
| 零拷贝到 PyTorch | 经 Arrow block | Arrow→PyTorch 原生零拷贝 |

---

## 9.3 基准之争：谁更快？

这是社区最热议的话题，但**双方发布的数字看似矛盾，实则揭示了工作负载形状的决定性作用**。

### 9.3.1 Daft 官方基准（2025-09，Daft 0.6.2 vs Ray Data 2.49.2）

在 8 台 AWS `g6.xlarge`（每机 1×L4 GPU、4 vCPU、16GB）上跑四类多模态负载：

| 负载 | Daft | Ray Data | Spark |
|---|---|---|---|
| 音频转写（11.4 万文件） | 6m22s | 29m20s（慢 4.6×） | 25m46s |
| 文档嵌入（1 万 PDF） | 1m54s | 14m32s（慢 7.6×） | 8m04s |
| 图像分类（80 万张） | 4m23s | 23m30s（慢 5.4×） | 45m07s |
| 视频检测（1000 视频） | 11m46s | 25m54s（慢 2.2×） | 3h36m |

Daft 结论：**比 Ray Data 快 2–7×，比 Spark 快 4–18×**，且开箱即完成、无需调参。

### 9.3.2 Anyscale 的反向基准（Ray Data 团队 rebuttal）

Ray 团队指出 Daft 的脚本存在"隐藏假设"，并做了等价复现 + 调优：

- **图像分类**（g6.xlarge 4 vCPU 时 Daft 仍快；但换成 **g6.8xlarge（32 vCPU/1 GPU）**，Ray Data 2.50 RC 仅需 111s，比 Daft 的 195s **快 1.7×**）。
- **4TiB 大嵌入处理**（40×g6e + 64×r6i 混合集群）：Ray Data 2.49.2 比 Daft 快约 **2×**，Ray Data 2.50 RC 快约 **7×**。

Ray 团队的关键洞察：**GPU 是最贵的环节，而多模态管道往往卡在 CPU 侧（解码/解析）。当 CPU:GPU 比足够高时，Ray Data 能更充分地利用 CPU 喂饱 GPU，从而反超 Daft。**

### 9.3.3 如何客观解读

| 场景 | 谁更占优 | 原因 |
|---|---|---|
| 开箱即用、低 CPU 配比（云默认形状） | **Daft** | 自带优化器 + Arrow 列式，少调参即高效 |
| 大集群、高 CPU:GPU 比、重 shuffle | **Ray Data** | 资源利用率随机器规格线性提升 |
| 需要查询优化器自动下推 | **Daft** | Ray Data 无 CBO，需手写 |
| 已经用 Ray Train/Serve | **Ray Data** | 原生衔接，少一层桥接 |

两套数字并不矛盾：**Daft 赢在"默认配置下的工程优雅"，Ray Data 赢在"规模与异构资源下的天花板"**。生产选型应基于你真实的 CPU:GPU 比和调优人力。

---

## 9.4 社区投入与资本：体量不在同一量级，但增速不同

### 9.4.1 Ray Data 背后的生态

- **起源**：UC Berkeley RISELab（与 Spark 同宗），后由 **Anyscale** 商业化。
- **社区体量**：Ray 是整个 ML 基础设施的"操作系统级"项目，GitHub 星标数十万级，贡献者上千，被 OpenAI、字节、蚂蚁等头部团队用于训练/推理调度。
- **资本**：Anyscale 累计融资超 **1 亿美元**（含 a16z、Intel、NEA 等），2024 年估值约 10 亿美元级。
- **生态广度**：Ray Train / Serve / Tune / RLlib / Data 形成闭环，Daft 只是"DataFrame 这一小块"。

### 9.4.2 Daft 背后的 Eventual

- **起源**：2022 年由两位前 **Lyft 自动驾驶**工程师（Sammy Sidhu、Jay Chia）创立，最初为解决 AV 多模态数据（LiDAR/视频/音频）处理痛点。
- **资本**：
  - 种子轮 **750 万美元**（CRV 领投）
  - A 轮 **2000 万美元**（Felicis 领投，微软 M12、Citi Ventures 跟投）
  - 合计 **2750 万美元**，明显小于 Ray/Anyscale，但聚焦单点。
- **社区**：2025 全年有 **132 位贡献者**提交 PR；GitHub 星标约 **5000+**（2025 中约 4700，2026 增长中）；规模远小于 Ray，但增速快、议题质量高。
- **生产用户**：Amazon、Essential AI、CloudKitchens、Together AI。
- **商业化**：2025 Q3 推出企业版（部署/监控/扩缩容）。
- **许可证**：Apache 2.0，与 Ray 一致。

### 9.4.3 投入结构对比

| 维度 | Ray Data / Ray | Daft / Eventual |
|---|---|---|
| 总融资 | >1 亿美元 | 2750 万美元 |
| 贡献者规模 | 上千 | ~132/年（2025） |
| GitHub 星标 | 数十万级 | 5000+ |
| 单点专注度 | 广而全 | 极窄（多模态 DataFrame） |
| 商业成熟度 | 高（Anyscale 多年） | 中（2025 企业版起步） |
| 大厂背书 | OpenAI/字节/蚂蚁 | Amazon/CloudKitchens/Together |

---

## 9.5 潜力研判：两条增长曲线

### 9.5.1 Daft 的上行空间

- **契合多模态 AI 浪潮**：MarketsandMarkets 预测多模态 AI 市场 2023–2028 年 **35% CAGR**，而 Daft 的"非结构化数据的 SQL"定位正中靶心。
- **技术债低**：Rust + Arrow + 原生优化器，单点做到极致，没有 PySpark 的 JVM 包袱。
- **风险**：
  1. **单厂商主导**，社区深度不如 Ray；
  2. **1.0 之前成熟度**，快速迭代可能引入破坏性变更；
  3. **分布式依赖 Ray**，并非 Ray 的完整替代，天花板受 Ray 自身约束；
  4. 单节点纯 SQL 分析慢于 Polars/DuckDB。

### 9.5.2 Ray Data 的上行空间

- **生态锁定效应**：一旦训练/推理已在 Ray 上，Ray Data 是零摩擦选择。
- **补强短板**：2.50+ 正在加查询优化器、零数据传输 shuffle、`download` 表达式治块大小爆炸——直接回应 Daft 的优势项。
- **风险**：
  1. 查询优化器起步晚，与 Daft 的成熟度仍有差距；
  2. 多模态人体工学弱，用户需手写大量解码逻辑；
  3. 在"小团队、开箱即用"场景被 Daft 拉开体验差距。

### 9.5.3 最可能的终局

不是"谁取代谁"，而是**分层共存**：

- **Daft 成为 Ray 之上的事实标准 DataFrame 层**（类似 "Spark SQL 之于 YARN"），负责 ETL/特征/多模态预处理；
- **Ray Data 退守"Ray 原生简单管道 + 与 Train/Serve 的胶水"**，在已经深度使用 Ray 的团队里继续存在；
- **DREAM 栈式组合**会被更多团队采用：Daft 管数据形状，Ray 管计算与调度。

---

## 9.6 选型决策清单

给工程师一张可直接打勾的表：

- ✅ 多模态（图/视频/音频）预处理占比高，且想要"图像就是一列"的体验 → **Daft**
- ✅ 已用 Ray Train/Serve，管道简单、不想引入新依赖 → **Ray Data**
- ✅ 团队调优人力少、要开箱即用的快 → **Daft**
- ✅ 大集群、高 CPU:GPU 比、重 shuffle → **Ray Data（2.50+）**
- ✅ 需要谓词下推/列裁剪等自动优化 → **Daft**
- ✅ 要做 DREAM 栈、Daft 做 DataFrame + Ray 做计算 → **两者都要**

> **一句话总结**：Ray Data 是"Ray 生态里顺手的数据管道"，Daft 是"为 AI 多模态从零设计的 DataFrame 引擎"。前者赢在生态与规模天花板，后者赢在默认体验与技术纯度。二者共用 Ray 底座，长期来看更可能互补而非相残。

---

## 9.7 本书收束

至此，本书从 2.10 GA 一路走到 2.5x，覆盖了：

1. 为什么需要 Ray Data（与 Spark/tf.data/WebDataset 的差异）；
2. Dataset 与 Block 的惰性模型；
3. 执行模型（LogicalPlan→PhysicalPlan、算子融合）；
4. StreamingExecutor 调度循环与并发；
5. 内存/背压/稳定性；
6. 格式与连接器（Parquet/WebDataset/Lance/MCAP）；
7. 与 Ray Train/Serve 及 Megatron/DeepSpeed 的集成；
8. 版本演进与调优清单；
9. **与 Daft 的横向对比**（本章）。

Ray Data 的演进主线清晰：**从"够用的流式管道"走向"带优化器、带多模态、带零拷贝 shuffle 的现代数据引擎"**。而 Daft 的崛起，正倒逼这一演进加速——对使用者而言，这是一场值得乐见的良性竞争。
