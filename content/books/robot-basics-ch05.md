---
title: "机器人入门——从材料到控制 - 第5章: 整机集成与上机调试"
book: "机器人入门——从材料到控制"
chapter: "5"
chapterTitle: "整机集成与上机调试"
description: "硬件接线规范、ROS 2 Bringup流程、第一次让关节动起来、常见故障排查、遥控操作与可视化、关节零点标定"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "ROS 2"
  - "调试"
  - "标定"
  - "Bringup"
type: "book"
---

# 第 5 章：整机集成与上机调试

> **学习目标**：能完成机器人整机硬件接线并通过安全检查；能编写 ROS 2 Bringup 文件让所有关节上线；独立排查常见硬件/软件故障；完成关节零点标定。

---

## 5.1 上机前安全清单

真实机器人有力量和重量，第一次通电前必须完成以下检查，**避免设备损坏或人员受伤**。

### 硬件安全检查

```
□ 机械结构
  ├─ 所有螺栓已按扭矩规范拧紧（关节螺栓涂 Loctite 243）
  ├─ 线缆已理线、扎带固定，不会被关节夹断
  ├─ 末端执行器已锁定（首次调试不安装工具）
  └─ 机器人底座已固定（地脚螺栓 or 沙袋配重）

□ 电气安全
  ├─ 主电源与控制电源分离（先给控制板上电，确认通信正常再给电机上电）
  ├─ 急停按钮已安装并测试（断开电机驱动使能，不断控制器）
  ├─ 电机驱动器散热良好（散热片/风扇安装）
  ├─ 所有接地线已连接（机架接地，避免共模噪声）
  └─ 电源反接保护二极管或保险丝已安装

□ 软件安全
  ├─ 关节限位已在 URDF 和驱动器中双重配置
  ├─ 速度限制已设为调试值（正常值的 10%）
  ├─ 位置误差保护已开启（误差 > 5° 自动断使能）
  └─ 看门狗超时已配置（控制器失联 500ms 自动停机）
```

### 第一次通电步骤

```bash
# 建议顺序（避免电机在无控制状态下通电运动）
1. 上控制板电（5V/12V 逻辑电源）
2. 连接 USB/CAN，验证驱动器通信正常
3. 将所有关节位置指令设为当前位置（零力矩模式）
4. 上电机主电源（24V/48V）
5. 逐轴使能，观察保持力矩是否正常
6. 发送小角度（1°）位置指令，验证方向正确
```

---

## 5.2 硬件接线规范

### CAN 总线布线

多轴机器人推荐 CAN 总线拓扑，一条总线最多 127 个节点。

```
主控制器 (Jetson/STM32)
    │
    ├─ CAN_H ──────────────────────────────── 120Ω 终端电阻
    ├─ CAN_L ──────────────────────────────── 120Ω 终端电阻
    │
    ├─ Joint1 Driver (ID=1)
    ├─ Joint2 Driver (ID=2)
    ├─ Joint3 Driver (ID=3)
    ├─ Joint4 Driver (ID=4)
    ├─ Joint5 Driver (ID=5)
    └─ Joint6 Driver (ID=6)

注意事项：
- 总线两端各接 120Ω 终端电阻（用万用表测 CAN_H/CAN_L 应读 60Ω）
- 双绞线（AWG22 或更粗），线长 < 40m（1Mbit/s）
- 每个节点 ID 唯一（出厂默认 ID=1，接线前先单独配置）
- 电源地与 CAN 信号地共地（GND 连接）
```

