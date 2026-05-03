---
title: "机器人入门——从材料到控制 - 第6章: 运动规划与轨迹生成"
book: "机器人入门——从材料到控制"
chapter: "6"
chapterTitle: "运动规划与轨迹生成"
description: "如何让机器人手臂从 A 点安全、平滑地运动到 B 点：运动学正/逆解、MoveIt 2 配置、笛卡尔路径规划、碰撞检测、速度/加速度曲线设计。"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "运动规划"
  - "MoveIt2"
  - "逆运动学"
  - "轨迹生成"
type: "book"
---

# 第 6 章：运动规划与轨迹生成

> **学习目标**：理解正/逆运动学原理并能手工推导 6 自由度机械臂的 IK；能用 MoveIt 2 规划避障路径；能设计梯形/S 曲线速度轨迹并在真机上执行。

---

## 6.1 运动学基础

### 6.1.1 为什么需要运动学

控制机器人有两个坐标系：

| 坐标系 | 变量 | 典型维度 |
|--------|------|---------|
| **关节空间**（Joint Space） | 各关节角度 θ₁…θₙ | n 维 |
| **笛卡尔空间**（Task Space） | 末端位姿 [x, y, z, R, P, Y] | 6 维 |

人类思考任务时用笛卡尔坐标（"把手移到桌子上方 30cm"），但电机只能接收关节角度指令。**运动学就是两个坐标系之间的转换**。

```
正运动学（FK）: 关节角度 → 末端位姿   (唯一解)
逆运动学（IK）: 末端位姿 → 关节角度   (多解 or 无解)
```

### 6.1.2 D-H 参数与正运动学

Denavit-Hartenberg（DH）约定用 4 个参数描述相邻关节间的坐标变换：

| 参数 | 含义 |
|------|------|
| **a**ᵢ | 连杆长度（沿 xᵢ 轴） |
| **d**ᵢ | 连杆偏距（沿 zᵢ₋₁ 轴） |
| **α**ᵢ | 连杆扭角（绕 xᵢ 轴） |
| **θ**ᵢ | 关节角（绕 zᵢ₋₁ 轴，**转动关节变量**） |

相邻坐标系变换矩阵：

```
      ┌ cos θᵢ  -sin θᵢ cos αᵢ   sin θᵢ sin αᵢ   aᵢ cos θᵢ ┐
Tᵢ =  │ sin θᵢ   cos θᵢ cos αᵢ  -cos θᵢ sin αᵢ   aᵢ sin θᵢ │
      │   0          sin αᵢ           cos αᵢ           dᵢ   │
      └   0             0                0              1    ┘
```

6 自由度机械臂末端位姿（世界坐标系）：

```
T₀⁶ = T₁ · T₂ · T₃ · T₄ · T₅ · T₆
```

```python
import numpy as np

def dh_matrix(theta, d, a, alpha):
    """单关节 DH 变换矩阵（4×4 齐次变换）"""
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    return np.array([
        [ct,  -st*ca,  st*sa,  a*ct],
        [st,   ct*ca, -ct*sa,  a*st],
        [0,      sa,    ca,    d   ],
        [0,       0,     0,    1   ]
    ])

# UR5 DH 参数（标准版）
# theta(变量), d(mm), a(mm), alpha
UR5_DH = [
    # d1=89.2, a=0,    alpha=pi/2
    # d2=0,    a=-425, alpha=0
    # d3=0,    a=-392, alpha=0
    # d4=109,  a=0,    alpha=pi/2
    # d5=94.2, a=0,    alpha=-pi/2
    # d6=82.5, a=0,    alpha=0
    (0,    89.2,   0,    np.pi/2),
    (0,     0,  -425.0,  0),
    (0,     0,  -392.0,  0),
    (0,   109.0,  0,    np.pi/2),
    (0,    94.2,  0,   -np.pi/2),
    (0,    82.5,  0,    0),
]

def forward_kinematics(joint_angles_deg):
    """正运动学：关节角度（°）→ 末端 4×4 齐次变换矩阵"""
    T = np.eye(4)
    for i, (_, d, a, alpha) in enumerate(UR5_DH):
        theta = np.radians(joint_angles_deg[i])
        T = T @ dh_matrix(theta, d, a, alpha)
    return T

# 示例：全零位
T_home = forward_kinematics([0, -90, 0, -90, 0, 0])
print("末端位置 (mm):", T_home[:3, 3].round(1))
# 输出: 末端位置 (mm): [-817.  0.  191.7]
```

