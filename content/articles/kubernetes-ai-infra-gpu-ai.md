---
title: "Kubernetes AI Infra 进展追踪：调度器、GPU 虚拟化与 AI 工作负载新特性"
description: "追踪 K8s 社区最新进展：Volcano/Koordinator/HAMi/Kueue 调度器更新、GPU 细粒度调度新特性、AI 工作负载 CRD 演进"
date: "2026-05-02"
updatedAt: "2026-05-02 11:53"
agent: "研究员→编辑→审校员"
tags:
  - "Kubernetes"
  - "GPU 调度"
  - "Volcano"
  - "HAMi"
  - "AI Infra"
type: "article"
category: "AI Infra"
---

# Kubernetes AI Infra 进展追踪：调度器、GPU 虚拟化与 AI 工作负载新特性

> 追踪 Volcano v1.14、HAMi v2.8、Kueue v0.17/0.18、Koordinator v1.8 等项目最新动态，聚焦 DRA 成熟化、GPU 细粒度调度与 AI Agent 工作负载调度三大主线。

---

## 背景：AI Infra 的调度复杂度跃升

LLM 训练与推理工作负载对 Kubernetes 调度层提出了截然不同于传统微服务的诉求：

- **All-or-Nothing 资源语义**：分布式训练 Gang 中任意 Pod 无法调度，整组作业即应等待而非部分启动
- **拓扑敏感性**：跨 NVLink、NVSwitch、InfiniBand 的 GPU 互联带宽差异可达 10×，错误的 Pod 放置会导致训练吞吐下降 30–50%
- **多厂商异构加速器**：NVIDIA/Huawei Ascend/百度昆仑/沐曦 MetaX 在一个集群中并存，Device Plugin 体系难以统一管理
- **低延迟交互式 AI Agent**：毫秒级响应与高吞吐批训练作业争抢同一 Node Pool

以下从各主要开源项目 2025 年最新进展展开分析。

---

## 一、Kubernetes 原生层：DRA 与 Workload API

### 1.1 Dynamic Resource Allocation（DRA）生产化

DRA 在 Kubernetes 1.31 升至 Beta，1.34+ 已被多个上层项目（HAMi、Kueue）视为稳定 API 接入。其核心设计是将设备分配从静态 `requests/limits` 字段中解耦，通过 `ResourceClaim` 对象由驱动侧实现精细语义：

```yaml
# ResourceClaimTemplate 示例：按拓扑选取同一 NVLink 域内的 4 块 GPU
apiVersion: resource.k8s.io/v1beta1
kind: ResourceClaimTemplate
metadata:
  name: gpu-claim-tmpl
spec:
  spec:
    devices:
      requests:
      - name: gpu
        deviceClassName: gpu.nvidia.com
        count: 4
        selectors:
        - cel:
            expression: "device.attributes['nvidia.com/cudaDriverVersion'].isGreaterThan('535')"
```

相比 Device Plugin，DRA 支持在驱动侧实现跨 Pod 设备共享（structured parameters）、动态拓扑约束与细粒度 QoS，是多租户 GPU 池化的基础。

### 1.2 Workload API 与原生 Gang Scheduling（Alpha，1.35+）

Kubernetes 1.35 引入 `Workload` API，为 Multi-Pod 作业提供原生 Gang 语义：

```yaml
apiVersion: scheduling.k8s.io/v1alpha1
kind: Workload
spec:
  podSets:
  - name: workers
    template: ...
    count: 16
    minCount: 16   # 全部就绪或全部等待
```

该 API 与 Kueue/Volcano 解耦设计对齐——上层调度器可直接消费 `Workload` 对象，无需侵入 Job CRD。

---

## 二、Volcano v1.14：面向 AI Agent 的统一调度架构

### 2.1 多调度器动态分片

v1.14.0（2025-01-31 发布）引入**动态 Node Sharding** 架构，依据 Scheduler CPU 利用率自动在两类调度器间路由 Node：

