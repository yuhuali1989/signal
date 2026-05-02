---
title: "机器人入门——从材料到控制 - 第2章: 传感器与执行器"
book: "机器人入门——从材料到控制"
chapter: "2"
chapterTitle: "传感器与执行器"
description: "电机与减速器选型（BLDC/步进/舵机）、编码器、IMU、力矩传感器、深度相机；驱动器接口与功率计算"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "电机"
  - "传感器"
  - "IMU"
  - "编码器"
type: "book"
---

# 第 2 章：传感器与执行器

> **学习目标**：会选电机和减速器，理解编码器类型与精度，能接 IMU 读数据，了解深度相机原理与选型。

---

## 2.1 执行器：让机器人动起来

### 无刷直流电机（BLDC）

机器人关节驱动的主流选择，结合 FOC 驱动器实现力矩控制。

**核心参数解读**：

| 参数 | 含义 | 典型值 |
|------|------|--------|
| KV 值 | 空载转速/电压 (RPM/V) | 100~2000 KV |
| 额定扭矩 | 连续工作扭矩 (N·m) | 0.1~50 N·m |
| 峰值扭矩 | 短时最大扭矩（通常 3× 额定）| — |
| 功率 | P = T × ω (W) | 50~5000 W |
| 极对数 | 极对数越多，低速扭矩越好 | 7~21 对极 |

**典型机器人电机选型**：

| 型号 | KV | 额定扭矩 | 特点 | 价格 |
|------|-----|---------|------|------|
| T-Motor MN501S KV80 | 80 | 2.5 N·m | 大扭矩低转速，机械臂大臂 | ¥800 |
| Unitree B1 Joint Motor | — | 23 N·m | 四足机器人关节一体化 | ¥2000 |
| Maxon EC-i 40 | — | 0.12 N·m | 瑞士精密，医疗/航天 | ¥3000 |
| 高云 GYEMS RMD-X8 | — | 8.0 N·m | 一体化关节（电机+驱动+编码器）| ¥1500 |

**FOC 驱动器推荐**：
- **SimpleFOC（开源）**：STM32 + DRV8302，¥80，支持 CAN/I2C/UART
- **ODrive 3.6**：双轴 56V/60A，¥1200，USB/UART/CAN，Python SDK
- **小米 Cyberdog 开源驱动**：基于 STM32H743

```python
# ODrive Python SDK — 力矩模式控制示例
import odrive
from odrive.enums import ControlMode, InputMode
import time

# 连接 ODrive（USB 自动搜索）
odrv = odrive.find_any()
axis = odrv.axis0

# 配置力矩控制模式
axis.controller.config.control_mode = ControlMode.TORQUE_CONTROL
axis.controller.config.input_mode   = InputMode.PASSTHROUGH

# 上电使能
axis.requested_state = 8   # CLOSED_LOOP_CONTROL

# 输出 0.5 N·m 力矩（需先配置 torque_constant = Kt）
for t in range(100):
    torque = 0.5 * (1 if t < 50 else -1)
    axis.controller.input_torque = torque
    print(f"位置: {axis.encoder.pos_estimate:.3f} rad  "
          f"速度: {axis.encoder.vel_estimate:.1f} rad/s  "
          f"电流: {axis.motor.current_control.Iq_measured:.2f} A")
    time.sleep(0.01)
```

### 谐波减速器（Harmonic Drive）

机械臂精密关节的标配减速器，**零间隙、高减速比、高扭矩密度**。

| 参数 | 值 |
|------|-----|
| 减速比 | 30:1 ~ 160:1（常用 80:1/100:1）|
| 传动精度 | ≤ 1 arcmin（≈ 0.017°）|
| 重复精度 | ≤ 0.1 arcmin |
| 传动效率 | 65~80%（低于行星减速器）|
| 代表品牌 | 哈默纳科（日本）/ 绿的谐波（国产，¥2000起）|

**国产替代**：绿的谐波 CSF-14-80-2A-GR 减速比 80:1，额定扭矩 7N·m，¥2500 —— 日本同规格约 ¥8000。

### 步进电机

低成本位置控制，无需编码器反馈（开环）。

```python
# 步进电机精度计算
steps_per_rev = 200        # 1.8°/步
microstepping  = 16        # 1/16 细分
gear_ratio     = 5.18      # 减速比（常见皮带轮）

total_steps = steps_per_rev * microstepping * gear_ratio
angular_res = 360 / total_steps
linear_res  = (360 / total_steps) * (20 / 360)  # 20mm 导程丝杠 (mm)

print(f"角度分辨率: {angular_res:.4f}°")          # → 0.0219°
print(f"线性分辨率（20mm导程）: {linear_res*1000:.2f} μm")  # → 12.1 μm
```

---

## 2.2 传感器：让机器人感知世界

### 编码器

关节角度反馈的核心传感器，决定位置控制精度。

| 类型 | 原理 | 分辨率 | 特点 |
|------|------|--------|------|
| 磁编码器（AS5048A）| 霍尔效应 | 14bit（16384 ppr）| 低成本，抗污，SPI 接口 |
| 光电增量式 | 光栅 | 1000~10000 ppr | 高精度，怕灰尘，需归零 |
| 绝对式（多圈）| 磁/光学 | 17~23bit | 上电即知位置，贵 |
| AMOS 电容式 | 电容 | 21bit | Maxon 高端产品 |

**实用建议**：大多数机器人项目用 **AS5048A（磁编码器，¥30）** 足够，14bit = 16384 分辨率，配合 100:1 减速器末端精度 < 0.002°。

### IMU（惯性测量单元）

机器人姿态估计、步态控制、导航的核心传感器。

