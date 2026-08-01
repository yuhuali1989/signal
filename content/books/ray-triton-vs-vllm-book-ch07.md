---
title: "Ray+Triton vs Ray+vLLM 离线推理架构对比 - 第7章: 故障恢复与容错"
book: "Ray+Triton vs Ray+vLLM：离线推理架构对比"
chapter: "7"
chapterTitle: "故障恢复与容错机制对比"
description: "从进程崩溃、GPU OOM、模型加载失败三个故障场景出发，对比两种架构的恢复速度、数据丢失风险和断点续传能力"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "故障恢复"
  - "容错"
  - "断点续传"
  - "Actor 重启"
  - "Triton 健康检查"
type: "book"
---

# 第 7 章：故障恢复与容错机制对比

> **学习目标**：理解两种架构在进程崩溃、GPU OOM、模型加载失败等故障场景下的恢复行为，掌握断点续传策略的设计方法。

---

## 7.1 故障场景分类

离线推理中常见的故障类型：

| 故障类型 | 频率 | 影响 | 恢复难度 |
|---------|------|------|---------|
| Triton/Actor 进程 OOM 崩溃 | 中 | 当前 batch 丢失 | 中 |
| GPU 驱动错误 (ECC, XID) | 低 | GPU 不可用直到重置 | 高 |
| 模型加载失败 (权重损坏) | 低 | 无法推理 | 中 |
| 数据加载异常 (I/O 错误) | 中 | 当前 chunk 丢失 | 低 |
| 网络超时 (gRPC timeout) | 中 | 当前请求丢失 | 低 |

两种架构对这些故障的响应方式截然不同。

---

## 7.2 架构 A 的故障恢复

### 7.2.1 Triton 崩溃

```
故障: Triton 进程因 OOM 或 CUDA error 崩溃

Ray 侧:
  - gRPC 请求超时/失败
  - Ray Worker 捕获异常
  - Worker 可以重试或跳过

Triton 侧:
  - 需要手动或通过 systemd 重启
  - 重启后重新加载所有模型 (8B: ~10s, 70B: ~60s)
  - KV Cache 全部丢失

恢复流程:
  t=0:    Triton 崩溃
  t=1:    Ray Worker 检测到 gRPC 连接断开
  t=2:    systemd 重启 Triton
  t=12:   Triton 加载完成 (8B 模型)
  t=12:   Ray Worker 重试 gRPC 请求
  t=12:   恢复正常

  总恢复时间: ~12 秒 (8B) / ~70 秒 (70B)
```

**关键优势**：Triton 重启不影响 Ray 集群——Ray Worker 可以继续处理数据（缓存结果），等 Triton 恢复后再发送。Worker 不需要重启。

### 7.2.2 Ray Worker 崩溃

```
故障: Ray Worker 进程崩溃

影响:
  - 该 Worker 正在处理的 chunk 丢失
  - 其他 Worker 和 Triton 不受影响

恢复:
  - Ray 自动重启 Worker（如果配置了 max_restarts）
  - Worker 重新加载数据 chunk
  - Triton 无感知

  总恢复时间: ~2-5 秒
```

**这是架构 A 的核心容错优势**：推理服务（Triton）和数据管道（Ray）是解耦的。一方崩溃不影响另一方。

### 7.2.3 断点续传

```python
@ray.remote(num_cpus=4, max_restarts=3)
class DataProcessor:
    def __init__(self, triton_url, checkpoint_path):
        self.triton = InferenceServerClient(triton_url)
        self.checkpoint = load_checkpoint(checkpoint_path)
        self.completed = set(self.checkpoint.get("completed", []))

    def process(self, items):
        results = []
        for item in items:
            if item["id"] in self.completed:
                continue  # 跳过已完成

            try:
                result = self.triton.infer(...)
                results.append(result)
                self.completed.add(item["id"])
                # 定期保存 checkpoint
                if len(self.completed) % 100 == 0:
                    save_checkpoint(self.checkpoint_path, self.completed)
            except Exception as e:
                # Triton 可能崩溃，标记为待重试
                log_error(item["id"], e)
                # Worker 可以继续处理下一个 item
                # Triton 恢复后重新处理失败的 item

        return results
```

