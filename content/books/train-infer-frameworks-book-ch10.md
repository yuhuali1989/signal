---
title: "大模型训练与推理框架源码全书 - 第10章: vLLM V1 多进程架构与 EngineCore.step 六步链路"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "10"
chapterTitle: "vLLM V1 多进程架构与 EngineCore.step 六步链路"
description: "算清一个 vLLM 实例的真实进程数，展开 ZMQ 与 msgpack 的 IO 线程设计、run_busy_loop 与 step 六步代码、batch_queue 与异步调度两种 CPU-GPU 重叠机制，以及中断请求的处理位置"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "EngineCore"
  - "ZMQ"
  - "推理服务"
  - "源码拆解"
type: "book"
part: "篇四 · 推理引擎"
---

# 第 10 章 · vLLM V1 多进程架构与 `EngineCore.step()` 六步链路

## 10.1 结论：一个 vLLM 实例不是「一个进程 + 几张卡」

【文档】vLLM 官方 `design/arch_overview`（2026-10-29）把 V1 拆成四类进程，通过 ZMQ 通信：

| 进程 | 职责 | 数量 |
|---|---|---|
| API Server | HTTP / OpenAI 协议、tokenize、流式输出 | A（通常 1） |
| Engine Core | 调度、KV 管理、驱动 GPU | 1（DP>1 时每 DP rank 1 个） |
| GPU Worker | 每个 TP/PP rank 一个，执行模型 | `TP × PP × DP` |
| DP Coordinator | DP>1 时协调 wave 对齐 | 0 或 1 |

**进程数公式**：`A + DP + TP×PP×DP`（DP>1 再 +1 个 coordinator）。

> 【推算】站内第 75 轮 Ray Serve 那次讨论里「单机 4 卡 TP=4」的场景：`A=1, DP=1, TP=4, PP=1` → `1 + 1 + 4 = 6` 个进程。本书贯穿拓扑 I 是单机 8 卡 `TP=8` → `1 + 1 + 8 = 10` 个进程。**再叠 `num_replicas=2` 就是 20 个进程**，CPU 侧规划要按这个倍数算，否则瓶颈会落在 API server 的 Python 线程而不是 GPU。这是训练侧（ch04 的 64 个 rank）与推理侧资源账的第一次合流。

## 10.2 为什么拆进程：ZMQ IO 线程释放 GIL

【源码】`vllm/v1/engine/core.py::EngineCoreProc.__init__` 的注释几乎把设计动机写全了：

```python
# Background Threads and Queues for IO. These enable us to
# overlap ZMQ socket IO with GPU since they release the GIL,
# and to overlap some serialization/deserialization with the model forward pass.
input_thread = threading.Thread(target=self.process_input_sockets, ..., daemon=True)
output_thread = threading.Thread(target=self.process_output_sockets, ..., daemon=True)
```

三个关键点：

1. **输入路径**：`zmq.DEALER` → `MsgpackDecoder(EngineCoreRequest)` → `preprocess_add_request()` 直接在 IO 线程里做（源码注释明确说 `allow request initialization running in parallel with Model forward`）→ 塞进 `input_queue: Queue[tuple[EngineCoreRequestType, Any]]`。
2. **输出路径**：`zmq.PUSH` + `MsgpackEncoder.encode_into()` 零拷贝发送，由 `OutputProcessor` 做 detokenize / stop / stream。
3. **ABORT 特殊处理**：同时写 `aborts_queue` 与 `input_queue`——既保证顺序，又能让中断在 GPU 在途时提前生效。

这与第 2 章原语④的「慢的一方不必等快的一方」是同一个模式，只是这里把「通信」换成了「网络 IO 与序列化」，把「重叠层」从 CUDA stream 抬到了进程级。

## 10.3 `EngineCore.step()` 六步

【源码】`vllm/v1/engine/core.py`（精简掉日志与 profiler 包装，变量名保留）：