```python
# 批量配置 ODrive CAN ID（连接单个驱动器操作）
import odrive
import can

def set_can_id(new_id: int):
    """将当前连接的 ODrive 设置为指定 CAN ID"""
    odrv = odrive.find_any(timeout=10)
    odrv.axis0.config.can.node_id = new_id
    odrv.save_configuration()
    print(f"已设置 CAN ID = {new_id}，设备将重启")
    try:
        odrv.reboot()
    except:
        pass  # 重启会断开连接，忽略异常

# 逐个连接驱动器并配置 ID
# set_can_id(1)  # Joint1
# set_can_id(2)  # Joint2
# ...

# 扫描总线上的所有节点
def scan_can_bus(channel='can0'):
    bus = can.interface.Bus(channel=channel, bustype='socketcan')
    print(f"扫描 {channel} 总线（按 Ctrl+C 停止）...")
    seen_ids = set()
    try:
        for msg in bus:
            node_id = msg.arbitration_id >> 5  # ODrive CAN ID 在高位
            if node_id not in seen_ids:
                seen_ids.add(node_id)
                print(f"发现节点 ID={node_id}  CAN帧ID=0x{msg.arbitration_id:03X}")
    except KeyboardInterrupt:
        print(f"共发现 {len(seen_ids)} 个节点: {sorted(seen_ids)}")
    finally:
        bus.shutdown()
```

### IMU 安装与减振

```
错误安装（直接刚性固定到机架）：
  机架振动 → 直接传到 IMU → 高频噪声 → 姿态估计漂移

正确安装：
  机架 → 减振泡棉（3M VHB 胶带/硅胶减振垫）→ IMU 安装板
  
  减振垫规格：硬度 30A 硅胶，厚度 3mm
  安装方向：IMU X轴对齐机器人前进方向，Z轴朝上
  
  验证：敲击机架，用 rostopic echo /imu 观察，
        噪声峰值 < 0.5 g（加速度），< 10 dps（角速度）
```

---

## 5.3 ROS 2 Bringup 流程

### 包结构规范

```
my_robot/
├── my_robot_bringup/          # 顶层启动包
│   ├── launch/
│   │   ├── robot.launch.py    # 完整机器人启动
│   │   ├── hardware.launch.py # 仅硬件驱动
│   │   └── sim.launch.py      # 仿真模式
│   └── config/
│       ├── controllers.yaml   # ros2_control 控制器参数
│       └── robot_params.yaml  # 通用参数
├── my_robot_description/      # URDF/mesh 文件
│   ├── urdf/
│   └── meshes/
├── my_robot_hardware/         # 硬件驱动（Hardware Interface）
│   └── src/
└── my_robot_moveit_config/    # MoveIt 2 配置
```

### 完整 Bringup Launch 文件

```python
# my_robot_bringup/launch/robot.launch.py
import os
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, IncludeLaunchDescription,
                             RegisterEventHandler, TimerAction)
from launch.conditions import IfCondition
from launch.event_handlers import OnProcessStart
from launch.substitutions import (Command, FindExecutable, LaunchConfiguration,
                                   PathJoinSubstitution)
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    # ── 参数声明 ──────────────────────────────────────────
    declared_args = [
        DeclareLaunchArgument('use_sim', default_value='false',
                              description='是否使用仿真模式'),
        DeclareLaunchArgument('use_rviz', default_value='true'),
        DeclareLaunchArgument('log_level', default_value='info'),
    ]

    use_sim  = LaunchConfiguration('use_sim')
    use_rviz = LaunchConfiguration('use_rviz')

    # ── 生成 robot_description（通过 xacro）─────────────────
    pkg_desc = FindPackageShare('my_robot_description')
    urdf_path = PathJoinSubstitution([pkg_desc, 'urdf', 'my_robot.urdf.xacro'])
    robot_description = Command([FindExecutable(name='xacro'), ' ', urdf_path,
                                 ' use_sim:=', use_sim])

    # ── 节点定义 ──────────────────────────────────────────
    robot_state_pub = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[{'robot_description': robot_description,
                     'publish_frequency': 100.0}],
        output='screen',
    )

    # ros2_control 控制器管理器
    controller_manager = Node(
        package='controller_manager',
        executable='ros2_control_node',
        parameters=[
            {'robot_description': robot_description},
            PathJoinSubstitution([FindPackageShare('my_robot_bringup'),
                                  'config', 'controllers.yaml']),
        ],
        output='screen',
    )

    # 关节状态广播器（在控制器管理器启动后 1s 启动）
    joint_state_broadcaster = TimerAction(
        period=1.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['joint_state_broadcaster', '-c', '/controller_manager'],
        )]
    )

    # 轨迹控制器
    joint_trajectory_ctrl = TimerAction(
        period=2.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['joint_trajectory_controller', '-c', '/controller_manager'],
        )]
    )

    # IMU 驱动
    imu_node = Node(
        package='icm42688_ros2',
        executable='icm42688_node',
        parameters=[{'frame_id': 'imu_link', 'publish_rate': 200}],
        output='screen',
    )

    # RViz 可视化
    rviz_config = PathJoinSubstitution([
        FindPackageShare('my_robot_bringup'), 'rviz', 'robot.rviz'])
    rviz = Node(
        package='rviz2',
        executable='rviz2',
        arguments=['-d', rviz_config],
        condition=IfCondition(use_rviz),
        output='screen',
    )

    return LaunchDescription(declared_args + [
        robot_state_pub,
        controller_manager,
        joint_state_broadcaster,
        joint_trajectory_ctrl,
        imu_node,
        rviz,
    ])
```