**架构 A 的断点续传特点**：
- Triton 崩溃时，Worker 可以继续处理数据（标记失败项）
- Triton 恢复后，Worker 重试失败项
- Checkpoint 粒度可以到单条数据
- **不需要重新加载模型**——Triton 恢复后立即可用

---

## 7.3 架构 B 的故障恢复

### 7.3.1 Actor 崩溃

```
故障: Ray Actor 因 OOM 或 CUDA error 崩溃

影响:
  - Actor 进程消失
  - GPU 显存释放
  - vLLM 引擎实例销毁
  - KV Cache 全部丢失
  - 正在处理的所有请求丢失

恢复:
  - Ray 自动重启 Actor（如果配置了 max_restarts）
  - Actor.__init__ 重新执行 → 重新加载模型
  - 8B: ~15-30s, 70B INT4: ~60-120s
  - 恢复后需要从 checkpoint 继续

  总恢复时间: ~30 秒 (8B) / ~120 秒 (70B INT4)
```

**关键劣势**：Actor 崩溃意味着模型重新加载。对于 70B 模型，这意味着 2 分钟的停机。

### 7.3.2 Worker 崩溃

架构 B 中如果 CPU Worker 崩溃（数据预取 Worker），影响与架构 A 类似——Actor 不受影响，Worker 重启即可。

### 7.3.3 断点续传

```python
@ray.remote(num_gpus=1, num_cpus=8, max_restarts=3)
class vLLMActor:
    def __init__(self, model_name, checkpoint_path):
        # 模型重新加载（耗时）
        self.llm = LLM(model=model_name, ...)
        self.checkpoint = load_checkpoint(checkpoint_path)
        self.completed = set(self.checkpoint.get("completed", []))

    def process(self, items):
        results = []
        for item in items:
            if item["id"] in self.completed:
                continue

            output = self.llm.generate([item["prompt"]], self.params)
            results.append(output[0])
            self.completed.add(item["id"])

            if len(self.completed) % 100 == 0:
                save_checkpoint(self.checkpoint_path, self.completed)

        return results
```

**架构 B 的断点续传特点**：
- Actor 崩溃后需要重新加载模型（慢）
- Checkpoint 粒度也可以到单条数据
- **恢复时间 = 模型加载时间 + checkpoint 加载时间**

---

## 7.4 恢复时间对比

| 故障场景 | 架构 A 恢复时间 | 架构 B 恢复时间 | 差异原因 |
|---------|---------------|---------------|---------|
| 推理进程 OOM (8B) | ~12s | ~30s | B 需重新加载模型 |
| 推理进程 OOM (70B INT4) | ~70s | ~120s | B 需重新加载模型 |
| Worker 崩溃 | ~3s | ~3s | 两者相同 |
| GPU 驱动错误 | ~60s (重置+重启) | ~150s (重置+重载模型) | B 额外需要模型加载 |
| gRPC 超时 (仅 A) | ~5s (重试) | N/A | B 无 gRPC |
| 模型权重损坏 | ~120s (重下载+加载) | ~180s (重下载+加载+初始化) | 差异不大 |

---

## 7.5 减少架构 B 的恢复时间

架构 B 的恢复慢主要因为模型重新加载。缓解策略：

### 7.5.1 Ray Serve 常驻 Actor

```python
from ray import serve

@serve.deployment(
    num_replicas=1,
    ray_actor_options={"num_gpus": 1},
    max_concurrent_queries=10,
)
class vLLMDeployment:
    def __init__(self, model_name):
        self.llm = LLM(model=model_name, ...)

    async def __call__(self, request):
        prompts = await request.json()
        return self.llm.generate(prompts, ...)

# 部署后 Actor 常驻，Ray 作业结束后不销毁
# 新的 Ray 作业可以直接复用
serve.run(vLLMDeployment.bind("meta-llama/Llama-3-8B"))
```

