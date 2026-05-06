---
title: "芯片设计：从沙子到算力 - 第1章: 半导体物理基础"
book: "芯片设计：从沙子到算力"
chapter: "1"
chapterTitle: "半导体物理基础"
description: "从原子、硅晶体、PN结到MOSFET——理解芯片的最小物理单元"
date: "2026-05-02"
updatedAt: "2026-05-06"
agent: "研究员→编辑→审校员"
tags:
  - "芯片"
  - "半导体"
  - "MOSFET"
  - "PN结"
  - "物理基础"
type: "book"
---

# 第 1 章：半导体物理基础

> **学习目标**：理解硅原子的导电机理、PN 结为何具有单向导电性（含完整物理推导），以及 MOSFET 晶体管如何作为电子开关——这是理解一切芯片的物理根基。

---

## 1.1 为什么从物理开始

一块 iPhone 16 Pro 的 A18 芯片，面积不到 1 个指甲盖，集成了约 **190 亿个晶体管**。  
一个 H100 GPU，每秒执行 **2000 万亿次**浮点运算。

这些令人难以置信的数字，背后只有一个物理机制在工作：**受控制的电子开关**。

理解半导体物理，就是理解：
- 为什么硅（而不是铜或橡胶）是芯片的材料
- 一个晶体管如何用 0.5V 的电压控制电流
- 为什么缩小尺寸就能带来更快的速度和更低的功耗

---

## 1.2 原子与能带理论

### 硅原子结构

硅（Silicon，Si）是第 14 号元素，外层有 **4 个价电子**。每个硅原子与周围 4 个硅原子共享价电子，形成正四面体共价键结构——这就是**硅晶体**（单晶硅）。

```
硅晶体中每个 Si 原子的键合：

        Si
       /|\
      / | \
     Si-Si-Si
      \ | /
       \|/
        Si

4 个共价键，每个键 2 个电子（共享），共 8 个电子满足外层
```

### 导体 / 绝缘体 / 半导体的区别

量子力学给出了答案：**能带理论**。

| 材料类型 | 导带与价带间隙（带隙 Eg） | 导电性 | 例子 |
|---------|----------------------|--------|------|
| 导体 | 0（导带与价带重叠） | 极强 | 铜、铝、金 |
| 半导体 | 约 1~2 eV | 可调控 | 硅(1.12eV)、锗(0.67eV)、GaAs(1.42eV) |
| 绝缘体 | > 4 eV | 极弱 | 二氧化硅(~9eV)、玻璃 |

**硅之所以适合做芯片**，正是因为它的带隙（1.12 eV）：
- 不像导体，可以被"关断"
- 不像绝缘体，可以被掺杂或电场激活导通
- 带隙接近室温热激发（kT ≈ 0.026eV），可以通过电压精确控制

---

## 1.3 掺杂：人为制造载流子

纯净硅的导电性很弱。通过向硅晶格中加入少量杂质原子（**掺杂**），可以大幅改变导电性。

### N 型半导体（Negative）

掺入 **第 V 族元素**（磷 P、砷 As）：5 个价电子，比硅多 1 个。多余的那个电子被弱束缚，极易脱离成为自由电子（**多数载流子为电子**）。

```
P 原子掺入硅晶格：

     Si - Si - Si
     |    |    |
     Si - P  - Si     ← P 有5个价电子，4个参与键合，1个自由
     |    |↑   |
     Si - Si - Si
          |
         自由电子 e⁻（可自由移动导电）
```

### P 型半导体（Positive）

掺入 **第 III 族元素**（硼 B）：3 个价电子，比硅少 1 个。形成一个"空穴"（**Hole**）——正电荷载流子（**多数载流子为空穴**）。

```
B 原子掺入硅晶格：

     Si - Si - Si
     |    |    |
     Si - B  - Si     ← B 只有3个价电子，形成1个空穴（+）
     |    |○   |
     Si - Si - Si
          |
         空穴 h⁺（相邻电子跳入，空穴等效向反方向移动）
```

---

## 1.4 PN 结：单向导电性的完整物理推导

将 P 型和 N 型半导体紧密接触，界面处发生关键的物理过程——**PN 结**。  
这一节用完整的物理推导解释：**为什么 PN 结只允许电流朝一个方向流动？**

---

### Step 1：接触前——两块独立的半导体

**P 型区**：大量空穴（来自硼掺杂），浓度记为 $N_A$（Acceptor，受主浓度，典型值 $10^{16} \sim 10^{18}$ cm⁻³）

**N 型区**：大量自由电子（来自磷掺杂），浓度记为 $N_D$（Donor，施主浓度，典型值 $10^{16} \sim 10^{18}$ cm⁻³）

此时两区都是电中性的——P 区有等量的正空穴和负硼离子核，N 区有等量的自由电子和正磷离子核。

---

### Step 2：接触瞬间——扩散开始

接触后，载流子感受到**浓度梯度**：

- P 区空穴浓度远高于 N 区 → 空穴从 P 向 N **扩散**
- N 区电子浓度远高于 P 区 → 电子从 N 向 P **扩散**

> **扩散（Diffusion）**是纯粹的物理过程，不需要外加电压，只要存在浓度差，载流子就会从高浓度流向低浓度区。

---

### Step 3：耗尽层形成——固定离子核裸露

空穴离开 P 区后，原来中和它的**负硼离子（B⁻）**被留了下来，无法移动（它们固定在晶格中）。  
电子离开 N 区后，原来中和它的**正磷离子（P⁺）**也被留了下来。

结果是：**界面两侧各形成了一层带固定电荷的区域**：

