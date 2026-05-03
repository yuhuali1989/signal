---
title: "机器人入门——从材料到控制 - 第8章: 端到端智能与 VLA"
book: "机器人入门——从材料到控制"
chapter: "8"
chapterTitle: "端到端智能与 VLA"
description: "从模仿学习到 Vision-Language-Action 模型：数据采集、行为克隆、扩散策略、ACT 架构，以及如何将 OpenVLA/Pi0 等预训练大模型部署到真实机器人上。"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "端到端学习"
  - "VLA"
  - "模仿学习"
  - "扩散策略"
  - "ACT"
type: "book"
---

# 第 8 章：端到端智能与 VLA

> **学习目标**：理解行为克隆、扩散策略、ACT 三种机器人学习范式的原理差异；能用遥操作系统采集高质量示教数据；能在真实机器人上部署并微调 OpenVLA 等预训练 VLA 模型。

---

## 8.1 为什么需要端到端学习？

传统机器人抓取流程是**模块化串联**：

```
感知（YOLO → ICP）→ 规划（MoveIt）→ 控制（PID）
    ↑                    ↑                ↑
  单独调参            单独调参           单独调参
  误差累积            误差累积
```

每个模块单独开发、误差逐级累积，泛化到新场景时需要重新标定/调参。

**端到端方法**直接从观测（图像/语言）映射到动作：

```
观测 (图像 + 语言指令)
         ↓
  ┌──────────────┐
  │  端到端模型  │   ← 一个模型，统一训练
  └──────────────┘
         ↓
  关节角度 / 末端速度
```

| 维度 | 传统方法 | 端到端方法 |
|------|---------|-----------|
| 开发成本 | 高（每模块单独工程化） | 中（数据采集成本高） |
| 精度（已知场景） | 高（<1mm） | 中（~5mm） |
| 泛化性（新场景） | 差（需重调） | 好（scaling 后提升） |
| 可解释性 | 高 | 低 |
| 实时性 | 好（1kHz） | 中（10-50Hz） |

---

## 8.2 遥操作数据采集

**"学习的上限取决于示教数据的质量"**。高质量示教数据是 VLA 训练的核心资产。

### 8.2.1 遥操作系统对比

| 系统 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **示教器** | 关节空间手动拖拽 | 精度高，反馈好 | 速度慢，不直观 |
| **领导-跟随（Leader-Follower）** | 同构小机械臂映射到真机 | 自然，双手可用 | 成本高（需第二台机器） |
| **VR/手柄遥操作** | 手部追踪 → 末端位姿 | 便宜，可远程 | 延迟，无力反馈 |
| **人手示教（Mocap/AprilTag）** | 捕捉人手姿态 | 最自然 | 手部映射噪声大 |

### 8.2.2 Leader-Follower 系统（推荐）