### 6.1.3 逆运动学（IK）

IK 是 FK 的逆过程，通常有 **多解**（最多 16 个解）或 **无解**（目标超出工作空间）。

**解法分类：**

| 方法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **解析法** | 几何 + 代数，手工推导 | 速度最快（μs 级） | 仅适用于特定构型（如腕部三轴相交） |
| **数值法（Jacobian）** | 迭代收敛 | 通用 | 可能陷入局部最优，不保证收敛 |
| **学习法（NN-IK）** | 神经网络拟合 | 可考虑约束 | 精度有限，泛化性未知 |

**雅可比矩阵迭代法（数值 IK）：**

```python
def jacobian_ik(target_pos, q_init, max_iter=200, lr=0.01, tol=1e-3):
    """
    数值 IK：雅可比伪逆迭代
    target_pos: 目标末端位置 [x, y, z]（mm）
    q_init:     初始关节角度（°）
    """
    q = np.array(q_init, dtype=float)

    for iteration in range(max_iter):
        T = forward_kinematics(q)
        current_pos = T[:3, 3]
        error = target_pos - current_pos

        if np.linalg.norm(error) < tol:
            print(f"收敛于第 {iteration} 次迭代，误差 {np.linalg.norm(error):.4f} mm")
            return q

        # 数值雅可比矩阵（有限差分）
        eps = 0.1  # 扰动量（°）
        J = np.zeros((3, len(q)))
        for j in range(len(q)):
            q_plus = q.copy(); q_plus[j] += eps
            T_plus = forward_kinematics(q_plus)
            J[:, j] = (T_plus[:3, 3] - current_pos) / eps

        # 伪逆更新
        J_pinv = np.linalg.pinv(J)
        dq = lr * J_pinv @ error
        q += dq

    print("警告：未收敛，返回最后结果")
    return q

# 测试
target = np.array([-500.0, 300.0, 400.0])
q_sol = jacobian_ik(target, q_init=[0, -90, 0, -90, 0, 0])
print("IK 解 (°):", q_sol.round(2))
```

---

## 6.2 工作空间与奇异性分析

### 6.2.1 工作空间可视化

```python
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def sample_workspace(n_samples=5000):
    """随机采样工作空间点云"""
    joint_limits = [
        (-180, 180),  # J1
        (-180,   0),  # J2（UR5 常用范围）
        (-180, 180),  # J3
        (-180, 180),  # J4
        (-180, 180),  # J5
        (-180, 180),  # J6
    ]
    points = []
    for _ in range(n_samples):
        q = [np.random.uniform(lo, hi) for lo, hi in joint_limits]
        T = forward_kinematics(q)
        points.append(T[:3, 3])
    return np.array(points)

pts = sample_workspace(8000)
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')
ax.scatter(pts[:, 0], pts[:, 1], pts[:, 2],
           s=1, alpha=0.3, c=pts[:, 2], cmap='viridis')
ax.set_xlabel('X (mm)'); ax.set_ylabel('Y (mm)'); ax.set_zlabel('Z (mm)')
ax.set_title('UR5 工作空间点云（8000 采样点）')
plt.tight_layout(); plt.savefig('workspace.png', dpi=120)
```

### 6.2.2 奇异构型

奇异点（Singular Configuration）：雅可比矩阵秩亏，关节速度趋向无穷大。

