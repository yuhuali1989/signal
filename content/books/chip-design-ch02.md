---
title: "芯片设计：从沙子到算力 - 第2章: 数字逻辑与组合/时序电路"
book: "芯片设计：从沙子到算力"
chapter: "2"
chapterTitle: "数字逻辑与组合/时序电路"
description: "布尔代数、逻辑门、组合电路（加法器/MUX/编码器）、时序电路（D触发器/计数器/状态机）——芯片的逻辑积木"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "芯片"
  - "数字逻辑"
  - "Verilog"
  - "组合电路"
  - "时序电路"
  - "状态机"
type: "book"
---

# 第 2 章：数字逻辑与组合/时序电路

> **学习目标**：掌握布尔代数和卡诺图化简，理解组合电路（加法器/多路复用器）和时序电路（触发器/状态机）的设计原理，能用 Verilog 描述基础数字电路。

---

## 2.1 为什么是"数字"

上一章的 MOSFET 可以工作在任意电压，本质是模拟器件。但芯片设计时我们人为规定：

- **逻辑 1** = 高电平（接近 VDD，如 1.8V 或 3.3V）
- **逻辑 0** = 低电平（接近 GND，0V）

这种**二值化抽象**带来三大好处：
1. **噪声容限**：只要电压在阈值范围内，0/1 就不会出错
2. **可再生信号**：经过逻辑门后信号被"重新整形"，噪声不会累积
3. **设计简单**：用布尔代数就能描述任意复杂逻辑

```
模拟信号 vs 数字信号：

模拟：  ╭──╮    ╭──╮    ← 连续变化，噪声直接叠加到信号上
      ╯    ╰──╯    ╰

数字：  ┌──┐    ┌──┐   ← 高/低两种状态，噪声在阈值内被忽略
      ──┘  └────┘  └──

VDD ─────────────────── 高电平区（逻辑 1）
     ↕ 噪声容限 ~0.4V
─────────── 判决阈值（VDD/2）
     ↕ 噪声容限 ~0.4V
GND ─────────────────── 低电平区（逻辑 0）
```

---

## 2.2 布尔代数基础

**布尔代数**用 0 和 1 描述逻辑关系。三种基本运算：

| 运算 | 符号 | 真值表 | 电路 |
|------|------|--------|------|
| AND（与） | A·B 或 AB | 全 1 才输出 1 | NAND + INV |
| OR（或）  | A+B | 有 1 就输出 1 | NOR + INV |
| NOT（非） | Ā 或 ~A | 取反 | INV |

### 重要恒等式

```
德·摩根定律（最常用）：
  ~(A·B) = ~A + ~B    （与非 = 非或）
  ~(A+B) = ~A · ~B    （或非 = 非与）

吸收律：
  A + A·B = A
  A·(A+B) = A

化简例子：
  F = ABC + AB~C + A~BC
    = AB(C + ~C) + A~BC   ← 提取 AB
    = AB + A~BC            ← C+~C=1
    = A(B + ~BC)           ← 提取 A
    = A(B + ~B)(B + C)     ← 分配律
    = A(B + C)             ← B+~B=1
```

### 卡诺图（Karnaugh Map）

卡诺图是快速化简布尔函数的图形工具，相邻格子只差 1 个变量（格雷码排列）。

```
3变量卡诺图：F(A,B,C)

      BC
AB  00  01  11  10
 0 | 0 | 1 | 1 | 0 |
 1 | 0 | 0 | 1 | 1 |

圈相邻的1（圈越大越好，必须是2的幂次个）：
- 圈右上 2×1（BC=01,11，AB=0）：~A·B
  不对，重新看...

实际圈法（格雷码边相邻）：
- 最右列（BC=11）有两个1：A=0,1 → 消去A → BC
- (AB=01, BC=11) + (AB=11, BC=10) → B·~C + A·B = B(A+~C)

最小项和：F = B·C + A·B = B·(C + A)
```

---

## 2.3 基本逻辑门

所有复杂电路都由以下基本门构成。在 CMOS 工艺中，**NAND 和 NOR 是最基础的门**（直接用 PMOS+NMOS 实现），AND/OR 需要额外加反相器。

```verilog
// Verilog 描述基本逻辑门
module basic_gates (
    input  wire a, b, c,
    output wire y_and,   // a AND b
    output wire y_or,    // a OR b
    output wire y_not,   // NOT a
    output wire y_nand,  // a NAND b
    output wire y_nor,   // a NOR b
    output wire y_xor,   // a XOR b（异或：相同出0，不同出1）
    output wire y_xnor   // a XNOR b（同或）
);
    assign y_and  = a & b;
    assign y_or   = a | b;
    assign y_not  = ~a;
    assign y_nand = ~(a & b);
    assign y_nor  = ~(a | b);
    assign y_xor  = a ^ b;
    assign y_xnor = ~(a ^ b);
endmodule

// 真值表验证（Python）
def verify_gates():
    for a in [0, 1]:
        for b in [0, 1]:
            print(f"a={a} b={b}: "
                  f"AND={a&b} OR={a|b} XOR={a^b} "
                  f"NAND={1-(a&b)} NOR={1-(a|b)}")
```

