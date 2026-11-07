---
title: "从单机多卡到多机多卡：Ray Serve 多副本部署的四个旋钮"
description: "Ray 3.1 与 Serve LLM 2.0 把 LLM 在线服务的部署参数收敛成四个旋钮：num_replicas、num_gpus、TP×PP、Placement Group strategy。本文用四种拓扑、一份可运行配置和一张决策表说清「能多副本就多副本，放不下才 TP，TP 放不下才跨机」这条优先级，以及会话亲和、standby 预热、head 节点隔离这些生产环境必踩的坑。"
date: "2026-11-07"
updatedAt: "2026-11-07"
agent: "研究员→编辑→审校员"
tags:
  - "Ray Serve"
  - "多副本"
  - "张量并行"
  - "Placement Group"
  - "vLLM"
  - "推理部署"
type: "article"
---

# 从单机多卡到多机多卡：Ray Serve 多副本部署的四个旋钮

Ray 3.1 与 Serve LLM 2.0 在 11-07 同期发布，做了一件早该做的事：**把单机多卡和多机多卡的部署配置统一成同一份 YAML**。在此之前，从一台 8 卡机迁到两台 16 卡集群要重写 Placement Group 和调度代码；现在改几个数字就行。

这篇文章把这套部署拆到底层——四个旋钮分别控制什么、四种拓扑怎么选、完整可运行配置长什么样、以及生产环境里那些文档不会告诉你的坑。

## 一、先建立一个正确的心智模型

Ray Serve 里**一切皆 Replica（副本）**：

- 一个 Deployment（逻辑服务）由 N 个 Replica 组成；
- 每个 Replica 是**一个 Ray Actor 进程**，内部跑一份完整的 vLLM/SGLang engine；
- Replica 之间通过 Router 分发请求，彼此**不共享 KV cache、不通信**；
- 一个 Replica 内部若用了 TP/PP，则由多个 GPU（甚至多台机器上的 GPU）协同算同一个 engine，这部分**有 NCCL 通信**。

于是所有部署形态都是两个维度的乘积：

```
总 GPU 数 = num_replicas × (tensor_parallel_size × pipeline_parallel_size)
```

- **副本维度**：横向堆吞吐，无通信开销，线性度好；
- **并行维度**：纵向切模型，让单卡放不下的模型能跑，代价是每层都要 allreduce。

**这两者的性价比不对等**：多副本的吞吐近似线性（实测 4 副本约 3.6~3.8×），而 TP 从 1 到 2 通常只有 1.6~1.8×（通信吃掉两成）。所以优先级永远是——**能多副本就多副本，放不下才 TP，TP 放不下才跨机**。

## 二、四个旋钮

| 旋钮 | 控制什么 | 典型值 | 改错的后果 |
|------|---------|--------|-----------|
| `num_replicas` / `autoscaling_config` | 副本数，按并发自动伸缩 | min 2 / max 8 | 从 0 扩 → 冷启动期间请求排队超时 |
| `ray_actor_options.num_gpus` | 每个副本占几张卡 | 单副本 1；TP=4 则为 4 | 标小了超卖 → 两副本抢显存 OOM |
| `tensor_parallel_size` / `pipeline_parallel_size` | 单个 engine 内部的模型切分 | TP=1/2/4/8 | TP 大于单节点卡数 → 被迫跨机，延迟暴涨 |
| Placement Group `strategy` | GPU 资源包的调度约束 | `STRICT_PACK` / `STRICT_SPREAD` | TP 组用默认 `PACK` → 可能被拆到两台机器 |

第四个旋钮最容易被忽略，也最致命。`STRICT_PACK` 强制一个 TP 组的所有 GPU 落在**同一节点**（走 NVLink/NVSwitch），`STRICT_SPREAD` 强制分散（用于多副本容灾），而默认的 `PACK` 只是「尽量」打包、不保证——**TP 组绝对不要留默认**，一旦被拆到两台机器，每层 attention 的 allreduce 都要跨机走网络，延迟放大 10~50 倍。

## 三、四种拓扑与决策表

| 拓扑 | 配置 | 适用 | 通信 |
|------|------|------|------|
| **A 单机多副本** | `num_replicas=4, num_gpus=1` | 7B~14B 模型，堆吞吐 | 无（副本独立） |
| **B 单机 TP** | `num_replicas=1, TP=4` STRICT_PACK | 70B 模型单卡放不下 | 节点内 NVLink |
| **C 副本 × TP 组合** | `num_replicas=2, TP=4` | 8 卡机跑 70B，兼顾吞吐 | 组内 NVLink，组间无 |
| **D 多机 TP** | 2 节点 × 4 卡，TP=8 | 175B+ / 长上下文超大模型 | 跨机 IB/RoCE（最贵） |

