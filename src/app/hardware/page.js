'use client';
import React, { useState } from 'react';
import useHashState from '@/hooks/useHashState';
import Footer from '@/components/Footer';

// ─── CodeBlock 组件 ───────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'code' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="mt-2 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-[10px] font-mono text-gray-500 select-none">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded">
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-gray-300 leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

// ─── 通用基础 ─────────────────────────────────────────────────────────────────
const BASICS_LAYERS = [
  {
    level: '🟢 入门',
    title: '硬件接口与协议',
    subtitle: 'GPIO/PWM/I2C/SPI/CAN/UART — 连接一切传感器与执行器的基础',
    color: '#27ae60',
    items: [
      {
        name: 'GPIO / PWM / ADC',
        icon: '⚡',
        desc: '最基础的数字/模拟 IO，控制 LED、读按键、驱动舵机',
        details: [
          { label: 'GPIO', text: '通用输入/输出引脚。高电平(3.3V/5V)=1，低电平=0。树莓派 40Pin，BCM 编号。' },
          { label: 'PWM（脉宽调制）', text: '通过改变占空比模拟模拟量输出。舵机：50Hz，脉宽 500~2500μs 对应 0°~180°。电机调速：20kHz 高频 PWM。' },
          { label: 'ADC（模数转换）', text: '将模拟电压(0~3.3V)转为数字值。12位 ADC 精度：3.3/4096≈0.8mV。STM32 内置；树莓派需外接 MCP3208。' },
        ],
        code: `# 树莓派 — pigpio 库控制舵机 (比 RPi.GPIO 精度更高)
import pigpio, time
pi = pigpio.pi()
SERVO_PIN = 18

# 舵机脉宽：500μs(0°) ~ 1500μs(90°) ~ 2500μs(180°)
pi.set_servo_pulsewidth(SERVO_PIN, 1500)   # 90° 中立位
time.sleep(1)
pi.set_servo_pulsewidth(SERVO_PIN, 500)    # 0°
time.sleep(1)
pi.set_servo_pulsewidth(SERVO_PIN, 2500)   # 180°
time.sleep(1)
pi.set_servo_pulsewidth(SERVO_PIN, 0)      # 关闭 PWM 输出

# ADC 读取示例 (MCP3208, SPI 接口)
import spidev
spi = spidev.SpiDev()
spi.open(0, 0)          # Bus 0, Device 0
spi.max_speed_hz = 1000000
def read_adc(channel):  # channel 0~7
    r = spi.xfer2([0x06 | (channel >> 2), (channel & 3) << 6, 0])
    return ((r[1] & 0x0F) << 8) | r[2]   # 12-bit 结果
voltage = read_adc(0) * 3.3 / 4096
print(f"ADC 通道0: {voltage:.3f} V")`,
        lang: 'python',
      },
      {
        name: 'I2C 总线',
        icon: '🔌',
        desc: '两线制（SDA/SCL），多设备挂载同一总线，最常见于传感器',
        details: [
          { label: '电气特性', text: '开漏输出 + 上拉电阻（4.7kΩ）。标准速率 100kHz，快速 400kHz，高速 3.4MHz。7位地址，最多 128 个设备。' },
          { label: 'MPU-6050 寄存器', text: '0x6B = 电源管理（写0唤醒），0x3B~0x40 = 加速度 XYZ（各2字节大端），0x43~0x48 = 角速度 XYZ。' },
          { label: 'I2C 扫描', text: '`i2cdetect -y 1` 扫描总线上所有设备地址（树莓派 Bus 1）。' },
        ],
        code: `import smbus2, struct, time

bus = smbus2.SMBus(1)     # 树莓派 I2C-1
MPU6050_ADDR = 0x68

# 唤醒 MPU-6050（清零 sleep bit）
bus.write_byte_data(MPU6050_ADDR, 0x6B, 0x00)
time.sleep(0.1)

# 读取加速度计原始值（6 字节：AX_H AX_L AY_H AY_L AZ_H AZ_L）
def read_accel():
    raw = bus.read_i2c_block_data(MPU6050_ADDR, 0x3B, 6)
    # '>hhh' = 3个有符号短整型，大端序
    ax, ay, az = struct.unpack('>hhh', bytes(raw))
    # ±2g 量程：LSB = 16384 counts/g
    return ax/16384.0, ay/16384.0, az/16384.0

# 读取陀螺仪原始值（0x43 起 6 字节）
def read_gyro():
    raw = bus.read_i2c_block_data(MPU6050_ADDR, 0x43, 6)
    gx, gy, gz = struct.unpack('>hhh', bytes(raw))
    # ±250°/s 量程：LSB = 131 counts/(°/s)
    return gx/131.0, gy/131.0, gz/131.0

for _ in range(5):
    ax, ay, az = read_accel()
    gx, gy, gz = read_gyro()
    print(f"Accel: {ax:+.2f}g {ay:+.2f}g {az:+.2f}g | "
          f"Gyro: {gx:+.1f} {gy:+.1f} {gz:+.1f} °/s")
    time.sleep(0.1)`,
        lang: 'python',
      },
      {
        name: 'SPI 总线',
        icon: '🔄',
        desc: '四线制（MOSI/MISO/SCK/CS），速率高于 I2C，适合高速 ADC/显示屏',
        details: [
          { label: '与 I2C 对比', text: 'SPI 全双工，速率可达 50MHz；I2C 半双工，最高 3.4MHz。SPI 占用更多引脚，但无需寻址协议。' },
          { label: 'CPOL/CPHA', text: '4种模式（mode 0/1/2/3）决定时钟极性和相位。MPU-6050 SPI 用 mode 3（CPOL=1, CPHA=1）。' },
          { label: 'CS（片选）', text: '低电平激活目标设备，多设备需多个 CS 引脚，不能共享。' },
        ],
        code: `import spidev, struct

spi = spidev.SpiDev()
spi.open(0, 0)                    # Bus 0, Device 0 (CS0)
spi.max_speed_hz = 5_000_000      # 5MHz
spi.mode = 0b00                   # CPOL=0, CPHA=0

# 读 ICM-20689 陀螺仪（SPI mode 3，寄存器地址 MSB=1 表示读）
ICM_GYRO_XOUT_H = 0x43
def read_reg(reg):
    resp = spi.xfer2([reg | 0x80, 0x00])  # 0x80 = 读标志
    return resp[1]

def read_gyro_x():
    h = read_reg(ICM_GYRO_XOUT_H)
    l = read_reg(ICM_GYRO_XOUT_H + 1)
    raw = struct.unpack('>h', bytes([h, l]))[0]
    return raw / 131.0    # ±250°/s 量程

# BME280 气压/温湿度传感器 — 读取温度补偿值
def bme280_read_temp_raw():
    data = spi.xfer2([0xFA | 0x80, 0x00, 0x00, 0x00])
    return (data[1] << 12) | (data[2] << 4) | (data[3] >> 4)`,
        lang: 'python',
      },
      {
        name: 'CAN bus',
        icon: '🚌',
        desc: '差分双线，工业/汽车标准总线，多节点共享，高抗干扰',
        details: [
          { label: '帧结构', text: '仲裁 ID（11/29位）+ DLC（数据长度）+ 最多 8 字节 Data + CRC。ID 越小优先级越高。' },
          { label: '电气特性', text: 'CAN_H / CAN_L 差分；终端电阻 120Ω；速率：1Mbps(40m)，250kbps(250m)，125kbps(500m)。' },
          { label: 'CAN FD', text: '数据段最多 64 字节，速率最高 8Mbps；向下兼容 CAN 2.0；汽车 E/E 架构主流。' },
          { label: 'SocketCAN (Linux)', text: 'Linux 内核原生 CAN 驱动，`can0` 作为网络接口，`ip link set can0 up type can bitrate 500000`。' },
        ],
        code: `# CAN 帧结构（字节级）
# ┌──────┬───────────┬─────┬──────────────────────────────────┬─────┐
# │ SOF  │  ID(11bit) │ DLC │         Data (0~8 Bytes)         │ CRC │
# │ 1bit │   11bit    │ 4bit│           最多 64bit              │15bit│
# └──────┴───────────┴─────┴──────────────────────────────────┴─────┘

import can, struct

# 连接 SocketCAN 接口
bus = can.interface.Bus(channel='can0', bustype='socketcan')

# 发送：电机控制命令（ID=0x141，DLC=8）
# 协议示例：[命令类型, 空, 空, 空, 速度低字节, 速度高字节, 空, 空]
speed_rpm = 1000
cmd = struct.pack('<BBBBHBB', 0xA2, 0, 0, 0, speed_rpm, 0, 0)
msg = can.Message(arbitration_id=0x141, data=cmd, is_extended_id=False)
bus.send(msg)
print(f"发送: ID={msg.arbitration_id:#05x}  Data={msg.data.hex()}")

# 接收并解析电机反馈
for msg in bus:
    if msg.arbitration_id == 0x241:   # 反馈 ID
        temp, torque, speed, pos = struct.unpack('<BBhH', msg.data)
        print(f"温度:{temp}°C  力矩:{torque*0.01:.2f}Nm  "
              f"速度:{speed}rpm  位置:{pos}")
        break`,
        lang: 'python',
      },
      {
        name: 'UART / RS-485',
        icon: '📡',
        desc: '异步串行通信，最简单的双设备互联，Modbus RTU 工业标准',
        details: [
          { label: 'UART 参数', text: '波特率（9600/115200/921600bps）、数据位（8）、停止位（1）、校验位（None/Even/Odd）。起始位=0，停止位=1。' },
          { label: 'RS-485 vs RS-232', text: 'RS-232：±12V 单端，最远 15m；RS-485：差分 ±7V，最远 1200m，支持 32 节点，需方向控制（DE/RE）。' },
          { label: 'Modbus RTU 帧格式', text: '从机地址(1B) + 功能码(1B) + 数据(NB) + CRC16(2B)。功能码 03=读保持寄存器，06=写单寄存器。' },
        ],
        code: `import serial, struct, time

# Modbus RTU CRC16 计算
def crc16(data: bytes) -> bytes:
    crc = 0xFFFF
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
    return struct.pack('<H', crc)   # 小端序

ser = serial.Serial('/dev/ttyUSB0', 9600,
                    bytesize=8, parity='N', stopbits=1, timeout=0.5)

def read_holding_registers(slave_id, start_addr, count):
    """功能码 0x03：读保持寄存器"""
    req = bytes([slave_id, 0x03,
                 start_addr >> 8, start_addr & 0xFF,
                 count >> 8,      count & 0xFF])
    req += crc16(req)
    ser.write(req)
    # 响应：地址(1)+功能码(1)+字节数(1)+数据(count*2)+CRC(2)
    resp = ser.read(5 + count * 2)
    if len(resp) < 5 or crc16(resp[:-2]) != resp[-2:]:
        raise ValueError("CRC 校验失败")
    n = resp[2]
    return struct.unpack(f'>{n//2}H', resp[3:3+n])

# 读取温湿度传感器（从机地址1，寄存器0x0000起2个）
hum, temp = read_holding_registers(1, 0x0000, 2)
print(f"温度: {temp/10:.1f}°C   湿度: {hum/10:.1f}%RH")`,
        lang: 'python',
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: '嵌入式系统与算法',
    subtitle: 'FreeRTOS 调度、坐标变换、卡尔曼滤波、PID 控制、MAVLink 解析',
    color: '#e17055',
    items: [
      {
        name: 'FreeRTOS 任务模型',
        icon: '⏱️',
        desc: '实时操作系统调度核心：任务优先级、精确周期、队列通信',
        details: [
          { label: '任务状态机', text: 'Running → Blocked（等待信号量/队列/延迟）→ Ready → Running。只有最高优先级 Ready 任务运行。' },
          { label: 'vTaskDelayUntil', text: '绝对时间延迟，消除累积误差，实现精确 1kHz 控制环（比 vTaskDelay 相对延迟精确）。' },
          { label: '队列（Queue）', text: 'FIFO 线程安全通信，`xQueueSend` 生产，`xQueueReceive` 消费，可设超时；替代全局变量。' },
          { label: '信号量/互斥锁', text: '二值信号量用于同步（中断 → 任务），互斥锁保护共享资源（防优先级反转 `xSemaphoreCreateMutex`）。' },
        ],
        code: `// STM32 + FreeRTOS：IMU 读取(1kHz高优先级) + 日志(10Hz低优先级)
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

typedef struct { float ax, ay, az, gx, gy, gz; } ImuData_t;
QueueHandle_t imu_queue;

// 传感器任务：高优先级，1kHz 精确周期
void vSensorTask(void *pvParam) {
    TickType_t xLastWake = xTaskGetTickCount();
    for (;;) {
        ImuData_t data;
        MPU6050_Read(&data.ax, &data.ay, &data.az,
                     &data.gx, &data.gy, &data.gz);
        // 非阻塞发送（队列满时丢弃旧数据）
        xQueueOverwrite(imu_queue, &data);
        vTaskDelayUntil(&xLastWake, pdMS_TO_TICKS(1));  // 1ms = 1kHz
    }
}

// 日志任务：低优先级，10Hz
void vLogTask(void *pvParam) {
    ImuData_t data;
    for (;;) {
        if (xQueueReceive(imu_queue, &data, pdMS_TO_TICKS(100)) == pdTRUE) {
            printf("Accel: %.2f %.2f %.2f g\\n", data.ax, data.ay, data.az);
        }
        vTaskDelay(pdMS_TO_TICKS(100));  // 100ms = 10Hz
    }
}

int main(void) {
    imu_queue = xQueueCreate(1, sizeof(ImuData_t));   // 深度=1，只保留最新值
    xTaskCreate(vSensorTask, "Sensor", 256, NULL, 5, NULL);  // 优先级5
    xTaskCreate(vLogTask,    "Log",    512, NULL, 1, NULL);  // 优先级1
    vTaskStartScheduler();
}`,
        lang: 'c',
      },
      {
        name: '坐标变换 SE(3)',
        icon: '📐',
        desc: '机器人坐标系变换：旋转矩阵、四元数、齐次矩阵',
        details: [
          { label: 'SO(3) 旋转群', text: '3×3 正交矩阵，det=1。绕 Z 轴 θ：[[cosθ,-sinθ,0],[sinθ,cosθ,0],[0,0,1]]。' },
          { label: '四元数', text: 'q = w + xi + yj + zk，|q|=1。优势：无万向锁、插值平滑（SLERP）、计算高效。ROS 用 (x,y,z,w) 顺序。' },
          { label: '欧拉角 vs 四元数', text: '欧拉角（RPY）直观但有万向锁（Gimbal Lock）；传感器输出多为欧拉角，内部计算用四元数。' },
          { label: 'SE(3) 齐次矩阵', text: '4×4 矩阵 T = [R|t; 0|1]，同时表达旋转和平移，链式乘法 T_world = T_robot * T_local。' },
        ],
        code: `import numpy as np
from scipy.spatial.transform import Rotation

# ── 四元数 ↔ 旋转矩阵 ──────────────────────────────
# ROS 惯例 [x, y, z, w]，绕 Z 轴旋转 90°
q_ros = [0.0, 0.0, 0.707, 0.707]   # x, y, z, w
R = Rotation.from_quat(q_ros).as_matrix()  # 3×3
print("旋转矩阵:\\n", R.round(3))

# 欧拉角 (roll, pitch, yaw) → 四元数
rpy = [0.0, 0.0, np.pi/2]   # yaw=90°
q = Rotation.from_euler('xyz', rpy).as_quat()   # [x,y,z,w]
print(f"四元数: x={q[0]:.3f} y={q[1]:.3f} z={q[2]:.3f} w={q[3]:.3f}")

# ── SE(3) 齐次变换矩阵 ────────────────────────────
def make_T(R, t):
    T = np.eye(4)
    T[:3, :3] = R
    T[:3,  3] = t
    return T

T_base_to_world = make_T(R, t=[1.0, 0.5, 0.0])  # 机器人在世界系中的位姿
p_local = np.array([0.2, 0.0, 0.0, 1.0])         # 机器人坐标系中的点（齐次）
p_world = T_base_to_world @ p_local               # 变换到世界坐标系

# ── 链式变换（相机→机器人→世界）──────────────────
T_cam_to_robot = make_T(np.eye(3), t=[0.1, 0, 0.3])
T_robot_to_world = T_base_to_world
T_cam_to_world = T_robot_to_world @ T_cam_to_robot

# ── SLERP 球面线性插值（动画/轨迹平滑）──────────
r1 = Rotation.from_euler('z', 0)
r2 = Rotation.from_euler('z', np.pi/2)
rots = Rotation.concatenate([r1, r2])
slerp_fn = rots  # 用 Slerp 类进行插值
ts = [0, 0.25, 0.5, 0.75, 1.0]
# from scipy.spatial.transform import Slerp
# slerp = Slerp([0,1], rots); result = slerp(ts)`,
        lang: 'python',
      },
      {
        name: '卡尔曼滤波',
        icon: '📈',
        desc: '融合多个含噪声传感器的最优估计器，IMU/GPS融合基础',
        details: [
          { label: '两步递推', text: '预测步（时间更新）：x̂⁻ = Fx̂, P⁻ = FPFᵀ+Q。更新步（测量更新）：K = P⁻Hᵀ(HP⁻Hᵀ+R)⁻¹, x̂ = x̂⁻ + K(z-Hx̂⁻)。' },
          { label: 'Q vs R 调参', text: 'Q大→信任模型少，更新快，噪声大；R大→信任传感器少，更新慢，平滑。Q/R比值决定收敛速度。' },
          { label: 'EKF（扩展）', text: '非线性系统（机器人运动/SLAM），用雅可比矩阵线性化：F=∂f/∂x, H=∂h/∂x。' },
          { label: 'UKF（无迹）', text: 'Sigma 点采样，比 EKF 精度更高，无需求导；适合强非线性系统（无人机姿态估计）。' },
        ],
        code: `import numpy as np

class KalmanFilter1D:
    """1D 卡尔曼滤波器 — 以高度+气压计为例"""
    def __init__(self, q=0.01, r=0.5):
        self.x = 0.0   # 状态估计：高度 (m)
        self.p = 1.0   # 误差协方差
        self.q = q     # 过程噪声：越大越相信运动模型
        self.r = r     # 测量噪声：越大越不信传感器

    def predict(self):
        self.p += self.q              # P⁻ = P + Q (匀速模型简化)

    def update(self, z):              # z：气压计高度测量值
        k = self.p / (self.p + self.r)        # 卡尔曼增益 K
        self.x += k * (z - self.x)            # 状态更新
        self.p *= (1 - k)                     # 协方差更新
        return self.x

# 模拟：真实高度=10m，气压计有 ±0.5m 噪声
import random
kf = KalmanFilter1D(q=0.01, r=0.5)
print(f"{'测量':>8}  {'估计':>8}  {'误差':>8}")
for i in range(10):
    z = 10.0 + random.gauss(0, 0.5)     # 含噪声测量
    kf.predict()
    est = kf.update(z)
    print(f"{z:8.3f}  {est:8.3f}  {abs(est-10):8.3f}")

# ── EKF 预测+更新（机器人 2D 定位）────────────────
def ekf_predict(x, P, u, Q, dt):
    v, w = u          # 线速度, 角速度
    θ = x[2]
    f = x + np.array([v*np.cos(θ)*dt, v*np.sin(θ)*dt, w*dt])
    F = np.array([[1,0,-v*np.sin(θ)*dt],
                  [0,1, v*np.cos(θ)*dt],
                  [0,0,1]])
    return f, F @ P @ F.T + Q

def ekf_update(x, P, z, H, R):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    return x + K@(z - H@x), (np.eye(3) - K@H) @ P`,
        lang: 'python',
      },
      {
        name: 'PID 控制器',
        icon: '🎛️',
        desc: '最广泛使用的反馈控制器，掌握它能调好 80% 的控制问题',
        details: [
          { label: 'P/I/D 作用', text: 'P(比例)：消除当前误差，增大→响应快但振荡。I(积分)：消除稳态误差，增大→消静差但超调。D(微分)：预测趋势抑制振荡，对噪声敏感。' },
          { label: '抗积分饱和', text: '积分项无限累积会导致大超调。Clamping 法：输出饱和时停止积分；Back-calculation 法：用饱和差值反向修正。' },
          { label: '微分滤波', text: 'D 项对测量噪声敏感，实际用低通滤波器：D_filtered = α*D_prev + (1-α)*D_raw，α=0.1~0.3。' },
          { label: '串级 PID', text: '外环（位置）→目标速度→内环（速度）PID。机械臂关节：位置环 + 速度环 + 电流环三闭环。' },
        ],
        code: `import time

class PID:
    def __init__(self, kp, ki, kd,
                 output_limit=(-100.0, 100.0),
                 d_filter_alpha=0.2):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.limit = output_limit
        self.alpha = d_filter_alpha   # 微分低通滤波系数
        self._integral  = 0.0
        self._prev_err  = 0.0
        self._prev_deriv = 0.0

    def compute(self, setpoint, measurement, dt):
        err = setpoint - measurement

        # P 项
        p = self.kp * err

        # I 项 + 抗积分饱和（Clamping）
        self._integral += err * dt
        i_raw = self.ki * self._integral
        i_clamped = max(self.limit[0], min(self.limit[1], i_raw))
        if i_raw != i_clamped:
            self._integral = i_clamped / self.ki  # 反向修正

        # D 项 + 低通滤波（避免噪声放大）
        deriv_raw = (err - self._prev_err) / max(dt, 1e-6)
        deriv = (self.alpha * self._prev_deriv +
                 (1 - self.alpha) * deriv_raw)
        self._prev_deriv = deriv
        self._prev_err   = err

        output = p + i_clamped + self.kd * deriv
        return max(self.limit[0], min(self.limit[1], output))

# 演示：电机转速控制，目标 100 rpm
pid = PID(kp=2.0, ki=0.5, kd=0.1, output_limit=(-50, 50))
speed, dt = 0.0, 0.01
for i in range(80):
    u = pid.compute(setpoint=100.0, measurement=speed, dt=dt)
    speed += u * dt * 3     # 简化被控对象
    if i % 10 == 0:
        print(f"t={i*dt:.2f}s  speed={speed:.1f}rpm  u={u:.1f}")`,
        lang: 'python',
      },
      {
        name: 'MAVLink 消息',
        icon: '✈️',
        desc: '无人机/无人车通信协议，理解消息格式是二次开发基础',
        details: [
          { label: 'MAVLink v2 帧格式', text: 'STX(0xFD) + LEN + INC_FLAGS + CMP_FLAGS + SEQ + SYS_ID + COMP_ID + MSG_ID(3B) + PAYLOAD + CHECKSUM(2B)。' },
          { label: '常用消息', text: 'HEARTBEAT(#0)：系统状态心跳。GPS_RAW_INT(#24)：GPS坐标。ATTITUDE(#30)：欧拉角。RC_CHANNELS(#65)：遥控器通道。COMMAND_LONG(#76)：发送指令。' },
          { label: '系统模式', text: 'base_mode: MAV_MODE_FLAG_AUTO_ENABLED(0x10)|MAV_MODE_FLAG_GUIDED_ENABLED(0x08)。custom_mode: PX4 子模式(POSCTL=3, OFFBOARD=6, LAND=9)。' },
        ],
        code: `from pymavlink import mavutil
import time

# 连接飞控（USB or UDP）
mav = mavutil.mavlink_connection('/dev/ttyACM0', baud=57600)
# 或 UDP: mavutil.mavlink_connection('udp:127.0.0.1:14550')

# 等待心跳，确认连接
print("等待心跳...")
mav.wait_heartbeat()
print(f"系统: {mav.target_system}  组件: {mav.target_component}")

# 请求数据流（POSITION 10Hz）
mav.mav.request_data_stream_send(
    mav.target_system, mav.target_component,
    mavutil.mavlink.MAV_DATA_STREAM_POSITION, 10, 1)

# 解析 GPS + 姿态消息
for _ in range(20):
    msg = mav.recv_match(
        type=['GPS_RAW_INT', 'ATTITUDE'], blocking=True, timeout=1.0)
    if msg is None:
        continue
    if msg.get_type() == 'GPS_RAW_INT':
        lat = msg.lat / 1e7      # 1e-7 度 → 度
        lon = msg.lon / 1e7
        alt = msg.alt / 1000.0   # mm → m
        print(f"GPS: {lat:.6f},{lon:.6f}  Alt:{alt:.1f}m  Fix:{msg.fix_type}")
    elif msg.get_type() == 'ATTITUDE':
        import math
        print(f"Roll:{math.degrees(msg.roll):.1f}°  "
              f"Pitch:{math.degrees(msg.pitch):.1f}°  "
              f"Yaw:{math.degrees(msg.yaw):.1f}°")

# 发送 ARM 指令
mav.mav.command_long_send(
    mav.target_system, mav.target_component,
    mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
    0,        # confirmation
    1,        # param1: 1=ARM, 0=DISARM
    0,0,0,0,0,0)`,
        lang: 'python',
      },
    ],
  },
  {
    level: '🔴 精通',
    title: '系统级开发',
    subtitle: 'ROS 2 完整节点、URDF 建模、EKF SLAM、DDS QoS — 构建完整机器人系统',
    color: '#6c5ce7',
    items: [
      {
        name: 'ROS 2 节点完整模板',
        icon: '🤖',
        desc: 'Publisher/Subscriber/Service/Action/参数服务 完整示例',
        details: [
          { label: 'QoS 策略', text: 'SENSOR_DATA：BestEffort+Volatile（传感器，允许丢失）；SYSTEM_DEFAULT：Reliable+Transient（控制指令，不丢失）。' },
          { label: 'Lifecycle Node', text: '状态机：Unconfigured→Inactive→Active→Finalized。硬件驱动节点推荐用 LifecycleNode，可受控启动/关闭。' },
          { label: 'Timer 与 Callback Group', text: 'MutuallyExclusiveCallbackGroup 保证串行；ReentrantCallbackGroup 允许并行执行多个回调。' },
          { label: 'Launch 文件', text: 'Python launch 文件 `LaunchDescription([Node(...)])` 可参数化、条件启动、设置 remapping。' },
        ],
        code: `# ros2_control_demo.py — 完整 ROS 2 Python 节点
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data, QoSProfile, ReliabilityPolicy
from sensor_msgs.msg import Imu, LaserScan
from geometry_msgs.msg import Twist
from std_srvs.srv import SetBool
import numpy as np

class ControlNode(Node):
    def __init__(self):
        super().__init__('hw_control_node')

        # ── 参数声明 ──────────────────────────────────
        self.declare_parameter('kp', 1.0)
        self.declare_parameter('max_vel', 0.5)
        self.kp  = self.get_parameter('kp').value
        self.vmax = self.get_parameter('max_vel').value

        # ── 订阅：IMU（传感器QoS，允许丢包）──────────
        self.sub_imu = self.create_subscription(
            Imu, '/imu/data', self.imu_cb,
            qos_profile_sensor_data)

        # ── 订阅：激光雷达（自定义QoS）───────────────
        lidar_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT, depth=5)
        self.sub_scan = self.create_subscription(
            LaserScan, '/scan', self.scan_cb, lidar_qos)

        # ── 发布：速度指令（可靠QoS）─────────────────
        self.pub_cmd = self.create_publisher(Twist, '/cmd_vel', 10)

        # ── 服务：开关控制 ────────────────────────────
        self.srv = self.create_service(
            SetBool, '~/enable', self.enable_cb)
        self.enabled = False

        # ── 定时器：50Hz 控制环 ───────────────────────
        self.timer = self.create_timer(0.02, self.control_loop)
        self.roll = 0.0
        self.min_range = float('inf')
        self.get_logger().info("ControlNode 已启动")

    def imu_cb(self, msg: Imu):
        # 从四元数提取 roll
        q = msg.orientation
        self.roll = np.arctan2(
            2*(q.w*q.x + q.y*q.z), 1 - 2*(q.x**2 + q.y**2))

    def scan_cb(self, msg: LaserScan):
        # 前方 ±15° 最近障碍物距离
        n = len(msg.ranges)
        front = msg.ranges[:n//24] + msg.ranges[-n//24:]
        self.min_range = min(r for r in front if r > msg.range_min)

    def enable_cb(self, req, resp):
        self.enabled = req.data
        resp.success = True
        resp.message = "enabled" if req.data else "disabled"
        return resp

    def control_loop(self):
        if not self.enabled:
            return
        cmd = Twist()
        # 平衡控制（简化示例）
        cmd.angular.z = -self.kp * self.roll
        # 障碍物停车
        cmd.linear.x = 0.0 if self.min_range < 0.5 else self.vmax
        self.pub_cmd.publish(cmd)

def main():
    rclpy.init()
    node = ControlNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()`,
        lang: 'python',
      },
      {
        name: 'URDF 机器人建模',
        icon: '🦾',
        desc: 'XML 描述机器人物理结构，ROS 2 / MoveIt 2 / 仿真器通用',
        details: [
          { label: 'Link 元素', text: 'visual（可视化）/ collision（碰撞检测）/ inertial（质量与惯量矩阵）三个子元素。' },
          { label: 'Joint 类型', text: 'revolute（旋转，有限位）/ continuous（旋转，无限）/ prismatic（直线）/ fixed（固连）/ floating / planar。' },
          { label: '惯量矩阵', text: 'ixx/iyy/izz 主惯量，ixy/ixz/iyz 积惯量。实心圆柱绕轴：I=(1/12)m(3r²+h²)。MeshLab 可自动计算。' },
          { label: 'xacro 宏', text: '`<xacro:property>` 定义变量，`<xacro:macro>` 定义可复用组件，避免重复 URDF 代码。' },
        ],
        code: `<?xml version="1.0"?>
<!-- 两关节机械臂 URDF -->
<robot name="simple_arm" xmlns:xacro="http://ros.org/wiki/xacro">

  <!-- 参数（xacro 宏） -->
  <xacro:property name="link_len" value="0.3"/>
  <xacro:property name="link_r"   value="0.025"/>

  <!-- 基座 -->
  <link name="base_link">
    <visual>
      <geometry><cylinder radius="0.05" length="0.1"/></geometry>
      <material name="gray"><color rgba="0.5 0.5 0.5 1"/></material>
    </visual>
    <collision>
      <geometry><cylinder radius="0.05" length="0.1"/></geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <!-- 实心圆柱惯量：Ixx=Iyy=(1/12)m(3r²+h²), Izz=(1/2)mr² -->
      <inertia ixx="0.0021" iyy="0.0021" izz="0.00125"
               ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <link name="link1">
    <visual>
      <origin xyz="0 0 \${link_len/2}" rpy="0 0 0"/>
      <geometry><cylinder radius="\${link_r}" length="\${link_len}"/></geometry>
      <material name="blue"><color rgba="0.2 0.4 0.8 1"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 \${link_len/2}"/>
      <geometry><cylinder radius="\${link_r}" length="\${link_len}"/></geometry>
    </collision>
    <inertial>
      <mass value="0.3"/>
      <inertia ixx="0.0023" iyy="0.0023" izz="0.000028"
               ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <!-- 旋转关节：绕 Z 轴，限位 ±90°，最大力矩 10N·m -->
  <joint name="joint1" type="revolute">
    <parent link="base_link"/>
    <child  link="link1"/>
    <origin xyz="0 0 0.05" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.5708" upper="1.5708"
           effort="10.0" velocity="1.0"/>
    <dynamics damping="0.5" friction="0.1"/>
  </joint>

  <!-- ros2_control 接口声明 -->
  <ros2_control name="arm_hw" type="system">
    <hardware>
      <plugin>mock_components/GenericSystem</plugin>
    </hardware>
    <joint name="joint1">
      <command_interface name="position"/>
      <state_interface   name="position"/>
      <state_interface   name="velocity"/>
    </joint>
  </ros2_control>
</robot>`,
        lang: 'xml',
      },
      {
        name: 'DDS QoS 策略',
        icon: '🌐',
        desc: 'ROS 2 底层通信质量策略，决定数据可靠性与延迟',
        details: [
          { label: '可靠性（Reliability）', text: 'RELIABLE：保证送达，重传直到确认；BEST_EFFORT：不重传，适合传感器高频数据（丢一帧无所谓）。' },
          { label: '历史（History）', text: 'KEEP_LAST(N)：保留最近 N 条；KEEP_ALL：全保留（受系统内存限制）。深度=1 只需最新值。' },
          { label: '持久性（Durability）', text: 'VOLATILE：订阅者只收到订阅后的消息；TRANSIENT_LOCAL：订阅者加入时能收到历史消息（适合参数/地图）。' },
          { label: '截止期（Deadline）', text: '超过设定间隔无消息触发事件，用于检测传感器失联（如 IMU 超过 50ms 无数据）。' },
        ],
        code: `# ROS 2 Python — QoS 策略完整配置示例
import rclpy
from rclpy.node import Node
from rclpy.qos import (QoSProfile, QoSReliabilityPolicy,
                        QoSHistoryPolicy, QoSDurabilityPolicy,
                        QoSLivelinessPolicy)
from rclpy.duration import Duration
from sensor_msgs.msg import Image
from nav_msgs.msg import OccupancyGrid

class QosDemoNode(Node):
    def __init__(self):
        super().__init__('qos_demo')

        # ── 传感器数据 QoS（高频，允许丢包）────────
        sensor_qos = QoSProfile(
            reliability=QoSReliabilityPolicy.BEST_EFFORT,
            history=QoSHistoryPolicy.KEEP_LAST,
            depth=5,
            durability=QoSDurabilityPolicy.VOLATILE,
        )

        # ── 地图 QoS（低频，新节点需要最新地图）────
        map_qos = QoSProfile(
            reliability=QoSReliabilityPolicy.RELIABLE,
            history=QoSHistoryPolicy.KEEP_LAST,
            depth=1,
            durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,  # 迟订阅也能收到
        )

        # ── 实时控制 QoS（可靠+截止期监控）─────────
        ctrl_qos = QoSProfile(
            reliability=QoSReliabilityPolicy.RELIABLE,
            history=QoSHistoryPolicy.KEEP_LAST,
            depth=1,
            deadline=Duration(seconds=0.05),  # 50ms 截止，超时触发警告
        )

        self.sub_cam  = self.create_subscription(Image, '/camera/image', self.cam_cb, sensor_qos)
        self.sub_map  = self.create_subscription(OccupancyGrid, '/map', self.map_cb, map_qos)

    def cam_cb(self, msg): pass
    def map_cb(self, msg): pass

# ── YAML QoS 配置（launch 文件中加载）──────────
# qos_profiles.yaml:
# /camera/image:
#   qos_overrides:
#     publisher:
#       reliability: best_effort
#       history: keep_last
#       depth: 5`,
        lang: 'python',
      },
      {
        name: 'PointCloud 点云处理',
        icon: '☁️',
        desc: 'LiDAR 数据的核心数据结构与常用处理操作',
        details: [
          { label: 'ROS PointCloud2 格式', text: '二进制消息：header + height + width + fields[](name/offset/datatype/count) + point_step + row_step + data[]。' },
          { label: 'PCL 数据结构', text: 'pcl::PointXYZI：x,y,z(float32), intensity(float32)，16字节/点。pcl::PointCloud<T>：points[] + width + height + is_dense。' },
          { label: '常用操作', text: '体素降采样(VoxelGrid)→法线估计(NormalEstimation)→特征提取(FPFH/SHOT)→ICP配准→欧式聚类分割。' },
        ],
        code: `import numpy as np
import open3d as o3d

# ── 从 numpy array 创建点云 ──────────────────────
# 模拟 LiDAR 数据：N×3 (x,y,z)
N = 10000
pts = np.random.randn(N, 3).astype(np.float32)
pts[:,2] = np.abs(pts[:,2]) * 0.1   # 压缩Z，模拟平面点云

pcd = o3d.geometry.PointCloud()
pcd.points = o3d.utility.Vector3dVector(pts)

# ── 体素降采样（减少点数，保持形状）─────────────
pcd_down = pcd.voxel_down_sample(voxel_size=0.05)
print(f"原始: {len(pcd.points)}点 → 降采样后: {len(pcd_down.points)}点")

# ── 法线估计 ──────────────────────────────────────
pcd_down.estimate_normals(
    o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))

# ── 统计离群点去除 ────────────────────────────────
_, ind = pcd_down.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
pcd_clean = pcd_down.select_by_index(ind)

# ── ICP 点云配准（计算两帧之间的变换）────────────
source = pcd_clean
# 模拟目标点云（稍微偏移）
target = source.translate([0.1, 0.05, 0.0])
reg = o3d.pipelines.registration.registration_icp(
    source, target, max_correspondence_distance=0.05,
    estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPoint())
print(f"ICP 变换矩阵:\\n{reg.transformation.round(4)}")
print(f"配准 RMSE: {reg.inlier_rmse:.4f}")

# ── 欧式聚类分割（检测独立物体）─────────────────
labels = np.array(pcd_clean.cluster_dbscan(eps=0.1, min_points=10))
n_clusters = labels.max() + 1
print(f"检测到 {n_clusters} 个聚类")`,
        lang: 'python',
      },
    ],
  },
];

// ─── 机器人（补充代码字段）────────────────────────────────────────────────────
const ROBOT_LAYERS = [
  {
    level: '🟢 入门',
    title: '硬件认知',
    subtitle: '认识主要组件，能读懂规格表，能连接传感器与执行器',
    color: '#27ae60',
    items: [
      {
        name: '执行器',
        icon: '⚙️',
        desc: '机器人的"肌肉"，将电信号转化为机械运动',
        details: [
          { label: '舵机（Servo）', text: '位置控制，MG996R 扭矩 9.4kg·cm，PWM 50Hz 控制，适合末端执行器' },
          { label: '无刷电机（BLDC）', text: 'KV 值=转速/电压（KV100→12V→1200rpm），配合 FOC 驱动器实现力矩控制' },
          { label: '步进电机', text: '200步/圈（1.8°/步），开环位置控制，低速扭矩大，适合打印机/轻型机械臂' },
          { label: '液压/气动执行器', text: '高功率密度，适合重型机器人（Boston Dynamics Atlas 液压）；气动适合夹爪' },
        ],
      },
      {
        name: '传感器',
        icon: '📡',
        desc: '机器人的"感官"，感知自身状态与外部环境',
        details: [
          { label: 'IMU（惯性测量单元）', text: '6轴（加速度+陀螺仪）或9轴（+磁力计），MPU-6050 入门，Bosch BMI088 工业级，频率 200~1000Hz' },
          { label: '编码器（Encoder）', text: '增量式（光电/磁性）检测角位移；绝对式（多圈）上电即知位置；分辨率 1024~65536 PPR' },
          { label: '力矩传感器（F/T Sensor）', text: '六维力/力矩传感，ATI Nano17 最小化型，配合阻抗控制实现柔顺交互' },
          { label: '深度相机', text: 'Intel RealSense D435i（结构光，0.2~10m），ZED 2i（双目，0.3~20m），TOF：微软 Azure Kinect DK' },
        ],
      },
      {
        name: '计算平台',
        icon: '💻',
        desc: '机器人的"大脑"，运行感知与控制算法',
        details: [
          { label: 'NVIDIA Jetson Orin NX', text: '16GB，100 TOPS，功耗 10~25W；搭载 Ampere GPU，运行 SLAM+推理首选' },
          { label: 'NVIDIA Jetson AGX Orin', text: '64GB，275 TOPS，工业级；Tesla Optimus、Figure 02 同级别平台' },
          { label: 'FPGA（实时控制）', text: 'Xilinx Zynq UltraScale+，确定性延迟 <1μs；运行 EtherCAT 主站/伺服驱动' },
          { label: '微控制器（MCU）', text: 'STM32H7/F4 运行底层控制环（1kHz+），通过 micro-ROS 接入 ROS 2 生态' },
        ],
      },
      {
        name: '通信总线',
        icon: '🔗',
        desc: '连接各组件的"神经"，决定响应速度和可靠性',
        details: [
          { label: 'CAN bus', text: '工业机器人标配，差分信号抗干扰，500kbps~1Mbps，支持30+节点；CAN FD 可达 8Mbps' },
          { label: 'EtherCAT', text: '实时以太网，循环时间 <100μs，适合多轴同步控制（Beckhoff 力推）' },
          { label: 'RS-485', text: '半双工差分，最远 1200m，适合传感器/执行器简单通信；Modbus RTU 协议' },
        ],
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: '软件栈',
    subtitle: '会用 ROS 2，能跑通仿真，理解运动规划与 SLAM 框架',
    color: '#e17055',
    items: [
      {
        name: 'ROS 2 核心概念',
        icon: '🤖',
        desc: 'Robot Operating System 2，机器人软件的事实标准',
        details: [
          { label: '核心概念', text: 'Node（进程单元）/ Topic（pub-sub）/ Service（request-reply）/ Action（长任务+反馈）/ Parameter Server' },
          { label: '推荐发行版', text: 'Humble Hawksbill（LTS，Ubuntu 22.04，2027年EOL）；Jazzy Jalisco（LTS，2029年EOL）' },
          { label: 'DDS 中间件', text: 'Fast-DDS（默认）/ CycloneDDS（低延迟首选）；QoS 策略配置可靠性与延迟' },
          { label: 'micro-ROS', text: '在 MCU（STM32/ESP32）上运行 ROS 2 通信，通过 micro-ROS Agent 桥接到上层' },
        ],
        code: `# ROS 2 Topic 发布/订阅最简示例
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32
from sensor_msgs.msg import JointState

class JointPublisher(Node):
    def __init__(self):
        super().__init__('joint_pub')
        self.pub = self.create_publisher(JointState, '/joint_states', 10)
        self.t = 0.0
        self.create_timer(0.02, self.publish)   # 50Hz

    def publish(self):
        msg = JointState()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.name     = ['joint1', 'joint2', 'joint3']
        msg.position = [self.t, self.t*0.5, -self.t*0.3]
        msg.velocity = [1.0, 0.5, -0.3]
        msg.effort   = [0.0, 0.0, 0.0]
        self.pub.publish(msg)
        self.t += 0.02

# 命令行等效操作：
# ros2 topic pub /joint_states sensor_msgs/JointState \\
#   "{name: ['j1'], position: [0.5]}" --rate 50
# ros2 topic echo /joint_states
# ros2 topic hz /joint_states`,
        lang: 'python',
      },
      {
        name: 'SLAM 算法',
        icon: '🗺️',
        desc: '同步定位与建图（Simultaneous Localization and Mapping）',
        details: [
          { label: 'Cartographer（2D LiDAR）', text: 'Google 开源，子地图+回环检测；适合室内轮式机器人，ROS 2 官方支持' },
          { label: 'ORB-SLAM3（视觉）', text: '单目/双目/RGB-D + IMU 融合；特征点法，建图精度高，实时性好' },
          { label: 'FAST-LIO2', text: '增量式 ikd-Tree 地图，计算量小；Orin NX 上可实时运行（>20Hz）' },
          { label: 'LIO-SAM（3D LiDAR）', text: '激光惯导紧耦合，因子图优化；精度高，支持 GPS 融合与回环' },
        ],
      },
      {
        name: 'MoveIt 2 运动规划',
        icon: '🧭',
        desc: '机械臂运动规划，正逆运动学，碰撞检测',
        details: [
          { label: 'MoveGroupInterface', text: 'Python/C++ API；set_joint_value_target / set_pose_target；plan() + execute() 两步执行。' },
          { label: 'OMPL 规划器', text: '内置 RRT*/PRM*/KPIECE；碰撞检测：FCL；障碍物通过 PlanningScene 动态添加。' },
          { label: 'Cartesian Path', text: 'compute_cartesian_path()：末端沿直线/曲线运动；需设置最大步长（0.01m）和跳转阈值。' },
        ],
        code: `# MoveIt 2 Python API — 机械臂规划执行
import rclpy
from moveit.planning import MoveItPy
from geometry_msgs.msg import Pose
import numpy as np

rclpy.init()
moveit = MoveItPy(node_name='moveit_demo')
arm = moveit.get_planning_component('arm')   # 规划组名

# ── 关节空间目标 ──────────────────────────────────
arm.set_start_state_to_current_state()
goal_joints = {'joint1': 0.5, 'joint2': -0.3,
               'joint3': 1.0, 'joint4': 0.0}
arm.set_goal_state(configuration_settings=goal_joints)
plan = arm.plan()
if plan:
    moveit.execute(plan.trajectory, blocking=True)

# ── 笛卡尔空间目标（末端位姿）────────────────────
arm.set_start_state_to_current_state()
target_pose = Pose()
target_pose.position.x = 0.4
target_pose.position.y = 0.1
target_pose.position.z = 0.3
target_pose.orientation.w = 1.0   # 无旋转
arm.set_goal_state(pose_stamped_msg=target_pose,
                   pose_link='end_effector_link')
plan = arm.plan()
if plan:
    moveit.execute(plan.trajectory, blocking=True)

# ── 笛卡尔路径规划（直线移动）────────────────────
# arm.compute_cartesian_path(waypoints, eef_step=0.01)`,
        lang: 'python',
      },
      {
        name: '控制理论',
        icon: '🎛️',
        desc: '让机器人稳定、精确地执行动作指令',
        details: [
          { label: 'PID 控制', text: '比例-积分-微分；最基础的反馈控制器；关节位置/速度/力矩环均使用；抗积分饱和是关键' },
          { label: 'MPC（模型预测控制）', text: '滚动优化未来N步轨迹，同时处理约束；适合高动态系统（双足、无人机）；计算量较大' },
          { label: '阻抗/导纳控制', text: '让机器人末端表现出弹簧-阻尼特性；实现人机安全交互；需要力矩传感器反馈' },
          { label: 'LQR / 全状态反馈', text: '线性二次调节器；单摆/倒立摆/Segway 类平衡控制；结合卡尔曼滤波估计状态' },
        ],
      },
      {
        name: '仿真环境',
        icon: '🌐',
        desc: '在虚拟环境中验证算法，降低硬件调试风险',
        details: [
          { label: 'Gazebo Harmonic', text: 'ROS 2 官方搭档；物理引擎 Bullet/ODE/DART；传感器仿真（LiDAR/相机/IMU）' },
          { label: 'MuJoCo', text: 'DeepMind 开源；接触动力学精确；强化学习训练首选；Python bindings 友好' },
          { label: 'NVIDIA Isaac Sim', text: '基于 USD + PhysX 5；光线追踪传感器仿真；合成数据生成；Sim-to-Real 迁移工具链' },
          { label: 'Genesis', text: '2024年新兴；物理仿真速度 430,000× 实时；GPU 并行；Sim-to-Real 效果媲美 Isaac Sim' },
        ],
      },
    ],
  },
  {
    level: '🔴 精通',
    title: '系统集成 & 前沿',
    subtitle: '端到端调试、Sim-to-Real 迁移、VLA 模型、主流硬件平台',
    color: '#6c5ce7',
    items: [
      {
        name: 'VLA 模型',
        icon: '🧠',
        desc: 'Vision-Language-Action，端到端学习机器人操作策略',
        details: [
          { label: 'RT-2（Google DeepMind）', text: 'PaLI-X 为骨干，将语言/图像→动作 token；Zero-shot 泛化；Web 数据 + 机器人数据联合训练' },
          { label: 'π0（Physical Intelligence）', text: '流匹配（Flow Matching）策略头；7B VLM + 动作专家；支持灵巧操作（折叠衣物/组装）' },
          { label: 'OpenVLA', text: 'Llama 2 7B 微调，HuggingFace 开源；BridgeData V2 训练；可在 Jetson AGX Orin 推理' },
          { label: 'LeRobot（HuggingFace）', text: '统一操作数据集 + 策略库；ACT/Diffusion Policy/TDMPC2；社区活跃，低成本硬件适配' },
        ],
        code: `# LeRobot — Diffusion Policy 推理示例
import torch
from lerobot.common.policies.diffusion.modeling_diffusion import DiffusionPolicy

# 加载预训练策略（HuggingFace Hub）
policy = DiffusionPolicy.from_pretrained(
    "lerobot/diffusion_pusht")   # pusht 桌面推块任务
policy.eval()

# 观测数据结构（批处理）
# observation.image:       [B, C, H, W]  float32  0~1
# observation.state:       [B, state_dim] float32  关节角度
obs = {
    "observation.image": torch.zeros(1, 3, 96, 96),
    "observation.state": torch.zeros(1, 2),   # pusht: (x,y)
}

# 推理：输出 action_horizon 步动作序列
with torch.no_grad():
    actions = policy.select_action(obs)
# actions: [action_horizon, action_dim]
# Diffusion Policy 默认 horizon=16，chunk_size=8

# ACT（Action Chunking Transformer）对比
# from lerobot.common.policies.act.modeling_act import ACTPolicy
# ACT: Transformer encoder-decoder，自回归生成动作序列
# 适合精细操作任务（折叠/插拔/抓取）`,
        lang: 'python',
      },
      {
        name: 'Sim-to-Real',
        icon: '🔁',
        desc: '将仿真训练的策略迁移到真实机器人，是商业化核心挑战',
        details: [
          { label: 'Domain Randomization', text: '随机化物理参数（摩擦/质量/外观/光照）；Unitree G1 通过此方法训练步态迁移' },
          { label: 'Isaac Lab（NVIDIA）', text: 'Isaac Sim + RL 训练框架；并行 4096 环境同时训练；RSL-rl/skrl 算法支持；GPU 物理加速' },
          { label: 'RMA（Rapid Motor Adaptation）', text: '训练 adaptation encoder 实时估计地形参数；ANYmal/Unitree 广泛使用' },
          { label: '系统辨识', text: '测量真实机器人参数（关节摩擦/惯量）反填仿真；URDF/MJCF 精确建模是基础' },
        ],
      },
      {
        name: '主流硬件平台',
        icon: '🦾',
        desc: '了解市面主流人形/四足/机械臂平台，跟踪行业方向',
        details: [
          { label: 'Unitree G1 / H1', text: '国产人形；G1 含灵巧手，23 DoF，售价 16 万；H1 双腿，4.5m/s 奔跑；开放 ROS 2 + Isaac Lab 接口' },
          { label: 'Boston Dynamics Spot', text: '四足，12.5kg，爬楼/越障；Spot SDK Python API；工业巡检标杆' },
          { label: 'Tesla Optimus Gen 2', text: '22 DoF，Dexterous Hand 11 DoF；FSD 视觉架构复用；工厂产线部署目标' },
          { label: 'Figure 02', text: 'OpenAI GPT-4o 视觉推理 + 本体策略网络；BMW 工厂试点；操作速度是 Gen 1 的 2×' },
        ],
      },
    ],
  },
];

// ─── 自动驾驶 ──────────────────────────────────────────────────────────────────
const AD_LAYERS = [
  {
    level: '🟢 入门',
    title: '传感器体系',
    subtitle: '理解各类传感器原理、规格与适用场景',
    color: '#27ae60',
    items: [
      {
        name: 'LiDAR',
        icon: '🔭',
        desc: '激光雷达，点云数据，三维环境感知的核心传感器',
        details: [
          { label: 'Velodyne VLP-16', text: '16线，360°水平/30°垂直视角，100m 量程，10Hz；入门级，ROS driver 成熟' },
          { label: '禾赛 AT128 / Pandar128E3X', text: '128线 MEMS 固态，200m 量程，10Hz，$500 级；L4 量产主流选择' },
          { label: 'Livox Mid-360', text: '非重复扫描，近距离密度高，盲区小；配合 FAST-LIO2 效果佳；$599' },
          { label: '点云格式', text: 'PCL PCD 格式；ROS PointCloud2 消息；KITTI/nuScenes 数据集格式标准' },
        ],
      },
      {
        name: '摄像头',
        icon: '📷',
        desc: '视觉感知，纹理与语义信息，成本最低的传感器',
        details: [
          { label: 'RCCB Bayer 格式', text: '去掉绿通道换红（Red Clear Clear Blue），提升低光感度 30%；特斯拉/Mobileye 摄像头标配' },
          { label: 'ISP 处理流水线', text: '去马赛克→白平衡→降噪→色彩校正→HDR 合成；车规 ISP 芯片：TI DS90UB954' },
          { label: '环视（Surround View）', text: '4~8 路鱼眼相机（FOV 190°+）拼接 BEV 鸟瞰图；泊车/低速感知核心' },
          { label: '相机标定', text: '内参（焦距/畸变）用棋盘格 + OpenCV；外参（雷达-相机）用 kalibr；重投影误差 < 0.5px' },
        ],
      },
      {
        name: '毫米波雷达',
        icon: '📻',
        desc: '全天候测距/测速，雨雾穿透性强',
        details: [
          { label: 'Continental ARS540', text: '4D 成像雷达（距离/速度/方位/俯仰），400m 量程；特斯拉 FSD 取消后备选' },
          { label: '频段', text: '77GHz FMCW；距离精度 ±0.1m；速度测量 ±0.1m/s（多普勒）' },
          { label: '点云稀疏问题', text: '毫米波点云稀疏（<200点/帧 vs LiDAR 100k点）；与 LiDAR/Camera 融合互补' },
        ],
      },
      {
        name: '定位系统',
        icon: '🛰️',
        desc: '厘米级定位是 L4 级自动驾驶的基础条件',
        details: [
          { label: 'RTK-GPS', text: '差分 GPS，精度 2cm（水平）；NovAtel PwrPak7；需基准站或 CORS 网络；隧道/地下失效' },
          { label: 'IMU 组合导航', text: 'GPS + IMU 惯性融合（EKF）；IMU 弥补 GPS 更新率低（10Hz→200Hz）' },
          { label: 'HD Map 定位', text: '高精地图（厘米级道路特征）+ NDT 点云匹配；Here / 百度地图 Apollo / 高德 HAOMO' },
        ],
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: '软件栈',
    subtitle: '掌握感知/预测/规划全链路，熟悉开源自动驾驶框架',
    color: '#e17055',
    items: [
      {
        name: '开源框架',
        icon: '🏗️',
        desc: '工业级自动驾驶软件中间件与全栈框架',
        details: [
          { label: 'Autoware Universe', text: 'Tier IV 主导，ROS 2 原生；感知/定位/规划/控制全栈；全球最活跃 AD 开源项目' },
          { label: 'Apollo（百度）', text: 'Cyber RT 实时中间件（替代 ROS）；HD Map + Dreamview UI；Apollo-D3 200w 帧数据集' },
          { label: 'CARLA 仿真器', text: 'UE4 渲染，传感器仿真逼真；OpenDRIVE 地图格式；与 Autoware/Apollo 均有官方接口' },
        ],
      },
      {
        name: '感知算法',
        icon: '👁️',
        desc: '3D目标检测与环境理解是自动驾驶感知的核心',
        details: [
          { label: 'BEVFusion（MIT/清华）', text: 'LiDAR + Camera 统一 BEV 特征融合；CenterPoint 检测头；nuScenes SOTA' },
          { label: 'BEVFormer', text: '纯视觉 BEV，Deformable Attention 时空融合；无 LiDAR 依赖；特斯拉 FSD v12 类似架构' },
          { label: 'PointPillars', text: '将点云投影为柱状体，2D CNN 处理；实时性好（6ms/帧）；嵌入式平台首选' },
          { label: 'Occupancy（占据栅格）', text: '将环境编码为 3D 体素占用概率；处理不规则障碍物（路障/行人肢体）' },
        ],
        code: `import numpy as np

# PointPillars 输入数据格式（PyTorch Tensor）
# 原始点云: [N, 4] (x, y, z, intensity)
# Pillar 化后: [max_pillars, max_pts_per_pillar, 9]
# 特征维度 9 = (x,y,z,intensity, x_c,y_c,z_c, x_p,y_p)
#   _c: 相对 Pillar 中心偏移   _p: 相对 Pillar 网格偏移

POINT_CLOUD_RANGE = [0, -39.68, -3, 69.12, 39.68, 1]  # x_min,y_min,z_min,...
VOXEL_SIZE = [0.16, 0.16, 4]  # 米
MAX_VOXELS = 12000
MAX_POINTS_PER_VOXEL = 32

# BEV 特征图尺寸
bev_h = int((POINT_CLOUD_RANGE[4]-POINT_CLOUD_RANGE[1]) / VOXEL_SIZE[1])  # 496
bev_w = int((POINT_CLOUD_RANGE[3]-POINT_CLOUD_RANGE[0]) / VOXEL_SIZE[0])  # 432

# 模拟 PointPillars 输出（检测框格式）
# [x_c, y_c, z_c, w, l, h, sin_θ, cos_θ, vx, vy]  (10维)
detections = np.array([
    [15.2, 3.1, -0.9, 4.5, 1.9, 1.5, 0.0, 1.0, 2.1, 0.0],   # 前方车辆
    [8.7, -5.2, -1.1, 0.8, 0.5, 1.8, 0.87, 0.5, 0.3, -0.1],  # 行人
])
labels = ['Car', 'Pedestrian']
scores = [0.92, 0.78]

# NMS（3D 非极大值抑制）阈值
IOU_THRESHOLD = 0.1   # 3D NMS 比 2D 更严格
print("检测到目标:")
for i, (det, label, score) in enumerate(zip(detections, labels, scores)):
    x, y, z, w, l, h = det[:6]
    print(f"  [{label}] pos=({x:.1f},{y:.1f},{z:.1f})m "
          f"size=({w:.1f}×{l:.1f}×{h:.1f})m score={score:.2f}")`,
        lang: 'python',
      },
      {
        name: '规划与控制',
        icon: '🗺️',
        desc: '从感知结果生成安全可行的行驶轨迹并执行',
        details: [
          { label: 'Lattice Planner', text: '在 Frenet 坐标系采样候选轨迹；按代价函数（碰撞/舒适/效率）排序；Autoware 默认规划器' },
          { label: 'PDM-Closed（IDM+）', text: '智能驾驶员模型扩展；反应式规划；低延迟，适合高速工况' },
          { label: '横纵向控制', text: '纵向：Cruise PID + 自适应巡航（ACC）；横向：Pure Pursuit / Stanley / LQR / MPC' },
          { label: 'DriveVLM（清华×理想）', text: 'VLM 做场景理解+链式推理；本地规划网络做精细轨迹；减少长尾 corner case' },
        ],
      },
      {
        name: '预测算法',
        icon: '🔮',
        desc: '预测其他交通参与者未来轨迹，是规划决策的前提',
        details: [
          { label: 'MTR（Waymo，SOTA）', text: 'Motion Transformer；全场景预测，Waymo Open Motion SOTA；自回归生成多模态轨迹' },
          { label: 'TNT / MultiPath++', text: '目标-预测-评分三阶段；意图先验 + 高斯混合输出' },
          { label: '数据集', text: 'Waymo Open Dataset（1950段）/ nuScenes（1000段）/ Argoverse 2（25万段）' },
        ],
      },
    ],
  },
  {
    level: '🔴 精通',
    title: '系统集成 & 标准',
    subtitle: '功能安全认证、量产计算平台选型、SAE 等级深度解读',
    color: '#6c5ce7',
    items: [
      {
        name: '功能安全',
        icon: '🛡️',
        desc: '量产自动驾驶系统的硬性门槛，不了解就无法做工程落地',
        details: [
          { label: 'ISO 26262 ASIL', text: 'Automotive Safety Integrity Level；A/B/C/D 四级；刹车/转向系统需 ASIL-D（最高）' },
          { label: 'SOTIF（ISO 21448）', text: 'Safety Of The Intended Functionality；关注感知局限导致的危险（雨天/逆光）' },
          { label: 'FMEA / FTA', text: '失效模式与效应分析；故障树分析；安全目标分解到硬件/软件 FTTI' },
        ],
      },
      {
        name: '量产计算平台',
        icon: '💎',
        desc: '了解当前量产/准量产的 SoC 选型与算力对比',
        details: [
          { label: 'NVIDIA DRIVE Orin X', text: '254 TOPS，7nm，功耗 45W；理想 L9/小鹏 G9 搭载；CUDA 生态直接复用研发代码' },
          { label: 'Mobileye EyeQ Ultra', text: '176 TOPS，专用 CNN 加速；极氪 001/吉利银河搭载；闭源工具链，集成度高' },
          { label: '华为 MDC 810', text: '400 TOPS，国产自研；昇腾 AI 核；问界 M9/阿维塔 12 标配；MindSDK 开发套件' },
          { label: '地平线征程 6M', text: '128 TOPS，BPU 架构；有开放 SDK；亿咖通/极氪供应链' },
        ],
      },
      {
        name: 'SAE 自动化等级',
        icon: '📊',
        desc: 'L0~L5 六级定义，正确理解边界避免混淆',
        details: [
          { label: 'L1/L2 驾驶辅助', text: 'L2：ACC+LKA 组合；驾驶员全程监控；特斯拉 AP / 小鹏 NGP 属 L2+' },
          { label: 'L3 有条件自动化', text: '特定工况系统主导；驾驶员可分心但需备援；奔驰 Drive Pilot 首获量产 L3 认证' },
          { label: 'L4 高度自动化', text: '特定 ODD 内无需人工干预；Waymo One 商业运营；百度萝卜快跑武汉大规模无人化' },
        ],
      },
    ],
  },
];

// ─── 无人机 ───────────────────────────────────────────────────────────────────
const DRONE_LAYERS = [
  {
    level: '🟢 入门',
    title: '硬件认知',
    subtitle: '认识飞控/电机/电调，理解飞行原理与基本参数',
    color: '#27ae60',
    items: [
      {
        name: '飞行控制器',
        icon: '🕹️',
        desc: '无人机的"大脑"，融合传感器数据，输出电机控制指令',
        details: [
          { label: 'Pixhawk 6X', text: '最主流开源飞控；STM32H7 主控 + F1 协处理器；运行 PX4 固件；三余度 IMU；$300' },
          { label: 'Cube Orange+', text: 'HEX Technology 出品；ArduPilot 生态首选；工业/商业应用广泛' },
          { label: 'DJI N3 / A3', text: '商业闭源飞控；稳定性强；DJI SDK 二次开发；适合商业项目' },
        ],
      },
      {
        name: '电机与电调',
        icon: '⚡',
        desc: '电机提供推力，电调（ESC）负责驱动与调速',
        details: [
          { label: 'KV 值', text: 'KV = 转速/电压（RPM/V）；KV1000+4S（16.8V）= 16800 RPM 空载；大桨低KV，小桨高KV' },
          { label: 'BLHeli_32 ESC', text: '32位ARM处理器；DShot300/600 数字协议；支持ESC 遥测（温度/RPM/电流）' },
          { label: 'DShot 协议', text: 'DShot300/600 数字信号抗干扰；支持双向 DShot 反转油门；无需校准' },
          { label: '电池规格', text: 'LiPo（锂聚合物）；3S=11.1V/4S=14.8V/6S=22.2V；C 值=最大持续放电倍率' },
        ],
      },
      {
        name: '链路与通信',
        icon: '📡',
        desc: '遥控/图传/数传是地面站与无人机通信的三条关键链路',
        details: [
          { label: '遥控协议', text: 'SBUS（串行，16通道）/ CRSF（ExpressLRS/TBS，低延迟4ms）/ PPM（8通道，老协议）' },
          { label: '图传', text: 'DJI O3 Air Unit：1080p@60fps，延迟 <40ms，4km 距离' },
          { label: '数传', text: 'SiK Radio（915MHz/433MHz，MAVLink 2.0）；4G/5G 数传（无限距离但依赖网络）' },
        ],
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: '软件栈',
    subtitle: '掌握 PX4/ArduPilot，能配置自主飞行与 SLAM 建图',
    color: '#e17055',
    items: [
      {
        name: 'PX4 Autopilot',
        icon: '🚁',
        desc: 'Linux 基金会支持的主流开源飞控固件，商业应用首选',
        details: [
          { label: '架构', text: 'NuttX RTOS 内核；uORB 消息总线（类ROS Topic）；模块化设计（估计器/控制器/驱动器独立）' },
          { label: 'ROS 2 接口', text: 'uXRCE-DDS 桥接 uORB↔ROS 2 Topic/Service；Offboard 模式下远程控制' },
          { label: '飞行模式', text: 'Position（GPS 定点）/ Altitude（高度保持）/ Mission（航点执行）/ Offboard（外部计算机接管）' },
          { label: 'EKF2 状态估计', text: '扩展卡尔曼滤波；融合 IMU/GPS/Baro/Mag/光流/视觉里程计' },
        ],
        code: `# MAVSDK-Python — 完整自主飞行示例
import asyncio
from mavsdk import System
from mavsdk.offboard import PositionNedYaw, OffboardError

async def run():
    drone = System()
    await drone.connect(system_address="udp://:14540")

    print("等待连接...")
    async for state in drone.core.connection_state():
        if state.is_connected:
            print("已连接到无人机")
            break

    # 解锁 + 起飞
    await drone.action.arm()
    await drone.action.takeoff()
    await asyncio.sleep(5)

    # 切换到 Offboard 模式，发布初始设点
    await drone.offboard.set_position_ned(
        PositionNedYaw(0.0, 0.0, -3.0, 0.0))  # NED 系：Z向下，-3m=高3m
    try:
        await drone.offboard.start()
    except OffboardError as e:
        print(f"Offboard 启动失败: {e}")
        await drone.action.land()
        return

    # 飞正方形航线（NED 坐标系：北/东/下）
    waypoints = [
        ( 5.0,  0.0, -3.0, 0.0),   # 向北 5m
        ( 5.0,  5.0, -3.0, 90.0),  # 向东 5m，偏航90°
        ( 0.0,  5.0, -3.0, 180.0), # 向南 5m
        ( 0.0,  0.0, -3.0, 270.0), # 向西 5m，回原点
    ]
    for n, e, d, yaw in waypoints:
        print(f"飞向 N={n} E={e} D={d} Yaw={yaw}°")
        await drone.offboard.set_position_ned(
            PositionNedYaw(n, e, d, yaw))
        await asyncio.sleep(4)

    # 停止 Offboard，降落
    await drone.offboard.stop()
    await drone.action.land()

asyncio.run(run())`,
        lang: 'python',
      },
      {
        name: 'ArduPilot',
        icon: '🔧',
        desc: '历史最悠久的开源飞控固件，生态最丰富',
        details: [
          { label: '多平台支持', text: 'ArduCopter（多旋翼）/ ArduPlane（固定翼）/ ArduRover（地面车辆）/ ArduSub（水下）' },
          { label: 'MAVLink 生态', text: 'Mission Planner（Windows 全功能）/ QGroundControl（跨平台）/ MAVProxy（命令行）' },
          { label: 'MAVROS', text: 'MAVLink → ROS 1/2 桥接；setpoint_position/setpoint_velocity Topic；Offboard 控制' },
        ],
      },
      {
        name: '无人机 SLAM',
        icon: '🗺️',
        desc: '无 GPS 环境下的自主定位与建图',
        details: [
          { label: 'FAST-LIO2', text: '激光惯导紧耦合；增量式 ikd-Tree 地图；Orin NX 上 20Hz 以上；港大 MARS Lab 开源' },
          { label: 'VINS-Fusion', text: '视觉惯导紧耦合（VIO）；单目/双目/RGB-D；港大沈劭劼组；轻量适合 Jetson Nano' },
          { label: 'RTAB-Map', text: '适合 RGB-D 建图；回环检测成熟；ROS 原生支持；可输出全局一致性 3D 地图' },
        ],
      },
      {
        name: '任务规划',
        icon: '📋',
        desc: '自主执行任务的核心：航线规划、地面站与行为决策',
        details: [
          { label: 'QGroundControl 任务', text: '航点（Waypoint）/ 感兴趣点（ROI）/ 样条曲线；地面站实时遥测' },
          { label: 'MAVSDK', text: 'Python/C++ SDK；PX4/ArduPilot 通用；Action/Telemetry/Mission 三大模块' },
          { label: 'DroneKit（Python）', text: 'ArduPilot Offboard 开发；简化版 MAVLink；适合快速原型；Raspberry Pi 常用' },
        ],
      },
    ],
  },
  {
    level: '🔴 精通',
    title: '集群 & 商业应用 & 法规',
    subtitle: '无人机蜂群、行业应用深度、中国民用无人机管理法规',
    color: '#6c5ce7',
    items: [
      {
        name: '蜂群系统',
        icon: '🐝',
        desc: '多无人机协同是未来军事/商业应用的关键方向',
        details: [
          { label: 'Crazyswarm2', text: 'BitCraze Crazyflie 平台；ROS 2 原生；时间同步 + 防碰撞；学术演示 500 机集群' },
          { label: 'ArduPilot Swarm', text: 'Follow Me / 编队飞行；基于相对位置维持队形；MAVLink 多机广播' },
          { label: 'UWB 相对定位', text: '室内/GPS 拒止环境；Decawave DW1000；10cm 精度；多机相对位置感知' },
        ],
      },
      {
        name: '商业应用',
        icon: '🏭',
        desc: '了解主要行业落地场景与代表产品',
        details: [
          { label: 'DJI Agras T50（农业植保）', text: '50kg 载药，16 旋翼；雷达避障；RTK 厘米级作业；单机 1 小时 40 亩喷洒' },
          { label: '物流配送', text: '美团（M400 六旋翼）/ 顺丰（AS-DC）；城市楼顶/配送站点；CAAC 专项试点' },
          { label: '电力巡线', text: '大疆经纬 M300 RTK + 禅思 H20T（可见光+热成像+激光测距）；AI 缺陷识别' },
        ],
      },
      {
        name: '中国民用法规',
        icon: '📜',
        desc: '在中国飞无人机必须了解的法律法规（2024版）',
        details: [
          { label: '无人机分类', text: '按重量：微型（<0.25kg）/ 轻型（0.25~7kg）/ 小型（7~25kg）/ 中型（25~150kg）/ 大型（>150kg）' },
          { label: 'UOM 执照', text: '无人机操控员执照；轻型固定翼/旋翼/垂起分类；理论+实操考试' },
          { label: '《无人驾驶航空器飞行管理暂行条例》', text: '2024年1月1日起施行；商业运营需申请运营合格证（UOC）' },
        ],
      },
    ],
  },
];

// ─── Tab 定义 ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basics', name: '🔩 通用基础', desc: '接口·协议·嵌入式·算法' },
  { id: 'robot',  name: '🤖 机器人',   desc: '执行器·ROS 2·VLA' },
  { id: 'ad',     name: '🚗 自动驾驶', desc: 'LiDAR·感知·规划·ISO 26262' },
  { id: 'drone',  name: '🛸 无人机',   desc: 'PX4·ArduPilot·法规·集群' },
];

// ─── LayerCard 组件（支持代码块）─────────────────────────────────────────────
function LayerCard({ layer }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rounded-2xl border p-5 mb-5"
      style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg font-bold">{layer.level}</span>
        <span className="text-base font-semibold text-gray-800">{layer.title}</span>
      </div>
      <p className="text-[12px] text-gray-500 mb-4">{layer.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {layer.items.map((item, idx) => (
          <div key={item.name}
            className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow"
            style={{ borderColor: expanded === idx ? layer.color + '55' : '#f0f0f0' }}
            onClick={() => setExpanded(expanded === idx ? null : idx)}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{item.name}</span>
              <span className="ml-auto text-[10px] text-gray-400 select-none">
                {expanded === idx ? '▲' : '▼'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{item.desc}</p>

            {expanded === idx && (
              <div className="border-t border-gray-100 pt-3">
                {/* 详情条目 */}
                <div className="space-y-2 mb-0">
                  {item.details.map((d, di) => (
                    <div key={di} className="text-[12px]">
                      <span className="font-medium" style={{ color: layer.color }}>{d.label}：</span>
                      <span className="text-gray-600">{d.text}</span>
                    </div>
                  ))}
                </div>
                {/* 代码块（如存在） */}
                {item.code && (
                  <CodeBlock code={item.code} lang={item.lang || 'code'} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function HardwarePage() {
  const [tab, setTab] = useHashState('tab', 'basics');

  const layersMap = {
    basics: BASICS_LAYERS,
    robot:  ROBOT_LAYERS,
    ad:     AD_LAYERS,
    drone:  DRONE_LAYERS,
  };
  const layers = layersMap[tab] || BASICS_LAYERS;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── Hero ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ 硬件</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              通用基础 · 机器人 · 自动驾驶 · 无人机
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            面向软件工程师的硬件知识体系。从通用接口协议（I2C/CAN/UART）、嵌入式算法（PID/卡尔曼/坐标变换），到 ROS 2 / PX4 / Autoware 完整软件栈，再到 VLA 模型与功能安全标准。每个知识点附带可运行代码，真实客观。
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>4 个模块</span>
            <span>·</span>
            <span>12 个知识层</span>
            <span>·</span>
            <span>点击卡片展开代码与详解</span>
          </div>
        </div>

        {/* ─── Tab 切换 ─── */}
        <div className="flex flex-wrap gap-1.5 mb-7 border-b border-gray-100 pb-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tab === t.id
                  ? 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'}`}>
              <span>{t.name}</span>
              <span className="text-[10px] text-gray-400 hidden sm:inline">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ─── 层级卡片 ─── */}
        <div>
          {layers.map(layer => (
            <LayerCard key={layer.level + layer.title} layer={layer} />
          ))}
        </div>

        {/* ─── 底部说明 ─── */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400">
          <span className="font-medium text-gray-500">📌 内容说明：</span>
          所有代码均基于真实库和 API 编写，可在对应环境直接运行（Python 示例需安装对应依赖）。建议学习路径：先完成「通用基础」层，再按需深入各领域。代码中的注释为知识点的核心提炼，可独立阅读。
        </div>

      </div>
      <Footer />
    </>
  );
}