| 调度器类型 | 激活条件 | 适合场景 |
|----------|---------|---------|
| Batch Scheduler | CPU 利用率 < 60% | 分布式训练、批处理作业 |
| Agent Scheduler | CPU 利用率 > 70% | 交互式 AI Agent、在线推理 |

两类调度器共享一套 Node 视图，避免静态划分导致的资源孤岛。实测 Agent Scheduler 在 **950 Pods/s 吞吐量**下 P99 延迟仅 **45ms**，依赖 Conflict-Aware Binder（减少绑定冲突重试）与 Warm Pool 机制。

### 2.2 HyperNode 与 SubGroup 拓扑感知

```
Cluster
└── HyperNode-A  (NVSwitch fabric)
    ├── SubGroup-1  (8× H100, NVLink)
    └── SubGroup-2  (8× H100, NVLink)
└── HyperNode-B  (PCIe Switch)
    └── SubGroup-3  (4× A100)
```

调度策略优先将分布式训练的 Pod 组放置在同一 SubGroup 内（带宽最优），其次同一 HyperNode，最后跨 HyperNode。v1.14 修复了 SubGroup 缺乏 hard networkTopology 模式时的调度异常（v1.14.1，2025-02-14）。

### 2.3 性能收益

通过 HyperNode Bin-Packing + Coexistence 策略，Volcano 用户实测 GPU 利用率从 **35% 提升至 72%**，同时支持训练/推理/Agent 工作负载混合部署。

---

## 三、HAMi v2.8：DRA 桥接与多厂商 vGPU

### 3.1 HAMi-DRA：Device Plugin 到 DRA 的平滑迁移

HAMi v2.8.0（2025-01-20）推出 HAMi-DRA 机制，通过 **MutatingWebhook** 自动将用户的传统 `nvidia.com/gpu` 资源请求转换为 DRA `ResourceClaim`，实现无感知迁移：

```
Pod 提交
  │  resources.limits:
  │    nvidia.com/gpumem: "10"
  │    nvidia.com/gpucores: "50"
  ▼
MutatingWebhook
  │  自动注入 ResourceClaimTemplate
  ▼
DRA Driver 分配具体 GPU 设备
  │  + 隔离限额注入到容器 LD_PRELOAD
  ▼
容器运行（vGPU 显存/算力限制生效）
```

这使得已有工作负载无需修改 YAML 即可使用 DRA 语义，同时保留 HAMi 的细粒度隔离能力。

### 3.2 多厂商支持矩阵（v2.8.x）

| 硬件类型 | 厂商 | 调度粒度 | 隔离机制 |
|--------|------|---------|---------|
| NVIDIA GPU | NVIDIA | 显存 MB + 算力 % | LD_PRELOAD shim |
| Ascend NPU | 华为 | 核数 + 显存 | vnpu-plugin |
| Kunlun XPU | 百度 | 算力 % | xpu-container |
| MetaX sGPU | 沐曦 | vcore + vmemory | cgroup v2 |
| Enflame GCU | 燧原科技 | 全卡/分片 | 驱动级隔离 |

### 3.3 可观测性增强

v2.8.1（2025-04-17）修复了多 GPU 部署场景下 vLLM 兼容性问题；v2.8.2（2025-04-28）改善了 device-monitor 稳定性。Pod 调度失败时现可获得结构化错误码（如 `NodeInsufficientDevice`）和两层日志（节点级/设备级），配合 ServiceMonitor 接入 Prometheus 实现端到端可观测。

---

## 四、Kueue v0.17/0.18：作业队列与 DRA 集成

### 4.1 层次化 Cohort（GA）与公平调度

Kueue v0.17.0（2025-03-31）将 Hierarchical Cohorts 升级为 GA，支持多级资源配额树：

```
RootCohort  (cluster-wide GPU quota: 512)
├── TeamA-Cohort  (quota: 256 GPUs)
│   ├── ClusterQueue: training   (256 GPUs nominal)
│   └── ClusterQueue: notebooks  (32 GPUs nominal, borrow from TeamA)
└── TeamB-Cohort  (quota: 256 GPUs)
    └── ClusterQueue: inference  (256 GPUs nominal)
```

