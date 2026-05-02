'use client';
import React, { useState } from 'react';
import Footer from '@/components/Footer';

// ─── CodeBlock ────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'code' }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-[10px] font-mono text-gray-500 select-none">{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded">
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-gray-300 leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

// ─── CheckItem ────────────────────────────────────────────────────────────────
function CheckItem({ text, sub }) {
  const [done, setDone] = useState(false);
  return (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${done ? 'bg-green-50' : 'hover:bg-gray-50'}`}
      onClick={() => setDone(!done)}>
      <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {done && <span className="text-white text-[9px] font-bold">✓</span>}
      </div>
      <div>
        <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{text}</span>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── 流程数据 ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'materials',
    step: '01',
    emoji: '🧱',
    title: '结构材料选型',
    subtitle: '骨架 · 外壳 · 关节减速器',
    color: '#e17055',
    bgColor: '#fff5f3',
    duration: '1~2 周',
    difficulty: '⭐⭐',
    summary: '材料决定机器人的重量、刚度和成本上限。对于 VLA / 具身智能机器人，优先考虑铝合金关节 + 碳纤维连杆 + SLS 打印壳体的组合。',
    decisions: [
      { q: '场景', options: ['桌面抓取（1~5kg载重）→ 铝合金 6061-T6', '移动底盘（10kg+）→ 铝合金 + 碳纤维管', '轻量化外骨骼 → 全碳纤维 + PA12'] },
      { q: '批量', options: ['1~5 台（研发）→ 3D打印快速迭代', '5~50 台（中试）→ CNC + SLS', '50 台+（量产）→ 压铸 + 注塑'] },
    ],
    checklist: [
      { text: '确定整机重量目标（自重 / 载重比 > 1:3）', sub: '六轴桌面臂自重目标 < 8kg，载重 ≥ 3kg' },
      { text: '关节选铝合金 7075-T6（高应力处）或 6061-T6（其余）', sub: '7075 屈服强度 503MPa vs 6061 的 276MPa' },
      { text: '连杆选碳纤维管（Ø16~25mm 碳管）', sub: '比铝管轻 40%，比强度高 6×' },
      { text: '壳体用 SLS PA12 打印（外包给第三方，¥50~200/件）', sub: 'PA12 耐冲击，尺寸精度 ±0.3mm' },
      { text: '减速器：谐波（精度优先）或行星（效率优先）', sub: '谐波 80:1 精度 < 1arcmin；行星效率 >95%' },
      { text: '螺栓防松：振动部位涂 Loctite 243（可拆卸螺纹胶）', sub: '避免运动中松动导致位置漂移' },
      { text: '完成 BOM 表并计算总成本', sub: '结构件通常占整机物料成本 20~30%' },
    ],
    code: `# 机器人连杆弯曲刚度计算 — 选型对比
# 问题：300mm 悬臂连杆，末端 5kg 载重，选铝管还是碳管？

import numpy as np

def max_deflection(F, L, E, I):
    """悬臂梁末端最大挠度 δ = F·L³ / (3·E·I)"""
    return F * L**3 / (3 * E * I)

def tube_I(D_outer, D_inner):
    """圆管截面二次矩 I = π(D₄-d₄)/64"""
    return np.pi * (D_outer**4 - D_inner**4) / 64

# 参数
F = 5 * 9.81      # 末端载荷 5kg → 49.05N
L = 0.30          # 连杆长度 300mm

# 方案A：铝合金 6061 圆管 Ø25×2mm
E_al = 69e9       # 铝合金弹性模量 69 GPa
I_al = tube_I(0.025, 0.021)
delta_al = max_deflection(F, L, E_al, I_al)
# 质量（密度 2700 kg/m³）
A_al = np.pi * (0.025**2 - 0.021**2) / 4
mass_al = A_al * L * 2700 * 1000  # g

# 方案B：碳纤维管 Ø25×2mm（T300/环氧树脂）
E_cf = 135e9      # 碳管轴向弹性模量（卷制，低于理论值）
I_cf = tube_I(0.025, 0.021)
delta_cf = max_deflection(F, L, E_cf, I_cf)
A_cf = np.pi * (0.025**2 - 0.021**2) / 4
mass_cf = A_cf * L * 1760 * 1000  # g

print(f"{'方案':<12} {'挠度 (mm)':<14} {'质量 (g)':<10} {'价格'}")
print(f"{'铝管 6061':<12} {delta_al*1000:<14.2f} {mass_al:<10.1f} ¥15/根")
print(f"{'碳纤维管':<12} {delta_cf*1000:<14.2f} {mass_cf:<10.1f} ¥25/根")
print(f"\\n挠度/长度比（目标 < 1/1000）：")
print(f"  铝管:  {delta_al/L*1000:.2f}‰  {'✓ 合格' if delta_al/L < 0.001 else '✗ 超标'}")
print(f"  碳管:  {delta_cf/L*1000:.2f}‰  {'✓ 合格' if delta_cf/L < 0.001 else '✗ 超标'}")

# 螺栓预紧力参考
def bolt_torque(d_mm, grade=8.8, mu=0.15):
    grade_map = {8.8: 640, 10.9: 900, 12.9: 1080}
    sigma_y = grade_map[grade]
    A = np.pi / 4 * (0.9 * d_mm * 1e-3)**2
    F = 0.7 * sigma_y * 1e6 * A
    return round(F * mu * (d_mm * 1e-3) * 1.3, 2)

print("\\nM 螺栓 8.8 级预紧力矩参考:")
for d in [3, 4, 5, 6]:
    print(f"  M{d}: {bolt_torque(d)} N·m")`,
    lang: 'python',
  },

  {
    id: 'hardware',
    step: '02',
    emoji: '⚙️',
    title: '硬件选型与集成',
    subtitle: '电机 · 编码器 · 传感器 · 计算平台',
    color: '#6c5ce7',
    bgColor: '#f8f7ff',
    duration: '2~4 周',
    difficulty: '⭐⭐⭐',
    summary: '从末端载重倒推关节扭矩需求，再选电机型号和减速比。传感器套件覆盖位置反馈（编码器）、姿态（IMU）、视觉（深度相机）三层。计算平台以 Jetson AGX Orin 为主力。',
    decisions: [
      { q: '关节数量', options: ['4 DoF（腰/肩/肘/腕）→ 简单抓取', '6 DoF（+腕旋+俯仰）→ 工业标准', '7 DoF（冗余）→ 灵活避障'] },
      { q: '计算平台', options: ['Jetson AGX Orin 64GB → 7B VLA 推理，¥6000', 'Jetson Orin NX 16GB → 1B 小模型，¥2000', '工控机 RTX 4090 → 研究级，¥20000'] },
    ],
    checklist: [
      { text: '用动力学仿真（或手动计算）得出每个关节峰值扭矩', sub: '末端关节通常 < 5N·m；肩关节可达 30N·m' },
      { text: '选 BLDC 电机：优先考虑一体化关节（电机+驱动+编码器）', sub: '推荐：高云 GYEMS RMD-X8（8N·m，¥1500）或 Unitree 关节' },
      { text: '部署 FOC 驱动器并完成位置/速度/力矩三环调试', sub: 'ODrive 3.6 或 SimpleFOC，先调速度环再调位置环' },
      { text: '安装 AS5048A 磁编码器（14bit，SPI 接口，¥30/个）', sub: '配合 100:1 谐波减速器末端精度 < 0.002°' },
      { text: '安装 ICM-42688-P IMU（躯干 + 各关节）', sub: '读取加速度 ±4g，陀螺仪 ±500dps，1kHz 采样' },
      { text: '安装深度相机（RealSense D435i × 2：腕部 + 第三视角）', sub: '腕部相机用于精细操作，第三视角用于整体感知' },
      { text: '完成功率预算：总峰值功耗 × 1.3 安全系数选电源', sub: '48V LFP 电池组；平均功耗算续航' },
      { text: '完成 CAN 总线拓扑设计（1Mbps，最多 127 节点）', sub: '各关节驱动器 + 传感器集线器接入同一 CAN 网络' },
    ],
    code: `# 关节扭矩需求计算 → 电机选型（以 6 DoF 桌面臂为例）
import numpy as np

# 关节质量和重心参数（估算值，单位：kg, m）
# 每个关节需要支撑其远端所有质量
arm_segments = [
    {'name': '关节1（腰）',   'mass_distal': 6.5, 'r': 0.35, 'gravity_factor': 0.0},  # 绕垂直轴
    {'name': '关节2（肩）',   'mass_distal': 6.5, 'r': 0.35, 'gravity_factor': 1.0},  # 绕水平轴，最大重力臂
    {'name': '关节3（肘）',   'mass_distal': 3.2, 'r': 0.25, 'gravity_factor': 1.0},
    {'name': '关节4（腕俯仰）','mass_distal': 1.5, 'r': 0.15, 'gravity_factor': 1.0},
    {'name': '关节5（腕偏航）','mass_distal': 0.8, 'r': 0.05, 'gravity_factor': 0.0},  # 绕垂直轴
    {'name': '关节6（末端）', 'mass_distal': 0.5, 'r': 0.04, 'gravity_factor': 0.3},
]
payload = 3.0   # kg 末端载重
g = 9.81

print(f"{'关节':<16} {'所需扭矩(N·m)':<16} {'含2.5x安全系数':<18} {'建议减速比'}")
print('-' * 65)
for seg in arm_segments:
    m = seg['mass_distal'] + payload
    T = m * g * seg['r'] * seg['gravity_factor']
    T_design = T * 2.5   # 动态载荷 + 安全系数
    # 假设电机额定扭矩约 0.3 N·m → 所需减速比
    motor_torque = 0.3
    ratio = T_design / motor_torque if T_design > 0 else 0
    print(f"{seg['name']:<16} {T:<16.1f} {T_design:<18.1f} {ratio:.0f}:1  ({'谐波' if ratio > 50 else '行星'})")

# 电机选型推荐逻辑
print("\\n电机选型推荐:")
print("  关节1-3（高扭矩）: GYEMS RMD-X8 (8N·m, ¥1500) + 谐波80:1")
print("  关节4-5（中扭矩）: T-Motor MN501S KV80 + 行星50:1")
print("  关节6（末端）:     小型舵机 MX-106R 或微型 BLDC")

print("\\n功率预算（48V 系统）:")
motors = {'肩/大臂 × 2': (120, 0.7), '中段关节 × 2': (60, 0.6),
          '末端关节 × 2': (20, 0.5), 'Jetson AGX Orin': (40, 1.0),
          'RealSense × 2': (4, 1.0),  '散热风扇': (15, 1.0)}
total_avg = sum(p * f for p, f in motors.values())
total_peak = sum(p for p, _ in motors.values())
print(f"  平均功耗: {total_avg:.0f}W  | 峰值功耗: {total_peak:.0f}W")
print(f"  30Ah 48V LFP 续航: {30 / (total_avg/48) * 0.85:.1f} 小时")`,
    lang: 'python',
  },

  {
    id: 'software',
    step: '03',
    emoji: '💻',
    title: '软件栈搭建',
    subtitle: 'ROS 2 · 控制器 · 仿真联调 · MoveIt 2',
    color: '#00b894',
    bgColor: '#f0fff8',
    duration: '3~6 周',
    difficulty: '⭐⭐⭐⭐',
    summary: '以 ROS 2 Humble 为核心中间件，打通从传感器驱动到运动规划的完整链路。先在 Gazebo 仿真中调通后，再上真机。数据采集节点与控制节点并行运行。',
    decisions: [
      { q: '控制框架', options: ['ROS 2 Control + MoveIt 2 → 通用最佳实践', 'Lerobot（HuggingFace）→ 专为 VLA 设计的收集框架', '自研轻量控制器 → 低延迟，适合 1kHz 闭环'] },
      { q: '仿真器', options: ['Gazebo Harmonic → 学习首选，文档多', 'MuJoCo → RL 训练首选，速度最快', 'Isaac Sim → 合成数据生成，光追渲染'] },
    ],
    checklist: [
      { text: '安装 Ubuntu 22.04 + ROS 2 Humble', sub: 'source /opt/ros/humble/setup.bash 加入 .bashrc' },
      { text: '编写 URDF（或 xacro）描述机器人模型', sub: '每个 link 需要 visual / collision / inertial 三要素' },
      { text: '在 Gazebo 中加载 URDF 并验证关节运动', sub: 'ros2 run ros_gz_sim create -name myrobot -topic robot_description' },
      { text: '配置 ros2_control：joint_state_broadcaster + position/effort 控制器', sub: '先调通 joint_trajectory_controller，再实现自定义控制器' },
      { text: '实现 PID 位置控制（含抗积分饱和 + 微分滤波）', sub: 'Kp/Ki/Kd 先用 Ziegler-Nichols 整定，再手动微调' },
      { text: '集成 MoveIt 2 运动规划（或手写 IK）', sub: 'moveit_setup_assistant 生成配置；OMPL 规划器默认可用' },
      { text: '跑通相机→点云→抓取位置识别的感知链路', sub: '使用 FoundationPose 或 GraspNet 做物体位姿估计' },
      { text: '搭建 Foxglove Studio 可视化（替代 RViz，支持 Web）', sub: '实时可视化点云、关节状态、相机画面' },
    ],
    code: `# ROS 2 端到端控制节点（收发一体，50Hz 闭环）
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState, Image
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from geometry_msgs.msg import PoseStamped
import numpy as np

class RobotControlNode(Node):
    def __init__(self):
        super().__init__('robot_control')

        # ── 订阅 ────────────────────────────────────────────
        # 关节状态反馈（由 joint_state_broadcaster 发布）
        self.js_sub = self.create_subscription(
            JointState, '/joint_states',
            self.joint_state_cb,
            rclpy.qos.qos_profile_sensor_data)

        # 腕部相机图像（用于 VLA 推理）
        self.img_sub = self.create_subscription(
            Image, '/wrist_camera/color/image_raw',
            self.image_cb, 1)

        # VLA 输出的目标末端位姿（由推理节点发布）
        self.target_sub = self.create_subscription(
            PoseStamped, '/vla/target_pose',
            self.target_cb, 10)

        # ── 发布 ────────────────────────────────────────────
        # 关节轨迹指令（到 joint_trajectory_controller）
        self.cmd_pub = self.create_publisher(
            JointTrajectory, '/joint_trajectory_controller/joint_trajectory', 10)

        # 50Hz 控制循环
        self.timer = self.create_timer(0.02, self.control_loop)

        # 状态
        self.joint_names = [f'joint{i}' for i in range(1, 7)]
        self.current_q   = np.zeros(6)
        self.target_q    = np.zeros(6)
        self.latest_image = None
        self.get_logger().info('Robot control node started ✓')

    def joint_state_cb(self, msg: JointState):
        for i, name in enumerate(self.joint_names):
            if name in msg.name:
                idx = msg.name.index(name)
                self.current_q[i] = msg.position[idx]

    def image_cb(self, msg: Image):
        self.latest_image = msg   # 由 VLA 推理节点处理

    def target_cb(self, msg: PoseStamped):
        # 将目标末端位姿 → IK 解算 → 目标关节角度
        # 这里用解析 IK 或 MoveIt IK 服务
        self.target_q = self._solve_ik(msg.pose)

    def _solve_ik(self, pose):
        """
        调用 MoveIt 2 IK 服务或内置解析 IK
        简化示意：返回插值目标
        """
        return self.current_q + np.clip(
            self.target_q - self.current_q, -0.05, 0.05)

    def control_loop(self):
        """50Hz 控制循环：发送下一时刻目标关节角"""
        q_cmd = self._solve_ik(None)   # 实际中传入目标

        msg = JointTrajectory()
        msg.joint_names = self.joint_names
        pt = JointTrajectoryPoint()
        pt.positions = q_cmd.tolist()
        pt.time_from_start.nanosec = 20_000_000   # 20ms
        msg.points = [pt]
        self.cmd_pub.publish(msg)

def main():
    rclpy.init()
    node = RobotControlNode()
    rclpy.spin(node)

# 运行：
# ros2 run myrobot_pkg control_node
# 监控延迟：
# ros2 topic hz /joint_states
# ros2 topic delay /joint_states`,
    lang: 'python',
  },

  {
    id: 'data',
    step: '04',
    emoji: '🔄',
    title: '数据闭环',
    subtitle: '遥操作采集 · 数据格式 · 标注 · 清洗',
    color: '#0984e3',
    bgColor: '#f0f7ff',
    duration: '2~8 周（持续进行）',
    difficulty: '⭐⭐⭐',
    summary: '数据是 VLA 训练的核心瓶颈。主流方法：遥操作（人工演示）采集 100~5000 条轨迹，每条覆盖从初始到完成任务的完整动作序列，存为 LeRobot Dataset / RLDS 格式后训练。',
    decisions: [
      { q: '采集方式', options: ['SpaceMouse 遥操作 → 快速，低成本，延迟 < 50ms', 'Gello 影子臂遥操 → 自然，关节对应关系好', 'VR 手柄遥操 → 支持双臂，沉浸感好'] },
      { q: '数据格式', options: ['LeRobot（HuggingFace）→ 与主流 VLA 框架直接兼容', 'RLDS（Google）→ TensorFlow DataSet，RT-2 系列使用', '自定义 HDF5 → 灵活，但需要转换适配'] },
    ],
    checklist: [
      { text: '搭建 LeRobot 采集环境（lerobot.ai 开源框架）', sub: 'pip install lerobot；支持 SpaceMouse / Gello 接入' },
      { text: '定义任务（Task）和成功条件', sub: '例如："将红色积木放入蓝色盒子"，二值成功标签' },
      { text: '采集 ≥ 100 条 Demo（每条 5~30 秒）', sub: '建议先 20 条测试训练效果，再决定是否扩大采集量' },
      { text: '对每条轨迹标注成功/失败，过滤失败 Demo', sub: '失败 Demo 会引入噪声，但部分方法（DAgger）可利用' },
      { text: '数据增强：图像随机裁剪、颜色抖动（不改变动作标签）', sub: '对视觉策略泛化性至关重要' },
      { text: '验证数据集：重放动作序列在仿真中检查轨迹合理性', sub: '异常关节角（超限 / 跳变）直接剔除' },
      { text: '上传到 HuggingFace Hub（可私有）便于多机训练', sub: 'huggingface-cli upload myorg/my-robot-dataset' },
      { text: '建立数据飞轮：每次部署后采集失败案例，迭代扩充数据集', sub: '失败案例价值 > 成功案例（更多分布边界信息）' },
    ],
    code: `# LeRobot 数据采集 + 格式化（lerobot 0.2+ API）
# pip install lerobot[feetech] 或 lerobot[dynamixel]

from lerobot.common.datasets.lerobot_dataset import LeRobotDataset
from lerobot.common.robot_devices.robots.factory import make_robot
from lerobot.common.robot_devices.control_utils import record_dataset
import numpy as np

# ── 1. 初始化机器人（以 SO-ARM100 为例）──────────────────
robot = make_robot('so100')   # Koch v1.1 / Aloha / SO-ARM100 等
robot.connect()

# ── 2. 创建数据集 ─────────────────────────────────────────
dataset = LeRobotDataset.create(
    repo_id='myorg/pick-and-place-v1',
    robot_type='so100',
    fps=30,
    features={
        'observation.images.top':    {'dtype': 'video', 'shape': (480, 640, 3)},
        'observation.images.wrist':  {'dtype': 'video', 'shape': (480, 640, 3)},
        'observation.state':         {'dtype': 'float32', 'shape': (6,)},  # 关节角度
        'action':                    {'dtype': 'float32', 'shape': (6,)},  # 关节动作
    }
)

# ── 3. 采集主循环（由遥操作驱动）────────────────────────
def collect_episode(task_instruction: str):
    """采集一条 Demo，返回成功/失败"""
    frames = []
    robot.send_action(robot.home_position)   # 回初始位

    input(f"任务: {task_instruction}\\n准备好后按回车开始遥操...")

    while True:
        obs = robot.get_observation()        # {'joint_pos': [...], 'images': {...}}
        action = robot.get_teleop_action()   # 从 SpaceMouse / Gello 读取

        frames.append({
            'observation.images.top':   obs['images']['top'],
            'observation.images.wrist': obs['images']['wrist'],
            'observation.state':        np.array(obs['joint_pos']),
            'action':                   np.array(action),
            'task':                     task_instruction,
        })

        if action.is_done:   # 遥操者按 ✓/✗ 键结束
            break

    success = input("本次轨迹是否成功？ [y/n]: ").strip() == 'y'
    return frames, success

# ── 4. 保存并推送到 Hub ──────────────────────────────────
for episode_idx in range(100):
    frames, success = collect_episode("将红色积木放入蓝色盒子")
    if success:
        dataset.add_episode(frames, task="pick_red_to_blue")
        print(f"Episode {episode_idx+1} 保存 ✓")
    else:
        print(f"Episode {episode_idx+1} 失败，跳过")

dataset.consolidate()          # 合并视频 + 整理 parquet 文件
dataset.push_to_hub()          # 上传 HuggingFace

print(f"数据集统计: {len(dataset)} 帧, {dataset.num_episodes} 条轨迹")

# ── 5. 数据集质检：检查动作跳变 ──────────────────────────
import torch
data = dataset[0]
actions = torch.stack([dataset[i]['action'] for i in range(len(dataset))])
delta = (actions[1:] - actions[:-1]).abs()
outliers = (delta > 0.5).any(dim=1).sum()   # 动作突变 > 0.5rad
print(f"动作跳变帧: {outliers}/{len(dataset)} ({outliers/len(dataset)*100:.1f}%)")`,
    lang: 'python',
  },

  {
    id: 'training',
    step: '05',
    emoji: '🧠',
    title: '模型训练与部署',
    subtitle: 'VLA 微调 · Sim2Real · TensorRT 量化 · 闭环验证',
    color: '#a855f7',
    bgColor: '#fdf8ff',
    duration: '2~4 周（+持续迭代）',
    difficulty: '⭐⭐⭐⭐⭐',
    summary: '以开源 VLA（OpenVLA / π0 / LeRobot ACT）为基座，在自采数据上微调。训练后在 MuJoCo/Gazebo 仿真中进行 Sim2Real 验证，再用 TensorRT INT4 量化部署到 Jetson。目标：在真机上 ≥10Hz 闭环推理。',
    decisions: [
      { q: '基础模型', options: ['ACT（Action Chunking）→ 小数据（50条Demo）也能工作，¥0', 'OpenVLA-OFT（7B）→ 视觉-语言-动作对齐，泛化强', 'π0（Physical Intelligence）→ 多任务，需更多数据'] },
      { q: '训练资源', options: ['单 RTX 4090（24GB）→ 7B INT4/INT8 微调，~3天', 'A100 × 4 → 7B BF16 全量微调，~12小时', 'Jetson AGX Orin（推理验证用，不用于训练）'] },
    ],
    checklist: [
      { text: '搭建训练环境：CUDA 12.1 + PyTorch 2.2 + transformers + lerobot', sub: 'conda create -n vla python=3.10 && pip install lerobot[train]' },
      { text: '选择基础架构：ACT（小数据首选）或 OpenVLA（泛化首选）', sub: 'ACT 50条 Demo 可出效果；OpenVLA 需 200~1000 条' },
      { text: '配置训练参数并启动微调（LoRA 降显存需求）', sub: 'LoRA rank=16 将 7B 模型显存从 28GB 降至 8GB' },
      { text: '用 WandB 监控训练：action loss、l1_loss 曲线', sub: 'validation loss < 0.02 通常可上机测试' },
      { text: '在 MuJoCo/Gazebo 仿真中验证策略（无风险）', sub: '先跑 100 次仿真测试成功率，目标 > 80%' },
      { text: '域随机化训练（Sim2Real）：随机化摩擦/光照/物体位置', sub: '加了域随机化的策略在真机上成功率通常提升 20-40%' },
      { text: 'TensorRT INT4 量化：将推理延迟从 200ms 降到 50ms', sub: '在 Jetson 上：trtllm-build --model openvla --dtype int4' },
      { text: '真机闭环测试：从 1Hz 慢速验证逐渐提速到 10Hz+', sub: '先测试各类物体/位置，记录成功率；失败案例加入数据集' },
    ],
    code: `# ACT（Action Chunking Transformer）训练 + 推理部署
# ACT 小数据友好（50条Demo即可），是 VLA 入门最佳选择
# 论文: Learning Fine-Grained Bimanual Manipulation (Zhao et al., 2023)

# ── 1. 安装 LeRobot（包含 ACT 实现）──────────────────────
# pip install lerobot[act]

# ── 2. 训练配置 ───────────────────────────────────────────
# configs/act_so100.yaml
TRAIN_CONFIG = """
dataset_repo_id: myorg/pick-and-place-v1
policy:
  name: act
  input_features:
    observation.images.top:   {type: visual}
    observation.images.wrist: {type: visual}
    observation.state:        {type: low_dim, dim: 6}
  output_features:
    action: {type: low_dim, dim: 6}
  chunk_size: 50          # 一次预测 50 步动作序列
  n_obs_steps: 1
  dim_model: 512
  n_heads: 8
  n_encoder_layers: 4
  n_decoder_layers: 7
training:
  batch_size: 32
  num_epochs: 2000
  lr: 1e-4
  lr_backbone: 1e-5
  eval_freq: 100          # 每 100 epoch 在仿真中评估
  save_checkpoint: true
"""

# ── 3. 启动训练 ───────────────────────────────────────────
# python -m lerobot.scripts.train \
#   --config configs/act_so100.yaml \
#   --output_dir outputs/act_v1

# ── 4. 推理节点（部署到 Jetson，10Hz 闭环）─────────────
import torch
import numpy as np
from lerobot.common.policies.act.modeling_act import ACTPolicy

class VLAInferenceNode:
    def __init__(self, checkpoint_path: str, device='cuda'):
        self.policy = ACTPolicy.from_pretrained(checkpoint_path)
        self.policy.to(device).eval()
        self.device = device

        # 统计推理延迟
        self.latency_ms = []
        print(f"模型加载完成，设备: {device}")
        print(f"参数量: {sum(p.numel() for p in self.policy.parameters())/1e6:.1f}M")

    @torch.no_grad()
    def predict_action(self, obs: dict) -> np.ndarray:
        """
        obs: {
          'observation.images.top':   np.array (H,W,3) uint8,
          'observation.images.wrist': np.array (H,W,3) uint8,
          'observation.state':        np.array (6,) float32,
        }
        返回: action (6,) float32 — 当前时刻关节角度增量
        """
        import time
        t0 = time.perf_counter()

        # 转换为 tensor
        batch = {}
        for k, v in obs.items():
            t = torch.from_numpy(v).to(self.device)
            if 'image' in k:
                t = t.float().permute(2, 0, 1) / 255.0  # (3,H,W)
            batch[k] = t.unsqueeze(0)  # 加 batch 维

        # ACT 输出 chunk（50步动作序列），只取第1步
        action_chunk = self.policy.select_action(batch)  # (1, chunk_size, action_dim)
        action = action_chunk[0, 0].cpu().numpy()        # 取第1步

        t1 = time.perf_counter()
        self.latency_ms.append((t1 - t0) * 1000)
        return action

    def print_stats(self):
        if self.latency_ms:
            ms = np.array(self.latency_ms)
            print(f"推理延迟: 均值={ms.mean():.1f}ms  P95={np.percentile(ms,95):.1f}ms  P99={np.percentile(ms,99):.1f}ms")

# ── 5. Sim2Real 域随机化（在 MuJoCo 仿真中）──────────────
def randomize_env_for_sim2real(env, rng):
    """每个 episode 随机化物理+视觉参数，增强真实迁移性"""
    # 物理随机化
    friction   = rng.uniform(0.5, 1.8)    # 摩擦系数 ±60%
    damping    = rng.uniform(0.2, 0.8)    # 关节阻尼
    # 视觉随机化（对图像策略很重要）
    brightness = rng.uniform(0.7, 1.3)    # 亮度
    obj_pos_noise = rng.uniform(-0.03, 0.03, size=3)  # 目标物体位置扰动 ±3cm
    # 动作延迟模拟（真实 CAN 通信约 5~10ms）
    action_delay_steps = rng.integers(0, 3)   # 0~2 步延迟
    env.randomize(friction=friction, damping=damping,
                  brightness=brightness, obj_offset=obj_pos_noise,
                  action_delay=action_delay_steps)

# ── 6. TensorRT INT4 量化（Jetson 上执行）────────────────
# 量化前推理：~200ms/步 → 量化后：~45ms/步 (4.4× 加速)
# trtexec --onnx=act_model.onnx \\
#         --int8 --calib_dataset=calibration_data/ \\
#         --saveEngine=act_model_int8.trt \\
#         --workspace=4096

# 真机部署成功率记录
results = {'success': 0, 'total': 0}
# 目标：>= 80% 成功率（50次测试）
# 如果 < 60%：采集更多 Demo，重点补充失败场景`,
    lang: 'python',
  },
];