### controllers.yaml 配置

```yaml
# config/controllers.yaml
controller_manager:
  ros__parameters:
    update_rate: 1000  # Hz，控制频率

    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster

    joint_trajectory_controller:
      type: joint_trajectory_controller/JointTrajectoryController

joint_trajectory_controller:
  ros__parameters:
    joints:
      - joint1
      - joint2
      - joint3
      - joint4
      - joint5
      - joint6
    command_interfaces:
      - position
    state_interfaces:
      - position
      - velocity
    # 运动学约束
    constraints:
      stopped_velocity_tolerance: 0.05  # rad/s
      goal_time: 1.0                    # 超时时间 (s)
    # 轨迹状态发布频率
    state_publish_rate: 100.0
    action_monitor_rate: 20.0
```

---

## 5.4 第一次让关节动起来

通过 ros2 命令行直接发送轨迹，验证整个链路。

```bash
# 1. 检查控制器状态
ros2 control list_controllers

# 预期输出：
# joint_state_broadcaster[joint_state_broadcaster/JointStateBroadcaster] active
# joint_trajectory_controller[joint_trajectory_controller/JointTrajectoryController] active

# 2. 查看关节当前状态
ros2 topic echo /joint_states --once

# 3. 发送第一个轨迹命令（关节1转到 30°）
ros2 action send_goal /joint_trajectory_controller/follow_joint_trajectory \
  control_msgs/action/FollowJointTrajectory \
  "{
    trajectory: {
      joint_names: ['joint1'],
      points: [{
        positions: [0.524],
        velocities: [0.0],
        time_from_start: {sec: 3}
      }]
    }
  }"
```

```python
# Python 客户端发送关节轨迹（更灵活）
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from control_msgs.action import FollowJointTrajectory
from trajectory_msgs.msg import JointTrajectoryPoint
from builtin_interfaces.msg import Duration
import numpy as np

class RobotMover(Node):
    def __init__(self):
        super().__init__('robot_mover')
        self._client = ActionClient(
            self, FollowJointTrajectory,
            '/joint_trajectory_controller/follow_joint_trajectory')

    def move_to(self, joint_positions, duration_sec=3.0):
        """
        joint_positions: dict {'joint1': 0.524, 'joint2': 0.0, ...}
        duration_sec: 运动时间
        """
        self._client.wait_for_server()

        goal = FollowJointTrajectory.Goal()
        goal.trajectory.joint_names = list(joint_positions.keys())

        point = JointTrajectoryPoint()
        point.positions  = list(joint_positions.values())
        point.velocities = [0.0] * len(joint_positions)

        secs = int(duration_sec)
        nsecs = int((duration_sec - secs) * 1e9)
        point.time_from_start = Duration(sec=secs, nanosec=nsecs)

        goal.trajectory.points = [point]

        self.get_logger().info(f"发送目标: {joint_positions}")
        future = self._client.send_goal_async(goal)
        rclpy.spin_until_future_complete(self, future)

        result_future = future.result().get_result_async()
        rclpy.spin_until_future_complete(self, result_future)
        self.get_logger().info("运动完成")

def main():
    rclpy.init()
    mover = RobotMover()

    # 归零（所有关节回到 0°）
    mover.move_to({'joint1': 0.0, 'joint2': 0.0, 'joint3': 0.0,
                   'joint4': 0.0, 'joint5': 0.0, 'joint6': 0.0},
                  duration_sec=5.0)

    # 测试姿态（joint1=30°, joint2=-45°, joint3=90°）
    mover.move_to({'joint1': np.radians(30), 'joint2': np.radians(-45),
                   'joint3': np.radians(90), 'joint4': 0.0,
                   'joint5': np.radians(45), 'joint6': 0.0},
                  duration_sec=4.0)

    rclpy.shutdown()
```