---

## 2.4 组合逻辑电路

**组合逻辑**：输出仅由当前输入决定，与历史状态无关（无记忆）。

### 半加器与全加器

```verilog
// 半加器：两个1位数相加
// 输入：A, B
// 输出：Sum（和位）, Cout（进位）
module half_adder (
    input  wire a, b,
    output wire sum, cout
);
    assign sum  = a ^ b;   // 异或 = 和位
    assign cout = a & b;   // 与 = 进位
endmodule

// 全加器：考虑低位进位 Cin
// Sum = A ⊕ B ⊕ Cin
// Cout = AB + (A⊕B)·Cin
module full_adder (
    input  wire a, b, cin,
    output wire sum, cout
);
    wire s1, c1, c2;
    // 用两个半加器实现
    half_adder ha1(.a(a),  .b(b),   .sum(s1), .cout(c1));
    half_adder ha2(.a(s1), .b(cin), .sum(sum),.cout(c2));
    assign cout = c1 | c2;
endmodule

// 4位串行进位加法器（Ripple Carry Adder）
module adder_4bit (
    input  wire [3:0] a, b,
    input  wire       cin,
    output wire [3:0] sum,
    output wire       cout
);
    wire c1, c2, c3;
    full_adder fa0(.a(a[0]),.b(b[0]),.cin(cin), .sum(sum[0]),.cout(c1));
    full_adder fa1(.a(a[1]),.b(b[1]),.cin(c1),  .sum(sum[1]),.cout(c2));
    full_adder fa2(.a(a[2]),.b(b[2]),.cin(c2),  .sum(sum[2]),.cout(c3));
    full_adder fa3(.a(a[3]),.b(b[3]),.cin(c3),  .sum(sum[3]),.cout(cout));
    // 关键路径：4级 FA 延迟，限制了最高频率
    // 改进：超前进位加法器（CLA）可并行计算进位
endmodule
```

### 多路复用器（MUX）

```verilog
// 2选1 MUX：sel=0选a，sel=1选b
module mux2to1 #(parameter W = 8) (
    input  wire [W-1:0] a, b,
    input  wire         sel,
    output wire [W-1:0] y
);
    assign y = sel ? b : a;
endmodule

// 4选1 MUX（用2选1 MUX构成）
module mux4to1 #(parameter W = 8) (
    input  wire [W-1:0] a, b, c, d,
    input  wire [1:0]   sel,
    output wire [W-1:0] y
);
    wire [W-1:0] m0, m1;
    mux2to1 #(W) m_low (.a(a), .b(b), .sel(sel[0]), .y(m0));
    mux2to1 #(W) m_hi  (.a(c), .b(d), .sel(sel[0]), .y(m1));
    mux2to1 #(W) m_out (.a(m0),.b(m1),.sel(sel[1]), .y(y));
endmodule

// MUX 用途：指令选择、数据路径切换、动态配置
```

### 编码器与译码器

```verilog
// 3-8 译码器（Decoder）：3位输入，选中8位中的1位
module decoder_3to8 (
    input  wire [2:0] sel,
    input  wire       en,       // 使能
    output reg  [7:0] out
);
    always @(*) begin
        out = 8'b0;
        if (en) out[sel] = 1'b1;  // 仅选中的一路为高
    end
endmodule

// 优先编码器：8输入，输出最高优先级的编号
module priority_encoder_8to3 (
    input  wire [7:0] in,
    output reg  [2:0] out,
    output reg        valid   // 输入是否有效
);
    always @(*) begin
        valid = 1;
        casez (in)             // casez 支持 ? 通配符
            8'b1???????: out = 3'd7;
            8'b01??????: out = 3'd6;
            8'b001?????: out = 3'd5;
            8'b0001????: out = 3'd4;
            8'b00001???: out = 3'd3;
            8'b000001??: out = 3'd2;
            8'b0000001?: out = 3'd1;
            8'b00000001: out = 3'd0;
            default:    begin out = 3'd0; valid = 0; end
        endcase
    end
endmodule
```

---

## 2.5 时序逻辑电路

**时序逻辑**：输出不仅与当前输入有关，还与**历史状态**（存储的值）有关。需要时钟信号和存储元件。

### D 触发器（D Flip-Flop，DFF）

DFF 是时序电路最基本的存储单元：在时钟**上升沿**，捕获输入 D，存入 Q。

```
D 触发器时序图：

CLK: ___┐┌┐┌┐┌┐┌___
D  : ___X____1____X___
Q  : ____________1____
              ↑
          上升沿采样
```