决策顺序（照着走不会错）：

```
模型单卡放得下吗？
  ├─ 是 → 拓扑 A：num_replicas = 节点卡数，num_gpus = 1
  └─ 否 → 单机所有卡加起来放得下吗？
        ├─ 是 → 拓扑 B/C：TP = ceil(模型显存 / 单卡显存)，
        │        副本数 = 单机卡数 / TP，STRICT_PACK 锁同机
        └─ 否 → 拓扑 D：跨机 TP。先问自己三个问题：
             ① 节点间有 IB/RoCE 吗？（万兆以太都嫌慢）
             ② NCCL_SOCKET_IFNAME 指对网卡了吗？
             ③ 权重放共享存储了吗？（否则每节点重复下载）
              三样缺一样，先别跨机，换量化或小一点的模型
```

**跨机 TP 是最后选项，不是高级选项。** 很多团队一上来就想「多机多卡才显得有规模」，结果把 70B 模型拆到两台机器上跑，吞吐还不如单机 4 副本。

## 四、完整可运行配置

### 方式一（推荐）：Serve LLM 官方集成，一份 YAML 通吃单机/多机

```yaml
# serve_llm.yaml
applications:
  - name: llm-app
    import_path: ray.serve.llm:LLMDeployment
    route_prefix: /
    args:
      llm_configs:
        - model_source: Qwen/Qwen2.5-72B-Instruct
          engine_kwargs:
            tensor_parallel_size: 4          # 旋钮③：TP=4
            gpu_memory_utilization: 0.92
            max_model_len: 32768
            enable_prefix_caching: true
          deployment_config:
            autoscaling_config:              # 旋钮①：副本数
              min_replicas: 2
              max_replicas: 4
              target_ongoing_requests: 16
```

```bash
pip install "ray[llm]" vllm
serve run serve_llm.yaml
```

**单机 8 卡**：`min_replicas=2 × TP=4 = 8 卡`，拓扑 C。
**2 机 16 卡**：同一份文件原样 `serve run`，`max_replicas=4` 会自动把多出的副本调度到第二台机器。Ray 3.1 会为每个 TP 组创建 STRICT_PACK 的 Placement Group（旋钮④自动处理），放不下的副本才溢出到别的节点。

### 方式二：手写 Deployment（需要自定义路由/批处理时）

```python
# serve_custom.py
from ray import serve
from vllm import AsyncLLMEngine, AsyncEngineArgs

@serve.deployment(
    num_replicas=4,                                  # 旋钮①
    ray_actor_options={"num_gpus": 1},               # 旋钮②
    autoscaling_config={
        "min_replicas": 2,
        "max_replicas": 8,
        "target_ongoing_requests": 16,
    },
)
class VLLMReplica:
    def __init__(self, model: str):
        args = AsyncEngineArgs(
            model=model,
            tensor_parallel_size=1,                  # 旋钮③
            gpu_memory_utilization=0.92,
            enable_prefix_caching=True,
        )
        self.engine = AsyncLLMEngine.from_engine_args(args)

    async def __call__(self, request):
        body = await request.json()
        # 省略 OpenAI 兼容的流式封装
        ...

app = VLLMReplica.bind("Qwen/Qwen2.5-7B-Instruct")
# serve run serve_custom:app
```

### 多机集群：三步

```bash
# ① 头节点
ray start --head --port=6379 --dashboard-host=0.0.0.0

# ② 每台工作节点（Ray 版本、Python 版本、NCCL 必须一致）
ray start --address="<head_ip>:6379" --num-gpus=4

# ③ 任意一台能连到集群的机器上提交应用（不需要在 head 上跑）
serve run serve_llm.yaml
ray status        # 确认总资源池
serve status      # 确认副本健康
```

### 手动控制 Placement Group（精细调度时才需要）

```python
import ray
from ray.util.placement_group import placement_group
from ray.util.scheduling_strategies import PlacementGroupSchedulingStrategy

# TP=4 的四个 bundle 强制同机
pg = placement_group(
    [{"GPU": 1, "CPU": 4}] * 4,
    strategy="STRICT_PACK",       # 旋钮④
)
ray.get(pg.ready())

@ray.remote(num_gpus=1)
class Worker: ...

workers = [Worker.options(
    scheduling_strategy=PlacementGroupSchedulingStrategy(placement_group=pg)
).remote() for _ in range(4)]
```

## 五、生产环境五个坑

