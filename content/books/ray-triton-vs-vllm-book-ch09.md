---
title: "Ray+Triton vs Ray+vLLM 离线推理架构对比 - 第9章: 完整代码实现"
book: "Ray+Triton vs Ray+vLLM：离线推理架构对比"
chapter: "9"
chapterTitle: "完整代码实现：两种架构的生产级代码"
description: "提供 Ray+Triton 和 Ray+vLLM Actor 两种架构的完整生产级代码实现，包含数据预处理、推理、断点续传、监控等完整功能"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "代码实现"
  - "Ray"
  - "Triton"
  - "vLLM"
  - "生产级"
type: "book"
---

# 第 9 章：完整代码实现

> **学习目标**：获得两种架构的完整生产级代码，可以直接适配到自己的离线推理项目中。

---

## 9.1 架构 A：Ray + Triton 完整实现

### 9.1.1 Triton 配置文件

```protobuf
# model_repository/llama-3-8b/config.pbtxt
name: "llama-3-8b"
backend: "tensorrtllm"
max_batch_size: 64

input [
  {
    name: "input_ids"
    data_type: TYPE_INT32
    dims: [ -1 ]
  },
  {
    name: "input_lengths"
    data_type: TYPE_INT32
    dims: [ 1 ]
  }
]

output [
  {
    name: "output_ids"
    data_type: TYPE_INT32
    dims: [ -1, -1 ]
  },
  {
    name: "sequence_length"
    data_type: TYPE_INT32
    dims: [ 1 ]
  }
]

dynamic_batching {
  preferred_batch_size: [ 4, 8, 16, 32, 64 ]
  max_queue_delay_microseconds: 5000
  preserve_ordering: true
}

instance_group [
  {
    kind: KIND_GPU
    count: 1
    gpus: [ 0 ]
  }
]

parameters: {
  key: "gpu_memory_fraction"
  value: { string_value: "0.9" }
}
parameters: {
  key: "max_prompt_embedding_size"
  value: { string_value: "2048" }
}
```

### 9.1.2 启动 Triton Server

```bash
#!/bin/bash
# start_triton.sh

tritonserver \
  --model-repository=/models/model_repository \
  --http-port=8000 \
  --grpc-port=8001 \
  --metrics-port=8002 \
  --cuda-memory-pool-size-bytes=0:72000000000 \
  --log-verbose=0 \
  --backend-directory=/opt/tritonserver/backends \
  --strict-model-config=false &

# 等待模型加载
echo "Waiting for Triton to be ready..."
until curl -s localhost:8000/v2/health/ready; do
  sleep 2
done
echo "Triton is ready."
```

### 9.1.3 Ray + Triton 离线推理代码

