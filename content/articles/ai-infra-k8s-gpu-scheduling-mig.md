---
title: "K8s GPU 调度全解：从 MIG 到 DRA 的云原生 AI 基础设施"
description: "深度解析 Kubernetes 上 GPU 资源管理的完整技术栈：NVIDIA MIG、Device Plugin、DRA、GPU Operator"
date: "2026-04-12"
updatedAt: "2026-04-12"
agent: "研究员→编辑→审校员"
tags:
  - "AI Infra"
  - "行业动态"
type: "article"
---

# K8s GPU 调度全解：从 MIG 到 DRA 的云原生 AI 基础设施

> 训练大模型的第一步不是写代码，是抢 GPU。K8s 上的 GPU 调度决定了你的集群利用率。

## 一、为什么 GPU 调度是个难题

传统 K8s 把 GPU 当整数资源 (`nvidia.com/gpu: 1`)，但现实远比这复杂：

- **A100 80GB** 跑 7B 推理只用 15GB，剩余 65GB 空转
- **训练任务**需要跨节点多卡通信，调度器不理解拓扑
- **推理任务**需要低延迟，不能和训练抢带宽

## 二、NVIDIA MIG：硬件级 GPU 切分

Multi-Instance GPU 让 A100/H100 最多切成 **7 个独立实例**：

```
A100 80GB MIG 切分：
方案1: 7×MIG 1g.10gb  (小推理，最大共享)
方案2: 2×MIG 3g.40gb  (中等推理)
方案3: 1×MIG 7g.80gb  (整卡训练)
```

每个实例有独立显存、SM 核心和 L2 Cache，硬件级隔离。

```yaml
# K8s Pod 请求 MIG 实例
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: inference
    resources:
      limits:
        nvidia.com/mig-1g.10gb: 1  # 1/7 的 A100
```

## 三、Dynamic Resource Allocation (DRA)

K8s 1.32 GA 的 DRA 是 GPU 调度的未来。

| 特性 | Device Plugin | DRA |
|------|:---:|:---:|
| 声明式配置 | ❌ | ✅ |
| 动态切分 | ❌ | ✅ |
| 拓扑感知 | 有限 | ✅ |
| 跨节点编排 | ❌ | ✅ |

```yaml
apiVersion: resource.k8s.io/v1alpha2
kind: ResourceClaim
spec:
  resourceClassName: gpu.nvidia.com
  parametersRef:
    name: gpu-params
---
apiVersion: gpu.nvidia.com/v1
kind: GpuClaimParameters
spec:
  count: 1
  sharing:
    strategy: MIG
    mig:
      profile: 3g.40gb
```

## 四、GPU Operator 一键部署

```bash
helm install gpu-operator nvidia/gpu-operator \
  --set mig.strategy=mixed \
  --set driver.version=560.35.05
```

自动管理：驱动 → CUDA Toolkit → Device Plugin → MIG → 监控 (DCGM)。

## 五、万卡集群调度策略

Meta 16K H100 集群：
1. **拓扑感知**：TP=8 的 Pod 调度到同节点（NVLink）
2. **网络亲和**：PP Pod 在同 TOR 下
3. **弹性伸缩**：故障时缩减 DP 维度
4. **抢占策略**：训练可抢占推理 GPU

## 六、2026 趋势

- **vGPU 虚拟化**：NVIDIA vGPU + K8s 实现 GPU 时分复用
- **Blackwell B200**：新 MIG 支持 14 个实例
- **多集群联邦**：跨数据中心 GPU 统一调度

---

*本文由 Signal 知识平台 AI 智能体自动生成。*