| 位置 | 留下的固定离子 | 电荷 |
|------|-------------|------|
| P 侧耗尽区 | B⁻（固定负离子） | 负电荷 |
| N 侧耗尽区 | P⁺（固定正离子） | 正电荷 |

这个区域内几乎没有自由载流子（都已扩散走或复合），因此叫做**耗尽层**（Depletion Region）。

---

### Step 4：内建电场——自动形成的"势垒"

P 侧带负电，N 侧带正电，自然在耗尽层内形成从 **N 指向 P** 的电场 $E_0$（电场方向从正极到负极）。

这个 $E_0$ 的方向与扩散运动**完全相反**：
- $E_0$ 把 N 区的电子往 N 方向推（阻止电子继续向 P 扩散）
- $E_0$ 把 P 区的空穴往 P 方向推（阻止空穴继续向 N 扩散）

<div style="margin:16px 0;padding:12px 12px 8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#166534;margin:0 0 8px;">📐 PN 结平衡态示意（耗尽区 + 内建电场）</p>
<svg viewBox="0 0 520 190" style="width:100%;max-width:560px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="520" height="190" fill="#fafffe" rx="8"/>
  <!-- P neutral -->
  <rect x="10" y="18" width="150" height="100" fill="#fde68a" rx="4" stroke="#f59e0b" stroke-width="1"/>
  <text x="85" y="36" text-anchor="middle" font-size="11" font-weight="bold" fill="#78350f">P 型（中性区）</text>
  <text x="85" y="49" text-anchor="middle" font-size="9" fill="#92400e">多子：空穴 ⊕</text>
  <text x="35" y="75" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="68" y="75" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="101" y="75" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="134" y="75" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="52" y="100" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="117" y="100" text-anchor="middle" font-size="15" fill="#dc2626">⊕</text>
  <text x="85" y="100" text-anchor="middle" font-size="12" fill="#1d4ed8">⊖</text>
  <!-- P depletion -->
  <rect x="160" y="18" width="90" height="100" fill="#fce7f3" stroke="#db2777" stroke-width="1.5"/>
  <text x="205" y="34" text-anchor="middle" font-size="9" fill="#9d174d" font-weight="bold">耗尽区(P侧)</text>
  <text x="205" y="45" text-anchor="middle" font-size="8" fill="#9d174d">固定负离子 ⊖</text>
  <text x="182" y="70" text-anchor="middle" font-size="15" fill="#be185d">⊖</text>
  <text x="222" y="70" text-anchor="middle" font-size="15" fill="#be185d">⊖</text>
  <text x="182" y="97" text-anchor="middle" font-size="15" fill="#be185d">⊖</text>
  <text x="222" y="97" text-anchor="middle" font-size="15" fill="#be185d">⊖</text>
  <!-- Junction line -->
  <line x1="260" y1="18" x2="260" y2="118" stroke="#be185d" stroke-width="2.5"/>
  <text x="260" y="132" text-anchor="middle" font-size="8" fill="#be185d">冶金结</text>
  <!-- N depletion -->
  <rect x="260" y="18" width="90" height="100" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="305" y="34" text-anchor="middle" font-size="9" fill="#5b21b6" font-weight="bold">耗尽区(N侧)</text>
  <text x="305" y="45" text-anchor="middle" font-size="8" fill="#5b21b6">固定正离子 ⊕</text>
  <text x="280" y="70" text-anchor="middle" font-size="15" fill="#6d28d9">⊕</text>
  <text x="320" y="70" text-anchor="middle" font-size="15" fill="#6d28d9">⊕</text>
  <text x="280" y="97" text-anchor="middle" font-size="15" fill="#6d28d9">⊕</text>
  <text x="320" y="97" text-anchor="middle" font-size="15" fill="#6d28d9">⊕</text>
  <!-- N neutral -->
  <rect x="350" y="18" width="160" height="100" fill="#bfdbfe" rx="4" stroke="#3b82f6" stroke-width="1"/>
  <text x="430" y="36" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e3a8a">N 型（中性区）</text>
  <text x="430" y="49" text-anchor="middle" font-size="9" fill="#1e40af">多子：电子 ⊖</text>
  <text x="375" y="75" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="410" y="75" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="445" y="75" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="480" y="75" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="392" y="100" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="462" y="100" text-anchor="middle" font-size="15" fill="#1d4ed8">⊖</text>
  <text x="427" y="100" text-anchor="middle" font-size="12" fill="#dc2626">⊕</text>
  <!-- E-field arrow (N→P direction) -->
  <defs>
    <marker id="arrowL" markerWidth="7" markerHeight="7" refX="0" refY="3.5" orient="auto">
      <path d="M7,0 L7,7 L0,3.5 z" fill="#7c3aed"/>
    </marker>
  </defs>
  <line x1="348" y1="150" x2="162" y2="150" stroke="#7c3aed" stroke-width="2.5" marker-end="url(#arrowL)"/>
  <text x="255" y="146" text-anchor="middle" font-size="10" font-weight="bold" fill="#5b21b6">← E₀ 内建电场（N→P 方向）</text>
  <!-- W_d label -->
  <line x1="160" y1="168" x2="350" y2="168" stroke="#db2777" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="255" y="178" text-anchor="middle" font-size="9" fill="#9d174d">← W_d（耗尽宽度，正偏变窄/反偏变宽）→</text>
  <text x="255" y="188" text-anchor="middle" font-size="8" fill="#6b7280">V_bi = (kT/q)·ln(N_A·N_D/nᵢ²) ≈ 0.6~0.7V（Si）</text>
</svg>
</div>

---

### Step 5：动态平衡——内建电位差 V_bi

随着扩散持续，耗尽层不断加宽，$E_0$ 不断增强，最终达到一个**动态平衡**：