```python
# smbus2 读取 ICM-42688-P（高精度 IMU）
import smbus2, struct, time

bus = smbus2.SMBus(1)
ICM = 0x68

# 初始化：退出 sleep，配置 ODR
bus.write_byte_data(ICM, 0x75, 0x00)   # 写 BANK_SEL = 0
bus.write_byte_data(ICM, 0x4E, 0x06)   # Accel ODR = 1kHz
bus.write_byte_data(ICM, 0x50, 0x06)   # Gyro  ODR = 1kHz

def read_imu():
    data = bus.read_i2c_block_data(ICM, 0x1F, 12)  # Accel+Gyro 各 6B
    ax, ay, az = struct.unpack('>hhh', bytes(data[0:6]))
    gx, gy, gz = struct.unpack('>hhh', bytes(data[6:12]))
    # 量程：±4g → LSB = 32768/4 = 8192; ±500dps → LSB = 65.5
    return (ax/8192, ay/8192, az/8192), (gx/65.5, gy/65.5, gz/65.5)

for _ in range(100):
    accel, gyro = read_imu()
    print(f"Accel(g): {accel[0]:+.3f} {accel[1]:+.3f} {accel[2]:+.3f}  "
          f"Gyro(dps): {gyro[0]:+.1f} {gyro[1]:+.1f} {gyro[2]:+.1f}")
    time.sleep(0.01)
```

**选型对比**：

| 型号 | 精度 | 接口 | 适用场景 | 价格 |
|------|------|------|---------|------|
| MPU-6050 | ±2% | I2C | 学习/玩具 | ¥5 |
| ICM-42688-P | ±0.5% | SPI/I2C | 无人机/机器人 | ¥30 |
| BMI088 | ±0.3% | SPI | 工业无人机 | ¥50 |
| ADIS16470 | ±0.1% | SPI | 高精度 AGV | ¥800 |
| Xsens MTi-630 | IMU+AHRS | RS-232 | 工业级 | ¥15000 |

### 深度相机

机器人感知3D环境的眼睛。

| 型号 | 原理 | 量程 | 分辨率 | 价格 |
|------|------|------|--------|------|
| Intel RealSense D435i | 有源双目+投影 | 0.2~10m | 1280×720 深度 | ¥1500 |
| Intel RealSense D457 | 有源双目 | 0.4~6m | 1280×800 | ¥2000 |
| Microsoft Azure Kinect DK | ToF | 0.25~2.88m | 1024×1024 | ¥2800 |
| ZED 2i | 被动双目 | 0.3~20m | 4MP 彩色 | ¥5000 |
| Orbbec Gemini 2L | ToF | 0.3~10m | 1280×800 | ¥800（国产）|

```python
# Intel RealSense D435i — 获取点云
import pyrealsense2 as rs
import numpy as np
import open3d as o3d

pipeline = rs.pipeline()
config   = rs.config()
config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16,  30)
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

pipeline.start(config)
align = rs.align(rs.stream.color)

try:
    frames  = pipeline.wait_for_frames()
    aligned = align.process(frames)
    depth   = aligned.get_depth_frame()
    color   = aligned.get_color_frame()

    # 转换为 numpy
    depth_img = np.asanyarray(depth.get_data())    # mm
    color_img = np.asanyarray(color.get_data())

    # 生成点云
    pc = rs.pointcloud()
    points = pc.calculate(depth)
    vtx = np.asanyarray(points.get_vertices()).view(np.float32).reshape(-1,3)

    # Open3D 可视化
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(vtx)
    o3d.visualization.draw_geometries([pcd])
finally:
    pipeline.stop()
```

---

## 2.3 功率预算与电气设计

整机选型必须做功率预算，否则会出现欠压/过热。

```python
# 机器人功率预算计算器
components = {
    # 执行器（峰值功率 × 同时工作系数）
    '6轴电机 × 6':           (120 * 6, 0.6),    # 120W/轴 × 60%同时工作
    '末端执行器':             (30,      0.5),
    # 计算平台
    'Jetson AGX Orin':       (40,      1.0),
    'STM32 × 3':             (1,       1.0),
    # 传感器
    'LiDAR (Ouster OS1)':    (20,      1.0),
    '深度相机 × 2':          (4,       1.0),
    'IMU × 2':               (0.2,     1.0),
    # 通信
    'WiFi 6 + 4G':           (8,       0.8),
    # 其他
    '风扇散热 × 3':          (15,      1.0),
}

total_avg  = sum(p * f for p, f in components.values())
total_peak = sum(p for p, _ in components.values())

print(f"平均功耗: {total_avg:.0f} W")
print(f"峰值功耗: {total_peak:.0f} W")

# 选择电池（48V 系统）
battery_v = 48          # V
avg_current = total_avg / battery_v
print(f"48V系统平均电流: {avg_current:.1f} A")

# 续航计算（选 30Ah LFP 电池组）
capacity_ah = 30
runtime_h   = capacity_ah / avg_current * 0.85   # 85% 放电深度
print(f"额定续航: {runtime_h:.1f} h ({runtime_h*60:.0f} min)")
```

---

## 2.4 本章小结

- **电机选型**：先定扭矩需求，再选 KV 和搭配减速比；力矩控制用无刷 + FOC
- **减速器**：谐波减速器精度最高但效率低；行星减速器效率高但有回差
- **编码器**：AS5048A 磁编码器性价比最高，绝对式适合上电即用场景
- **IMU**：无人机/高精度用 ICM-42688-P；工业级用 Xsens
- **深度相机**：RealSense D435i 是机器人领域事实标准入门款
- **功率预算**：必须在设计阶段完成，留 30% 余量

---

*内容由 Signal AI Agent 基于公开技术资料整理，数据截至 2026 年 5 月*