// ─── BOM 快速参考 ──────────────────────────────────────────────────────────────
const BOM_TIERS = [
  {
    tier: '🟢 入门验证套件',
    price: '¥2~5 万',
    desc: '桌面机器人 + VLA Demo，适合 1~3 人小团队',
    items: [
      { name: '机械臂', spec: 'Unitree Z1 或 Trossen WidowX 250', price: '¥8,000' },
      { name: '计算平台', spec: 'Jetson AGX Orin 64GB Dev Kit', price: '¥6,000' },
      { name: '深度相机', spec: 'Intel RealSense D435i × 2', price: '¥3,000' },
      { name: '工控机', spec: 'i7 32GB RAM，运行 ROS 2 + 采集', price: '¥4,000' },
      { name: '配件', spec: 'CAN 转换器、电源、线材', price: '¥2,000' },
    ],
    total: '¥23,000',
    color: '#27ae60',
  },
  {
    tier: '🟡 研发级套件',
    price: '¥10~30 万',
    desc: '自研 6DoF + 多传感器，适合 5~10 人团队',
    items: [
      { name: '自研 6DoF 关节', spec: 'GYEMS RMD-X8 × 6 + 谐波减速器', price: '¥30,000' },
      { name: '关节驱动器', spec: 'ODrive 3.6 × 3（双轴，共 6 轴）', price: '¥4,000' },
      { name: '传感器套件', spec: 'AS5048A × 6 + ICM-42688 × 2 + D435i × 2', price: '¥3,000' },
      { name: '计算平台', spec: 'Jetson AGX Orin × 2（控制 + 推理）', price: '¥12,000' },
      { name: '结构件', spec: 'CNC 铝合金 + 碳纤维管 + SLS PA12', price: '¥15,000' },
      { name: '训练服务器', spec: 'RTX 4090 × 2 工作站', price: '¥50,000' },
    ],
    total: '¥114,000',
    color: '#f39c12',
  },
  {
    tier: '🔴 量产预研套件',
    price: '¥50 万+',
    desc: '双臂全身 + 大算力，百条 Demo 量级',
    items: [
      { name: '双臂人形底盘', spec: 'Unitree H1 或 Figure 02 方案参考', price: '¥80,000' },
      { name: '计算平台', spec: 'NVIDIA Thor 模组或双 AGX Orin', price: '¥30,000' },
      { name: '传感器全套', spec: 'Ouster OS0-32 LiDAR + ZED 2i × 3 + 力传感器 × 6', price: '¥60,000' },
      { name: '训练集群', spec: 'A100 × 4 或云端 H100 × 8（按需购买）', price: '¥200,000' },
    ],
    total: '¥370,000+',
    color: '#e74c3c',
  },
];

