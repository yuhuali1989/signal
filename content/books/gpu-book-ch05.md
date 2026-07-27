---
title: "GPU 工作原理与并发模型 - 第5章: 内存层次与并发中的数据局部性"
book: "GPU 工作原理与并发模型"
chapter: "5"
chapterTitle: "内存层次与并发中的数据局部性"
description: "全局内存合并访问、共享内存 bank conflict、L2 与持久化 L2、统一虚拟内存 UVM，以及并发线程对带宽的竞争"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "内存合并"
  - "bank conflict"
  - "UVM"
  - "L2"
  - "数据局部性"
type: "book"
---

# 第 5 章：内存层次与并发中的数据局部性

> **学习目标**：理解为什么「同样算力的 kernel，性能差 10 倍」往往源于内存访问模式；掌握合并访问、bank conflict、UVM，以及并发线程如何竞争带宽。

---

## 5.1 内存类型速查

| 类型 | 作用域 | 速度 | 备注 |
|---|---|---|---|
| 寄存器 | 线程私有 | 最快 | 编译器分配，溢出到 local |
| 共享内存 | block 内 | ~19 TB/s | 程序员显式 `__shared__` |
| 本地内存 | 线程私有 | 慢（落 HBM） | 寄存器溢出时 |
| L1 | SM 内 | 快 | 与 shared 共用 SRAM |
| L2 | 全卡 | 中 | 40–50MB，可持久化 |
| 全局（HBM） | 全卡 | 2–3.35 TB/s | 主战场，竞争最激烈 |
| 常量/纹理 | 全卡（只读缓存） | 快（只读） | 适合查表 |
| Pinned（锁页） | Host | 经 PCIe/NVLink | 异步拷贝必需 |

---

## 5.2 全局内存合并访问（Coalescing）

全局内存以 **32 字节（或 128 字节）事务** 为单位从 HBM 取数。当 **一个 warp 的 32 个线程访问连续地址** 时，一次事务就能满足全部；若地址散乱，需要多次事务，带宽利用率暴跌。

```cuda
// ✅ 合并：warp 内线程访问连续 a[i]
float v = a[blockIdx.x*blockDim.x + threadIdx.x];

// ❌ 不合并：跨 stride 访问（如转置后按列读）
float v = a[(blockIdx.x*blockDim.x + threadIdx.x) * W];  // 跨 W*4 字节
```

**典型修复**：用共享内存做「转置中转」——先合并读入 shared，再在 shared 内重排，最后合并写回。

> 并发含义：合并访问 **减少了事务数**，等于为「其他 warp / 其他进程」省下带宽，是多进程友好型 kernel 的基本素养。

---

## 5.3 共享内存 Bank Conflict

共享内存被分成 **32 个 bank**（与 warp 宽度对应）。理想情况：warp 内 32 线程各访问不同 bank → 并行无冲突。若多个线程访问 **同一 bank 的不同地址**，就会序列化（bank conflict）。

```cuda
// ❌ 典型 conflict：按列访问一个 32 宽数组
s[threadIdx.x] = ...;  // 若下轮访问 s[threadIdx.x * 32] 则全挤 bank 0
```

**修复**：
1. 加 **padding**（如数组宽度设为 33 而非 32），打散 bank 映射。
2. 用 `uint` 打包多个值一次读。
3. 用 warp 级 `__shfl` 替代共享内存传递。

> 共享内存是「block 内线程协作」的高速区，也是后面多进程共享场景里 **不跨进程** 的边界（第 7 章会对比 IPC 共享的是「全局内存」而非共享内存）。

---

## 5.4 L2 缓存与持久化 L2

L2 是全卡共享的最后一层高速缓存。两个并发相关特性：

- **L2 带宽比 HBM 高数倍**，且能吸收重复访问。
- **持久化 L2（Persistent L2）**：用 `cudaMemcpyToSymbol` / `cudaAccessPolicyWindow` 把「会被反复访问的数据」标记为常驻 L2，避免被驱逐。对「多 kernel 反复读同一份权重」的推理场景收益明显。

```cuda
cudaStreamAttrValue attr;
attr.accessPolicyWindow.base_ptr = d_weights;
attr.accessPolicyWindow.num_bytes = weightBytes;
attr.accessPolicyWindow.hitRatio = 1.0;
attr.accessPolicyWindow.hitAttr = cudaAccessPropertyPersist;
attr.accessPolicyWindow.missAttr = cudaAccessPropertyStreaming;
cudaStreamSetAttribute(stream, cudaStreamAttributeAccessPolicyWindow, &attr);
```

---

## 5.5 统一虚拟内存（UVM）与按需迁移

**UVM** 把 CPU 与 GPU 地址空间统一，程序员可以只声明 `cudaMallocManaged`，由驱动在访问时 **按需把页面在 Host↔Device 间迁移**。

```cuda
float* data;
cudaMallocManaged(&data, N * sizeof(float));  // 不必区分在哪
kernel<<<g, b>>>(data);   // 首次访问触发页面迁移
```

优点：编程简单，适合原型。缺点：
- **首次访问的缺页迁移有延迟**，且跨 PCIe 迁移可能成为瓶颈。
- 多进程下 UVM 的页面归属与一致性更复杂，生产环境大模型训练通常用 **显式 `cudaMalloc` + 主动拷贝** 而非 UVM。

---

## 5.6 并发对带宽的竞争

当很多 warp（甚至多个进程，见第 6 章）同时访问 HBM：
- 总带宽固定（如 H100 ~3.35 TB/s），**大家分时复用**。
- 「合并差 / 事务多」的 kernel 会 **挤占他人带宽**，引发全局变慢。
- L2 命中率、UVM 迁移、原子操作（第 7 章）都会放大竞争。

> 性能口诀：**写 kernel 时假设「带宽很贵且是共享的」**——合并访问、重用共享内存、避免全局原子风暴，既利己也利（同卡的）他者。

---

## 5.7 本章小结

- 全局内存 **合并访问** 决定你能用满多少 HBM 带宽；转置等 stride 访问要用 shared 中转。
- 共享内存 **bank conflict** 会序列化访问，padding / shuffle 可解。
- **持久化 L2** 利于反复读权重；**UVM** 简单但有迁移成本。
- 并发线程（及进程）**竞争固定带宽**，写好访问模式是「多进程友好」的前提。

下一章进入全书最硬核的应用主题：**多进程如何共享同一块 GPU**，以及硬件/驱动提供了哪些切分手段。