```python
"""
architecture_a_triton.py
Ray + Triton 离线推理完整实现
"""

import ray
import json
import os
import time
import logging
from pathlib import Path
from typing import List, Dict, Any

import tritonclient.grpc as tritongrpc
import numpy as np
from transformers import AutoTokenizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TritonHealthCheck:
    """Triton 健康检查工具"""

    def __init__(self, url: str = "localhost:8001"):
        self.url = url

    def is_ready(self) -> bool:
        try:
            client = tritongrpc.InferenceServerClient(url=self.url)
            return client.is_server_ready()
        except Exception:
            return False

    def wait_until_ready(self, timeout: int = 300):
        start = time.time()
        while time.time() - start < timeout:
            if self.is_ready():
                logger.info("Triton is ready")
                return True
            logger.info("Waiting for Triton...")
            time.sleep(5)
        raise TimeoutError(f"Triton not ready within {timeout}s")


@ray.remote(num_cpus=4, max_restarts=3)
class TritonInferenceWorker:
    """Ray Worker: 负责 tokenize → gRPC 推理 → detokenize"""

    def __init__(
        self,
        triton_url: str,
        model_name: str,
        tokenizer_name: str,
        checkpoint_dir: str,
        worker_id: int,
    ):
        self.triton_url = triton_url
        self.model_name = model_name
        self.worker_id = worker_id
        self.checkpoint_dir = checkpoint_dir

        # 初始化 tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)

        # 初始化 Triton 客户端
        self.triton = tritongrpc.InferenceServerClient(
            url=triton_url,
            verbose=False,
        )

        # 加载 checkpoint
        self.checkpoint_file = os.path.join(
            checkpoint_dir, f"worker_{worker_id}.json"
        )
        self.completed_ids = self._load_checkpoint()

        # 推理参数
        self.max_input_len = 2048
        self.max_output_len = 256

    def _load_checkpoint(self) -> set:
        if os.path.exists(self.checkpoint_file):
            with open(self.checkpoint_file) as f:
                data = json.load(f)
                return set(data.get("completed", []))
        return set()

    def _save_checkpoint(self):
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        with open(self.checkpoint_file, "w") as f:
            json.dump({"completed": list(self.completed_ids)}, f)

    def _create_infer_input(self, input_ids_list):
        """创建 Triton 推理输入"""
        # padding 到相同长度
        max_len = max(len(ids) for ids in input_ids_list)
        padded = []
        lengths = []
        for ids in input_ids_list:
            padded.append(ids + [0] * (max_len - len(ids)))
            lengths.append([len(ids)])

        input_ids = np.array(padded, dtype=np.int32)
        input_lengths = np.array(lengths, dtype=np.int32)

        inputs = [
            tritongrpc.InferInput(
                name="input_ids",
                shape=list(input_ids.shape),
                datatype="INT32",
            ),
            tritongrpc.InferInput(
                name="input_lengths",
                shape=list(input_lengths.shape),
                datatype="INT32",
            ),
        ]
        inputs[0].set_data_from_numpy(input_ids)
        inputs[1].set_data_from_numpy(input_lengths)

        return inputs

    def _create_infer_output(self):
        return [
            tritongrpc.RequestedOutput("output_ids"),
            tritongrpc.RequestedOutput("sequence_length"),
        ]

    def process_batch(
        self, batch: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """处理一个 batch 的数据"""
        # 过滤已完成
        pending = [
            item for item in batch
            if item["id"] not in self.completed_ids
        ]
        if not pending:
            return []

        # Tokenize
        texts = [item["prompt"] for item in pending]
        tokenized = self.tokenizer(
            texts,
            truncation=True,
            max_length=self.max_input_len,
            return_tensors=None,
        )

        # 构建 Triton 输入
        input_ids_list = tokenized["input_ids"]
        inputs = self._create_infer_input(input_ids_list)
        outputs = self._create_infer_output()

        # 推理（带重试）
        max_retries = 3
        for attempt in range(max_retries):
            try:
                result = self.triton.infer(
                    model_name=self.model_name,
                    inputs=inputs,
                    outputs=outputs,
                )
                break
            except Exception as e:
                logger.warning(
                    f"Worker {self.worker_id} attempt {attempt+1} failed: {e}"
                )
                if attempt == max_retries - 1:
                    raise
                time.sleep(5)
                # 重新初始化客户端
                self.triton = tritongrpc.InferenceServerClient(
                    url=self.triton_url
                )

        # 解析结果
        output_ids = result.as_numpy("output_ids")
        seq_lengths = result.as_numpy("sequence_length")

        results = []
        for i, item in enumerate(pending):
            seq_len = int(seq_lengths[i][0])
            out_ids = output_ids[i][:seq_len].tolist()
            text = self.tokenizer.decode(out_ids, skip_special_tokens=True)

            results.append({
                "id": item["id"],
                "prompt": item["prompt"],
                "output": text,
            })
            self.completed_ids.add(item["id"])

        # 保存 checkpoint
        self._save_checkpoint()
        return results

    def get_progress(self) -> int:
        return len(self.completed_ids)


def run_architecture_a(
    data_path: str,
    output_path: str,
    model_name: str = "llama-3-8b",
    triton_url: str = "localhost:8001",
    tokenizer_name: str = "meta-llama/Llama-3-8B",
    num_workers: int = 4,
    batch_size: int = 32,
):
    """架构 A 主函数"""
    ray.init()

    # 1. 健康检查
    health = TritonHealthCheck(triton_url)
    health.wait_until_ready()

    # 2. 加载数据
    with open(data_path) as f:
        all_data = json.load(f)
    logger.info(f"Loaded {len(all_data)} items")

    # 3. 按 prompt 长度排序（减少 padding）
    all_data.sort(key=lambda x: len(x["prompt"]))

    # 4. 分 batch
    batches = [
        all_data[i:i + batch_size]
        for i in range(0, len(all_data), batch_size)
    ]

    # 5. 启动 Workers
    checkpoint_dir = "/tmp/checkpoints"
    workers = [
        TritonInferenceWorker.remote(
            triton_url=triton_url,
            model_name=model_name,
            tokenizer_name=tokenizer_name,
            checkpoint_dir=checkpoint_dir,
            worker_id=i,
        )
        for i in range(num_workers)
    ]

    # 6. 分发任务
    futures = []
    for i, batch in enumerate(batches):
        worker = workers[i % num_workers]
        futures.append(worker.process_batch.remote(batch))

    # 7. 收集结果
    all_results = []
    for i, future in enumerate(futures):
        try:
            batch_results = ray.get(future)
            all_results.extend(batch_results)
            if (i + 1) % 10 == 0:
                logger.info(
                    f"Progress: {i+1}/{len(batches)} batches, "
                    f"{len(all_results)} results"
                )
        except Exception as e:
            logger.error(f"Batch {i} failed: {e}")

    # 8. 写入结果
    with open(output_path, "w") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    logger.info(f"Done. {len(all_results)} results written to {output_path}")
    ray.shutdown()


if __name__ == "__main__":
    run_architecture_a(
        data_path="/data/prompts.json",
        output_path="/data/results.json",
    )
```