$$\text{扩散电流} = \text{漂移电流（E₀ 驱动）}$$

此时不再有净载流子流动。内建电位差（Built-in Potential）为：

$$V_{bi} = \frac{kT}{q} \ln\frac{N_A \cdot N_D}{n_i^2}$$

**各参数含义：**
- $k = 1.38 \times 10^{-23}$ J/K：玻尔兹曼常数
- $T$：绝对温度（室温 300K）
- $q = 1.6 \times 10^{-19}$ C：电子电荷量
- $N_A, N_D$：P/N 两侧掺杂浓度
- $n_i = 1.5 \times 10^{10}$ cm⁻³：硅在室温下的本征载流子浓度

**代入典型数值**（$N_A = N_D = 10^{16}$ cm⁻³，$T = 300$K，$kT/q = 0.0259$ V）：

$$V_{bi} = 0.0259 \times \ln\frac{10^{16} \times 10^{16}}{(1.5 \times 10^{10})^2} = 0.0259 \times \ln(4.4 \times 10^{11}) \approx 0.0259 \times 26.8 \approx \mathbf{0.70\ V}$$

这就是我们常说的"硅 PN 结内建电位约 0.7V"的物理来源。

---

### Step 6：单向导电的物理本质——势垒模型

把内建电位 $V_{bi}$ 理解成一堵"势垒墙"：

```
能量（eV）
  │
  │  P 区     耗尽层      N 区
  │           ┌────┐
  │           │    │  ← 势垒高度 = q·V_bi ≈ 0.7eV
  │           │    │
  │ ──────────┘    └──────────
  │
  └──────────────────────────── 位置 x
```

**没有外加电压时（零偏）**：扩散电流与漂移电流精确平衡，净电流为零。

---

#### 正向偏置（Forward Bias）：势垒被削减 → 大量导通

外加正向电压 $V$（P 接正极，N 接负极）：

**机制**：外加电场方向与 $E_0$ **相反**，耗尽层变窄，势垒高度从 $q \cdot V_{bi}$ 降低到 $q(V_{bi} - V)$。

势垒降低意味着：**能越过势垒的多数载流子（空穴、电子）数量按指数增长**。

根据玻尔兹曼统计，能量高于势垒的载流子比例正比于 $e^{-\Delta E / kT}$。势垒每降低 $qV$，越过的载流子数量就增加 $e^{qV/kT}$ 倍。

因此，正向电流：

$$I_{\text{forward}} \propto e^{qV/kT}$$

在 $V = 0.7$V 时：

$$e^{qV/kT} = e^{0.7 / 0.0259} = e^{27} \approx 5 \times 10^{11}$$

**5000 亿倍的增幅**——这就是为什么 0.7V 能让二极管从几乎截止到大量导通。

---

#### 反向偏置（Reverse Bias）：势垒被加强 → 几乎截止

外加反向电压 $-V_R$（N 接正极，P 接负极）：

**机制**：外加电场方向与 $E_0$ **相同**，耗尽层加宽，势垒高度升至 $q(V_{bi} + V_R)$。

多数载流子（空穴、电子）完全无法越过这道加高的势垒。

只有极少数**少数载流子**（P 区里偶然存在的电子、N 区里偶然存在的空穴，浓度 $\sim n_i^2/N$）能被电场拉过耗尽层，形成极微小的**反向饱和电流** $I_0$（量级 nA～pA）。

无论反向电压多大，$I_0$ 几乎不随电压增加（因为少数载流子的供应量是固定的）——这就是"反向截止"的物理原因。

---

### Shockley 方程：两种状态的统一描述

将正反向偏置统一到一个方程，就是著名的 **Shockley 二极管方程**（1949年，William Shockley，后来获诺贝尔奖）：

$$\boxed{I = I_0 \left( e^{qV / nkT} - 1 \right)}$$

**各项含义：**

| 符号 | 含义 | 典型值 |
|------|------|--------|
| $I$ | 通过 PN 结的净电流 | — |
| $I_0$ | 反向饱和电流（少子热激发） | $10^{-12} \sim 10^{-9}$ A |
| $q$ | 电子电量 | $1.6 \times 10^{-19}$ C |
| $V$ | 外加电压（正为正偏，负为反偏） | — |
| $n$ | 理想因子（理想 PN 结 n=1，考虑复合 n=1~2） | 1.0~2.0 |
| $k$ | 玻尔兹曼常数 | $1.38 \times 10^{-23}$ J/K |
| $T$ | 绝对温度 | 300K（室温） |

**热电压**（Thermal Voltage）$V_T = kT/q$，室温下约 **0.0259 V ≈ 26mV**。

所以方程也可写成：

$$I = I_0 \left( e^{V / nV_T} - 1 \right)$$

---

#### 直觉理解：两种情况下方程的行为

**正向偏置（$V \gg V_T$，比如 $V = 0.6$V）**：

指数项远大于 1，$-1$ 可忽略：

$$I \approx I_0 \cdot e^{V/nV_T}$$

电流随电压**指数增长**。每增加 $60$ mV，电流增大约 **10 倍**（$e^{0.06/0.026} \approx 10$）。

**反向偏置（$V \ll 0$，比如 $V = -5$V）**：

指数项趋向 0，方程变为：

$$I \approx I_0 \cdot (0 - 1) = -I_0$$

电流趋向 **$-I_0$**（极小的常数），与反向电压无关——这就是"反向截止"。

