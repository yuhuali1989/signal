---
title: "机器人入门——从材料到控制 - 第4章: 仿真环境搭建"
book: "机器人入门——从材料到控制"
chapter: "4"
chapterTitle: "仿真环境搭建"
description: "Gazebo/MuJoCo/NVIDIA Isaac Sim三大仿真器对比与使用；URDF/MJCF模型导入；ROS 2联调；Sim2Real迁移技巧"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "仿真"
  - "Gazebo"
  - "MuJoCo"
  - "Isaac Sim"
  - "Sim2Real"
type: "book"
---

# 第 4 章：仿真环境搭建

> **学习目标**：能在三大主流仿真器中加载 URDF 模型并运行 ROS 2 接口；理解 Sim2Real Gap 并掌握基本迁移技巧。

---

## 4.1 仿真器选型对比

| 仿真器 | 物理引擎 | ROS 2 支持 | 渲染 | 适用场景 | 价格 |
|--------|---------|------------|------|---------|------|
| **Gazebo (Harmonic)** | ODE/Bullet/DART | 原生 | OGRE2 | 学术/开源项目 | 免费 |
| **MuJoCo** | 自研（最精准）| ros2_mujoco | OpenGL | 强化学习训练 | 免费 |
| **NVIDIA Isaac Sim** | PhysX 5 | 原生 | RTX 光追 | 商业/大规模数据生成 | 免费（个人）|
| **Webots** | ODE | 原生 | 自研 | 教学入门 | 免费 |
| **PyBullet** | Bullet | 自实现 | TinyRenderer | RL 快速原型 | 免费 |

**推荐路径**：
- 学习入门 → **Gazebo + ROS 2**（文档最多，生态最完善）
- 强化学习训练 → **MuJoCo + IsaacGym**（仿真速度最快，单 GPU 可跑 4096 个并行环境）
- 数据生成/光学仿真 → **Isaac Sim**（Omniverse 光追渲染最逼真）

---

## 4.2 Gazebo Harmonic + ROS 2

### 安装

```bash
# Ubuntu 22.04 + ROS 2 Humble
sudo apt install ros-humble-ros-gz-bridge
sudo apt install ros-humble-gz-ros2-control
# 安装 Gazebo Harmonic
sudo curl https://packages.osrfoundation.org/gazebo.gpg -o /usr/share/keyrings/pkgs-osrf-archive-keyring.gpg
sudo apt install gz-harmonic
```

### 最简 URDF + Launch 文件

```xml
<!-- simple_robot.urdf.xacro -->
<?xml version="1.0"?>
<robot name="simple_arm" xmlns:xacro="http://ros.org/wiki/xacro">
  <xacro:property name="L1" value="0.3"/>

  <link name="base_link">
    <visual>
      <geometry><cylinder radius="0.05" length="0.05"/></geometry>
      <material name="gray"><color rgba="0.5 0.5 0.5 1"/></material>
    </visual>
    <collision>
      <geometry><cylinder radius="0.05" length="0.05"/></geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.001" iyy="0.001" izz="0.001"
               ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <link name="link1">
    <visual>
      <origin xyz="0 0 \${L1/2}"/>
      <geometry><cylinder radius="0.025" length="\${L1}"/></geometry>
      <material name="blue"><color rgba="0.2 0.4 0.8 1"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 \${L1/2}"/>
      <geometry><cylinder radius="0.025" length="\${L1}"/></geometry>
    </collision>
    <inertial>
      <mass value="0.3"/>
      <inertia ixx="0.002" iyy="0.002" izz="0.00003"
               ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <joint name="joint1" type="revolute">
    <parent link="base_link"/>
    <child  link="link1"/>
    <origin xyz="0 0 0.025"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14" upper="3.14" effort="10.0" velocity="2.0"/>
    <dynamics damping="0.5" friction="0.1"/>
  </joint>

  <!-- ros2_control 插件 -->
  <ros2_control name="gz_system" type="system">
    <hardware>
      <plugin>gz_ros2_control/GazeboSimSystem</plugin>
    </hardware>
    <joint name="joint1">
      <command_interface name="position"/>
      <state_interface   name="position"/>
      <state_interface   name="velocity"/>
    </joint>
  </ros2_control>

  <!-- Gazebo 插件 -->
  <gazebo>
    <plugin filename="gz_ros2_control-system"
            name="gz_ros2_control::GazeboSimROS2ControlPlugin">
      <robot_param>robot_description</robot_param>
      <robot_param_node>robot_state_publisher</robot_param_node>
      <parameters>$(find simple_arm)/config/controllers.yaml</parameters>
    </plugin>
  </gazebo>
</robot>
```