**效果**：Actor 作为 Ray Serve 的 Deployment 常驻，不随离线作业结束而销毁。新作业启动时模型已加载，**恢复时间从 30s 降到 0s**。

### 7.5.2 模型预热

```python
# Actor 重启时先做一次 warmup 推理
class vLLMActor:
    def __init__(self, model_name):
        self.llm = LLM(model=model_name, ...)
        # warmup: 触发 CUDA Graph 捕获
        self.llm.generate(["warmup"], SamplingParams(max_tokens=1))
```

### 7.5.3 多 Actor 冗余

```python
# 启动 2 个 Actor，一个崩溃时另一个接管
actors = [
    vLLMActor.options(num_gpus=1).remote("model")
    for _ in range(2)  # 需要 2 张 GPU
]

# 使用 ActorPool，一个 Actor 崩溃时自动切换
pool = ActorPool(actors)
```

**代价**：需要额外的 GPU 资源。

---

## 7.6 故障检测机制

**架构 A**：

```python
# Triton 健康检查
def check_triton_health(triton_url):
    try:
        client = InferenceServerClient(url=triton_url)
        return client.is_server_ready()
    except:
        return False

# Ray Worker 中定期检查
while True:
    if not check_triton_health("localhost:8001"):
        log("Triton not ready, waiting...")
        time.sleep(5)
        continue
    # 正常处理
```

Triton 提供标准化的健康检查端点：
- `/v2/health/live`：服务器是否活着
- `/v2/health/ready`：服务器是否就绪（模型已加载）
- `/v2/models/{model}/ready`：特定模型是否就绪

**架构 B**：

```python
# Actor 健康检查
@ray.remote(num_gpus=1)
class vLLMActor:
    def health_check(self):
        try:
            # 简单推理测试
            self.llm.generate(["test"], SamplingParams(max_tokens=1))
            return True
        except:
            return False

# Ray Dashboard 监控 Actor 状态
# ray.get(actor.health_check.remote())
```

Ray 提供原生机制：
- Actor 状态自动检测（`ray.get_actor()` 检查 liveness）
- `max_restarts` 配置自动重启
- Ray Dashboard 可视化 Actor 状态

---

## 7.7 容错策略对比

| 策略 | 架构 A | 架构 B |
|------|--------|--------|
| 推理服务崩溃恢复 | Triton 重启 (~10-70s) | Actor 重启 + 模型重载 (~30-120s) |
| 数据管道崩溃恢复 | Worker 重启 (~3s) | Worker 重启 (~3s) |
| 解耦性 | 服务与管道解耦 | 服务与管道耦合 |
| 断点续传 | Checkpoint + Triton 恢复即可继续 | Checkpoint + Actor 重载模型后继续 |
| 冗余部署 | 多 Triton 实例（复杂） | 多 Actor（简单，但贵） |
| 常驻服务 | Triton 天然常驻 | 需要 Ray Serve |
| 健康检查 | 标准化 HTTP 端点 | 自定义 + Ray 内置 |

---

## 7.8 本章小结

**架构 A 的容错优势**：
- 推理服务与数据管道解耦，一方崩溃不影响另一方
- Triton 恢复快（不涉及模型加载逻辑，Triton 自己管理）
- 健康检查标准化

**架构 B 的容错劣势**：
- Actor 崩溃 = 模型重新加载（慢）
- 推理与数据耦合，Actor 崩溃影响整个流水线

**架构 B 的缓解方案**：
- Ray Serve 常驻部署（避免反复加载）
- 多 Actor 冗余（用资源换可用性）
- 精细 Checkpoint（减少数据重算）

**核心权衡**：架构 A 的解耦容错 vs 架构 B 的简化部署。在长时间离线推理（如 1000 万条数据）中，架构 A 的快速恢复能力可能比通信开销节省的时间更有价值。