```python
"""
领导-跟随遥操作节点
领导臂（小型示教机械臂）的关节角度实时映射到跟随臂（真实机器人）
"""
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
from std_msgs.msg import Float64MultiArray
import numpy as np

class LeaderFollowerNode(Node):
    # 领导臂关节范围（°）
    LEADER_LIMITS  = [(-180,180), (-135, 0), (-135,135),
                      (-180,180), (-90, 90), (-180,180)]
    # 跟随臂关节范围（°）
    FOLLOWER_LIMITS = [(-180,180), (-180, 0), (-180,180),
                       (-180,180), (-90,90), (-180,180)]

    def __init__(self):
        super().__init__('leader_follower')
        self.declare_parameter('scale', 1.0)   # 关节比例缩放
        self.declare_parameter('filter_alpha', 0.7)  # 低通滤波系数

        self.scale = self.get_parameter('scale').value
        self.alpha = self.get_parameter('filter_alpha').value
        self.filtered_joints = None
        self.recording = False
        self.demo_buffer = []

        self.leader_sub = self.create_subscription(
            JointState, '/leader/joint_states', self.leader_cb, 50)
        self.follower_pub = self.create_publisher(
            Float64MultiArray, '/follower/joint_commands', 50)

        # 键盘控制录制
        self.create_timer(0.02, self.timer_cb)  # 50Hz 控制

    def leader_cb(self, msg: JointState):
        """接收领导臂关节角度，映射到跟随臂"""
        leader_q = np.array(msg.position)  # rad

        # 低通滤波（去抖动）
        if self.filtered_joints is None:
            self.filtered_joints = leader_q.copy()
        else:
            self.filtered_joints = (self.alpha * self.filtered_joints
                                    + (1 - self.alpha) * leader_q)

        # 关节范围映射
        follower_q = self.map_joints(np.degrees(self.filtered_joints))
        cmd = Float64MultiArray(data=np.radians(follower_q).tolist())
        self.follower_pub.publish(cmd)

        # 录制模式
        if self.recording:
            self.demo_buffer.append({
                'timestamp': self.get_clock().now().nanoseconds * 1e-9,
                'joint_positions': follower_q.tolist(),
            })

    def map_joints(self, leader_q_deg):
        """领导臂关节角度映射到跟随臂（处理关节范围差异）"""
        follower_q = np.zeros_like(leader_q_deg)
        for i, (lq, (l_lo, l_hi), (f_lo, f_hi)) in enumerate(
                zip(leader_q_deg, self.LEADER_LIMITS, self.FOLLOWER_LIMITS)):
            # 线性插值映射
            ratio = (lq - l_lo) / (l_hi - l_lo)
            follower_q[i] = f_lo + ratio * (f_hi - f_lo)
            follower_q[i] = np.clip(follower_q[i], f_lo, f_hi)
        return follower_q * self.scale

    def start_recording(self):
        self.demo_buffer = []
        self.recording = True
        self.get_logger().info('🔴 开始录制示教数据...')

    def stop_recording(self, save_path='demo.npz'):
        self.recording = False
        if self.demo_buffer:
            data = {k: [d[k] for d in self.demo_buffer]
                    for k in self.demo_buffer[0]}
            np.savez(save_path, **data)
            self.get_logger().info(
                f'✓ 保存 {len(self.demo_buffer)} 帧到 {save_path}')
```

### 8.2.3 多模态数据同步录制

```python
class DemoRecorder(Node):
    """
    同步录制：关节状态 + RGB图像 + 深度图 + 夹爪状态
    数据格式与 LeRobot/LEROBOT 兼容
    """
    def __init__(self, output_dir='demos/'):
        super().__init__('demo_recorder')
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.bridge = CvBridge()
        self.episode_data = []
        self.episode_id = 0
        self.recording = False

        # 同步订阅（ApproximateTimeSynchronizer）
        self.img_sub   = message_filters.Subscriber(self, Image, '/camera/color/image_raw')
        self.joint_sub = message_filters.Subscriber(self, JointState, '/joint_states')
        self.sync = message_filters.ApproximateTimeSynchronizer(
            [self.img_sub, self.joint_sub],
            queue_size=10, slop=0.05  # 50ms 时间戳容差
        )
        self.sync.registerCallback(self.sync_cb)

    def sync_cb(self, img_msg: Image, joint_msg: JointState):
        if not self.recording:
            return

        img = self.bridge.imgmsg_to_cv2(img_msg, 'rgb8')
        frame = {
            'timestamp': joint_msg.header.stamp.sec + joint_msg.header.stamp.nanosec * 1e-9,
            'observation.image': img,                           # H×W×3 uint8
            'observation.state': np.array(joint_msg.position),  # 关节角度（rad）
            'action': np.array(joint_msg.position),             # 与 state 对齐（遥操作时）
        }
        self.episode_data.append(frame)

    def save_episode(self):
        """保存一条 episode（HuggingFace datasets 格式）"""
        ep_dir = os.path.join(self.output_dir, f'episode_{self.episode_id:04d}')
        os.makedirs(ep_dir, exist_ok=True)

        states  = np.array([f['observation.state'] for f in self.episode_data])
        actions = np.array([f['action'] for f in self.episode_data])
        np.save(os.path.join(ep_dir, 'states.npy'),  states)
        np.save(os.path.join(ep_dir, 'actions.npy'), actions)

        # 保存视频
        imgs = [f['observation.image'] for f in self.episode_data]
        h, w = imgs[0].shape[:2]
        writer = cv2.VideoWriter(
            os.path.join(ep_dir, 'video.mp4'),
            cv2.VideoWriter_fourcc(*'mp4v'), 30, (w, h))
        for img in imgs:
            writer.write(cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        writer.release()

        self.get_logger().info(
            f'✓ Episode {self.episode_id}: {len(self.episode_data)} 帧保存至 {ep_dir}')
        self.episode_id += 1
        self.episode_data = []
```

---

## 8.3 行为克隆（Behavior Cloning）