---

## 5.5 常见故障排查

### 故障速查表

| 故障现象 | 可能原因 | 排查方法 |
|---------|---------|---------|
| 关节不动，无报错 | 控制器未激活 | `ros2 control list_controllers` |
| 关节震荡/振动 | PID 增益过高 | 降低 Kp 50%，增大 Kd |
| 位置误差大 | 编码器方向反 | 查看 pos_estimate 方向 |
| 急停后不恢复 | 驱动器故障锁定 | 断电重启 + 清除故障码 |
| IMU 数据漂移 | 安装有振动耦合 | 检查减振垫，重新标定 |
| CAN 通信超时 | 总线终端电阻缺失 | 用万用表测 H/L 间阻值 |
| 电机过热 | 电流限制设置过高 | 降低峰值电流 30% |
| 轨迹跟踪滞后 | 控制频率不足 | 检查 CPU 占用，降低其他节点频率 |

### 调试脚本

```python
# 综合诊断脚本
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState, Imu
from diagnostic_msgs.msg import DiagnosticArray
import numpy as np
import time

class RobotDiagnostics(Node):
    def __init__(self):
        super().__init__('robot_diagnostics')

        self.joint_data = {}
        self.imu_data   = {}
        self.error_flags = []

        self.create_subscription(JointState, '/joint_states',
                                  self.joint_cb, 10)
        self.create_subscription(Imu, '/imu/data',
                                  self.imu_cb, 10)
        self.create_timer(2.0, self.print_report)

    def joint_cb(self, msg):
        for name, pos, vel in zip(msg.name, msg.position, msg.velocity):
            self.joint_data[name] = {'pos': np.degrees(pos), 'vel': vel}
            # 检查关节速度异常
            if abs(vel) > 5.0:  # rad/s
                self.error_flags.append(f"⚠️  {name} 速度过高: {vel:.2f} rad/s")

    def imu_cb(self, msg):
        ax = msg.linear_acceleration.x
        ay = msg.linear_acceleration.y
        az = msg.linear_acceleration.z
        g  = np.sqrt(ax**2 + ay**2 + az**2)
        self.imu_data = {'ax': ax, 'ay': ay, 'az': az, 'g': g}
        # 检查 IMU 异常
        if abs(g - 9.81) > 0.5:
            self.error_flags.append(f"⚠️  IMU 重力加速度异常: {g:.2f} m/s²")

    def print_report(self):
        print("\n" + "="*50)
        print(f"[{time.strftime('%H:%M:%S')}] 机器人诊断报告")
        print("="*50)

        print("\n📡 关节状态:")
        for name, d in self.joint_data.items():
            status = "✅" if abs(d['vel']) < 1.0 else "⚠️"
            print(f"  {status} {name:10s}: {d['pos']:+7.2f}°  vel={d['vel']:+5.2f} rad/s")

        if self.imu_data:
            print(f"\n🧭 IMU: g={self.imu_data['g']:.3f} m/s²  "
                  f"ax={self.imu_data['ax']:+.2f}  "
                  f"ay={self.imu_data['ay']:+.2f}  "
                  f"az={self.imu_data['az']:+.2f}")

        if self.error_flags:
            print("\n❌ 故障报告:")
            for err in self.error_flags[-5:]:  # 显示最近5条
                print(f"  {err}")
            self.error_flags.clear()
        else:
            print("\n✅ 无故障")

def main():
    rclpy.init()
    rclpy.spin(RobotDiagnostics())
```