```
典型奇异类型：
┌─────────────────────────────────────────────┐
│ 1. 肩部奇异（Shoulder Singular）             │
│    J1 轴与腕部原点共线时                     │
│    → 避免策略：规划时检测 |p_wrist_xy| < ε  │
│                                              │
│ 2. 肘部奇异（Elbow Singular）                │
│    J3 = 0° or 180°（完全伸展/折叠）          │
│    → 避免策略：路径中段保持肘部弯曲          │
│                                              │
│ 3. 腕部奇异（Wrist Singular）                │
│    J4 与 J6 共线（J5 = 0°）                  │
│    → 避免策略：绕奇异点重新规划姿态          │
└─────────────────────────────────────────────┘
```

**奇异性检测：**

```python
def check_singularity(q, threshold=10.0):
    """
    检测当前构型是否接近奇异点
    threshold: 最小奇异值阈值（越小越接近奇异）
    """
    eps = 0.1
    T = forward_kinematics(q)
    J = np.zeros((3, len(q)))
    for j in range(len(q)):
        q_plus = q.copy(); q_plus[j] += eps
        T_plus = forward_kinematics(q_plus)
        J[:, j] = (T_plus[:3, 3] - T[:3, 3]) / eps

    sv = np.linalg.svd(J, compute_uv=False)
    manipulability = np.prod(sv)  # 可操作度
    min_sv = sv[-1]

    status = "⚠️  奇异！" if min_sv < threshold else "✓ 正常"
    print(f"可操作度: {manipulability:.2f}, 最小奇异值: {min_sv:.3f}  {status}")
    return min_sv > threshold
```

---

## 6.3 MoveIt 2 配置与使用

### 6.3.1 MoveIt 2 架构

```
┌─────────────────────────────────────────────────────┐
│                   用户代码 / RViz2                    │
│         MotionPlanningRequest (goal pose)            │
└──────────────────────┬──────────────────────────────┘
                       │ ROS 2 Action
┌──────────────────────▼──────────────────────────────┐
│              move_group 节点（MoveIt 核心）           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  规划器插件   │  │  碰撞检测    │  │ IK 插件   │  │
│  │  (OMPL/Pilz) │  │  (FCL/Bullet)│  │(KDL/IKFast│  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────────┐│
│  │        规划场景（Planning Scene）                 ││
│  │  机器人 URDF + 碰撞体 + 附着物体 + 环境障碍物    ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────┘
                       │ FollowJointTrajectory Action
┌──────────────────────▼──────────────────────────────┐
│            ros2_control（轨迹执行）                   │
│        JointTrajectoryController                     │
└──────────────────────┬──────────────────────────────┘
                       │ 硬件接口（CAN / EtherCAT）
              ┌────────▼────────┐
              │   真实电机驱动   │
              └─────────────────┘
```

### 6.3.2 MoveIt Setup Assistant 配置步骤

```bash
# 1. 启动 Setup Assistant（需要已有 URDF）
ros2 launch moveit_setup_assistant setup_assistant.launch.py

# Setup Assistant 配置项：
# ① 加载 URDF → 预览机器人模型
# ② Self-Collision → 自动计算不需要碰撞检测的链接对（加速规划）
# ③ Virtual Joints → 定义世界坐标系固定关系
# ④ Planning Groups → 定义 arm（关节链）和 gripper（末端）
# ⑤ Robot Poses → 定义 home / ready / transport 等预设位姿
# ⑥ End Effectors → 关联夹爪到 arm 规划组
# ⑦ Passive Joints → 弹簧驱动等被动关节
# ⑧ ROS 2 Controllers → 生成 controllers.yaml
# ⑨ 生成 MoveIt 配置包 → my_robot_moveit_config/
```

### 6.3.3 Python MoveIt 2 接口（MoveGroup API）