最简单的模仿学习：把示教数据当作监督学习的输入-输出对，训练一个从观测到动作的映射。

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

class RobotDemoDataset(Dataset):
    """加载遥操作示教数据集"""
    def __init__(self, data_dir, img_size=224):
        self.episodes = []
        for ep_dir in sorted(glob.glob(os.path.join(data_dir, 'episode_*'))):
            states  = np.load(os.path.join(ep_dir, 'states.npy'))
            actions = np.load(os.path.join(ep_dir, 'actions.npy'))
            # 按帧配对
            for i in range(len(states)):
                img_path = os.path.join(ep_dir, f'frame_{i:05d}.jpg')
                self.episodes.append({
                    'image': img_path,
                    'state':  states[i].astype(np.float32),
                    'action': actions[i].astype(np.float32),
                })
        self.img_size = img_size
        self.transform = transforms.Compose([
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
        ])

    def __len__(self): return len(self.episodes)

    def __getitem__(self, idx):
        item = self.episodes[idx]
        img = Image.open(item['image']).convert('RGB')
        return {
            'image':  self.transform(img),
            'state':  torch.from_numpy(item['state']),
            'action': torch.from_numpy(item['action']),
        }


class BCPolicy(nn.Module):
    """
    行为克隆策略网络
    输入：图像 + 关节状态
    输出：下一步关节角度
    """
    def __init__(self, n_joints=6, hidden_dim=256):
        super().__init__()
        import torchvision.models as models

        # 图像编码器（ResNet-18）
        resnet = models.resnet18(pretrained=True)
        self.img_encoder = nn.Sequential(*list(resnet.children())[:-1])  # → (B, 512, 1, 1)

        # 状态 MLP 编码器
        self.state_encoder = nn.Sequential(
            nn.Linear(n_joints, 64), nn.ReLU(),
            nn.Linear(64, 64),       nn.ReLU(),
        )

        # 融合 + 动作预测
        self.action_head = nn.Sequential(
            nn.Linear(512 + 64, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, n_joints),   # 输出：关节角度增量
        )

    def forward(self, image, state):
        img_feat   = self.img_encoder(image).flatten(1)   # (B, 512)
        state_feat = self.state_encoder(state)              # (B, 64)
        fused      = torch.cat([img_feat, state_feat], dim=1)
        return self.action_head(fused)                      # (B, n_joints)


def train_bc(data_dir, epochs=50, lr=1e-4, batch_size=32):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    dataset = RobotDemoDataset(data_dir)
    train_size = int(0.9 * len(dataset))
    train_set, val_set = torch.utils.data.random_split(
        dataset, [train_size, len(dataset) - train_size])

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=4)
    val_loader   = DataLoader(val_set,   batch_size=batch_size, shuffle=False, num_workers=4)

    model = BCPolicy(n_joints=6).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, epochs)
    criterion = nn.MSELoss()

    best_val_loss = float('inf')
    for epoch in range(epochs):
        # 训练
        model.train()
        train_loss = 0.0
        for batch in train_loader:
            img    = batch['image'].to(device)
            state  = batch['state'].to(device)
            action = batch['action'].to(device)

            pred_action = model(img, state)
            loss = criterion(pred_action, action)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        # 验证
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in val_loader:
                pred = model(batch['image'].to(device), batch['state'].to(device))
                val_loss += criterion(pred, batch['action'].to(device)).item()

        scheduler.step()
        train_loss /= len(train_loader)
        val_loss   /= len(val_loader)
        print(f'Epoch {epoch+1:3d}/{epochs}: train={train_loss:.4f}, val={val_loss:.4f}')

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'bc_policy_best.pth')

    print(f'训练完成，最优验证损失: {best_val_loss:.4f}')
```

---

## 8.4 扩散策略（Diffusion Policy）

行为克隆的核心问题：**多模态动作分布**。同一观测可能对应多种合理动作（左绕还是右绕障碍物），MSE 损失会取均值导致"模糊行为"。

**扩散策略**用 DDPM（去噪扩散概率模型）建模动作分布，可以精确表达多模态分布。

```
扩散过程：
  真实动作 a₀ → 逐步加噪 → aₙ ~ N(0, I)
                                 ↑ 训练时已知

去噪过程（推理）：
  噪声 aₙ → 条件去噪（条件=图像+状态）→ a₀
         每步去噪由神经网络预测噪声 ε_θ(aₜ, t, obs)
```

```python
import torch
import torch.nn as nn
import numpy as np

