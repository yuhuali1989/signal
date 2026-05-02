'use client';
import React, { useState } from 'react';
import useHashState from '@/hooks/useHashState';
import Footer from '@/components/Footer';

// ─── 机器人 ───────────────────────────────────────────────────────────────────
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
          { label: '触觉传感器', text: '电阻/电容压力阵列，XELA uSkin 柔性触觉皮肤；用于抓握力反馈' },
        ],
      },
      {
        name: '计算平台',
        icon: '💻',
        desc: '机器人的"大脑"，运行感知与控制算法',
        details: [
          { label: 'NVIDIA Jetson Orin NX', text: '16GB，100 TOPS，功耗 10~25W；搭载 Ampere GPU，运行 SLAM+推理首选' },
          { label: 'NVIDIA Jetson AGX Orin', text: '64GB，275 TOPS，工业级；Tesla Optimus、Figure 02 同级别平台' },
          { label: 'x86 工控机', text: 'i7/i9 + 独立显卡（RTX 3060Ti）；算力强但功耗大，适合轮式移动机器人' },
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
          { label: 'USB-C / PCIe', text: '相机/深度传感器接口；PCIe x4 用于高带宽 GPU 计算板' },
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
        name: 'ROS 2',
        icon: '🤖',
        desc: 'Robot Operating System 2，机器人软件的事实标准',
        details: [
          { label: '核心概念', text: 'Node（进程单元）/ Topic（pub-sub）/ Service（request-reply）/ Action（长任务+反馈）/ Parameter Server' },
          { label: '推荐发行版', text: 'Humble Hawksbill（LTS，Ubuntu 22.04，2027年EOL）；Jazzy Jalisco（LTS，2029年EOL）' },
          { label: 'DDS 中间件', text: 'Fast-DDS（默认）/ CycloneDDS（低延迟首选）；QoS 策略配置可靠性与延迟' },
          { label: 'micro-ROS', text: '在 MCU（STM32/ESP32）上运行 ROS 2 通信，通过 micro-ROS Agent 桥接到上层' },
          { label: 'colcon 构建', text: '工作空间（workspace）+ 功能包（package）+ CMake/Python 混合构建；ament_cmake 依赖管理' },
        ],
      },
      {
        name: 'SLAM',
        icon: '🗺️',
        desc: '同步定位与建图（Simultaneous Localization and Mapping）',
        details: [
          { label: 'Cartographer（2D LiDAR）', text: 'Google 开源，子地图+回环检测；适合室内轮式机器人，ROS 2 官方支持' },
          { label: 'ORB-SLAM3（视觉）', text: '单目/双目/RGB-D + IMU 融合；特征点法，建图精度高，实时性好' },
          { label: 'LOAM / LIO-SAM（3D LiDAR）', text: 'LIO-SAM：激光惯导紧耦合，因子图优化；精度高，支持 GPS 融合与回环' },
          { label: 'FAST-LIO2', text: '增量式 ikd-Tree 地图，计算量小；Orin NX 上可实时运行（>20Hz）' },
          { label: 'OpenVSLAM / Stella-VSLAM', text: '视觉 SLAM 工具箱，支持鱼眼/全景相机，适合服务机器人室内定位' },
        ],
      },
      {
        name: '运动规划',
        icon: '🧭',
        desc: '让机器人在三维空间中安全、高效地移动',
        details: [
          { label: 'MoveIt 2（机械臂）', text: '关节空间/笛卡尔空间规划；OMPL 算法库（RRT*/PRM*）；碰撞检测（FCL）；轨迹执行 + 力控模式' },
          { label: 'Nav2（移动底盘）', text: 'A* / DWA / TEB 路径规划；行为树（BT）任务管理；支持非完整性约束机器人' },
          { label: 'OMPL', text: 'Open Motion Planning Library；内置 30+ 规划器（RRT, EST, PRM, KPIECE）；MoveIt 2 后端' },
          { label: 'Pinocchio', text: '高性能刚体动力学库；正/逆运动学（IK）；用于实时全身运动控制（WBC）' },
        ],
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
          { label: 'Gazebo Harmonic', text: 'ROS 2 官方搭档；物理引擎 Bullet/ODE/DART；插件体系完善；传感器仿真（LiDAR/相机/IMU）' },
          { label: 'MuJoCo', text: 'DeepMind 开源；接触动力学精确；强化学习训练首选（IsaacLab 也支持 MuJoCo 后端）' },
          { label: 'NVIDIA Isaac Sim', text: '基于 USD + PhysX 5；光线追踪传感器仿真；合成数据生成；Sim-to-Real 迁移工具链' },
          { label: 'Genesis', text: '2024年新兴；物理仿真速度 430,000× 实时；GPU 并行；Sim-to-Real 效果媲美 Isaac Sim' },
          { label: 'PyBullet', text: '轻量 Python 物理引擎；快速原型验证；RL 入门首选（gym 接口友好）' },
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
          { label: 'Diffusion Policy', text: '扩散模型生成动作轨迹；处理多模态动作分布；UMI（通用操作接口）的核心算法' },
        ],
      },
      {
        name: 'Sim-to-Real',
        icon: '🔁',
        desc: '将仿真训练的策略迁移到真实机器人，是商业化核心挑战',
        details: [
          { label: 'Domain Randomization', text: '随机化物理参数（摩擦/质量/外观/光照）；Unitree G1 通过此方法训练步态迁移' },
          { label: 'Isaac Lab（NVIDIA）', text: 'Isaac Sim + RL 训练框架；并行 4096 环境同时训练；RSL-rl/skrl 算法支持；GPU 物理加速' },
          { label: 'RMA / Adaptation Module', text: 'Rapid Motor Adaptation；训练 adaptation encoder 实时估计环境参数；ANYmal/Unitree 广泛使用' },
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
          { label: 'Figure 02', text: 'OpenAI GPT-4o 视觉推理 + 本体策略网络；BMW 工厂试点；操作速度是 Gen 1 的 2× ' },
          { label: 'Universal Robots UR10e', text: '协作机械臂，10kg 负载，1300mm 臂展；ISO 10218-1 安全认证；ROS 2 官方驱动' },
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
          { label: '速腾 RS-Helios 16P', text: '混合固态，近/远双场景兼顾，防尘防水 IP67；国内车规量产' },
          { label: 'Livox Mid-360', text: '非重复扫描，近距离密度高，盲区小；配合 FAST-LIO2 效果佳；$599' },
          { label: '点云格式', text: 'PCL（点云库）PCD 格式；ROS PointCloud2 消息；KITTI/nuScenes 数据集格式标准' },
        ],
      },
      {
        name: '摄像头',
        icon: '📷',
        desc: '视觉感知，纹理与语义信息，成本最低的传感器',
        details: [
          { label: 'RCCB Bayer 格式', text: '去掉绿通道换红（Red Clear Clear Blue），提升低光感度 30%；特斯拉/Mobileye 摄像头标配' },
          { label: 'ISP 处理流水线', text: '去马赛克→白平衡→降噪→色彩校正→HDR 合成；车规 ISP 芯片：TI DS90UB954' },
          { label: '环视（Surround View）', text: '4~8 路鱼眼相机（FOV 190°+）拼接 BEV 鸟瞰图；泊车/低速感知核心；分辨率 1920×1536' },
          { label: '相机标定', text: '内参（焦距/畸变）用棋盘格 + OpenCV；外参（相机间/雷达-相机）用 kalibr；重投影误差 < 0.5px' },
        ],
      },
      {
        name: '毫米波雷达',
        icon: '📻',
        desc: '全天候测距/测速，雨雾穿透性强，弥补 LiDAR 和摄像头局限',
        details: [
          { label: 'Continental ARS540', text: '4D 成像雷达（距离/速度/方位/俯仰），400m 量程，分辨率 0.39°；特斯拉 FSD 取消后备选' },
          { label: '频段', text: '77GHz FMCW（调频连续波）；距离精度 ±0.1m；速度测量 ±0.1m/s（多普勒）' },
          { label: '点云稀疏问题', text: '毫米波点云稀疏（<200点/帧 vs LiDAR 100k点）；与 LiDAR/Camera 融合互补' },
        ],
      },
      {
        name: '定位系统',
        icon: '🛰️',
        desc: '厘米级定位是 L4 级自动驾驶的基础条件',
        details: [
          { label: 'RTK-GPS', text: '差分 GPS，精度 2cm（水平）；NovAtel PwrPak7；需基准站或 CORS 网络；隧道/地下失效' },
          { label: 'IMU 组合导航', text: 'GPS + IMU 惯性融合（Kalman/EKF）；IMU 弥补 GPS 更新率低（10Hz→200Hz）；GNSS+IMU：NovAtel SPAN' },
          { label: 'HD Map 定位', text: '高精地图（厘米级道路特征）+ NDT 点云匹配；Here / 百度地图 Apollo / 高德 HAOMO' },
          { label: 'UWB 室内定位', text: '停车场/封闭场景；精度 10cm；IEEE 802.15.4z；弥补 GPS 室内失效' },
        ],
      },
      {
        name: 'V2X 通信',
        icon: '📶',
        desc: '车联网，车-车/车-路协同，超视距感知',
        details: [
          { label: 'C-V2X（PC5）', text: '基于 LTE/5G，3GPP Rel-16 NR-V2X；直连通信（PC5）不依赖基站；中国主推标准' },
          { label: 'DSRC（802.11p）', text: '5.9GHz，专用短程通信；美国/欧洲早期标准；延迟 <10ms；逐渐被 C-V2X 取代' },
          { label: '应用场景', text: '绿波车速引导（SPaT）、施工区域预警（MAP）、紧急车辆预警；已在雄安/上海等地规模部署' },
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
          { label: 'Autoware Universe', text: 'Tier IV 主导，ROS 2 原生；感知/定位/规划/控制全栈；Applanix POS LV 定位；全球最活跃 AD 开源项目' },
          { label: 'Apollo（百度）', text: 'Cyber RT 实时中间件（替代 ROS）；HD Map + Dreamview UI；阿波罗城市开放数据集（Apollo-D3 200w 帧）' },
          { label: 'CARLA 仿真器', text: 'UE4 渲染，传感器仿真逼真；OpenDRIVE 地图格式；与 Autoware/Apollo 均有官方接口' },
          { label: 'LGSVL / SVL Simulator', text: 'Unity 引擎，高并发仿真；现已并入 CARLA 生态；百度 Apollo 官方搭档' },
        ],
      },
      {
        name: '感知算法',
        icon: '👁️',
        desc: '3D目标检测与环境理解是自动驾驶感知的核心',
        details: [
          { label: 'BEVFusion（MIT/清华）', text: 'LiDAR + Camera 统一 BEV 特征融合；CenterPoint 检测头；nuScenes SOTA；可在 Orin 上 10Hz 运行' },
          { label: 'BEVFormer', text: '纯视觉 BEV，Deformable Attention 时空融合；无 LiDAR 依赖；特斯拉 FSD v12 类似架构' },
          { label: 'Occupancy（占据栅格）', text: '将环境编码为 3D 体素占用概率；UniOcc/OccNet；处理不规则障碍物（路障/行人肢体）' },
          { label: 'PointPillars', text: '将点云投影为柱状体，2D CNN 处理；实时性好（6ms/帧）；嵌入式平台首选' },
          { label: 'DETR3D / PETR', text: '基于 Transformer 的 3D 检测；端到端，无 NMS；多帧时序建模' },
        ],
      },
      {
        name: '预测算法',
        icon: '🔮',
        desc: '预测其他交通参与者未来轨迹，是规划决策的前提',
        details: [
          { label: 'MTR（Waymo，SOTA）', text: 'Motion Transformer；全场景预测，Waymo Open Motion SOTA；自回归生成多模态轨迹' },
          { label: 'TNT / MultiPath++', text: '目标-预测-评分三阶段；意图先验 + 高斯混合输出；Waymo 2021 SOTA' },
          { label: 'SIMPL', text: '轻量化预测网络，适合嵌入式；百度 Apollo 生产线使用' },
          { label: '数据集', text: 'Waymo Open Dataset（1950段）/ nuScenes（1000段）/ Argoverse 2（25万段）' },
        ],
      },
      {
        name: '规划与控制',
        icon: '🗺️',
        desc: '从感知结果生成安全可行的行驶轨迹并执行',
        details: [
          { label: 'Lattice Planner', text: '在 Frenet 坐标系采样候选轨迹；按代价函数（碰撞/舒适/效率）排序；Autoware 默认规划器' },
          { label: 'PDM-Closed（IDM+）', text: '智能驾驶员模型扩展；反应式规划；低延迟，适合高速工况' },
          { label: 'DriveVLM（清华×理想）', text: 'VLM 做场景理解+链式推理；本地规划网络做精细轨迹；减少长尾 corner case' },
          { label: '横纵向控制', text: '纵向：Cruise PID + 自适应巡航（ACC）；横向：Pure Pursuit / Stanley / LQR / MPC（Carla benchmark SOTA）' },
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
          { label: 'ISO 26262 ASIL', text: 'Automotive Safety Integrity Level；A/B/C/D 四级；刹车/转向系统需 ASIL-D（最高）；风险图谱：严重度×暴露度×可控性' },
          { label: 'SOTIF（ISO 21448）', text: 'Safety Of The Intended Functionality；关注感知局限导致的危险（雨天/逆光）；自动驾驶专项补充 26262' },
          { label: 'FMEA / FTA', text: '失效模式与效应分析；故障树分析；安全目标分解到硬件/软件 FTTI（故障容忍时间间隔）' },
          { label: 'SEooC', text: 'Safety Element out of Context；芯片/传感器供应商需提供 SEooC 包（ASIL 分解证明）' },
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
          { label: '特斯拉 FSD 芯片 HW4.0', text: '两片自研 AI 芯片，合计 144 TOPS；完全自主开发，不对外销售' },
          { label: '地平线征程 6M', text: '128 TOPS，BPU 架构；J6M 对标 Orin N；亿咖通/极氪供应链；有开放 SDK' },
        ],
      },
      {
        name: 'SAE 自动化等级',
        icon: '📊',
        desc: 'L0~L5 六级定义，正确理解边界避免混淆',
        details: [
          { label: 'L0 无自动化', text: '全程人工驾驶；AEB/LDW 只是安全辅助，不算自动化' },
          { label: 'L1/L2 驾驶辅助', text: 'L1：单一功能（ACC or LKA）；L2：组合功能（ACC+LKA）；驾驶员全程监控；特斯拉 AP / 小鹏 NGP 属 L2+' },
          { label: 'L3 有条件自动化', text: '特定工况（高速/低速）系统主导；驾驶员可分心但需备援；奔驰 Drive Pilot 2023 年首获量产 L3 认证' },
          { label: 'L4 高度自动化', text: '特定 ODD（运营设计域）内无需人工干预；Waymo One 商业运营；百度萝卜快跑武汉大规模无人化' },
          { label: 'L5 完全自动化', text: '全工况无需方向盘/踏板；理论终点，业界尚无量产案例；技术和法规均未就绪' },
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
          { label: 'Cube Orange+', text: 'HEX Technology 出品；ArduPilot 生态首选；橙色标准载板含双 IMU；工业/商业应用广泛' },
          { label: 'DJI N3 / A3', text: '商业闭源飞控；稳定性强；DJI SDK 二次开发；适合商业项目但可定制性低' },
          { label: 'Holybro Kakute H7', text: '穿越机（FPV）飞控；BLHeli32 兼容 4 合 1 ESC；低延迟控制 <1ms；F4/H7 系列' },
        ],
      },
      {
        name: '电机与电调',
        icon: '⚡',
        desc: '电机提供推力，电调（ESC）负责驱动与调速',
        details: [
          { label: 'KV 值', text: 'KV = 转速/电压（RPM/V）；KV1000+4S（16.8V）= 16800 RPM 空载；大桨低KV（T-Motor MN系列），小桨高KV' },
          { label: '无刷电机型号规则', text: '2306（定子直径23mm/高6mm）；数字越大，电机越大；穿越机常用 2306-2450KV' },
          { label: 'BLHeli_32 ESC', text: '32位ARM处理器；DShot300/600 数字协议（无需校准油门行程）；双向 DShot 反转油门' },
          { label: 'DShot 协议', text: 'DShot300（300kbaud）/ DShot600（600kbaud）；数字信号抗干扰；支持ESC 遥测（温度/RPM/电流）' },
          { label: '电池规格', text: 'LiPo（锂聚合物）；3S=11.1V/4S=14.8V/6S=22.2V；C 值=最大持续放电倍率（45C×5Ah=225A）' },
        ],
      },
      {
        name: '机架与气动',
        icon: '✈️',
        desc: '机架构型决定飞行特性，桨叶尺寸决定效率',
        details: [
          { label: '多旋翼构型', text: '四旋翼（X/+型）最常见；六旋翼提高冗余；八旋翼用于重载（农业植保）；共轴双桨提升面积效率' },
          { label: '桨叶规格', text: '5英寸（穿越机）→ 10英寸（消费级）→ 28英寸（农业T50）；螺距越大巡航效率越高' },
          { label: '碳纤维机架', text: '3K 碳纤维板；强度/重量比高；注意碳纤维导电，走线需绝缘；T300/T700 强度等级' },
          { label: '轴距', text: '轴距 = 对角电机间距（mm）；220mm（5寸穿越）→ 450mm（中型）→ 2200mm（大型农业）' },
        ],
      },
      {
        name: '链路与通信',
        icon: '📡',
        desc: '遥控/图传/数传是地面站与无人机通信的三条关键链路',
        details: [
          { label: '遥控协议', text: 'SBUS（串行，16通道）/ CRSF（ExpressLRS/TBS，低延迟4ms）/ PPM（并联，8通道，老协议）' },
          { label: '图传', text: 'DJI O3 Air Unit：1080p@60fps，延迟 <40ms，4km 距离；模拟图传：1.3GHz/5.8GHz，<15ms 极低延迟（竞速）' },
          { label: '数传', text: 'SiK Radio（915MHz/433MHz，MAVLink 2.0，低带宽状态遥测）；4G/5G 数传（无限距离但依赖网络）' },
          { label: 'MAVLink 2.0', text: '无人机标准通信协议；Heartbeat（心跳）/ GPS_RAW_INT / COMMAND_LONG；QGroundControl 使用此协议' },
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
          { label: 'ROS 2 接口', text: 'uXRCE-DDS 桥接 uORB↔ROS 2 Topic/Service；px4_msgs 类型库；Offboard 模式下远程控制' },
          { label: '飞行模式', text: 'Position（GPS 定点）/ Altitude（高度保持）/ Mission（航点执行）/ Offboard（外部计算机接管）' },
          { label: 'EKF2 状态估计', text: '扩展卡尔曼滤波；融合 IMU/GPS/Baro/Mag/光流/视觉里程计；输出位姿+速度估计' },
          { label: 'SITL 仿真', text: 'Software In The Loop；Gazebo 无人机模型 + PX4 固件；QGroundControl 地面站联调' },
        ],
      },
      {
        name: 'ArduPilot',
        icon: '🔧',
        desc: '历史最悠久的开源飞控固件，生态最丰富',
        details: [
          { label: '多平台支持', text: 'ArduCopter（多旋翼）/ ArduPlane（固定翼）/ ArduRover（地面车辆）/ ArduSub（水下）' },
          { label: 'MAVLink 生态', text: 'Mission Planner（Windows 全功能）/ QGroundControl（跨平台）/ MAVProxy（命令行）' },
          { label: '参数系统', text: '1000+ 参数通过 GCS 在线调整；PID 自整定（AUTOTUNE 飞行模式）；日志分析 Mission Planner' },
          { label: 'MAVROS', text: 'MAVLink → ROS 1/2 桥接；MAVROS 实现 Offboard 控制；setpoint_position/setpoint_velocity Topic' },
        ],
      },
      {
        name: '无人机 SLAM',
        icon: '🗺️',
        desc: '无 GPS 环境下的自主定位与建图',
        details: [
          { label: 'FAST-LIO2', text: '激光惯导紧耦合；增量式 ikd-Tree 地图管理；Orin NX 上 20Hz 以上；港大 MARS Lab 开源' },
          { label: 'VINS-Fusion', text: '视觉惯导紧耦合（VIO）；单目/双目/RGB-D；港大沈劭劼组；轻量适合 Jetson Nano' },
          { label: 'RTAB-Map', text: '适合 RGB-D 建图；回环检测成熟；ROS 原生支持；可输出全局一致性 3D 地图' },
          { label: 'Open3D / PCL', text: '点云处理库；ICP 精匹配；体素下采样；3D 地图存储与可视化；Python API 友好' },
        ],
      },
      {
        name: '任务规划',
        icon: '📋',
        desc: '自主执行任务的核心：航线规划、地面站与行为决策',
        details: [
          { label: 'QGroundControl 任务', text: '航点（Waypoint）/ 感兴趣点（ROI）/ 样条曲线；地面站实时遥测；Mission Upload/Download' },
          { label: 'Mission Planner Grid', text: '自动规划正射摄影测量（Photogrammetry）航线；重叠度设置（前向80%/旁向70%）；WGS84 坐标导出' },
          { label: 'MAVSDK', text: 'Python/C++ SDK；PX4/ArduPilot 通用；Action/Telemetry/Mission 三大模块；无人机群控制' },
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
          { label: 'ArduPilot Swarm', text: 'Follow Me / Swarm 编队飞行；基于相对位置维持队形；MAVLink 多机广播' },
          { label: 'UWB 相对定位', text: '室内/GPS 拒止环境；Decawave DW1000；10cm 精度；多机相对位置感知' },
          { label: '集群算法', text: 'Reynolds Boids（分离/聚集/对齐）；人工势场避障；最优化编队：MAPF（多智能体路径规划）' },
        ],
      },
      {
        name: '商业应用',
        icon: '🏭',
        desc: '了解主要行业落地场景与代表产品',
        details: [
          { label: 'DJI Agras T50（农业植保）', text: '50kg 载药，16 旋翼；雷达避障；RTK 厘米级作业；单机 1 小时完成 40 亩喷洒' },
          { label: '物流配送', text: '美团（自研 M400 六旋翼）/ 顺丰（自研 AS-DC）；城市楼顶/配送站点网络；CAAC 城市场景专项试点' },
          { label: '电力巡线', text: '大疆经纬 M300 RTK + 禅思 H20T（可见光+热成像+激光测距）；自主沿线飞行；AI 缺陷识别' },
          { label: '测绘与数字孪生', text: '大疆精灵 4 RTK + 大疆智图；DOM/DSM/三维模型输出；厘米级 GSD（地面采样距离）' },
          { label: '灯光秀编队', text: '亿航/高巢/驭势；500~5000 机；北斗RTK 精准定位；同步时刻误差 <10ms' },
        ],
      },
      {
        name: '中国民用法规',
        icon: '📜',
        desc: '在中国飞无人机必须了解的法律法规（2024版）',
        details: [
          { label: '无人机分类', text: '按重量：微型（<0.25kg）/ 轻型（0.25~7kg）/ 小型（7~25kg）/ 中型（25~150kg）/ 大型（>150kg）' },
          { label: '实名登记', text: '250g 以上必须在 CAAC 民航局无人机云系统实名登记；粘贴 RFID/二维码；登记费 0 元' },
          { label: 'UOM 执照', text: '无人机操控员执照（Unmanned Aircraft Operator Mastercard）；轻型固定翼/旋翼/垂起分类；理论+实操考试' },
          { label: '适飞空域', text: '真高 120m 以下、距机场5类管制空域以外；飞行前通过"无人机云交换系统"（UTMISS）报备' },
          { label: '《无人驾驶航空器飞行管理暂行条例》', text: '2024年1月1日起施行；统一规范准入/运行/监管；商业运营需申请运营合格证（UOC）' },
        ],
      },
    ],
  },
];