```python
# launch/sim.launch.py
import os
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    pkg = get_package_share_directory('simple_arm')
    urdf = os.path.join(pkg, 'urdf', 'simple_robot.urdf.xacro')

    return LaunchDescription([
        # 发布 robot_description
        Node(package='robot_state_publisher',
             executable='robot_state_publisher',
             parameters=[{'robot_description':
                          open(urdf).read()}]),
        # 启动 Gazebo
        IncludeLaunchDescription(
            os.path.join(get_package_share_directory('ros_gz_sim'),
                         'launch', 'gz_sim.launch.py'),
            launch_arguments={'gz_args': '-r empty.sdf'}.items()),
        # 生成机器人
        Node(package='ros_gz_sim',
             executable='create',
             arguments=['-name', 'simple_arm',
                        '-topic', 'robot_description']),
        # 控制器管理器
        Node(package='controller_manager',
             executable='spawner',
             arguments=['joint_state_broadcaster',
                        'joint_trajectory_controller']),
    ])
```

---

## 4.3 MuJoCo — 强化学习训练首选

MuJoCo 物理仿真精度最高（尤其接触力），且支持 GPU 并行，是训练 VLA/控制策略的首选。

```python
# pip install mujoco dm_control

import mujoco
import numpy as np

# 加载 MJCF 模型（MuJoCo 自己的格式，比 URDF 更丰富）
MODEL_XML = """
<mujoco model="pendulum">
  <worldbody>
    <geom name="floor" type="plane" size="1 1 0.1"/>
    <body name="link" pos="0 0 0.5">
      <joint name="hinge" type="hinge" axis="0 1 0"
             range="-3.14 3.14"/>
      <geom type="capsule" size="0.02 0.15" rgba="0.4 0.6 0.8 1"/>
    </body>
  </worldbody>
  <actuator>
    <motor name="motor" joint="hinge" gear="1" ctrllimited="true"
           ctrlrange="-3 3"/>
  </actuator>
  <sensor>
    <jointpos name="q"    joint="hinge"/>
    <jointvel name="qdot" joint="hinge"/>
  </sensor>
</mujoco>
"""

model = mujoco.MjModel.from_xml_string(MODEL_XML)
data  = mujoco.MjData(model)

# 仿真循环（无渲染，用于训练）
for step in range(1000):
    # 设置控制输入（力矩）
    data.ctrl[0] = 1.0 * np.sin(step * 0.01)

    # 步进仿真
    mujoco.mj_step(model, data)

    # 读取传感器
    q    = data.sensordata[0]   # 关节角度
    qdot = data.sensordata[1]   # 关节角速度

    if step % 100 == 0:
        print(f"step={step:4d}  q={q:.3f}rad  qdot={qdot:.3f}rad/s")

# IsaacGym / Brax: GPU 并行训练（4096 环境同时运行）
# import isaacgym
# from isaacgymenvs.utils.reformat import omegaconf_to_dict
# env = isaacgymenvs.make(
#     seed=42, task="FrankaCabinet", num_envs=4096,
#     sim_device="cuda:0", rl_device="cuda:0"
# )
```

---

## 4.4 Sim2Real Gap 与迁移技巧

训练好的策略在仿真中表现完美，但在真实机器人上失效——这是 **Sim2Real Gap** 问题。

### 主要差距来源

| 差距类型 | 原因 | 影响 |
|---------|------|------|
| 动力学差距 | 摩擦/阻尼/柔性建模不准 | 动作执行误差 |
| 感知差距 | 光照/纹理/噪声不同 | 视觉策略失效 |
| 延迟差距 | 仿真无通信延迟，真实有 5~30ms | 控制不稳定 |
| 接触差距 | 接触力仿真误差 | 抓取失败 |