class DiffusionPolicy(nn.Module):
    """
    扩散策略（简化版 CNN Diffusion Policy）
    参考：Chi et al. 2023 "Diffusion Policy"
    """
    def __init__(self, obs_dim=512+64, action_dim=6,
                 pred_horizon=16, n_diffusion_steps=100):
        super().__init__()
        self.action_dim    = action_dim
        self.pred_horizon  = pred_horizon  # 一次预测未来 16 步动作
        self.n_diff_steps  = n_diffusion_steps

        # 噪声预测网络（UNet 风格的 1D 时序卷积）
        total_action_dim = action_dim * pred_horizon
        self.noise_pred_net = nn.Sequential(
            nn.Linear(total_action_dim + obs_dim + 1, 512),  # +1 for timestep
            nn.Mish(),
            nn.Linear(512, 512), nn.Mish(),
            nn.Linear(512, 512), nn.Mish(),
            nn.Linear(512, total_action_dim),
        )

        # DDPM 噪声计划
        betas = torch.linspace(1e-4, 0.02, n_diffusion_steps)
        alphas = 1.0 - betas
        alphas_cumprod = torch.cumprod(alphas, dim=0)
        self.register_buffer('betas', betas)
        self.register_buffer('alphas_cumprod', alphas_cumprod)
        self.register_buffer('sqrt_alphas_cumprod', alphas_cumprod.sqrt())
        self.register_buffer('sqrt_one_minus_alphas_cumprod',
                             (1. - alphas_cumprod).sqrt())

    def add_noise(self, action, t):
        """前向扩散：给真实动作加噪声"""
        noise = torch.randn_like(action)
        sqrt_alpha = self.sqrt_alphas_cumprod[t].view(-1, 1)
        sqrt_one_minus = self.sqrt_one_minus_alphas_cumprod[t].view(-1, 1)
        noisy_action = sqrt_alpha * action + sqrt_one_minus * noise
        return noisy_action, noise

    def forward(self, obs_feat, action):
        """训练：预测噪声（损失 = MSE(pred_noise, true_noise)）"""
        B = action.shape[0]
        t = torch.randint(0, self.n_diff_steps, (B,), device=action.device)
        action_flat = action.flatten(1)
        noisy_action, noise = self.add_noise(action_flat, t)

        t_norm = t.float().unsqueeze(1) / self.n_diff_steps
        net_input = torch.cat([noisy_action, obs_feat, t_norm], dim=1)
        pred_noise = self.noise_pred_net(net_input)
        return nn.functional.mse_loss(pred_noise, noise)

    @torch.no_grad()
    def sample(self, obs_feat, n_steps=None):
        """推理：从噪声逐步去噪，生成动作序列"""
        n_steps = n_steps or self.n_diff_steps
        B = obs_feat.shape[0]
        total_dim = self.action_dim * self.pred_horizon

        # 从纯噪声开始
        action = torch.randn(B, total_dim, device=obs_feat.device)

        for t_idx in reversed(range(n_steps)):
            t = torch.full((B,), t_idx, device=obs_feat.device, dtype=torch.long)
            t_norm = t.float().unsqueeze(1) / self.n_diff_steps
            net_input = torch.cat([action, obs_feat, t_norm], dim=1)
            pred_noise = self.noise_pred_net(net_input)

            # DDPM 去噪步骤
            alpha_t = self.alphas_cumprod[t_idx]
            beta_t  = self.betas[t_idx]
            alpha_prev = self.alphas_cumprod[t_idx - 1] if t_idx > 0 else torch.tensor(1.0)

            coef1 = beta_t / (1 - alpha_t).sqrt()
            coef2 = (1 - alpha_prev).sqrt() * beta_t / (1 - alpha_t)

            action = (action - coef1 * pred_noise) / (1 - beta_t).sqrt()
            if t_idx > 0:
                noise = torch.randn_like(action)
                action = action + coef2.sqrt() * noise

        return action.reshape(B, self.pred_horizon, self.action_dim)
```

---

## 8.5 ACT（Action Chunking with Transformers）

ACT 是 Stanford 提出的高效模仿学习框架，核心思想是**动作分块**——一次预测未来多步动作序列（chunk），用 Transformer 建模时序依赖，推理延迟极低（~50ms）。

```
ACT 架构：
                  ┌─────────────────────────────┐
  RGB 图像 → ViT → │                             │
                  │    Transformer Encoder      │ ← 观测编码
  关节状态 ──────→ │                             │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │   Transformer Decoder       │
                  │  (causal, chunk_size 步)    │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │   动作预测头 (每帧关节角度)  │
                  └─────────────────────────────┘