<div style="margin:16px 0;padding:12px 12px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#374151;margin:0 0 8px;">📐 I-V 特性曲线示意（Shockley 方程行为）</p>
<svg viewBox="0 0 480 220" style="width:100%;max-width:520px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="480" height="220" fill="#f8fafc" rx="8"/>
  <!-- axes -->
  <defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 z" fill="#374151"/>
    </marker>
  </defs>
  <line x1="60" y1="180" x2="440" y2="180" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>
  <line x1="160" y1="200" x2="160" y2="20" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="445" y="184" font-size="11" fill="#374151">V</text>
  <text x="165" y="16" font-size="11" fill="#374151">I</text>
  <!-- axis labels -->
  <text x="155" y="195" font-size="9" fill="#6b7280" text-anchor="middle">0</text>
  <text x="260" y="195" font-size="9" fill="#16a34a" text-anchor="middle">+0.3V</text>
  <text x="330" y="195" font-size="9" fill="#16a34a" text-anchor="middle">+0.5V</text>
  <text x="390" y="195" font-size="9" fill="#16a34a" text-anchor="middle">+0.7V</text>
  <text x="80" y="195" font-size="9" fill="#dc2626" text-anchor="middle">-5V</text>
  <!-- reverse saturation current line -->
  <line x1="60" y1="175" x2="158" y2="175" stroke="#dc2626" stroke-width="2" stroke-dasharray="4,2"/>
  <text x="100" y="170" font-size="8" fill="#dc2626">-I₀（反向饱和）</text>
  <!-- forward curve: exponential approximation via path -->
  <path d="M160,179 Q230,178 260,172 Q310,160 350,130 Q380,95 400,40" fill="none" stroke="#16a34a" stroke-width="2.5"/>
  <!-- knee point annotation -->
  <line x1="390" y1="180" x2="390" y2="40" stroke="#16a34a" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="385" y="30" font-size="9" fill="#16a34a" text-anchor="middle">正向导通</text>
  <text x="385" y="40" font-size="8" fill="#16a34a" text-anchor="middle">≈0.7V 膝点</text>
  <!-- I₀ label on y-axis -->
  <line x1="155" y1="175" x2="165" y2="175" stroke="#dc2626" stroke-width="1.5"/>
  <text x="148" y="178" font-size="8" fill="#dc2626" text-anchor="end">−I₀</text>
  <!-- annotation boxes -->
  <rect x="65" y="100" width="80" height="44" fill="white" rx="4" stroke="#dc2626" stroke-width="1"/>
  <text x="105" y="115" text-anchor="middle" font-size="8.5" fill="#dc2626" font-weight="bold">反向偏置</text>
  <text x="105" y="127" text-anchor="middle" font-size="8" fill="#dc2626">耗尽层加宽</text>
  <text x="105" y="138" text-anchor="middle" font-size="8" fill="#dc2626">势垒增高</text>
  <rect x="265" y="60" width="90" height="44" fill="white" rx="4" stroke="#16a34a" stroke-width="1"/>
  <text x="310" y="75" text-anchor="middle" font-size="8.5" fill="#16a34a" font-weight="bold">正向偏置</text>
  <text x="310" y="87" text-anchor="middle" font-size="8" fill="#16a34a">耗尽层变窄</text>
  <text x="310" y="98" text-anchor="middle" font-size="8" fill="#16a34a">电流指数增长</text>
</svg>
</div>

---

### 为什么"0.7V导通"而不是"0.3V或1V"？

这个数字并非任意定义，而是由硅的物理参数决定：

1. **$V_{bi}$ 约 0.7V**：前面算过，由硅的带隙（1.12eV）和本征载流子浓度 $n_i$ 决定
2. **导通电流的阈值**：当外加电压接近 $V_{bi}$，势垒几乎消失，多子大量涌入，电流急剧上升
3. **实用定义**：工程上将电流达到"可用量级"（比如 1mA）时对应的电压定义为导通电压，硅约为 0.6~0.7V；锗（带隙 0.67eV）约为 0.2~0.3V；GaAs（带隙 1.42eV）约为 1.2V

---

## 1.5 MOSFET：电压控制的开关

现代芯片使用的晶体管是 **MOSFET**（Metal-Oxide-Semiconductor Field-Effect Transistor，金属-氧化物-半导体场效应晶体管）。它有四个端子：**栅极（Gate）、源极（Source）、漏极（Drain）、衬底（Body/Bulk）**。

### N-MOS 结构

在 P 型硅衬底上，用磷/砷扩散形成两个 N⁺ 区域（Source 和 Drain），中间隔开。上方覆盖极薄的 SiO₂（栅氧化层，厚度 < 2nm），再上面是栅极金属/多晶硅。