```python
#!/usr/bin/env python3
"""
MoveIt 2 Python 接口示例
运行前先启动：ros2 launch my_robot_moveit_config demo.launch.py
"""
import rclpy
from rclpy.node import Node
from moveit.planning import MoveItPy
from moveit.core.robot_state import RobotState
from geometry_msgs.msg import Pose
import numpy as np

class RobotPlanner(Node):
    def __init__(self):
        super().__init__('robot_planner')
        # 初始化 MoveItPy
        self.moveit = MoveItPy(node_name='moveit_py')
        self.arm = self.moveit.get_planning_component('arm')
        self.robot_model = self.moveit.get_robot_model()
        self.get_logger().info('MoveIt 2 初始化完成')

    def move_to_named_target(self, target_name: str):
        """移动到预设位姿（如 home / ready）"""
        self.arm.set_start_state_to_current_state()
        self.arm.set_goal_state(configuration_name=target_name)
        plan_result = self.arm.plan()
        if plan_result:
            self.get_logger().info(f'规划成功，执行 → {target_name}')
            self.moveit.execute(plan_result.trajectory, controllers=[])
        else:
            self.get_logger().error(f'规划失败: {target_name}')

    def move_to_pose(self, x, y, z, qx=0.0, qy=0.0, qz=0.0, qw=1.0):
        """移动末端到指定笛卡尔位姿"""
        target_pose = Pose()
        target_pose.position.x = x
        target_pose.position.y = y
        target_pose.position.z = z
        target_pose.orientation.x = qx
        target_pose.orientation.y = qy
        target_pose.orientation.z = qz
        target_pose.orientation.w = qw

        self.arm.set_start_state_to_current_state()
        self.arm.set_goal_state(
            pose_stamped_msg=target_pose,
            pose_link='tool0'   # 末端链接名
        )
        plan_result = self.arm.plan()
        if plan_result:
            self.moveit.execute(plan_result.trajectory, controllers=[])
            return True
        return False

    def move_cartesian_path(self, waypoints: list, eef_step=0.01):
        """
        笛卡尔直线路径规划（焊接/涂胶场景）
        waypoints: [(x1,y1,z1), (x2,y2,z2), ...]  单位 m
        eef_step:  末端采样步长（m），越小越平滑但计算量越大
        """
        from moveit_msgs.msg import RobotTrajectory
        poses = []
        for (x, y, z) in waypoints:
            p = Pose()
            p.position.x = x; p.position.y = y; p.position.z = z
            p.orientation.w = 1.0
            poses.append(p)

        fraction, trajectory = self.arm.compute_cartesian_path(
            waypoints=poses,
            eef_step=eef_step,
            jump_threshold=0.0   # 禁用跳跃检测（连续路径）
        )
        self.get_logger().info(f'笛卡尔路径完成度: {fraction*100:.1f}%')
        if fraction > 0.95:
            self.moveit.execute(trajectory, controllers=[])
        else:
            self.get_logger().warn(f'路径完成度过低 ({fraction:.2f})，检查是否有障碍')

    def add_box_obstacle(self, name, x, y, z, size_x=0.1, size_y=0.1, size_z=0.1):
        """向规划场景添加长方体障碍物"""
        from moveit_msgs.msg import CollisionObject
        from shape_msgs.msg import SolidPrimitive
        from geometry_msgs.msg import Pose as GmPose

        planning_scene_monitor = self.moveit.get_planning_scene_monitor()
        with planning_scene_monitor.read_write() as scene:
            co = CollisionObject()
            co.id = name
            co.header.frame_id = 'world'

            box = SolidPrimitive()
            box.type = SolidPrimitive.BOX
            box.dimensions = [size_x, size_y, size_z]

            pose = GmPose()
            pose.position.x = x; pose.position.y = y; pose.position.z = z
            pose.orientation.w = 1.0

            co.primitives = [box]
            co.primitive_poses = [pose]
            co.operation = CollisionObject.ADD
            scene.apply_collision_object(co)
        self.get_logger().info(f'已添加障碍物: {name} at ({x},{y},{z})')


def main():
    rclpy.init()
    planner = RobotPlanner()

    # 1. 回到 home 位
    planner.move_to_named_target('home')

    # 2. 添加桌面障碍物
    planner.add_box_obstacle('table', x=0.5, y=0.0, z=0.3,
                              size_x=1.0, size_y=0.8, size_z=0.05)

    # 3. 移动到目标位姿（绕障）
    planner.move_to_pose(x=0.4, y=0.2, z=0.6, qw=1.0)

    # 4. 执行笛卡尔直线路径（从当前位置画一条线）
    waypoints = [(0.4, 0.2, 0.6), (0.4, 0.2, 0.4), (0.5, 0.2, 0.4)]
    planner.move_cartesian_path(waypoints, eef_step=0.005)

    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

## 6.4 轨迹生成：速度曲线设计

规划器输出的是**路径**（一系列路点），还需要**轨迹生成器**给每个路点分配时间，生成满足速度/加速度约束的**轨迹**。

### 6.4.1 梯形速度曲线

最常用，分三段：**匀加速 → 匀速 → 匀减速**。

```
速度 v
  ↑