### 编码器方向校验

```python
# 验证编码器方向是否与电机正方向一致
# 如果不一致，关节会不受控地旋转到限位

import odrive
import time

def check_encoder_direction(axis_num=0):
    odrv = odrive.find_any()
    axis = odrv.axis0 if axis_num == 0 else odrv.axis1

    # 记录初始位置
    pos_init = axis.encoder.pos_estimate
    print(f"初始位置: {pos_init:.3f} rad")

    # 施加小正力矩
    axis.controller.config.control_mode = 1  # TORQUE_CONTROL
    axis.requested_state = 8                  # CLOSED_LOOP_CONTROL
    axis.controller.input_torque = 0.2        # 0.2 N·m

    time.sleep(0.5)
    pos_after = axis.encoder.pos_estimate
    axis.controller.input_torque = 0.0
    axis.requested_state = 1  # IDLE

    delta = pos_after - pos_init
    print(f"施加正力矩后位置变化: {delta:.3f} rad")

    if delta > 0:
        print("✅ 编码器方向正确（正力矩 → 正位移）")
    else:
        print("❌ 编码器方向相反！设置 encoder.config.direction = -1")
```

---

## 5.6 关节零点标定

机器人第一次使用前必须标定零点，确保每次上电后的初始位置一致。

```python
# 半自动零点标定流程
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
import json
import os

class JointCalibration(Node):
    """
    零点标定步骤：
    1. 将机器人手动移动到机械零点（参考标记/限位开关）
    2. 运行此脚本，读取当前编码器值作为偏移量
    3. 保存偏移量到配置文件
    4. 驱动器启动时自动加载偏移量
    """

    def __init__(self):
        super().__init__('joint_calibration')
        self.current_positions = {}
        self.create_subscription(JointState, '/joint_states',
                                  self.joint_cb, 10)
        self.CALIBRATION_FILE = '/config/joint_calibration.json'

    def joint_cb(self, msg):
        for name, pos in zip(msg.name, msg.position):
            self.current_positions[name] = pos

    def calibrate(self):
        """交互式标定"""
        print("═══════════════════════════════════════")
        print("       机器人关节零点标定工具")
        print("═══════════════════════════════════════")
        print()

        joints = ['joint1', 'joint2', 'joint3',
                  'joint4', 'joint5', 'joint6']
        calibration_data = {}

        for joint in joints:
            input(f"\n请将 {joint} 移动到机械零点，然后按 Enter...")
            rclpy.spin_once(self, timeout_sec=0.1)

            if joint in self.current_positions:
                offset = self.current_positions[joint]
                calibration_data[joint] = {
                    'zero_offset': offset,
                    'unit': 'rad',
                    'calibrated_at': __import__('time').strftime('%Y-%m-%d %H:%M:%S'),
                }
                print(f"  ✅ {joint} 零点偏移: {offset:.4f} rad "
                      f"({offset * 180 / 3.14159:.2f}°)")
            else:
                print(f"  ❌ 无法读取 {joint} 数据，跳过")

        # 保存标定结果
        os.makedirs(os.path.dirname(self.CALIBRATION_FILE), exist_ok=True)
        with open(self.CALIBRATION_FILE, 'w') as f:
            json.dump(calibration_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ 标定完成，已保存到 {self.CALIBRATION_FILE}")
        print("\n标定结果汇总:")
        for joint, data in calibration_data.items():
            print(f"  {joint}: offset={data['zero_offset']:.4f} rad")

        return calibration_data

    @staticmethod
    def load_calibration(filepath='/config/joint_calibration.json'):
        """加载标定数据（在驱动器启动时调用）"""
        if not os.path.exists(filepath):
            print(f"⚠️  未找到标定文件 {filepath}，使用默认零点")
            return {}
        with open(filepath) as f:
            data = json.load(f)
        print(f"✅ 已加载关节标定数据（{len(data)} 个关节）")
        return data

def main():
    rclpy.init()
    node = JointCalibration()
    node.calibrate()
    rclpy.shutdown()
```