<div style="margin:16px 0;padding:12px 12px 8px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#0c4a6e;margin:0 0 8px;">📐 N-MOS 横截面结构（平面 MOSFET）</p>
<svg viewBox="0 0 520 250" style="width:100%;max-width:560px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="520" height="250" fill="#f8fafc" rx="8"/>
  <!-- operating conditions header -->
  <rect x="10" y="5" width="500" height="24" fill="white" rx="4" stroke="#e2e8f0"/>
  <text x="260" y="15" text-anchor="middle" font-size="9.5" fill="#374151">导通条件：V_GS &gt; V_th（阈值电压 ≈ 0.4~0.7V）</text>
  <text x="260" y="25" text-anchor="middle" font-size="8.5" fill="#6b7280">线性区：V_DS &lt; V_GS−V_th　｜　饱和区：V_DS ≥ V_GS−V_th（漏极电流恒定）</text>
  <!-- p-substrate -->
  <rect x="30" y="165" width="460" height="65" fill="#c7d2fe" rx="4"/>
  <text x="260" y="194" text-anchor="middle" font-size="12" font-weight="bold" fill="#3730a3">p-type substrate（p⁻ 硅衬底）</text>
  <text x="260" y="210" text-anchor="middle" font-size="9" fill="#4338ca">掺杂浓度低（~10¹⁵ cm⁻³），电阻率高，4个端子中的 Body（B）</text>
  <!-- Source n+ -->
  <rect x="50" y="120" width="100" height="46" fill="#6ee7b7" rx="3"/>
  <text x="100" y="139" text-anchor="middle" font-size="11" font-weight="bold" fill="#065f46">Source（S）</text>
  <text x="100" y="153" text-anchor="middle" font-size="9" fill="#047857">n⁺ 高掺杂区</text>
  <!-- Drain n+ -->
  <rect x="370" y="120" width="100" height="46" fill="#6ee7b7" rx="3"/>
  <text x="420" y="139" text-anchor="middle" font-size="11" font-weight="bold" fill="#065f46">Drain（D）</text>
  <text x="420" y="153" text-anchor="middle" font-size="9" fill="#047857">n⁺ 高掺杂区</text>
  <!-- channel -->
  <rect x="150" y="120" width="220" height="46" fill="#ddd6fe" rx="2"/>
  <text x="260" y="140" text-anchor="middle" font-size="10" fill="#5b21b6">沟道（channel，p-body）</text>
  <text x="260" y="154" text-anchor="middle" font-size="8.5" fill="#7c3aed">L = 栅极长度（= 工艺节点特征尺寸）</text>
  <!-- inversion layer dashed -->
  <line x1="150" y1="164" x2="370" y2="164" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="260" y="174" text-anchor="middle" font-size="8" fill="#7c3aed">← 反型层（V_GS &gt; V_th 时，电子在此聚集形成 N 型沟道）→</text>
  <!-- gate oxide -->
  <rect x="150" y="110" width="220" height="12" fill="#fca5a5"/>
  <text x="390" y="119" font-size="8.5" fill="#dc2626">← Gate Oxide（SiO₂，1~3 nm）</text>
  <!-- gate -->
  <rect x="150" y="65" width="220" height="46" fill="#fbbf24" rx="3"/>
  <text x="260" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="#78350f">Gate（G）</text>
  <text x="260" y="100" text-anchor="middle" font-size="9.5" fill="#92400e">Polysilicon / Metal 栅极电极</text>
  <!-- gate wire up -->
  <line x1="260" y1="65" x2="260" y2="38" stroke="#78350f" stroke-width="2"/>
  <circle cx="260" cy="34" r="5" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>
  <text x="274" y="38" font-size="9.5" fill="#78350f">V_G（控制电压）</text>
  <!-- source wire -->
  <line x1="100" y1="120" x2="100" y2="50" stroke="#065f46" stroke-width="2"/>
  <circle cx="100" cy="46" r="5" fill="#6ee7b7" stroke="#065f46" stroke-width="1.5"/>
  <text x="30" y="50" font-size="9" fill="#065f46">V_S = 0V</text>
  <!-- drain wire -->
  <line x1="420" y1="120" x2="420" y2="50" stroke="#065f46" stroke-width="2"/>
  <circle cx="420" cy="46" r="5" fill="#6ee7b7" stroke="#065f46" stroke-width="1.5"/>
  <text x="430" y="50" font-size="9" fill="#065f46">V_D &gt; 0V</text>
  <!-- bulk wire -->
  <line x1="260" y1="230" x2="260" y2="244" stroke="#3730a3" stroke-width="1.5"/>
  <circle cx="260" cy="247" r="4" fill="#c7d2fe" stroke="#3730a3" stroke-width="1.5"/>
  <text x="268" y="250" font-size="8.5" fill="#3730a3">Bulk / Body（V_B，通常接地）</text>
</svg>
</div>

### MOSFET 与 PN 结的关联

MOSFET 内部其实包含了两个 PN 结（n⁺-p 结），所以理解了 PN 结才能理解 MOSFET：

**截止状态（$V_{GS} < V_{th}$）**：  
S 和 D 之间是两个**背靠背**的 PN 结（n⁺-p-n⁺）。左边 n⁺S/p 正偏或零偏，右边 p/n⁺D 反偏——至少一个 PN 结阻断电流，因此没有电流流过。

**导通状态（$V_{GS} > V_{th}$）**：  
栅极正电压通过 SiO₂（绝缘层）在其下方的 p 型衬底表面感应出负电荷，当 $V_{GS}$ 超过阈值 $V_{th}$，感应的电子浓度超过空穴浓度，p 型表面被**反型**为 n 型（称为**反型层/沟道**）。此时 S 和 D 通过 n 型沟道连通，PN 结的阻断作用消失，电流从 D 流向 S。

### 工作原理

**截止（OFF，VGS < Vth）：**
- S 和 D 之间是两个背靠背的 PN 结（N⁺-P-N⁺）
- 无论 VDS 正负，至少一个 PN 结反偏
- 电流极小（理想情况下为零）

**导通（ON，VGS > Vth）：**
- Gate 上的正电压吸引 P 型衬底中的电子到 SiO₂界面
- 聚集的电子形成**反型层**（Inversion Layer）= N 型沟道
- S 和 D 通过 N 型沟道连通 → 电流流过 ✓