// ─── StepCard 组件 ────────────────────────────────────────────────────────────
function StepCard({ step, isActive, onToggle }) {
  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isActive ? 'shadow-lg' : 'hover:shadow-sm'}`}
      style={{ borderColor: isActive ? step.color : step.color + '33', background: isActive ? step.bgColor : 'white' }}>

      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: step.color }}>
          {step.step}
        </div>
        <div className="text-2xl flex-shrink-0">{step.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: step.color }}>{step.duration}</span>
            <span className="text-xs text-gray-400">{step.difficulty}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{step.subtitle}</p>
        </div>
        <span className="text-gray-400 flex-shrink-0 text-lg">{isActive ? '▲' : '▼'}</span>
      </div>

      {/* Expanded Content */}
      {isActive && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: step.color + '22' }}>
          {/* Summary */}
          <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-4 pl-4 border-l-2" style={{ borderColor: step.color }}>{step.summary}</p>

          {/* Decision Points */}
          {step.decisions && step.decisions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔀 关键决策点</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {step.decisions.map((d, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 p-3">
                    <div className="text-[11px] font-semibold text-gray-600 mb-1.5">{d.q}</div>
                    {d.options.map((opt, j) => (
                      <div key={j} className="text-[11px] text-gray-500 flex items-start gap-1.5 mb-1">
                        <span className="mt-0.5 flex-shrink-0">›</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✅ 执行清单（点击打勾）</h4>
            <div className="space-y-0.5">
              {step.checklist.map((item, i) => (
                <CheckItem key={i} text={item.text} sub={item.sub} />
              ))}
            </div>
          </div>

          {/* Code */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📝 代码参考</h4>
            <CodeBlock code={step.code} lang={step.lang} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function RobotGuidePage() {
  const [activeStep, setActiveStep] = useState(null);
  const [activeBomTier, setActiveBomTier] = useState(null);

  const toggleStep = (id) => setActiveStep(activeStep === id ? null : id);
  const toggleBom = (tier) => setActiveBomTier(activeBomTier === tier ? null : tier);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── Hero ─── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900">🤖 端到端机器人搭建指南</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mb-3">
            从零开始搭建一台具有 VLA 能力的操作机器人——完整覆盖结构材料选型、硬件集成、软件栈、数据采集闭环、模型训练与 Jetson 端侧部署。每一步附带可执行清单和参考代码。
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">5 大阶段</span>
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">交互式清单</span>
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">真实可运行代码</span>
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">BOM 成本参考</span>
          </div>
        </div>

        {/* ─── 流程预览条 ─── */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => toggleStep(step.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeStep === step.id ? 'bg-white shadow border' : 'hover:bg-gray-50'}`}
                style={{ borderColor: activeStep === step.id ? step.color + '55' : undefined }}>
                <span className="text-xl">{step.emoji}</span>
                <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">{step.step} {step.title}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className="flex-shrink-0 text-gray-300 text-lg px-1">→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ─── 各阶段详情 ─── */}
        <div className="space-y-4 mb-12">
          {STEPS.map(step => (
            <StepCard
              key={step.id}
              step={step}
              isActive={activeStep === step.id}
              onToggle={() => toggleStep(step.id)}
            />
          ))}
        </div>

        {/* ─── BOM 成本参考 ─── */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">💰 整机成本参考（BOM）</h2>
          <p className="text-sm text-gray-500 mb-4">按团队规模和验证阶段分三档，点击展开明细</p>
          <div className="space-y-3">
            {BOM_TIERS.map(bom => (
              <div key={bom.tier}
                className="rounded-2xl border-2 overflow-hidden cursor-pointer transition-all"
                style={{ borderColor: activeBomTier === bom.tier ? bom.color : bom.color + '33' }}
                onClick={() => toggleBom(bom.tier)}>
                <div className="flex items-center gap-4 p-4"
                  style={{ background: activeBomTier === bom.tier ? bom.color + '08' : 'white' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{bom.tier}</span>
                      <span className="text-sm font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: bom.color }}>{bom.price}</span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-0.5">{bom.desc}</p>
                  </div>
                  <span className="text-gray-400">{activeBomTier === bom.tier ? '▲' : '▼'}</span>
                </div>
                {activeBomTier === bom.tier && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: bom.color + '22' }}>
                    <div className="mt-3 space-y-2">
                      {bom.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 text-sm py-2 border-b border-gray-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-gray-400 text-[11px] ml-2">{item.spec}</span>
                          </div>
                          <span className="font-mono text-gray-600 flex-shrink-0 text-xs">{item.price}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 font-bold text-base">
                        <span style={{ color: bom.color }}>合计</span>
                        <span style={{ color: bom.color }}>{bom.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── 关键时间线 ─── */}
        <div className="mb-10 rounded-2xl border border-gray-100 p-5 bg-gray-50">
          <h2 className="text-base font-bold text-gray-900 mb-4">📅 参考时间线（入门套件 · 单人）</h2>
          <div className="space-y-2">
            {[
              { week: '第 1~2 周',  color: '#e17055', task: '材料采购 + BOM 确认 + URDF 建模', milestone: '结构方案冻结' },
              { week: '第 3~5 周',  color: '#6c5ce7', task: '硬件装配 + 驱动调通 + CAN 总线联调', milestone: '各关节可单独控制' },
              { week: '第 6~9 周',  color: '#00b894', task: 'ROS 2 集成 + Gazebo 仿真验证 + 视觉感知', milestone: '仿真中可完成目标任务' },
              { week: '第 10~12 周',color: '#0984e3', task: '遥操作数据采集（目标 100条 Demo）', milestone: '首批数据集上传 Hub' },
              { week: '第 13~14 周',color: '#a855f7', task: 'ACT 模型训练 + 量化 + Jetson 部署', milestone: '真机成功率 ≥ 60%' },
              { week: '第 15 周+',  color: '#2d3436', task: '持续采集 → 重训 → 迭代闭环', milestone: '数据飞轮建立' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-24 flex-shrink-0 text-[11px] font-mono text-gray-400">{row.week}</div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }}></div>
                <div className="flex-1 text-gray-600 text-[12px]">{row.task}</div>
                <div className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium text-white hidden sm:block"
                  style={{ background: row.color + 'cc' }}>{row.milestone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 延伸阅读 ─── */}
        <div className="rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">📖 配套资源</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '⚙️', title: '硬件知识体系', desc: '通用接口·机器人·自动驾驶·无人机·材料', href: '/hardware/' },
              { icon: '🚗', title: 'VLA · 自动驾驶', desc: 'VLA 架构·数据管线·端侧推理', href: '/vla/' },
              { icon: '📖', title: '机器人入门书籍', desc: '5 章系统教程：材料→传感器→控制→仿真→集成', href: '/books/' },
              { icon: '🔄', title: '数据闭环 Infra', desc: '采集·存储·标注·训练数据管线', href: '/data-infra/' },
            ].map(link => (
              <a key={link.href} href={link.href}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors group">
                <span className="text-xl">{link.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{link.title}</div>
                  <div className="text-[11px] text-gray-400">{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