---

## 5.7 遥控操作与可视化

调试稳定后，用键盘或手柄进行遥控操作，同时在 RViz 中实时监控状态。

```python
# 键盘遥控节点（关节空间）
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
import sys
import tty
import termios
import threading
import numpy as np

JOINT_NAMES = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
STEP = np.radians(2)   # 每次按键移动 2°

KEY_BINDINGS = {
    'q': (0, +1), 'a': (0, -1),   # joint1
    'w': (1, +1), 's': (1, -1),   # joint2
    'e': (2, +1), 'd': (2, -1),   # joint3
    'r': (3, +1), 'f': (3, -1),   # joint4
    't': (4, +1), 'g': (4, -1),   # joint5
    'y': (5, +1), 'h': (5, -1),   # joint6
    '0': None,                      # 归零
}

class KeyboardTeleop(Node):
    def __init__(self):
        super().__init__('keyboard_teleop')
        self.pub = self.create_publisher(
            JointTrajectory, '/joint_trajectory_controller/joint_trajectory', 10)
        self.positions = [0.0] * 6
        print("键盘遥控已启动")
        print("q/a:关节1  w/s:关节2  e/d:关节3  r/f:关节4  t/g:关节5  y/h:关节6")
        print("0:归零  Ctrl+C:退出")

    def send_command(self):
        traj = JointTrajectory()
        traj.joint_names = JOINT_NAMES
        pt = JointTrajectoryPoint()
        pt.positions  = self.positions[:]
        pt.velocities = [0.0] * 6
        pt.time_from_start = Duration(sec=0, nanosec=500_000_000)  # 0.5s
        traj.points = [pt]
        self.pub.publish(traj)
        pos_deg = [f"{np.degrees(p):+.1f}°" for p in self.positions]
        print(f"\r  关节: {' '.join(pos_deg)}", end='', flush=True)

    def run(self):
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            while True:
                key = sys.stdin.read(1)
                if key == '\x03':  # Ctrl+C
                    break
                if key == '0':
                    self.positions = [0.0] * 6
                elif key in KEY_BINDINGS and KEY_BINDINGS[key]:
                    joint_idx, direction = KEY_BINDINGS[key]
                    LIMITS = np.radians([-170, 170])
                    self.positions[joint_idx] = np.clip(
                        self.positions[joint_idx] + direction * STEP,
                        LIMITS[0], LIMITS[1])
                self.send_command()
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            print("\n遥控已退出")

def main():
    rclpy.init()
    node = KeyboardTeleop()
    # 在子线程运行键盘监听（避免阻塞 ROS 事件循环）
    t = threading.Thread(target=node.run, daemon=True)
    t.start()
    rclpy.spin(node)
    rclpy.shutdown()
```

### RViz 关键配置

```yaml
# rviz/robot.rviz 关键部分（手动添加以下 Display）

Displays:
  # 1. 机器人模型
  - Class: rviz_default_plugins/RobotModel
    Topic: /robot_description
    Alpha: 1.0

  # 2. 关节状态（TF树）
  - Class: rviz_default_plugins/TF
    Show Names: true
    Show Axes: true
    Marker Scale: 0.1

  # 3. 关节轨迹（实时回放）
  - Class: rviz_default_plugins/Path
    Topic: /joint_trajectory_controller/state

  # 4. IMU 可视化（需要 rviz_imu_plugin）
  - Class: rviz_imu_plugin/Imu
    Topic: /imu/data
    Scale: 1.0
    Arrow Length: 0.3
```

