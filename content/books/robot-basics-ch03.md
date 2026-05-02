---
title: "机器人入门——从材料到控制 - 第3章: 控制算法基础"
book: "机器人入门——从材料到控制"
chapter: "3"
chapterTitle: "控制算法基础"
description: "PID控制器设计与调参、状态空间方法、运动学与动力学基础、轨迹规划（梯形速度曲线/多项式插值）"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "PID"
  - "控制算法"
  - "运动学"
  - "轨迹规划"
type: "book"
---

# 第 3 章：控制算法基础

> **学习目标**：能设计 PID 控制器并用 Ziegler-Nichols 方法整定参数；理解正/逆运动学；能生成梯形速度曲线轨迹。

---

## 3.1 PID 控制器

PID 是机器人底层控制的基石，几乎所有电机驱动器都内置 PID。

### 原理

```
输出 u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de(t)/dt

e(t) = 目标值 - 当前值（误差）
```

- **P 项（比例）**：快速消除误差，过大会振荡
- **I 项（积分）**：消除稳态误差，过大会超调和积分饱和
- **D 项（微分）**：预测误差趋势，抑制振荡，对噪声敏感

### 完整实现（含抗积分饱和 + 微分滤波）

```python
class PID:
    """
    带抗积分饱和（Clamping）和低通微分滤波的 PID 控制器
    适用于机器人关节速度/位置控制
    """
    def __init__(self, kp, ki, kd,
                 output_limit=(-100, 100),
                 derivative_filter_tau=0.01):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.limit = output_limit
        self.tau   = derivative_filter_tau   # 微分滤波时间常数

        self.integral    = 0.0
        self.prev_error  = 0.0
        self.prev_deriv  = 0.0   # 滤波后微分项

    def compute(self, setpoint, measurement, dt):
        if dt <= 0:
            return 0.0

        error = setpoint - measurement

        # ── 积分项（带抗饱和）──────────────────────────────
        self.integral += error * dt
        # 积分限幅（避免积分饱和）
        max_integral = (self.limit[1] - self.kp * error) / (self.ki + 1e-9)
        min_integral = (self.limit[0] - self.kp * error) / (self.ki + 1e-9)
        self.integral = max(min_integral, min(max_integral, self.integral))

        # ── 微分项（低通滤波减少噪声放大）────────────────────
        raw_deriv = (error - self.prev_error) / dt
        alpha = dt / (self.tau + dt)
        self.prev_deriv = alpha * raw_deriv + (1 - alpha) * self.prev_deriv

        # ── 输出计算 ───────────────────────────────────────
        output = (self.kp * error
                + self.ki * self.integral
                + self.kd * self.prev_deriv)
        output = max(self.limit[0], min(self.limit[1], output))

        self.prev_error = error
        return output


# 模拟电机速度控制
import time, random

pid = PID(kp=2.0, ki=0.5, kd=0.1, output_limit=(-24, 24))
target_rpm = 100.0
current_rpm = 0.0
motor_inertia = 0.8   # 模拟电机惯量

dt = 0.01
for step in range(300):
    # 添加测量噪声
    measured = current_rpm + random.gauss(0, 0.5)
    voltage = pid.compute(target_rpm, measured, dt)

    # 简化电机模型
    current_rpm += (voltage * 5 - current_rpm * 0.3) * dt / motor_inertia

    if step % 50 == 0:
        print(f"t={step*dt:.2f}s  目标={target_rpm:.0f}rpm  "
              f"实际={current_rpm:.1f}rpm  控制量={voltage:.2f}V")
```

### Ziegler-Nichols 调参方法

1. 先将 Ki=0, Kd=0，只用 P 控制
2. 逐渐增大 Kp，直到系统持续振荡（临界增益 Kc，振荡周期 Pc）
3. 按表计算：

| 控制器类型 | Kp | Ki | Kd |
|-----------|-----|-----|-----|
| P | 0.5×Kc | — | — |
| PI | 0.45×Kc | 1.2/Pc | — |
| PID | 0.6×Kc | 2/Pc | Pc/8 |

---

## 3.2 机器人运动学

### 正运动学（FK）

**问题**：已知各关节角度 θ₁...θₙ，求末端位姿 T

DH（Denavit-Hartenberg）参数法是标准化方法：

```python
import numpy as np

def dh_matrix(theta, d, a, alpha):
    """
    构造 DH 变换矩阵 (4×4)
    theta: 关节角 (rad)
    d:     连杆偏移
    a:     连杆长度
    alpha: 扭转角 (rad)
    """
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    return np.array([
        [ct, -st*ca,  st*sa, a*ct],
        [st,  ct*ca, -ct*sa, a*st],
        [ 0,     sa,     ca,    d],
        [ 0,      0,      0,    1]
    ])

def forward_kinematics(joint_angles, dh_params):
    """
    dh_params: list of (d, a, alpha) for each joint
    返回: 末端 4×4 齐次变换矩阵
    """
    T = np.eye(4)
    for i, (theta, (d, a, alpha)) in enumerate(
            zip(joint_angles, dh_params)):
        T = T @ dh_matrix(theta, d, a, alpha)
    return T

# 2自由度平面机械臂示例
# DH 参数：(d, a, alpha)
L1, L2 = 0.3, 0.25  # 连杆长度 (m)
dh = [(0, L1, 0), (0, L2, 0)]

q = [np.pi/4, np.pi/6]    # 45°, 30°
T = forward_kinematics(q, dh)
print(f"末端位置: x={T[0,3]:.3f}m  y={T[1,3]:.3f}m")
# 解析验证：
# x = L1*cos(q1) + L2*cos(q1+q2)
x_check = L1*np.cos(q[0]) + L2*np.cos(q[0]+q[1])
y_check = L1*np.sin(q[0]) + L2*np.sin(q[0]+q[1])
print(f"解析验证:  x={x_check:.3f}m  y={y_check:.3f}m")
```