```python
# MOSFET 电流方程（长沟道模型）

def nmos_current(Vgs, Vds, Vth=0.5, mu_Cox_W_L=200e-6):
    """
    Vgs  — Gate-Source 电压 (V)
    Vds  — Drain-Source 电压 (V)
    Vth  — 阈值电压，约 0.3~0.7V (V)
    mu_Cox_W_L = μn·Cox·(W/L)，工艺参数 × 晶体管宽长比
    
    返回漏极电流 Id (A)
    """
    if Vgs < Vth:
        # 截止区（亚阈值泄漏在现实中不为零，此处简化）
        return 0.0
    
    Vov = Vgs - Vth  # 过驱动电压

    if Vds < Vov:
        # 线性区（Vds < Vgs - Vth）
        Id = mu_Cox_W_L * (Vov * Vds - 0.5 * Vds**2)
    else:
        # 饱和区（Vds >= Vgs - Vth）
        Id = 0.5 * mu_Cox_W_L * Vov**2
    
    return Id

# 示例：画 Id-Vgs 转移特性曲线
import numpy as np

Vgs_range = np.linspace(0, 1.8, 200)
Vds_fixed = 1.0  # 固定 Vds = 1V

currents = [nmos_current(v, Vds_fixed) for v in Vgs_range]

print("Vgs(V)  |  Id(μA)")
print("--------|----------")
for v, i in zip(Vgs_range[::20], currents[::20]):
    bar = '█' * int(i * 1e6 / 5)
    print(f"  {v:.2f}  |  {i*1e6:6.1f}  {bar}")
```

### P-MOS 与 CMOS

P-MOS 与 N-MOS 互补（Complementary）：P-MOS 在 Gate 接低电平时导通。

将 N-MOS 和 P-MOS 互补组合，就是 **CMOS**（Complementary MOS）——现代芯片的基础。

<div style="margin:16px 0;padding:12px 12px 8px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#6d28d9;margin:0 0 8px;">📐 CMOS 反相器（N-MOS 下拉 + P-MOS 上拉）</p>
<svg viewBox="0 0 420 290" style="width:100%;max-width:440px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="420" height="290" fill="#faf5ff" rx="8"/>
  <!-- VDD -->
  <line x1="200" y1="18" x2="200" y2="38" stroke="#dc2626" stroke-width="2"/>
  <line x1="175" y1="18" x2="225" y2="18" stroke="#dc2626" stroke-width="2"/>
  <text x="232" y="22" font-size="12" fill="#dc2626" font-weight="bold">VDD（1.8V）</text>
  <!-- PMOS body line -->
  <line x1="200" y1="38" x2="200" y2="100" stroke="#dc2626" stroke-width="2"/>
  <!-- PMOS source bar (top) -->
  <line x1="200" y1="52" x2="226" y2="52" stroke="#7c3aed" stroke-width="2"/>
  <!-- PMOS drain bar (bottom) -->
  <line x1="200" y1="86" x2="226" y2="86" stroke="#7c3aed" stroke-width="2"/>
  <!-- PMOS gate vertical -->
  <line x1="226" y1="52" x2="226" y2="86" stroke="#7c3aed" stroke-width="2"/>
  <!-- PMOS gate horizontal to circle -->
  <line x1="226" y1="69" x2="244" y2="69" stroke="#7c3aed" stroke-width="2"/>
  <!-- PMOS bubble (inversion) -->
  <circle cx="250" cy="69" r="6" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
  <!-- PMOS gate line to Vin node -->
  <line x1="256" y1="69" x2="300" y2="69" stroke="#374151" stroke-width="2"/>
  <!-- PMOS label -->
  <text x="118" y="64" font-size="11" fill="#7c3aed" font-weight="bold">P-MOS</text>
  <text x="118" y="77" font-size="8.5" fill="#7c3aed">（低电平导通）</text>
  <!-- mid node wire -->
  <line x1="200" y1="86" x2="200" y2="140" stroke="#374151" stroke-width="2"/>
  <!-- Vout wire -->
  <line x1="200" y1="115" x2="330" y2="115" stroke="#374151" stroke-width="2"/>
  <circle cx="200" cy="115" r="4" fill="#374151"/>
  <text x="335" y="119" font-size="12" fill="#374151" font-weight="bold">Vout = ¬Vin</text>
  <!-- NMOS body line -->
  <line x1="200" y1="140" x2="200" y2="202" stroke="#374151" stroke-width="2"/>
  <!-- NMOS drain bar (top) -->
  <line x1="200" y1="154" x2="226" y2="154" stroke="#0284c7" stroke-width="2"/>
  <!-- NMOS source bar (bottom) -->
  <line x1="200" y1="188" x2="226" y2="188" stroke="#0284c7" stroke-width="2"/>
  <!-- NMOS gate vertical -->
  <line x1="226" y1="154" x2="226" y2="188" stroke="#0284c7" stroke-width="2"/>
  <!-- NMOS gate horizontal -->
  <line x1="226" y1="171" x2="300" y2="171" stroke="#374151" stroke-width="2"/>
  <!-- NMOS label -->
  <text x="118" y="163" font-size="11" fill="#0284c7" font-weight="bold">N-MOS</text>
  <text x="118" y="176" font-size="8.5" fill="#0284c7">（高电平导通）</text>
  <!-- GND -->
  <line x1="200" y1="202" x2="200" y2="224" stroke="#059669" stroke-width="2"/>
  <line x1="180" y1="224" x2="220" y2="224" stroke="#059669" stroke-width="2.5"/>
  <line x1="186" y1="231" x2="214" y2="231" stroke="#059669" stroke-width="1.8"/>
  <line x1="192" y1="238" x2="208" y2="238" stroke="#059669" stroke-width="1.2"/>
  <text x="228" y="230" font-size="12" fill="#059669" font-weight="bold">GND</text>
  <!-- Vin vertical bus -->
  <line x1="300" y1="69" x2="300" y2="171" stroke="#374151" stroke-width="2"/>
  <circle cx="300" cy="69" r="3" fill="#374151"/>
  <circle cx="300" cy="171" r="3" fill="#374151"/>
  <line x1="300" y1="120" x2="370" y2="120" stroke="#374151" stroke-width="2"/>
  <circle cx="300" cy="120" r="4" fill="#374151"/>
  <text x="374" y="124" font-size="12" fill="#374151" font-weight="bold">Vin</text>
  <!-- truth table -->
  <rect x="10" y="252" width="400" height="34" fill="white" rx="4" stroke="#e2e8f0"/>
  <text x="210" y="265" text-anchor="middle" font-size="9.5" fill="#374151" font-weight="bold">Vin = 0V → PMOS 导通，NMOS 截止 → Vout = VDD（逻辑 1）</text>
  <text x="210" y="280" text-anchor="middle" font-size="9.5" fill="#374151">Vin = VDD → PMOS 截止，NMOS 导通 → Vout = 0V（逻辑 0）　静态功耗 ≈ 0</text>