---

## 9.2 架构 B：Ray + vLLM Actor 完整实现

```python
"""
architecture_b_vllm.py
Ray + vLLM Actor 离线推理完整实现
"""

import ray
import json
import os
import time
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

from vllm import LLM, SamplingParams

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@ray.remote(num_gpus=1, num_cpus=8, max_restarts=3)
class vLLMInferenceActor:
    """Ray Actor: 内嵌 vLLM 引擎，数据加载→推理→后处理全部在进程内"""

    def __init__(
        self,
        model_name: str,
        checkpoint_path: str,
        actor_id: int,
        gpu_memory_utilization: float = 0.95,
        enable_prefix_caching: bool = True,
        max_model_len: int = 4096,
        max_num_seqs: int = 256,
    ):
        self.actor_id = actor_id
        self.checkpoint_path = checkpoint_path

        # 初始化 vLLM 引擎
        logger.info(f"Actor {actor_id}: Loading model {model_name}...")
        self.llm = LLM(
            model=model_name,
            gpu_memory_utilization=gpu_memory_utilization,
            enable_prefix_caching=enable_prefix_caching,
            enforce_eager=False,                   # 启用 CUDA Graph
            max_model_len=max_model_len,
            enable_chunked_prefill=True,           # chunked prefill
            max_num_seqs=max_num_seqs,
            dtype="auto",
        )
        self.tokenizer = self.llm.get_tokenizer()
        logger.info(f"Actor {actor_id}: Model loaded.")

        # Warmup（触发 CUDA Graph 捕获）
        self.llm.generate(
            ["warmup"],
            SamplingParams(max_tokens=1, temperature=0),
        )
        logger.info(f"Actor {actor_id}: Warmup done.")

        # 加载 checkpoint
        self.completed_ids = self._load_checkpoint()

        # 默认采样参数
        self.default_params = SamplingParams(
            temperature=0.0,
            max_tokens=256,
        )

    def _load_checkpoint(self) -> set:
        if os.path.exists(self.checkpoint_path):
            with open(self.checkpoint_path) as f:
                data = json.load(f)
                return set(data.get("completed", []))
        return set()

    def _save_checkpoint(self):
        os.makedirs(os.path.dirname(self.checkpoint_path), exist_ok=True)
        with open(self.checkpoint_path, "w") as f:
            json.dump({"completed": list(self.completed_ids)}, f)

    def generate(
        self,
        prompts: List[str],
        ids: Optional[List[str]] = None,
        temperature: float = 0.0,
        max_tokens: int = 256,
        system_prompt: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """批量推理"""
        # 过滤已完成
        if ids:
            pending = [
                (id_, p) for id_, p in zip(ids, prompts)
                if id_ not in self.completed_ids
            ]
            if not pending:
                return []
            ids_filtered = [p[0] for p in pending]
            prompts_filtered = [p[1] for p in pending]
        else:
            ids_filtered = ids
            prompts_filtered = prompts

        # 添加 system prompt（触发 prefix caching）
        if system_prompt:
            prompts_filtered = [
                f"{system_prompt}\n\n{p}" for p in prompts_filtered
            ]

        # 设置采样参数
        params = SamplingParams(
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # vLLM 推理（进程内调用，零序列化）
        outputs = self.llm.generate(prompts_filtered, params)

        # 解析结果
        results = []
        for i, output in enumerate(outputs):
            result = {
                "id": ids_filtered[i] if ids_filtered else str(i),
                "prompt": output.prompt,
                "output": output.outputs[0].text,
            }
            results.append(result)
            if ids_filtered:
                self.completed_ids.add(ids_filtered[i])

        # 保存 checkpoint
        self._save_checkpoint()
        return results

    def generate_from_file(
        self,
        data_path: str,
        output_path: str,
        batch_size: int = 500,
        system_prompt: Optional[str] = None,
    ):
        """从文件读取数据，分批推理，直接写入结果（Actor 内部完成）"""
        # 在 Actor 内部加载数据（避免 Ray RPC 序列化）
        with open(data_path) as f:
            all_data = json.load(f)
        logger.info(
            f"Actor {self.actor_id}: Loaded {len(all_data)} items"
        )

        # 过滤已完成
        pending = [
            item for item in all_data
            if item["id"] not in self.completed_ids
        ]
        logger.info(
            f"Actor {self.actor_id}: {len(pending)} pending "
            f"({len(all_data) - len(pending)} already done)"
        )

        # 按长度排序（减少 vLLM 内部调度开销）
        pending.sort(key=lambda x: len(x["prompt"]))

        # 统一 system prompt（最大化 prefix caching）
        if system_prompt is None:
            system_prompt = "You are a helpful assistant."

        # 分批推理
        all_results = []
        total_batches = (len(pending) + batch_size - 1) // batch_size

        for batch_idx in range(total_batches):
            start = batch_idx * batch_size
            end = min(start + batch_size, len(pending))
            batch = pending[start:end]

            prompts = [item["prompt"] for item in batch]
            ids = [item["id"] for item in batch]

            # 推理
            results = self.generate(
                prompts=prompts,
                ids=ids,
                system_prompt=system_prompt,
            )
            all_results.extend(results)

            # 增量写入
            with open(output_path, "a") as f:
                for r in results:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")

            # Checkpoint
            self._save_checkpoint()

            if (batch_idx + 1) % 5 == 0:
                logger.info(
                    f"Actor {self.actor_id}: "
                    f"Batch {batch_idx+1}/{total_batches}, "
                    f"{len(all_results)} results"
                )

        logger.info(
            f"Actor {self.actor_id}: Done. "
            f"{len(all_results)} results written to {output_path}"
        )
        return len(all_results)

    def health_check(self) -> bool:
        """健康检查"""
        try:
            self.llm.generate(["health"], SamplingParams(max_tokens=1))
            return True
        except Exception as e:
            logger.error(f"Actor {self.actor_id} health check failed: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            "actor_id": self.actor_id,
            "completed": len(self.completed_ids),
            "gpu_memory_used": ray.get_runtime_context().gpus,
        }


def run_architecture_b(
    data_path: str,
    output_path: str,
    model_name: str = "meta-llama/Llama-3-8B",
    system_prompt: Optional[str] = None,
    gpu_memory_utilization: float = 0.95,
    max_model_len: int = 4096,
    max_num_seqs: int = 256,
):
    """架构 B 主函数"""
    ray.init()

    # 清空输出文件
    open(output_path, "w").close()

    # 创建 Actor
    checkpoint_path = "/tmp/checkpoints/actor_0.json"
    actor = vLLMInferenceActor.remote(
        model_name=model_name,
        checkpoint_path=checkpoint_path,
        actor_id=0,
        gpu_memory_utilization=gpu_memory_utilization,
        max_model_len=max_model_len,
        max_num_seqs=max_num_seqs,
    )

    # 等待模型加载
    logger.info("Waiting for model to load...")
    ray.get(actor.health_check.remote())
    logger.info("Model loaded and healthy.")

    # Actor 内部完成全部推理（数据加载 + 推理 + 写入）
    total = ray.get(
        actor.generate_from_file.remote(
            data_path=data_path,
            output_path=output_path,
            system_prompt=system_prompt,
        )
    )

    logger.info(f"Done. {total} results written to {output_path}")
    ray.shutdown()


if __name__ == "__main__":
    run_architecture_b(
        data_path="/data/prompts.json",
        output_path="/data/results.json",
        model_name="meta-llama/Llama-3-8B",
        system_prompt="You are a helpful assistant. Please answer the following question.",
    )
```