```python
def step(self) -> tuple[dict[int, EngineCoreOutputs], bool]:
    if not self.scheduler.has_requests():            # ① 没请求直接空转
        return {}, False
    scheduler_output = self.scheduler.schedule(self._should_throttle_prefills())  # ② 调度
    if scheduler_output.total_num_scheduled_tokens > 0:
        self.num_executed_steps += 1
        future = self.model_executor.execute_model(scheduler_output, non_block=True)  # ③ 异步下发
        grammar_output = self.scheduler.get_grammar_bitmask(scheduler_output)        # ④ CPU 侧并行算 grammar
        model_output = self._wait_for_output(future)                                 # ⑤ 等 GPU
        if model_output is None:
            model_output = self.model_executor.sample_tokens(grammar_output)
        self._process_aborts_queue()
        engine_core_outputs = self.scheduler.update_from_output(                     # ⑥ 回写状态
            scheduler_output, model_output)
        return engine_core_outputs, True
```

| 步 | 做什么 | 为什么这样排 |
|---|---|---|
| ① `has_requests` | 空队列直接返回 | 避免空转发起 GPU 调用 |
| ② `schedule()` | 决定本步每个请求算多少 token（ch11） | 纯 CPU，输出 `SchedulerOutput` |
| ③ `execute_model(non_block=True)` | 异步下发 GPU | 立刻返回 Future，不等结果 |
| ④ `get_grammar_bitmask` | 结构化输出的约束掩码 | **塞在 GPU 在途的窗口里，零额外延迟** |
| ⑤ `_wait_for_output` | 等 Future，期间处理输入 socket | 中断能及时生效 |
| ⑥ `update_from_output` | 推进 `num_computed_tokens`、判定结束、释放块 | 状态闭环，下一步调度依赖它 |

第 ④ 步是最容易被忽略的一处工程细节：**grammar bitmask 是纯 CPU 计算，被刻意安排在 GPU 跑 forward 的窗口里**。这类「把 CPU 活塞进 GPU 等待」的排布，贯穿整个 V1 引擎。

## 10.4 两种 CPU/GPU 重叠机制，别混为一谈

**机制一：`batch_queue` 让多批在途**

```python
# 【源码】core.py
self.step_fn = self.step if self.batch_queue is None else self.step_with_batch_queue

# step_with_batch_queue 骨架
exec_future = self.model_executor.execute_model(scheduler_output, non_block=True)
batch_queue.appendleft((future, scheduler_output, exec_future))
if len(batch_queue) < self.batch_queue_size and (model_executed or self.scheduler.has_requests()):
    return None, model_executed          # 不阻塞，回去继续调度下一批
# 队列满才 pop 最老批次 → _wait_for_output → scheduler.update_from_output()
```

它做的是**解耦「调度」与「消费输出」**：GPU 上可以同时有 `batch_queue_size` 批在途，CPU 不必每步都等上一步的输出回来。

**机制二：`async_scheduling` 用占位 token 预调度下一步**

【源码】`vllm/v1/core/sched/async_scheduler.py`：GPU 跑 step N 时，CPU 用占位 token 提前把 step N+1 的 `SchedulerOutput` 算好，等真实 token 回来再修正。它省的是**调度本身的 CPU 延迟**，不是 GPU 等待。

| | batch_queue | async_scheduling |
|---|---|---|
| 解耦对象 | 调度 ↔ 消费输出 | 调度 ↔ 上一步真实 token |
| 省什么 | GPU 等待输出的空档 | 调度 CPU 时间 |
| 代价 | 状态回写滞后、显存里在途批增多 | 需要占位与修正逻辑、与投机解码耦合 |

## 10.5 中断请求在哪里生效

```python
# 【源码】core.py
_INPUT_SPIN_DURATION_S = 1.0
# _wait_for_output() 在等 Future 时最多自旋 1 秒，边等边处理
# ADD / ABORT / WAKEUP / EXECUTOR_FAILED
# 其余输入进 _deferred_inputs，等本次 step 结束再处理
```