</svg>
</div>

---

## 1.6 特征尺寸与摩尔定律

### 什么是"特征尺寸"

MOSFET 最关键的尺寸参数是**栅极长度 L**（Gate Length，即 Source 和 Drain 之间沟道的长度）。

历史上，工艺节点（Process Node）用栅极长度命名：
- 1970年：10μm = 10,000nm
- 1990年：1μm
- 2003年：130nm
- 2012年：22nm（FinFET 出现）
- 2020年：5nm（TSMC N5）
- 2022年：3nm
- 2025年：2nm（GAA）

> ⚠️ **注意**：从 7nm 以后，节点命名已与实际物理尺寸脱钩，更多是营销标签。台积电"3nm"的实际栅极长度约 12nm。

### 缩小的好处：三重红利

```python
# 缩小尺寸的理论收益（Dennard Scaling）

def scaling_benefits(scale_factor=0.7):
    """
    每代节点缩小到 0.7×（面积缩小 0.5×）
    Dennard Scaling 预测（2005年前基本成立）：
    """
    area_ratio    = scale_factor ** 2   # 面积缩小
    speed_gain    = 1 / scale_factor     # 频率提升（RC 常数缩小）
    power_ratio   = scale_factor ** 2    # 功耗降低（V² 缩小 + 面积缩小）
    density_ratio = 1 / scale_factor**2  # 密度提升
    
    print(f"缩小比例:     {scale_factor:.1f}×")
    print(f"面积变为:     {area_ratio:.2f}×  ({(1-area_ratio)*100:.0f}% 更小)")
    print(f"速度提升:     {speed_gain:.2f}×  ({(speed_gain-1)*100:.0f}% 更快)")
    print(f"功耗变为:     {power_ratio:.2f}×  ({(1-power_ratio)*100:.0f}% 更省电)")
    print(f"密度提升:     {density_ratio:.2f}×  (相同面积塞入更多晶体管)")
    return area_ratio, speed_gain, power_ratio

scaling_benefits(0.7)
# 面积变为 0.49×（约缩小一半）
# 速度提升 1.43×（约快 43%）
# 功耗变为 0.49×（约省电一半）
# 密度提升 2.04×（约多塞 2 倍晶体管）
```

### 摩尔定律

Gordon Moore（英特尔创始人）1965 年预测：集成电路上的晶体管数量**每 18~24 个月翻倍**，成本减半。

| 年份 | 代表芯片 | 晶体管数量 |
|------|---------|----------|
| 1971 | Intel 4004 | 2,300 |
| 1985 | Intel 386 | 275,000 |
| 2000 | Intel Pentium 4 | 42,000,000 |
| 2012 | Apple A6 | 1,000,000,000（10亿） |
| 2020 | Apple M1 | 16,000,000,000（160亿） |
| 2024 | Apple M4 | 28,000,000,000（280亿） |

摩尔定律未死，但推动力已从简单的"缩小"变为 **3D 堆叠、GAA 新型晶体管结构、先进封装**。

---

## 1.7 从 FinFET 到 GAA：晶体管的进化

### 平面 MOSFET 的极限

当沟道长度缩小到 ~20nm 以下，平面 MOSFET 面临**短沟道效应**：
- 漏致势垒降低（DIBL）：VDS 影响沟道，Vth 降低
- 亚阈值泄漏电流：即使 Vgs < Vth 也有电流
- 栅极控制能力下降：沟道太短，Gate 无法有效"掐断"电流

### FinFET（鳍式 FET，22nm 起）

Intel 2011年率先量产（22nm）。将沟道从平面变为**垂直鳍片**（Fin），Gate 从三面包裹沟道（3D 结构），大幅增强控制能力。