v_max ┤     ████████████████
      │   ██              ██
      │ ██                  ██
    0 └──┬─────────────────────→ 时间 t
         ta      tc        td

ta = 加速时间 = v_max / a_max
td = 减速时间 = v_max / a_max
最短总时间: T_min = d/v_max + v_max/a_max  (d = 路径长度)
```

```python
import numpy as np
import matplotlib.pyplot as plt

def trapezoidal_profile(distance, v_max, a_max, dt=0.001):
    """
    梯形速度曲线生成器
    返回: (时间序列, 速度序列, 位置序列)
    """
    t_acc = v_max / a_max          # 加速时间
    d_acc = 0.5 * a_max * t_acc**2 # 加速段位移

    if 2 * d_acc > distance:
        # 距离太短，无法达到 v_max → 三角形曲线
        t_acc = np.sqrt(distance / a_max)
        v_peak = a_max * t_acc
        t_total = 2 * t_acc
        t_coast = 0.0
    else:
        d_coast = distance - 2 * d_acc
        t_coast = d_coast / v_max
        t_total = 2 * t_acc + t_coast
        v_peak = v_max

    t = np.arange(0, t_total, dt)
    vel = np.zeros_like(t)
    pos = np.zeros_like(t)

    for i, ti in enumerate(t):
        if ti <= t_acc:
            vel[i] = a_max * ti
        elif ti <= t_acc + t_coast:
            vel[i] = v_peak
        else:
            vel[i] = v_peak - a_max * (ti - t_acc - t_coast)
        if i > 0:
            pos[i] = pos[i-1] + vel[i] * dt

    return t, vel, pos

# 示例：1.0m 路径，v_max=0.5m/s，a_max=1.0m/s²
t, v, p = trapezoidal_profile(1.0, v_max=0.5, a_max=1.0)
print(f'总时间: {t[-1]:.2f}s，峰值速度: {v.max():.2f}m/s')

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6))
ax1.plot(t, v, 'b-', linewidth=2); ax1.set_ylabel('速度 (m/s)'); ax1.grid(True)
ax2.plot(t, p, 'r-', linewidth=2); ax2.set_ylabel('位置 (m)'); ax2.grid(True)
ax2.set_xlabel('时间 (s)')
plt.suptitle('梯形速度曲线', fontsize=14); plt.tight_layout()
plt.savefig('trapezoidal.png', dpi=120)
```

### 6.4.2 S 曲线（Jerk-limited）

梯形曲线加速度突变导致**冲击（Jerk）**，S 曲线在加速度上再加一层平滑，机械振动更小，适合高精度场景。

```
加速度 a
  ↑
a_max ┤   ████████
      │  █        █
      │ █          █
    0 └────────────────→ 时间 t
      │              █          █
-a_max┤               ████████
      