```verilog
// D 触发器（同步复位）
module dff_sync (
    input  wire clk, rst_n, d,
    output reg  q
);
    always @(posedge clk) begin   // 上升沿触发
        if (!rst_n)
            q <= 1'b0;            // 非阻塞赋值！
        else
            q <= d;
    end
endmodule

// ⚠️ 时序电路中必须使用 <= 非阻塞赋值
//    组合逻辑中使用 = 阻塞赋值
// 原因：非阻塞赋值在时钟沿同时更新，避免竞争冒险

// 带使能的 D 触发器（常用于寄存器）
module dff_en (
    input  wire clk, rst_n, en, d,
    output reg  q
);
    always @(posedge clk) begin
        if (!rst_n)   q <= 1'b0;
        else if (en)  q <= d;    // 只在 en=1 时更新
        // en=0 时保持原值（锁存）
    end
endmodule
```

### 寄存器（Register）

```verilog
// N 位寄存器：N个DFF并联
module register #(parameter N = 8) (
    input  wire         clk, rst_n, load,
    input  wire [N-1:0] d,
    output reg  [N-1:0] q
);
    always @(posedge clk) begin
        if (!rst_n)      q <= {N{1'b0}};
        else if (load)   q <= d;
    end
endmodule

// 移位寄存器（串行输入 → 并行输出）
module shift_reg #(parameter N = 8) (
    input  wire clk, rst_n, si,  // si = serial in
    output wire [N-1:0] po        // po = parallel out
);
    reg [N-1:0] sr;
    always @(posedge clk) begin
        if (!rst_n) sr <= 0;
        else        sr <= {sr[N-2:0], si};  // 左移，si 入最低位
    end
    assign po = sr;
endmodule
```

### 计数器

```verilog
// 4位同步二进制计数器
module counter_4bit (
    input  wire       clk, rst_n, en,
    output wire [3:0] count,
    output wire       overflow   // 计数到 15 后溢出脉冲
);
    reg [3:0] cnt;
    always @(posedge clk) begin
        if (!rst_n)            cnt <= 4'd0;
        else if (en) begin
            if (cnt == 4'd15)  cnt <= 4'd0;  // 溢出清零
            else               cnt <= cnt + 1;
        end
    end
    assign count    = cnt;
    assign overflow = en & (cnt == 4'd15);
endmodule

// 可加载计数器（用于分频器、定时器）
module counter_loadable #(parameter N = 16) (
    input  wire         clk, rst_n, en, load,
    input  wire [N-1:0] d,
    output wire [N-1:0] count
);
    reg [N-1:0] cnt;
    always @(posedge clk) begin
        if (!rst_n)    cnt <= 0;
        else if (load) cnt <= d;
        else if (en)   cnt <= cnt + 1;
    end
    assign count = cnt;
endmodule
```

---

## 2.6 有限状态机（FSM）

FSM 是描述**有顺序、有状态**逻辑的标准方法，广泛用于控制器、协议处理器。

### 交通灯控制器

```verilog
// 简单交通灯 FSM
// 状态：绿灯(GREEN) → 黄灯(YELLOW) → 红灯(RED) → 绿灯...
// 计时：GREEN=30个周期，YELLOW=5个周期，RED=25个周期

module traffic_light (
    input  wire       clk, rst_n,
    output reg  [1:0] light   // 00=绿, 01=黄, 10=红
);
    // 状态定义
    localparam GREEN  = 2'b00;
    localparam YELLOW = 2'b01;
    localparam RED    = 2'b10;

    reg [1:0]  state, next_state;
    reg [4:0]  timer;

    // 时序逻辑：状态寄存器（Mealy/Moore 机的共同部分）
    always @(posedge clk) begin
        if (!rst_n) begin
            state <= GREEN;
            timer <= 5'd0;
        end else begin
            state <= next_state;
            if (state != next_state) timer <= 5'd0;  // 状态切换，计时器清零
            else                     timer <= timer + 1;
        end
    end

    // 组合逻辑：状态转移（Next State Logic）
    always @(*) begin
        case (state)
            GREEN:  next_state = (timer >= 5'd29) ? YELLOW : GREEN;
            YELLOW: next_state = (timer >= 5'd4)  ? RED    : YELLOW;
            RED:    next_state = (timer >= 5'd24) ? GREEN  : RED;
            default: next_state = GREEN;
        endcase
    end

    // 输出逻辑（Moore 型：输出只与当前状态有关）
    always @(*) begin
        light = state;   // 直接输出状态编码
    end
endmodule
```

### Mealy 机 vs Moore 机