---

## 5.8 性能基准测试

上线后用以下测试验证整机性能满足设计指标。

```python
# 整机性能测试套件
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
import numpy as np
import time

class PerformanceBenchmark(Node):
    def __init__(self):
        super().__init__('performance_benchmark')
        self.joint_data = {}
        self.latency_samples = []
        self.cmd_time = {}

        self.sub = self.create_subscription(
            JointState, '/joint_states', self.joint_cb, 10)

    def joint_cb(self, msg):
        recv_time = time.time()
        for name, pos in zip(msg.name, msg.position):
            self.joint_data[name] = pos
            # 计算指令到反馈延迟
            if name in self.cmd_time:
                latency_ms = (recv_time - self.cmd_time[name]) * 1000
                self.latency_samples.append(latency_ms)

    def test_position_accuracy(self, target_deg=30.0):
        """位置精度测试：发送目标→稳定→测量误差"""
        target_rad = np.radians(target_deg)
        # ... (发送轨迹指令)
        time.sleep(4.0)  # 等待稳定
        rclpy.spin_once(self, timeout_sec=0.1)

        errors = {}
        for name, pos in self.joint_data.items():
            errors[name] = abs(pos - target_rad) * 1000  # mrad
        return errors

    def test_repeatability(self, n=10):
        """重复定位精度测试：同一目标点 n 次"""
        positions = []
        for i in range(n):
            # 发送目标，等待稳定
            time.sleep(3.0)
            rclpy.spin_once(self, timeout_sec=0.1)
            positions.append(dict(self.joint_data))

        # 计算标准差
        print(f"\n重复定位精度（{n} 次）:")
        for joint in self.joint_data:
            vals = [p[joint] for p in positions if joint in p]
            std_mrad = np.std(vals) * 1000
            print(f"  {joint}: σ = {std_mrad:.2f} mrad ({np.degrees(np.std(vals))*1000:.3f} mdeg)")

    def print_latency_stats(self):
        if not self.latency_samples:
            return
        samples = np.array(self.latency_samples)
        print(f"\n通信延迟统计 ({len(samples)} 样本):")
        print(f"  平均: {np.mean(samples):.1f} ms")
        print(f"  P50:  {np.percentile(samples, 50):.1f} ms")
        print(f"  P95:  {np.percentile(samples, 95):.1f} ms")
        print(f"  P99:  {np.percentile(samples, 99):.1f} ms")
        print(f"  最大: {np.max(samples):.1f} ms")

        # 判断是否满足指标
        if np.percentile(samples, 95) < 10:
            print("  ✅ P95延迟 < 10ms，满足实时控制要求")
        else:
            print("  ❌ P95延迟超标，检查网络/CPU负载")
```

---

## 5.9 本章小结

- **上机前**：安全清单不可省略，急停/限位/速度保护是三条底线
- **接线**：CAN总线双端终端电阻（60Ω），IMU 需减振安装
- **Bringup**：三层结构（描述→硬件接口→控制器），TimerAction 避免启动竞争
- **第一次动**：用 `ros2 action send_goal` 发 1° 小角度，确认方向正确再扩大
- **故障排查**：编码器方向、PID增益、CAN终端电阻是最常见的三个问题
- **零点标定**：第一次必须做，保存偏移量到配置文件
- **遥控调试**：键盘遥控 + RViz 可视化，快速验证整机运动

---

**《机器人入门——从材料到控制》系列完结**

| 章节 | 核心内容 |
|------|---------|
| 第1章 | 材料选型：铝合金/碳纤维/3D打印/螺栓计算 |
| 第2章 | 执行器与传感器：电机/减速器/编码器/IMU/深度相机 |
| 第3章 | 控制算法：PID/正逆运动学/轨迹规划 |
| 第4章 | 仿真环境：Gazebo/MuJoCo/Isaac Sim/Sim2Real |
| 第5章 | 整机调试：接线/Bringup/故障排查/标定/遥控 |

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