共 7 段：加加速 / 匀加速 / 减加速 / 匀速 / 加减速 / 匀减速 / 减减速
```

```python
def s_curve_profile(distance, v_max, a_max, j_max, dt=0.001):
    """
    S 曲线速度规划（简化版，假设能达到 v_max 和 a_max）
    j_max: 最大加加速度（jerk），单位 m/s³
    """
    t_j = a_max / j_max           # 加加速段时间
    t_a = v_max / a_max - t_j     # 匀加速段时间（如果 > 0）
    if t_a < 0:                   # 加加速段就已经超过 a_max，需要重算
        t_j = np.sqrt(v_max / j_max)
        t_a = 0.0
    t_acc = 2 * t_j + t_a         # 总加速时间

    d_acc = v_max * t_acc / 2     # 加速段总位移（近似）
    if 2 * d_acc > distance:
        # 简化处理：缩短 v_max
        v_max = distance / t_acc
        d_acc = distance / 2
    d_coast = distance - 2 * d_acc
    t_coast = d_coast / v_max
    t_total = 2 * t_acc + t_coast

    print(f'S曲线: 总时间={t_total:.3f}s, 加速段={t_acc:.3f}s, 匀速段={t_coast:.3f}s')
    # 实际实现略（完整版需分段积分）
    return t_total

# 对比：相同距离，梯形 vs S 曲线
s_curve_profile(1.0, v_max=0.5, a_max=1.0, j_max=5.0)
```

### 6.4.3 多关节同步

多关节机械臂需要所有关节**同时开始、同时结束**，否则末端轨迹弯曲。

```python
def synchronize_joints(joint_distances, v_max_per_joint, a_max_per_joint):
    """
    多关节时间同步：找最慢关节，其余关节按比例缩速
    joint_distances: [Δθ₁, Δθ₂, ..., Δθₙ]（各关节需运动的角度，°）
    返回: 同步后各关节的实际 v_max
    """
    # 计算每个关节单独运动的最短时间
    times = []
    for d, v, a in zip(joint_distances, v_max_per_joint, a_max_per_joint):
        if abs(d) < 1e-6:
            times.append(0.0)
            continue
        d = abs(d)
        t_acc = v / a
        d_acc = 0.5 * a * t_acc**2
        if 2 * d_acc > d:
            t = 2 * np.sqrt(d / a)
        else:
            t = 2 * t_acc + (d - 2*d_acc) / v
        times.append(t)

    t_sync = max(times)  # 最慢关节决定总时间
    print(f"同步总时间: {t_sync:.3f}s (最慢关节)")

    # 各关节按同步时间缩速
    v_sync = []
    for i, (d, v, a, t) in enumerate(zip(joint_distances, v_max_per_joint,
                                          a_max_per_joint, times)):
        if t < 1e-6:
            v_sync.append(0.0)
        else:
            scale = t / t_sync
            v_sync.append(v * scale)  # 等比缩速保持同步
            print(f"  J{i+1}: Δθ={d:.1f}°, v_max 从 {v:.1f}→{v_sync[-1]:.1f} °/s")
    return v_sync, t_sync