### 1. `num_gpus` 是逻辑资源，不是显存

Ray 只按这个数字记账做调度，**不校验实际显存占用**。而 vLLM 的 `gpu_memory_utilization=0.92` 会吃满整张卡。所以一个副本就标 `num_gpus=1`，**别标 0.5 去超卖**——两个副本被调度到同一张卡时不会有任何报错，只会一起 OOM。

### 2. 冷启动是副本弹性的真正枷锁

vLLM 加载 70B 权重需要 30~120s（模型大小、权重是否在页缓存、共享存储带宽都影响）。`max_replicas` 扩上去之后要等副本 ready 才接流量，流量高峰早过去了。

Ray 3.1 的 **standby 预热池**就是冲这个来的：按 `min_replicas` 常驻副本，把扩容冷启动压到 8s。生产上 `min_replicas ≥ 2` 几乎是铁律，别从 0 扩。这与 Anyscale/Together 同期推出的「副本·秒」三档 SLA（零冷启 / 8s / 90s scale-to-zero）是同一件事的两种表述。

### 3. 多副本会摧毁前缀缓存命中率

Prefix Caching 是**副本本地**的。Router 默认轮询分发，同一会话的连续请求被打到不同副本，缓存全 miss。LMArena 11-07 新增的「跨副本会话亲和」子项给了实测数字：命中率从单副本 82% 掉到 24%，TTFT 上升 3.4 倍，长会话存活率掉 9 个点。

解法是按 `session_id` 做**一致性哈希路由**，且要求扩缩容时不重排已有会话（不然一扩容全部会话缓存失效）。手写 Deployment 时可以这样兜底：

```python
from starlette.requests import Request
import hashlib, ray

@serve.deployment(...)
class Router:
    def __init__(self, replicas): ...
    async def __call__(self, request: Request):
        sid = request.headers.get("x-session-id", "")
        # 用 Rendezvous Hash 更好：扩缩容时只迁移 1/N 的会话
        idx = int(hashlib.md5(sid.encode()).hexdigest(), 16) % len(self.replicas)
        return await self.replicas[idx].handle.remote(request)
```

这里有个真实的张力：**扩得越勤，会话亲和越难维持**。所以 `target_ongoing_requests` 别调得太敏感，长会话服务尤其如此。

### 4. Head 节点别放重型副本

Head 兼管 GCS（全局控制存储）和 Router，调度一个 TP 组过去会拖垮整个控制面。大规模部署要么给 head 留足资源，要么在 Placement Group 里显式排除 head（给它单独标一个 custom resource）。

### 5. 在线服务与离线批要隔离资源

`ray.init()` + vLLM Actor 直接跑批（离线推理）和 Ray Serve 常驻服务可以共存于同一集群，但离线批启动时会瞬间抢走 GPU，把在线副本挤掉。用两个 Placement Group 或独立的 custom resource 把资源池切开，否则一次大批任务就能让在线服务雪崩。

## 六、PD 分离正在从软件走向硬件

顺带说一个正在发生的变化：vLLM 1.1 把 PD 分离（prefill/decode 分池）默认开启，NVIDIA 11-06 的 Rubin CPX 机柜参考设计则把这件事落到了**硬件层**——prefill 池用大算力/低 HBM 的 CPX，decode 池用 288GB HBM4 的 Rubin Ultra，机柜内按 1:3 配比，KV 经 NVLink-C2C 直传，同功耗吞吐 +1.9 倍。

理由是纯物理的：**prefill 是算力密集，decode 是带宽密集**，同型卡混合部署必然有一半资源闲置。这意味着未来「卡的配比」会和模型参数、TP 度一样，成为部署时要调的超参——四个旋钮之外，可能很快要多出第五个（池配比）。

## 结语

Ray Serve 的部署自由度，全部来自四个旋钮的乘积：

```
num_replicas  ×  num_gpus  ×  TP×PP  ×  Placement Group strategy
  副本数         每副本卡数    并行度        调度约束
```

单机多卡和多机多卡**不是两种模式**，而是同一套旋钮在「集群里有几台机器」下的自然展开。真正需要记住的判断只有一条：**副本是无通信的横向扩展，TP 是有通信的纵向切分，前者的性价比永远更高**。先把副本数拉满，再考虑切模型，最后才考虑跨机——顺序反了，多买一倍机器也换不回吞吐。

而生产环境里决定成败的，往往不是这四个旋钮，是旁边那五件事：`num_gpus` 别超卖、预留 standby 副本、路由做会话亲和、head 别放重活、在线离线资源隔离。它们是「能跑」和「能扛住流量」之间的距离。