所以「用户点了停止」不是靠外挂 VAD 或另一个线程发信号，而是**在等 GPU 的窗口里被 IO 线程塞进队列，下一步调度时不再分配 token、并释放 KV 块**。这与站内 Higgs 那本全书里「把外部阈值工程变成模型内策略」是两种完全不同的路线：vLLM 的 abort 是显式控制面事件，不是模型学到的行为。

## 10.6 离线入口 `LLM` 与在线入口的差别

```python
# 【源码】vllm/entrypoints/llm.py
llm = LLM(model="...", tensor_parallel_size=8,
          gpu_memory_utilization=0.95, enable_prefix_caching=True)
outputs = llm.generate(prompts, SamplingParams(...))
```

V1 下**离线 `LLM` 同样会拉起 EngineCore 与 GPU workers**，只是用同步的 `generate()` 循环驱动，没有 HTTP server 与流式 OutputProcessor。所以站内 `ray-vllm-optimization-book` 里那套参数（`gpu_memory_utilization`、`max_model_len`、`quantization="fp8"`、`kv_cache_dtype`）最终都落在本书 ch11~ch13 的同一批源码字段上。

> 这解释了第 75 轮那个结论：Ray + vLLM Actor 是「离线批，任务跑完释放」，Ray Serve 是「常驻在线服务，副本常驻 + Router + autoscaling」。两者不是两种引擎，是同一个 `LLM` / EngineCore 实例的两种生命周期管理方式。

## 10.7 一次请求的完整时序（把本章收口）

以贯穿请求 R（prompt 3000 token、共享前缀 2048、生成上限 512）为例：

| 时间 | 位置 | 动作 |
|---|---|---|
| t0 | API Server | tokenize → `EngineCoreRequest`，msgpack 编码 |
| t0+ | ZMQ DEALER | IO 线程解码 → `preprocess_add_request()` → `input_queue` |
| t1 | EngineCore | `run_busy_loop` 取出 → `scheduler.add_request()` |
| t2 | `step()` ② | `schedule()` 分配 token（ch11 算这一步） |
| t2 | `step()` ③④ | 异步下发 GPU；CPU 并行算 grammar bitmask |
| t3 | GPU Worker | `execute_model` → 组 metadata → attention（ch12） |
| t4 | `step()` ⑤⑥ | 采样 → `update_from_output` → 推进 `num_computed_tokens` |
| t4+ | ZMQ PUSH | `OutputProcessor` detokenize → 流式返回 |
| 每 80ms 级重复 | — | 直到 512 token 或命中 stop |

## 10.8 本章小结与坑

- V1 是四类进程：`A + DP + TP×PP×DP`；单机 8 卡 TP=8 是 10 个进程。
- ZMQ IO 线程释放 GIL，让网络收发与 msgpack 编解码与 GPU forward 并行。
- `step()` 六步：has_requests → schedule → execute_model(non_block) → grammar bitmask → wait → update_from_output。
- `batch_queue` 解耦调度与消费输出，`async_scheduling` 预调度下一步，两者省的不是同一段时间。
- ABORT 在 `_wait_for_output` 的 1 秒自旋窗口内被处理。
- 离线 `LLM` 与在线 server 共享 EngineCore，差别只在生命周期。
- **坑 1**：按 GPU 卡数规划 CPU，忽略每实例 10 个进程 → API server Python 线程成瓶颈。
- **坑 2**：以为 `non_block=True` 一定更快，实际开启 batch_queue 后状态回写滞后，调试时序问题会更难。
- **坑 3**：`async_scheduling` 与投机解码/结构化输出组合时，占位 token 的修正逻辑要一并检查。
- **坑 4**：中断后 KV 块没释放（老版本 bug 类），表现为并发逐渐下降。
- **坑 5**：PD 分离下 EngineCore 与远端 KV 传输的等待窗口不在 `step()` 的六步里，需单独看 `KVConnector`（ch13）。

> 下一章是推理侧最核心的一章：`Scheduler.schedule()` 为什么没有 prefill/decode 阶段，以及 8192 token 预算怎么分给四个请求。