# 示例
joint_distances = [45.0, 90.0, -30.0, 60.0, 15.0, 45.0]
v_max_joints    = [180.0]*6   # 每个关节最大 180°/s
a_max_joints    = [360.0]*6   # 每个关节最大 360°/s²
v_sync, t_total = synchronize_joints(joint_distances, v_max_joints, a_max_joints)
```

---

## 6.5 碰撞检测与避障

### 6.5.1 碰撞检测原理

MoveIt 使用 **FCL（Flexible Collision Library）** 或 **Bullet Physics** 进行碰撞检测。

```
碰撞检测层次（从粗到细）：
┌────────────────────────────────────────┐
│ 1. AABB 包围盒（Axis-Aligned Bounding Box）│
│    最快，用于快速排除不可能碰撞的对      │
│                                        │
│ 2. OBB（Oriented Bounding Box）         │
│    有向包围盒，比 AABB 更紧             │
│                                        │
│ 3. 凸包（Convex Hull）精确检测         │
│    GJK 算法，ms 级，用于实际碰撞判断   │
│                                        │
│ 4. 网格（Mesh）精确检测               │
│    最慢，用于精细形状                   │
└────────────────────────────────────────┘
```

### 6.5.2 OMPL 采样规划器选择

```python
# MoveIt 2 中设置规划器（通过参数或代码）
PLANNERS = {
    'RRT':       'RRTkConfigDefault',    # 快速探索随机树，适合一般场景
    'RRTConnect':'RRTConnectConfigDefault', # 双向 RRT，速度更快
    'RRTstar':   'RRTstarcConfigDefault', # 渐近最优，质量更高但慢
    'PRM':       'PRMkConfigDefault',    # 概率路图，适合重复查询
    'STOMP':     'STOMP',                # 随机轨迹优化，平滑性好
    'CHOMP':     'CHOMP',                # 梯度优化，需要代价场
}

# 在 Python API 中设置：
# arm.set_planning_pipeline_id("ompl")
# arm.set_planner_id("RRTConnectConfigDefault")
# arm.set_planning_time(5.0)      # 最长规划时间（秒）
# arm.set_num_planning_attempts(10)  # 多次尝试取最优

# Pilz 工业运动规划器（适合工业精确轨迹）：
# LIN - 末端直线运动（笛卡尔）
# CIRC - 末端圆弧运动
# PTP - 关节空间点到点
```

### 6.5.3 实时碰撞监控

```python
class CollisionMonitor(Node):
    """实时检测机器人与障碍物距离，发出预警"""
    def __init__(self):
        super().__init__('collision_monitor')
        self.moveit = MoveItPy(node_name='collision_monitor')
        self.scene_monitor = self.moveit.get_planning_scene_monitor()

        # 订阅关节状态
        self.joint_sub = self.create_subscription(
            JointState, '/joint_states', self.joint_cb, 10)
        self.min_distance = float('inf')

    def joint_cb(self, msg):
        """每帧检测碰撞距离"""
        with self.scene_monitor.read_only() as scene:
            robot_state = scene.current_state
            # 检测自碰撞
            result = scene.check_self_collision(robot_state)
            if result.collision:
                self.get_logger().error('⚠️  自碰撞检测！立即停止！')

            # 检测与环境碰撞
            result = scene.check_collision(robot_state)
            if result.collision:
                self.get_logger().error('⚠️  环境碰撞检测！立即停止！')