// ─── Tab 定义 ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'robot',  name: '🤖 机器人',   desc: '执行器·传感器·ROS 2·VLA' },
  { id: 'ad',     name: '🚗 自动驾驶', desc: 'LiDAR·感知·规划·ISO 26262' },
  { id: 'drone',  name: '🛸 无人机',   desc: 'PX4·ArduPilot·法规·集群' },
];

// ─── 子组件：层级卡片 ──────────────────────────────────────────────────────────
function LayerCard({ layer }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rounded-2xl border p-5 mb-5"
      style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
      {/* 层级头部 */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg font-bold">{layer.level}</span>
        <span className="text-base font-semibold text-gray-800">{layer.title}</span>
      </div>
      <p className="text-[12px] text-gray-500 mb-4">{layer.subtitle}</p>

      {/* 模块网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {layer.items.map((item, idx) => (
          <div key={item.name}
            className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow"
            style={{ borderColor: expanded === idx ? layer.color + '55' : '#f0f0f0' }}
            onClick={() => setExpanded(expanded === idx ? null : idx)}>
            {/* 卡片标题 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{item.name}</span>
              <span className="ml-auto text-[10px] text-gray-400">{expanded === idx ? '▲' : '▼'}</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{item.desc}</p>

            {/* 展开详情 */}
            {expanded === idx && (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {item.details.map((d, di) => (
                  <div key={di} className="text-[12px]">
                    <span className="font-medium text-gray-700"
                      style={{ color: layer.color }}>{d.label}：</span>
                    <span className="text-gray-600">{d.text}</span>
                  </div>
                ))}
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
  const [tab, setTab] = useHashState('tab', 'robot');

  const layers = tab === 'robot' ? ROBOT_LAYERS : tab === 'ad' ? AD_LAYERS : DRONE_LAYERS;
  const activeTab = TABS.find(t => t.id === tab);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── Hero ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ 硬件</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              机器人 · 自动驾驶 · 无人机
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            面向软件工程师的硬件入门指南。从传感器/执行器识别（入门），到 ROS 2 / PX4 / Autoware 软件栈（进阶），再到 VLA 模型、功能安全认证与集群系统（精通）。内容持续更新，力求真实客观。
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>3 个领域</span>
            <span>·</span>
            <span>9 层深度</span>
            <span>·</span>
            <span>点击卡片展开详细说明</span>
          </div>
        </div>

        {/* ─── Tab 切换 ─── */}
        <div className="flex gap-2 mb-7 border-b border-gray-100 pb-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
                ${tab === t.id
                  ? 'bg-white border border-b-white border-gray-200 -mb-px text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <span>{t.name}</span>
              <span className="text-[10px] text-gray-400 hidden sm:inline">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ─── 层级卡片列表 ─── */}
        <div>
          {layers.map(layer => (
            <LayerCard key={layer.level} layer={layer} />
          ))}
        </div>

        {/* ─── 底部说明 ─── */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400">
          <span className="font-medium text-gray-500">📌 内容说明：</span>
          本模块面向有软件背景（Python/C++/ROS）但缺少硬件经验的工程师，所有技术细节来自官方文档、学术论文和行业实践。硬件型号、算法指标均注明来源背景，不做虚构。建议学习路径：先完成入门层（2~4周），再深入进阶层（2~3个月），精通层内容可按实际项目需求选读。
        </div>

      </div>
      <Footer />
    </>
  );
}