训练时额外引入 CVAE（条件变分自编码器）对人类示教的多模态性建模
```

```python
from transformers import AutoModel, AutoConfig
import torch
import torch.nn as nn

class ACTPolicy(nn.Module):
    """
    ACT（Action Chunking Transformer）简化实现
    参考：Zhao et al. 2023 "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware"
    """
    def __init__(self,
                 state_dim=6,
                 action_dim=7,   # 6 joints + 1 gripper
                 chunk_size=100, # 一次预测 100 步
                 hidden_dim=512,
                 num_heads=8,
                 num_layers=4,
                 num_cameras=1):
        super().__init__()
        self.chunk_size = chunk_size
        self.action_dim = action_dim

        # 图像编码器（预训练 ResNet-18）
        from torchvision.models import resnet18
        backbone = resnet18(pretrained=True)
        self.img_encoder = nn.Sequential(*list(backbone.children())[:-2])  # → (B, 512, H/32, W/32)
        self.img_proj = nn.Conv2d(512, hidden_dim, kernel_size=1)

        # 关节状态嵌入
        self.state_proj = nn.Linear(state_dim, hidden_dim)

        # Transformer（Encoder-Decoder）
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim, nhead=num_heads, batch_first=True)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=num_heads, batch_first=True)
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=num_layers)

        # 动作查询向量（可学习）
        self.action_queries = nn.Parameter(torch.randn(1, chunk_size, hidden_dim))

        # 动作预测头
        self.action_head = nn.Linear(hidden_dim, action_dim)

        # 位置编码（简单可学习版）
        self.pos_embed = nn.Parameter(torch.randn(1, 196 + 1, hidden_dim))  # 14*14 + state

    def forward(self, image, state, actions=None):
        """
        image:   (B, C, H, W)
        state:   (B, state_dim)
        actions: (B, chunk_size, action_dim) 训练时提供
        返回:   (B, chunk_size, action_dim) 预测动作序列
                训练时同时返回 loss
        """
        B = image.shape[0]

        # 编码图像
        img_feat = self.img_encoder(image)             # (B, 512, 7, 7)
        img_feat = self.img_proj(img_feat)             # (B, hidden, 7, 7)
        img_tokens = img_feat.flatten(2).permute(0, 2, 1)  # (B, 49, hidden)

        # 编码状态
        state_token = self.state_proj(state).unsqueeze(1)  # (B, 1, hidden)

        # 拼接观测 tokens
        obs_tokens = torch.cat([state_token, img_tokens], dim=1)  # (B, 50, hidden)

        # Transformer Encoder
        memory = self.encoder(obs_tokens)  # (B, 50, hidden)

        # 动作查询 → Decoder
        queries = self.action_queries.expand(B, -1, -1)  # (B, chunk_size, hidden)
        decoded = self.decoder(queries, memory)            # (B, chunk_size, hidden)

        pred_actions = self.action_head(decoded)           # (B, chunk_size, action_dim)

        if actions is not None:
            loss = nn.functional.l1_loss(pred_actions, actions)
            return pred_actions, loss
        return pred_actions


def train_act(data_dir, epochs=2000, lr=1e-4, chunk_size=100):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = ACTPolicy(chunk_size=chunk_size).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-5)

    dataset = RobotDemoDataset(data_dir)  # 使用 8.3 节的数据集类（需要适配 chunk）
    loader = DataLoader(dataset, batch_size=8, shuffle=True, num_workers=4)

    for epoch in range(epochs):
        total_loss = 0.0
        for batch in loader:
            img    = batch['image'].to(device)
            state  = batch['state'].to(device)
            action = batch['action'].to(device).unsqueeze(1).repeat(1, chunk_size, 1)

            _, loss = model(img, state, action)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 10.0)
            optimizer.step()
            total_loss += loss.item()

        if (epoch + 1) % 100 == 0:
            avg = total_loss / len(loader)
            print(f'Epoch {epoch+1}: L1 loss = {avg:.4f}')
            torch.save(model.state_dict(), f'act_policy_ep{epoch+1}.pth')