---

## 9.3 代码对比分析

| 维度 | 架构 A 代码 | 架构 B 代码 |
|------|-----------|-----------|
| 总行数 | ~220 行 | ~200 行 |
| 外部依赖 | tritonclient, transformers | vllm, transformers |
| 需要的配置文件 | config.pbtxt + start_triton.sh | 无 |
| 序列化代码 | `_create_infer_input` + protobuf | 无 |
| 数据加载位置 | Ray Worker（进程外） | Actor 内（进程内） |
| Checkpoint 粒度 | 每 batch 保存 | 每 batch 保存 |
| 健康检查 | Triton HTTP 端点 | Actor 方法 |
| 多 Worker 并行 | 支持（多个 Worker 喂 Triton） | 单 Actor（vLLM 内部并行） |
| 模型加载 | Triton 启动时（独立于 Ray） | Actor 初始化时 |

---

## 9.4 进阶：混合架构

在某些场景下，两种架构可以混合使用：

```python
"""
architecture_c_hybrid.py
Triton 常驻在线服务 + vLLM Actor 离线推理
"""

import ray
from ray import serve

# 在线服务：Ray Serve + Triton（复用已有基础设施）
@serve.deployment(num_replicas=1, ray_actor_options={"num_cpus": 4})
class OnlineTritonService:
    """在线服务用 Triton，通过 gRPC 请求"""
    def __init__(self):
        import tritonclient.grpc as tritongrpc
        self.triton = tritongrpc.InferenceServerClient("localhost:8001")

    async def __call__(self, request):
        # 低延迟在线推理
        ...

# 离线推理：vLLM Actor（最大化吞吐）
@ray.remote(num_gpus=1)
class OfflinevLLMActor:
    """离线推理用 vLLM Actor，进程内调用"""
    def __init__(self):
        from vllm import LLM
        self.llm = LLM("meta-llama/Llama-3-8B", gpu_memory_utilization=0.9)

    def batch_generate(self, prompts):
        # 高吞吐离线推理
        ...

# 同时运行
serve.run(OnlineTritonService.bind())  # 在线服务
offline_actor = OfflinevLLMActor.remote()  # 离线 Actor
# 注意：Triton 和 vLLM Actor 不能共享同一 GPU
# 需要分配到不同 GPU
```

---

## 9.5 本章小结

两种架构的代码复杂度相近，但关注点不同：

- **架构 A** 的代码重心在**通信层**——protobuf 序列化、gRPC 客户端、健康检查、重试逻辑
- **架构 B** 的代码重心在**数据层**——数据加载、排序、prefix caching 设计、checkpoint

从工程效率角度看，架构 B 的代码更容易维护——没有网络通信相关的错误处理，没有 protobuf 数据格式转换，整个推理流程就是普通的 Python 函数调用。