<div style="margin:16px 0;padding:12px 12px 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#92400e;margin:0 0 8px;">📐 FinFET 结构（Gate 三面包裹硅鳍）</p>
<svg viewBox="0 0 360 190" style="width:100%;max-width:380px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="360" height="190" fill="#fffbeb" rx="8"/>
  <!-- substrate -->
  <rect x="20" y="148" width="320" height="32" fill="#c7d2fe" rx="3" stroke="#818cf8" stroke-width="1"/>
  <text x="180" y="168" text-anchor="middle" font-size="10" fill="#3730a3">p-substrate（衬底）</text>
  <!-- Fin body front face -->
  <rect x="155" y="70" width="50" height="80" fill="#86efac" stroke="#16a34a" stroke-width="1.2"/>
  <!-- Fin top face (isometric) -->
  <polygon points="155,70 175,52 225,52 205,70" fill="#4ade80" stroke="#16a34a" stroke-width="1"/>
  <!-- Fin right face -->
  <polygon points="205,70 225,52 225,130 205,148" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
  <text x="180" y="110" text-anchor="middle" font-size="9" fill="#166534" font-weight="bold">Fin</text>
  <text x="180" y="122" text-anchor="middle" font-size="8" fill="#166534">（硅鳍片）</text>
  <!-- Gate left face -->
  <rect x="140" y="80" width="17" height="48" fill="#fbbf24" opacity="0.88" stroke="#d97706" stroke-width="1"/>
  <!-- Gate right face -->
  <rect x="203" y="80" width="17" height="48" fill="#fbbf24" opacity="0.88" stroke="#d97706" stroke-width="1"/>
  <!-- Gate top face -->
  <polygon points="140,80 158,63 222,63 205,80" fill="#fcd34d" opacity="0.9" stroke="#d97706" stroke-width="1"/>
  <text x="90" y="104" font-size="9" fill="#92400e" font-weight="bold">Gate</text>
  <text x="82" y="115" font-size="8" fill="#92400e">三面包裹</text>
  <text x="82" y="125" font-size="8" fill="#92400e">（三侧控制）</text>
  <line x1="108" y1="110" x2="140" y2="108" stroke="#92400e" stroke-width="1"/>
  <!-- S/D labels -->
  <text x="50" y="142" font-size="9" fill="#065f46" font-weight="bold">Source</text>
  <text x="285" y="142" font-size="9" fill="#065f46" font-weight="bold">Drain</text>
  <!-- annotation -->
  <text x="180" y="183" text-anchor="middle" font-size="9" fill="#92400e">栅极控制面：3 面（两侧 + 顶面），22nm~5nm 节点</text>
</svg>
</div>

### GAA（全环绕栅极，3nm/2nm）

Gate All-Around：Gate **360° 完全包围**沟道纳米片（Nanosheet）。台积电 N2、三星 SF2 采用此结构。

<div style="margin:16px 0;padding:12px 12px 8px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;">
<p style="font-size:11px;font-weight:600;color:#0c4a6e;margin:0 0 8px;">📐 GAA（全环绕栅极）纳米片结构——栅极 360° 完全包围每层纳米片</p>
<svg viewBox="0 0 400 200" style="width:100%;max-width:420px;display:block;margin:0 auto;font-family:sans-serif;">
  <rect width="400" height="200" fill="#f0f9ff" rx="8"/>
  <!-- substrate -->
  <rect x="60" y="162" width="280" height="28" fill="#c7d2fe" rx="3"/>
  <text x="200" y="180" text-anchor="middle" font-size="10" fill="#3730a3">p-substrate</text>
  <!-- 3 nanosheets (bottom to top) -->
  <!-- nanosheet 1 -->
  <rect x="105" y="128" width="190" height="18" fill="#86efac" rx="3" stroke="#16a34a" stroke-width="1.2"/>
  <text x="200" y="141" text-anchor="middle" font-size="8.5" fill="#166534">Nanosheet 1（沟道，W≈30nm, T≈5nm）</text>
  <!-- gate ring 1 -->
  <rect x="96" y="122" width="208" height="30" fill="none" stroke="#fbbf24" stroke-width="3" rx="5"/>
  <!-- nanosheet 2 -->
  <rect x="105" y="89" width="190" height="18" fill="#86efac" rx="3" stroke="#16a34a" stroke-width="1.2"/>
  <text x="200" y="102" text-anchor="middle" font-size="8.5" fill="#166534">Nanosheet 2</text>
  <!-- gate ring 2 -->
  <rect x="96" y="83" width="208" height="30" fill="none" stroke="#fbbf24" stroke-width="3" rx="5"/>
  <!-- nanosheet 3 -->
  <rect x="105" y="50" width="190" height="18" fill="#86efac" rx="3" stroke="#16a34a" stroke-width="1.2"/>
  <text x="200" y="63" text-anchor="middle" font-size="8.5" fill="#166534">Nanosheet 3（顶层）</text>
  <!-- gate ring 3 -->
  <rect x="96" y="44" width="208" height="30" fill="none" stroke="#fbbf24" stroke-width="3" rx="5"/>
  <!-- Gate label -->
  <text x="30" y="103" font-size="9" fill="#92400e" font-weight="bold">Gate</text>
  <text x="22" y="114" font-size="8" fill="#92400e">全环绕</text>
  <line x1="52" y1="106" x2="96" y2="98" stroke="#92400e" stroke-width="1"/>
  <!-- annotation -->
  <text x="200" y="193" text-anchor="middle" font-size="9" fill="#1e40af">控制面：4 面（全环绕，360°），漏电更低，3nm/2nm 节点</text>
</svg>
</div>

---

## 1.8 本章小结

| 概念 | 核心要点 |
|------|---------|
| 硅半导体 | 带隙 1.12eV，可通过掺杂和电场控制导电性 |
| N/P 型掺杂 | N 型多电子（磷掺杂），P 型多空穴（硼掺杂） |
| PN 结形成 | 载流子扩散 → 耗尽层（固定离子）→ 内建电场 $E_0$ → 动态平衡 |
| 单向导电原理 | 正偏削减势垒（$e^{qV/kT}$ 倍增，0.7V时超千亿倍）；反偏加强势垒（仅极小 $I_0$） |
| Shockley 方程 | $I = I_0(e^{V/nV_T} - 1)$，统一描述正反向特性 |
| MOSFET | 栅极电压控制沟道导通/截止，VGS > Vth 开启 |
| CMOS | N+P 互补，静态功耗趋近于零，是所有数字芯片基础 |
| 特征尺寸 | 越小 → 密度更高 / 速度更快 / 功耗更低 |
| FinFET→GAA | 平面→3D 鳍片→纳米片全包围，持续增强栅控能力 |

**下一章**：从单个晶体管到逻辑门，再到能运算的电路——数字逻辑与组合/时序电路基础。

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