```

---

## 8.6 预训练 VLA 模型部署

### 8.6.1 主流 VLA 模型对比

| 模型 | 来源 | 基础模型 | 特点 | 开源 |
|------|------|---------|------|------|
| **RT-2** | Google DeepMind | PaLI-X（55B） | 语言推理强，Scaling 好 | ❌ |
| **OpenVLA** | Stanford | LLaVA-7B | 开源，可微调 | ✅ |
| **Pi0 (π₀)** | Physical Intelligence | PaliGemma+Expert | 扩散动作头，灵巧操作 | 部分 |
| **RoboFlamingo** | ByteDance | OpenFlamingo | 视觉语言历史建模 | ✅ |
| **Octo** | Berkeley | DiT-based | 通用机器人基础模型 | ✅ |

### 8.6.2 OpenVLA 微调（LoRA）

```python
"""
用 LoRA 微调 OpenVLA（7B 参数）适配自定义机器人
需要: GPU ≥ 24GB VRAM（或使用 4-bit 量化）
"""
from transformers import AutoModelForVision2Seq, AutoProcessor
from peft import LoraConfig, get_peft_model, TaskType
import torch

# 1. 加载预训练 OpenVLA
model_id = "openvla/openvla-7b"
processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForVision2Seq.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    load_in_4bit=True,           # 4bit 量化（显存 < 12GB 可用）
    trust_remote_code=True,
)