```verilog
// Moore 机：输出 = f(当前状态)
// 优点：输出稳定（无毛刺），时序更容易满足
// 输出在状态变化后才更新

// Mealy 机：输出 = f(当前状态, 当前输入)
// 优点：响应更快（当拍输入当拍输出），状态数更少
// 缺点：组合逻辑路径可能产生毛刺

// 串行序列检测器（检测 "101" 序列，Mealy 机）
module seq_detector_101 (
    input  wire clk, rst_n, din,
    output wire detected    // 检测到 "101" 时输出高脉冲
);
    // 状态：S0(初始) → S1(收到1) → S2(收到10) → 输出(收到101)
    localparam S0 = 2'b00;
    localparam S1 = 2'b01;
    localparam S2 = 2'b10;

    reg [1:0] state, next;

    always @(posedge clk) begin
        if (!rst_n) state <= S0;
        else        state <= next;
    end

    always @(*) begin
        case (state)
            S0: next = din ? S1 : S0;        // 收到1→S1
            S1: next = din ? S1 : S2;        // 收到0→S2，收到1继续S1
            S2: next = din ? S0 : S0;        // 收到1→检测到！回S0
            default: next = S0;
        endcase
    end

    // Mealy 输出：检测到 "101" = 处于S2且当前输入为1
    assign detected = (state == S2) && din;
endmodule
```

---

## 2.7 建立时间与保持时间

时序电路能否正确工作，取决于信号能否在时钟沿前稳定。这是**芯片时序分析**的核心。

```
DFF 时序约束：

      Tsetup  Thold
        ←──→←─→
D: ____XXXXXXX____
CLK:       ↑
           │
     时钟上升沿

Tsetup（建立时间）：时钟沿之前，D 必须已经稳定的最短时间
Thold（保持时间）：时钟沿之后，D 必须继续保持稳定的最短时间

违反 Tsetup → Setup Violation → 触发器捕获错误值或亚稳态
违反 Thold  → Hold Violation  → 值在时钟沿后太早就变了
```

```python
# 时序分析基础：计算最大工作频率

def max_frequency_analysis(
    T_clk_to_q=0.2,     # DFF 输出延迟 (ns)
    T_logic=1.5,         # 组合逻辑延迟 (ns)，关键路径
    T_setup=0.1,         # 建立时间 (ns)
    T_skew=0.05,         # 时钟偏斜 (ns)
):
    """
    时序约束公式：
    T_clk >= T_clk_to_q + T_logic + T_setup + T_skew
    """
    T_min = T_clk_to_q + T_logic + T_setup + T_skew
    F_max = 1.0 / (T_min * 1e-9) / 1e9  # GHz
    
    print(f"关键路径延迟分析:")
    print(f"  DFF 输出延迟 (Tcq):  {T_clk_to_q:.2f} ns")
    print(f"  组合逻辑延迟:        {T_logic:.2f} ns")
    print(f"  建立时间 (Tsetup):   {T_setup:.2f} ns")
    print(f"  时钟偏斜 (Tskew):    {T_skew:.2f} ns")
    print(f"  ─────────────────────────────")
    print(f"  最小时钟周期:        {T_min:.2f} ns")
    print(f"  最大工作频率:        {F_max:.2f} GHz")
    return F_max

# 典型现代芯片时序
max_frequency_analysis(
    T_clk_to_q=0.15,   # 7nm 工艺
    T_logic=0.35,       # 优化后的关键路径
    T_setup=0.08,
    T_skew=0.04,
)
# → 约 1.6 GHz（单级逻辑）
# 实际 CPU 通过流水线将逻辑分散到多级（每级约 15-20 个门）
```

---

## 2.8 组合逻辑 vs 时序逻辑对比

| 特性 | 组合逻辑 | 时序逻辑 |
|------|---------|---------|
| 记忆能力 | 无 | 有（触发器/锁存器） |
| 输出依赖 | 仅当前输入 | 当前输入 + 历史状态 |
| 时钟需求 | 不需要 | 需要（同步设计） |
| Verilog | `always @(*)` | `always @(posedge clk)` |
| 赋值方式 | `=`（阻塞） | `<=`（非阻塞） |
| 典型例子 | 加法器/MUX/译码器 | 计数器/寄存器/FSM |

---

## 2.9 本章小结

- **布尔代数**：AND/OR/NOT 三种运算构成一切逻辑，德·摩根定律和卡诺图是化简工具
- **组合逻辑**：加法器（半加器→全加器→CLA）、MUX、编码/译码器，输出仅由当前输入决定
- **时序逻辑**：D 触发器是基本存储单元，寄存器/计数器/FSM 都由 DFF 构成
- **时序约束**：建立时间和保持时间决定最大工作频率，关键路径优化是芯片设计核心
- **FSM**：Moore/Mealy 两种机型，是控制器设计的标准方法

**下一章**：RTL 设计与 Verilog/SystemVerilog——如何用代码描述真实 CPU 子模块（ALU、流水线、Cache）。

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