### 主流解决方案

```python
# 方案1：域随机化（Domain Randomization）
# 在仿真中随机化物理参数，训练时覆盖真实参数分布

import numpy as np

def randomize_physics_params(env, rng):
    """每个 episode 随机化物理参数"""
    params = {
        # 摩擦系数：真实值附近 ±50% 随机
        'friction':   rng.uniform(0.5, 1.5),
        # 电机阻尼
        'damping':    rng.uniform(0.3, 0.7),
        # 末端执行器质量（抓取不同物体）
        'tool_mass':  rng.uniform(0.05, 0.3),
        # 动作延迟（模拟真实通信延迟）
        'action_delay_steps': rng.integers(0, 3),
        # 观测噪声标准差
        'obs_noise_std': rng.uniform(0.005, 0.02),
    }
    env.set_physics_params(**params)
    return params

# 方案2：System Identification（系统辨识）
# 在真实机器人上采集数据，拟合精确动力学模型
# 常用方法：最小二乘辨识 / Gaussian Process 建模

# 方案3：Residual Policy（残差策略）
# Base policy（仿真训练）+ Residual policy（真实数据微调）
# action_real = action_base + residual_net(observation)

# 方案4：力控 + 阻抗控制（对接触任务最有效）
# 不依赖位置精度，而用力反馈自适应
class ImpedanceController:
    def __init__(self, Kp=200, Kd=20, M=1.0):
        self.Kp = Kp   # 刚度（N/m）
        self.Kd = Kd   # 阻尼（N·s/m）
        self.M  = M    # 虚拟惯量

    def compute(self, x_des, x, xdot, f_ext, dt):
        """
        阻抗控制：M·ẍ + D·ẋ + K·(x-x_des) = f_ext
        输出力控指令，接触时会柔顺变形
        """
        error    = x_des - x
        f_cmd = self.Kp * error - self.Kd * xdot + f_ext
        return f_cmd
```

---

## 4.5 NVIDIA Isaac Sim — 光追级仿真

适合生成大规模视觉训练数据（Synthetic Data Generation）。

```python
# Isaac Sim Python 脚本（需在 Isaac Sim 内运行）
from omni.isaac.kit import SimulationApp

# 启动 Isaac Sim（无头模式，适合服务器训练）
app = SimulationApp({"headless": True, "width": 1280, "height": 720})

import omni.isaac.core.utils.stage as stage_utils
from omni.isaac.core import World
from omni.isaac.core.robots import Robot

world = World(stage_units_in_meters=1.0)

# 加载 URDF
from omni.importer.urdf import _urdf
urdf_interface = _urdf.acquire_urdf_interface()
config = _urdf.ImportConfig()
config.merge_fixed_joints = False
config.fix_base = True

robot_path = urdf_interface.import_robot(
    "/path/to/robot.urdf", config)

world.scene.add_default_ground_plane()
world.reset()

# 光追渲染设置（SDG - Synthetic Data Generation）
import omni.replicator.core as rep

with rep.new_layer():
    camera = rep.create.camera(
        position=(1, 0, 1), look_at=(0, 0, 0))

    # 随机化光照
    with rep.trigger.on_frame(num_frames=1000):
        with rep.randomizer.light():
            rep.randomize.light(
                light_type="Sphere",
                intensity=rep.distribution.uniform(500, 5000))
        # 写入合成数据（RGB + Depth + 分割标签）
        rep.WriterRegistry.get("BasicWriter").initialize(
            output_dir="/data/synthetic",
            rgb=True, depth=True, semantic_segmentation=True)
```

---

## 4.6 本章小结

- **Gazebo** 是 ROS 2 生态首选：文档最多，工具链最完整
- **MuJoCo** 是 RL 训练首选：物理精度高 + GPU 并行 + dm_control 生态
- **Isaac Sim** 适合合成数据生成：RTX 光追渲染，Replicator 数据管线
- **Sim2Real Gap** 是最大挑战：域随机化 + 阻抗控制 + 系统辨识是三板斧
- **下一章**：整机集成与上机调试——从 Hello World 到真正让机器人动起来

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