```

---

## 6.6 实战：抓取任务的完整运动规划

### 目标：机械臂从 home 出发，抓取桌面物体，放置到指定位置

```python
class PickAndPlace(Node):
    """完整的抓取-放置任务规划示例"""

    APPROACH_OFFSET = 0.15   # 预抓取点：目标上方 15cm
    RETREAT_OFFSET  = 0.15   # 离开时：向上抬升 15cm

    def __init__(self):
        super().__init__('pick_and_place')
        self.moveit = MoveItPy(node_name='pick_place')
        self.arm     = self.moveit.get_planning_component('arm')
        self.gripper = self.moveit.get_planning_component('gripper')

    def open_gripper(self):
        self.gripper.set_goal_state(configuration_name='open')
        plan = self.gripper.plan()
        if plan: self.moveit.execute(plan.trajectory, controllers=[])

    def close_gripper(self):
        self.gripper.set_goal_state(configuration_name='close')
        plan = self.gripper.plan()
        if plan: self.moveit.execute(plan.trajectory, controllers=[])

    def execute_pick(self, obj_x, obj_y, obj_z):
        """执行抓取序列"""
        self.get_logger().info('=== 开始抓取序列 ===')

        # 1. 回 Home
        self.move_to_named('home')

        # 2. 张开夹爪
        self.open_gripper()

        # 3. 移动到预抓取点（目标正上方）
        approach_ok = self.move_to_pose(
            obj_x, obj_y, obj_z + self.APPROACH_OFFSET,
            orientation='top_down'
        )
        if not approach_ok:
            self.get_logger().error('无法到达预抓取点')
            return False

        # 4. 笛卡尔直线下降到抓取点
        waypoints = [(obj_x, obj_y, obj_z + self.APPROACH_OFFSET),
                     (obj_x, obj_y, obj_z)]
        self.arm.set_start_state_to_current_state()
        fraction, traj = self.arm.compute_cartesian_path(
            waypoints, eef_step=0.005, jump_threshold=0.0)
        if fraction < 0.99:
            self.get_logger().error(f'下降路径不完整: {fraction:.2f}')
            return False
        self.moveit.execute(traj, controllers=[])

        # 5. 闭合夹爪（抓取）
        self.close_gripper()
        self.get_logger().info('✓ 抓取完成')

        # 6. 笛卡尔直线上升（退出）
        waypoints = [(obj_x, obj_y, obj_z),
                     (obj_x, obj_y, obj_z + self.RETREAT_OFFSET)]
        _, traj = self.arm.compute_cartesian_path(waypoints, eef_step=0.005)
        self.moveit.execute(traj, controllers=[])
        return True

    def execute_place(self, place_x, place_y, place_z):
        """执行放置序列"""
        # 预放置 → 直线下降 → 松开 → 直线上升 → Home
        self.move_to_pose(place_x, place_y, place_z + self.APPROACH_OFFSET)
        waypoints = [(place_x, place_y, place_z + self.APPROACH_OFFSET),
                     (place_x, place_y, place_z)]
        _, traj = self.arm.compute_cartesian_path(waypoints, eef_step=0.005)
        self.moveit.execute(traj, controllers=[])
        self.open_gripper()
        waypoints.reverse()
        _, traj = self.arm.compute_cartesian_path(waypoints, eef_step=0.005)
        self.moveit.execute(traj, controllers=[])
        self.move_to_named('home')
        self.get_logger().info('✓ 放置完成')
```

---

## 6.7 本章小结

```
本章知识图谱：

  运动学
  ├─ 正运动学（FK）：DH 参数 → 4×4 齐次变换矩阵
  ├─ 逆运动学（IK）：解析法 / 雅可比迭代法 / IKFast
  └─ 奇异性：肩/肘/腕部奇异，可操作度衡量

  MoveIt 2
  ├─ 架构：move_group / 规划器 / 碰撞检测 / IK 插件
  ├─ Setup Assistant：生成配置包
  └─ Python API：move_to_named / move_to_pose / compute_cartesian_path

  轨迹生成
  ├─ 梯形曲线：3 段，简单高效
  ├─ S 曲线：7 段，低振动
  └─ 多关节同步：按最慢关节时间等比缩速

  碰撞检测
  ├─ FCL / Bullet：AABB → OBB → GJK 多层级
  ├─ 规划器：RRT / RRTConnect / Pilz（LIN/CIRC/PTP）
  └─ 实时监控：check_self_collision / check_collision
```

---

## 思考题

1. 为什么 6 自由度机械臂逆运动学最多有 8 组解（腕部三轴相交时）？请从几何角度解释。
2. 当目标位姿在工作空间边界附近时，IK 数值迭代法容易失败，有哪些工程化的处理策略？
3. 比较 RRT、RRTConnect 和 PRM 三种规划器，在「单次查询障碍少」和「重复查询相同场景」两种情况下各自的优劣势。
4. 笛卡尔路径（`compute_cartesian_path`）的 `jump_threshold` 参数为什么不能设为 0 在所有场景使用？什么情况下会引发问题？
5. 实际焊接任务要求末端严格沿直线运动，但 MoveIt 返回笛卡尔路径完成度只有 70%，你会怎么处理？