Cohort 内 ClusterQueue 可按 Fair-Share 策略动态借用额度，跨 Cohort 则严格隔离。

### 4.2 DRA 扩展资源支持

v0.17.0 原生支持在 `ClusterQueue` 的 `resourceGroups` 中声明 DRA ResourceClass，使 GPU 分配通过 Kueue 配额门控后再经 DRA 驱动实际分配：

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ResourceFlavor
metadata:
  name: h100-nvlink
spec:
  nodeLabels:
    gpu-topology: nvlink
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
```

### 4.3 v0.18.0-rc.0 预览（2025-04-30）

- **Concurrent Admission**：并发处理多 Workload 入队，减少串行队列头阻塞
- `MultiKueueRedoAdmissionOnEvictionInWorker` 升至 Stable：worker 集群驱逐时自动在其他集群重新入队
- `SkipFinalizersForPodsSuspendedByParent` 升至 Stable：优化 Pod 生命周期管理

---

## 五、Koordinator v1.8：MetaX sGPU 与异构拓扑调度

Koordinator v1.8.0（2024-04-16）重点引入 **MetaX sGPU** 细粒度调度，算力/显存独立分配：

```yaml
resources:
  limits:
    metax-tech.com/sgpu: "1"
    metax-tech.com/vcore: "60"    # 60% 算力
    metax-tech.com/vmemory: "4"   # 4 GB 显存
```

**NodeResourcesFitPlus** 插件为不同资源类型配置独立打分策略（如 GPU 优先 Bin-Packing，CPU 优先 Spread）；**ScarceResourceAvoidance** 防止无 GPU 需求的工作负载占用 GPU 节点。实测相较原生 Kubernetes，GPU 利用率从 **18% 提升至 75%**，500 张卡的集群可缩减到 133 张（节省约 73%）。

---

## 六、跨项目主线总结

### 6.1 DRA 成为新基础设施接口

$$\text{Device Plugin（静态）} \xrightarrow{\text{迁移}} \text{DRA（动态 + 拓扑感知）}$$

Kubernetes 1.34+ DRA Beta → HAMi v2.8 DRA 桥接 → Kueue v0.17 DRA 配额门控，三层协同初步成型。

### 6.2 拓扑感知调度标准化

| 项目 | 拓扑单元 | 优化目标 |
|------|---------|---------|
| Volcano | HyperNode > SubGroup > Node | 训练带宽最大化 |
| HAMi | linkZone（NVLink/MetaXLink 域） | 多 GPU 任务通信延迟最小化 |
| Koordinator | MetaXLink > PCIe Switch > Node | MetaX sGPU 组内带宽 |
| Kueue | ResourceFlavor + nodeLabels | 跨队列 GPU 族隔离 |

### 6.3 国产加速器一等公民化

HAMi 和 Koordinator 均将华为昇腾、百度昆仑、沐曦 MetaX 等国产芯片列入正式调度路径，配套 QoS 隔离与拓扑感知，不再是"实验性支持"，反映国内 AI 集群脱 NVIDIA 依赖的工程化进展。

---

## 实践建议

**场景一：大规模 LLM 训练集群**
- 采用 Volcano + HyperNode 拓扑感知，避免跨 NVSwitch 放置
- 开启 HAMi DRA 模式，统一管理 NVIDIA 与国产卡混用场景

**场景二：多租户 GPU 池（企业平台）**
- Kueue Hierarchical Cohort 做配额治理，ClusterQueue 对应业务团队
- ResourceFlavor 区分 H100/A100/国产卡，按优先级借用额度

**场景三：AI Agent + 训练混部**
- Volcano Agent Scheduler 处理在线推理/Agent 会话（低延迟路径）
- Batch Scheduler 处理离线训练，动态 Node Sharding 按负载自动路由

---

*本文由 Signal 知识平台 AI 智能体（研究员→编辑→审校员）自动生成，基于 2025-04/2026-05 各项目 Release Notes 及官方博客，经审校后发布。*