### 逆运动学（IK）

**问题**：已知目标末端位姿，求关节角度

对于简单机构有解析解，复杂机构用数值法：

```python
# 2DoF 平面臂解析逆解（有封闭解）
def ik_2dof(x, y, L1, L2):
    """
    返回 (elbow_up, elbow_down) 两个解
    """
    cos_q2 = (x**2 + y**2 - L1**2 - L2**2) / (2 * L1 * L2)
    if abs(cos_q2) > 1:
        raise ValueError(f"目标点 ({x},{y}) 超出工作空间")

    q2_up   =  np.arccos(cos_q2)   # 肘部朝上
    q2_down = -np.arccos(cos_q2)   # 肘部朝下

    def solve_q1(q2):
        k1 = L1 + L2 * np.cos(q2)
        k2 = L2 * np.sin(q2)
        return np.arctan2(y, x) - np.arctan2(k2, k1)

    return (solve_q1(q2_up), q2_up), (solve_q1(q2_down), q2_down)

# 目标点
target = (0.35, 0.20)
solutions = ik_2dof(*target, L1=0.3, L2=0.25)
for i, (q1, q2) in enumerate(solutions):
    print(f"解{i+1}: q1={np.degrees(q1):.1f}°  q2={np.degrees(q2):.1f}°")

# 数值 IK（适合高自由度机器人）
# 使用 ikpy 或 roboticstoolbox-python
# pip install robotics-toolbox-python
```

---

## 3.3 轨迹规划

关节空间轨迹规划决定机器人的运动平滑性和效率。

### 梯形速度曲线

最常用的单轴轨迹规划方法：匀加速→匀速→匀减速。

```python
import numpy as np
import matplotlib.pyplot as plt

def trapezoidal_trajectory(q0, qf, v_max, a_max, dt=0.001):
    """
    梯形速度曲线轨迹规划
    q0, qf: 起点/终点位置
    v_max:  最大速度
    a_max:  最大加速度
    返回: (t_array, q_array, v_array, a_array)
    """
    dq = qf - q0
    sign = np.sign(dq)
    dq_abs = abs(dq)

    # 加速阶段时间
    t_acc = v_max / a_max
    # 加速阶段位移
    d_acc = 0.5 * a_max * t_acc**2

    if 2 * d_acc > dq_abs:
        # 三角形速度曲线（来不及达到 v_max）
        t_acc = np.sqrt(dq_abs / a_max)
        t_total = 2 * t_acc
        v_peak  = a_max * t_acc
    else:
        # 梯形速度曲线
        t_const = (dq_abs - 2 * d_acc) / v_max
        t_total = 2 * t_acc + t_const
        v_peak  = v_max

    t = np.arange(0, t_total + dt, dt)
    q = np.zeros_like(t)
    v = np.zeros_like(t)
    a = np.zeros_like(t)

    for i, ti in enumerate(t):
        if ti <= t_acc:             # 加速段
            a[i] = sign * a_max
            v[i] = sign * a_max * ti
            q[i] = q0 + sign * 0.5 * a_max * ti**2
        elif ti <= t_total - t_acc: # 匀速段
            a[i] = 0
            v[i] = sign * v_peak
            q[i] = q0 + sign * (0.5*a_max*t_acc**2 + v_peak*(ti-t_acc))
        else:                        # 减速段
            t_dec = ti - (t_total - t_acc)
            a[i] = -sign * a_max
            v[i] = sign * (v_peak - a_max * t_dec)
            q_const_end = dq_abs - 0.5 * a_max * t_acc**2
            q[i] = q0 + sign * (q_const_end - 0.5*a_max*t_dec**2 +
                                  v_peak*t_dec - v_peak*t_dec)
            q[i] = qf - sign * 0.5 * a_max * (t_total - ti)**2

    return t, q, v, a

# 生成关节轨迹
t, q, v, a = trapezoidal_trajectory(
    q0=0, qf=np.pi/2, v_max=1.5, a_max=3.0)

print(f"轨迹时间: {t[-1]:.2f}s")
print(f"最大速度: {max(abs(v)):.2f} rad/s")
print(f"采样点数: {len(t)}")
```

### 五次多项式轨迹

满足起止点速度/加速度均为零的边界条件，运动更平滑：

```python
def quintic_polynomial(q0, qf, t_total, dt=0.001):
    """
    五次多项式轨迹（边界：速度=加速度=0）
    """
    t = np.arange(0, t_total + dt, dt)
    s = t / t_total                    # 归一化时间 [0,1]

    # 五次多项式系数（满足边界条件推导）
    q = q0 + (qf - q0) * (10*s**3 - 15*s**4 + 6*s**5)
    v = (qf - q0) / t_total * (30*s**2 - 60*s**3 + 30*s**4)
    a = (qf - q0) / t_total**2 * (60*s - 180*s**2 + 120*s**3)

    return t, q, v, a
```

---

## 3.4 本章小结

- **PID** 是底层控制基石：P 控制快速响应，I 消除稳差，D 抑制振荡；抗积分饱和必须加
- **正运动学**：DH 矩阵连乘即可；`robotics-toolbox-python` 可处理任意 DoF
- **逆运动学**：简单机构用解析解（快速），复杂机构用数值法（ikpy/MoveIt）
- **轨迹规划**：梯形速度曲线用于关节空间；五次多项式适合要求平滑的场景
- **下一章**：仿真环境搭建（Gazebo/MuJoCo/Isaac Sim）与上机调试

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