# 2. 添加 LoRA 适配器（只训练少量参数）
lora_config = LoraConfig(
    task_type=TaskType.SEQ_2_SEQ_LM,
    r=16,                        # LoRA rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# 输出: trainable params: 8,388,608 || all params: 7,247,966,208 || trainable%: 0.1158

# 3. 准备数据（OpenVLA 格式）
def prepare_vla_sample(image, language_instruction, robot_action):
    """
    image: PIL Image
    language_instruction: str, e.g. "pick up the red cube"
    robot_action: np.array (7,)  关节角度 + 夹爪
    """
    # OpenVLA 将动作离散化为 token（256 bins per dimension）
    action_bins = np.clip(
        ((robot_action - ACTION_MIN) / (ACTION_MAX - ACTION_MIN) * 256).astype(int),
        0, 255
    )
    action_str = " ".join([f"<act_{v}>" for v in action_bins])
    prompt = f"In: What action should the robot take to {language_instruction}?\nOut: {action_str}"

    inputs = processor(
        text=prompt,
        images=image,
        return_tensors="pt"
    )
    return inputs

# 4. 微调训练循环
from torch.optim import AdamW
optimizer = AdamW(model.parameters(), lr=2e-4, weight_decay=0.0)

model.train()
for epoch in range(10):
    for batch in vla_dataloader:
        outputs = model(**batch)
        loss = outputs.loss
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
    print(f'Epoch {epoch+1}: loss={loss.item():.4f}')

# 5. 保存 LoRA 权重
model.save_pretrained('openvla_lora_myrobot/')
```

### 8.6.3 ROS 2 推理节点

```python
class VLAInferenceNode(Node):
    """OpenVLA 推理 ROS 2 节点"""

    ACTION_MIN = np.array([-np.pi]*6 + [0.0])   # 关节下限 + 夹爪全开
    ACTION_MAX = np.array([ np.pi]*6 + [1.0])   # 关节上限 + 夹爪全闭
    CONTROL_HZ = 10  # 推理频率

    def __init__(self):
        super().__init__('vla_inference')
        self.bridge = CvBridge()

        # 加载模型（启动时一次性加载）
        self.get_logger().info('加载 OpenVLA 模型...')
        self.processor = AutoProcessor.from_pretrained(
            'openvla/openvla-7b', trust_remote_code=True)
        self.model = AutoModelForVision2Seq.from_pretrained(
            'openvla_lora_myrobot/',   # 微调后的 LoRA 权重
            torch_dtype=torch.bfloat16,
            device_map='cuda',
            trust_remote_code=True,
        )
        self.model.eval()
        self.get_logger().info('✓ 模型加载完成')

        # 当前任务指令
        self.declare_parameter('instruction', 'pick up the bottle')
        self.instruction = self.get_parameter('instruction').value

        # 订阅图像和关节状态
        self.img_sub = self.create_subscription(
            Image, '/camera/color/image_raw', self.img_cb, 10)
        self.joint_sub = self.create_subscription(
            JointState, '/joint_states', self.joint_cb, 10)
        self.action_pub = self.create_publisher(
            Float64MultiArray, '/vla/joint_commands', 10)

        self.latest_img = None
        self.latest_joints = None
        self.create_timer(1.0 / self.CONTROL_HZ, self.inference_step)

    def img_cb(self, msg): self.latest_img = self.bridge.imgmsg_to_cv2(msg, 'rgb8')
    def joint_cb(self, msg): self.latest_joints = np.array(msg.position)

    @torch.no_grad()
    def inference_step(self):
        if self.latest_img is None or self.latest_joints is None:
            return

        from PIL import Image as PILImage
        pil_img = PILImage.fromarray(self.latest_img)
        prompt = (f"In: What action should the robot take to {self.instruction}?\nOut: ")

        inputs = self.processor(
            text=prompt, images=pil_img, return_tensors='pt'
        ).to('cuda', dtype=torch.bfloat16)

        # 生成动作 token
        output_ids = self.model.generate(
            **inputs, max_new_tokens=8, do_sample=False)

        # 解码动作 token → 关节角度
        action_tokens = output_ids[0][-7:].cpu().numpy()  # 7 维动作
        action_norm = action_tokens / 255.0               # 反归一化
        action = self.ACTION_MIN + action_norm * (self.ACTION_MAX - self.ACTION_MIN)

        # 安全限幅
        action = np.clip(action, self.ACTION_MIN, self.ACTION_MAX)
        cmd = Float64MultiArray(data=action.tolist())
        self.action_pub.publish(cmd)
```

---

## 8.7 实战建议：从零到可用的 VLA 机器人

```
推荐路线（按成本和难度从低到高）：

阶段 1：BC baseline（2-4 周）
  ├─ 采集 50 条示教数据（每条 30-60s）
  ├─ 训练简单 BC Policy（ResNet-18 + MLP）
  └─ 成功率目标：50-60%（同一场景，固定摆放）

阶段 2：Diffusion/ACT（4-8 周）
  ├─ 扩充到 200 条数据
  ├─ 训练 Diffusion Policy 或 ACT
  └─ 成功率目标：70-80%（轻微位置扰动）

阶段 3：VLA 微调（8-16 周）
  ├─ 扩充到 500-1000 条多样化数据（不同光照/位置/物体颜色）
  ├─ LoRA 微调 OpenVLA 或 Octo
  └─ 成功率目标：85%+（新位置/新物体类别泛化）

数据采集黄金法则：
  ✓ 多样化：位置偏移 ±5cm，旋转 ±30°，光照变化
  ✓ 高质量：流畅连贯，无停顿，避免大幅修正动作
  ✓ 失败重录：任何示教出错都从头重来，不要将错就错
  ✗ 不要：在同一固定位置录太多条（模型会过拟合到位置）
```

---

## 8.8 本章小结

```
本章知识图谱：

  端到端学习范式
  ├─ 行为克隆（BC）：MSE 监督，简单但多模态问题
  ├─ 扩散策略：DDPM 建模动作分布，表达多模态
  └─ ACT：动作分块 + Transformer，高频推理

  数据采集
  ├─ Leader-Follower 遥操作（推荐）
  ├─ 多模态同步录制（图像 + 关节 + 夹爪）
  └─ 数据格式：HuggingFace datasets / LeRobot

  VLA 大模型
  ├─ OpenVLA（7B）：开源可微调
  ├─ LoRA 微调：仅训练 0.1% 参数
  └─ ROS 2 推理节点：10Hz 实时控制

  工程实践
  ├─ 数据多样化是成功关键
  ├─ BC → Diffusion/ACT → VLA 渐进路线
  └─ 真机部署：安全限幅、看门狗、紧急停止
```

---

## 思考题

1. 行为克隆在面对"拿红色杯子"还是"拿蓝色杯子"两种指令时，如果训练数据各占一半，MSE 损失的网络会输出什么？为什么扩散策略可以解决这个问题？
2. ACT 的 chunk_size 设置过大（如 500 步）vs 过小（如 5 步）各有什么问题？实际任务中如何选择？
3. Leader-Follower 遥操作时，领导臂的关节噪声会直接进入训练数据。列举至少三种减少噪声的方法及其各自的代价。
4. LoRA 微调 OpenVLA 时，如果新场景的机器人有 8 个关节（而预训练时是 7 个），动作维度不匹配，你会怎么处理？
5. 机器人用 BC Policy 完成率只有 40%，你会怎么系统性地分析失败原因？给出一个诊断框架。
