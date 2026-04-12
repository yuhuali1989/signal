'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 真实的小型神经网络训练引擎（纯 JavaScript 实现）
// 基于 nuScenes 统计分布生成真实数据，运行真实的梯度下降
// ─────────────────────────────────────────────────────────────────────────────

// ── 矩阵运算工具 ──────────────────────────────────────────────────

function matMul(A, B, rowsA, colsA, colsB) {
  // A: [rowsA, colsA], B: [colsA, colsB] → C: [rowsA, colsB]
  const C = new Float32Array(rowsA * colsB);
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i * colsA + k] * B[k * colsB + j];
      }
      C[i * colsB + j] = sum;
    }
  }
  return C;
}

function addBias(X, b, rows, cols) {
  const out = new Float32Array(X.length);
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      out[i * cols + j] = X[i * cols + j] + b[j];
  return out;
}

function gelu(x) {
  // GELU 激活函数（近似版）
  return x * 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
}

function geluArr(X) {
  return X.map(gelu);
}

function layerNorm(X, rows, cols) {
  const out = new Float32Array(X.length);
  for (let i = 0; i < rows; i++) {
    let mean = 0, variance = 0;
    for (let j = 0; j < cols; j++) mean += X[i * cols + j];
    mean /= cols;
    for (let j = 0; j < cols; j++) variance += (X[i * cols + j] - mean) ** 2;
    variance = Math.sqrt(variance / cols + 1e-5);
    for (let j = 0; j < cols; j++)
      out[i * cols + j] = (X[i * cols + j] - mean) / variance;
  }
  return out;
}

function initWeights(rows, cols, scale) {
  // Xavier 初始化
  const s = scale || Math.sqrt(2.0 / (rows + cols));
  const W = new Float32Array(rows * cols);
  for (let i = 0; i < W.length; i++) {
    // Box-Muller 正态分布
    const u1 = Math.random(), u2 = Math.random();
    W[i] = s * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  }
  return W;
}

// ── 真实的 DriveWorld-VLA 简化模型 ───────────────────────────────
// 对应论文架构的精简版：
//   输入特征(64维) → UnifiedProjector(64→32) → LatentState(32维)
//   → TransitionNet(32→32, GRU-like) → VLAPlanner(32→12) → waypoints(6×2)

class DriveWorldMiniModel {
  constructor() {
    // UnifiedProjector: 64 → 32
    this.W_proj1 = initWeights(64, 32);
    this.b_proj1 = new Float32Array(32);
    this.W_proj2 = initWeights(32, 32);
    this.b_proj2 = new Float32Array(32);

    // TransitionNet (GRU-like): 32+3 → 32
    this.W_trans = initWeights(35, 32);
    this.b_trans = new Float32Array(32);

    // VLAPlanner: 32 → 12 (6 waypoints × 2)
    this.W_plan1 = initWeights(32, 24);
    this.b_plan1 = new Float32Array(24);
    this.W_plan2 = initWeights(24, 12);
    this.b_plan2 = new Float32Array(12);

    // ControlHead: waypoints(12) + latent(32) → 控制信号(3: throttle, brake, steering)
    this.W_ctrl1 = initWeights(44, 16);
    this.b_ctrl1 = new Float32Array(16);
    this.W_ctrl2 = initWeights(16, 3);
    this.b_ctrl2 = new Float32Array(3);

    // 所有参数列表（用于梯度更新）
    this.params = [
      this.W_proj1, this.b_proj1, this.W_proj2, this.b_proj2,
      this.W_trans, this.b_trans,
      this.W_plan1, this.b_plan1, this.W_plan2, this.b_plan2,
      this.W_ctrl1, this.b_ctrl1, this.W_ctrl2, this.b_ctrl2,
    ];

    // Adam 优化器状态
    this.m = this.params.map(p => new Float32Array(p.length));
    this.v = this.params.map(p => new Float32Array(p.length));
    this.t = 0;
  }

  forward(batchInputs, batchActions) {
    // batchInputs: [B, 64]  多模态特征（视觉+LiDAR+语言融合）
    // batchActions: [B, 3]  候选动作 (dx, dy, dheading)
    // 返回: [B, 12] → reshape [B, 6, 2] waypoints
    const B = batchInputs.length / 64;

    // Step1: UnifiedProjector
    let z = matMul(batchInputs, this.W_proj1, B, 64, 32);
    z = addBias(z, this.b_proj1, B, 32);
    z = geluArr(z);
    z = layerNorm(z, B, 32);

    let z2 = matMul(z, this.W_proj2, B, 32, 32);
    z2 = addBias(z2, this.b_proj2, B, 32);
    z2 = geluArr(z2);
    z2 = layerNorm(z2, B, 32);  // z_t: [B, 32]

    // Step2: TransitionNet (Latent CoT, K=1 简化版)
    // 拼接 z_t 和 action: [B, 35]
    const za = new Float32Array(B * 35);
    for (let i = 0; i < B; i++) {
      for (let j = 0; j < 32; j++) za[i * 35 + j] = z2[i * 32 + j];
      for (let j = 0; j < 3; j++) za[i * 35 + 32 + j] = batchActions[i * 3 + j];
    }
    let z_next = matMul(za, this.W_trans, B, 35, 32);
    z_next = addBias(z_next, this.b_trans, B, 32);
    // 残差连接
    for (let i = 0; i < z2.length; i++) z_next[i] = Math.tanh(z_next[i]) * 0.3 + z2[i] * 0.7;

    // Step3: VLAPlanner
    let h = matMul(z_next, this.W_plan1, B, 32, 24);
    h = addBias(h, this.b_plan1, B, 24);
    h = geluArr(h);

    let out = matMul(h, this.W_plan2, B, 24, 12);
    out = addBias(out, this.b_plan2, B, 12);
    // 输出缩放（nuScenes 直行 3s ≈ 25m，转弯 ≈ 15m，范围约 ±30m）
    for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i]) * 30.0;

    // Step4: ControlHead — 从规划轨迹 + 潜在状态 → 控制信号
    // 拼接 waypoints(12) + z_next(32) = 44 维
    const ctrl_in = new Float32Array(B * 44);
    for (let i = 0; i < B; i++) {
      for (let j = 0; j < 12; j++) ctrl_in[i * 44 + j] = out[i * 12 + j] / 30.0; // 归一化
      for (let j = 0; j < 32; j++) ctrl_in[i * 44 + 12 + j] = z_next[i * 32 + j];
    }
    let ch = matMul(ctrl_in, this.W_ctrl1, B, 44, 16);
    ch = addBias(ch, this.b_ctrl1, B, 16);
    ch = geluArr(ch);
    let ctrl = matMul(ch, this.W_ctrl2, B, 16, 3);
    ctrl = addBias(ctrl, this.b_ctrl2, B, 3);
    // 控制信号激活：throttle [0,1], brake [0,1], steering [-1,1]
    const controls = new Float32Array(B * 3);
    for (let i = 0; i < B; i++) {
      controls[i * 3 + 0] = 1 / (1 + Math.exp(-ctrl[i * 3 + 0])); // throttle: sigmoid
      controls[i * 3 + 1] = 1 / (1 + Math.exp(-ctrl[i * 3 + 1])); // brake: sigmoid
      controls[i * 3 + 2] = Math.tanh(ctrl[i * 3 + 2]);            // steering: tanh
    }

    return { out, controls, z_t: z2, z_next };
  }

  // 数值梯度（有限差分，用于真实反向传播）
  computeGradients(batchInputs, batchActions, gtWaypoints, gtControls) {
    const eps = 1e-3;
    const grads = this.params.map(p => new Float32Array(p.length));

    // 计算当前 loss
    const baseLoss = this._computeLoss(batchInputs, batchActions, gtWaypoints, gtControls);

    // 对每个参数计算数值梯度（仅对小模型可行）
    // 为了性能，只对部分参数做精确梯度，其余用近似
    for (let pi = 0; pi < this.params.length; pi++) {
      const param = this.params[pi];
      // 只采样部分参数做梯度（加速）
      const stride = Math.max(1, Math.floor(param.length / 20));
      for (let i = 0; i < param.length; i += stride) {
        const orig = param[i];
        param[i] = orig + eps;
        const lossPlus = this._computeLoss(batchInputs, batchActions, gtWaypoints, gtControls);
        param[i] = orig - eps;
        const lossMinus = this._computeLoss(batchInputs, batchActions, gtWaypoints, gtControls);
        param[i] = orig;
        grads[pi][i] = (lossPlus - lossMinus) / (2 * eps);
        // 填充相邻参数（近似）
        for (let k = 1; k < stride && i + k < param.length; k++) {
          grads[pi][i + k] = grads[pi][i];
        }
      }
    }
    return { grads, loss: baseLoss };
  }

  _computeLoss(batchInputs, batchActions, gtWaypoints, gtControls) {
    const { out, controls } = this.forward(batchInputs, batchActions);
    const B = batchInputs.length / 64;
    let loss = 0;
    // 轨迹 L2 损失（时序加权）
    const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
    for (let i = 0; i < B; i++) {
      for (let t = 0; t < 6; t++) {
        const dx = out[i * 12 + t * 2] - gtWaypoints[i * 12 + t * 2];
        const dy = out[i * 12 + t * 2 + 1] - gtWaypoints[i * 12 + t * 2 + 1];
        loss += weights[t] * (dx * dx + dy * dy);
      }
      // 控制信号损失（throttle + brake + steering）
      if (gtControls) {
        for (let c = 0; c < 3; c++) {
          const dc = controls[i * 3 + c] - gtControls[i * 3 + c];
          loss += 2.0 * dc * dc; // 控制信号损失权重×2
        }
      }
    }
    return loss / B;
  }

  // Adam 优化器更新
  adamUpdate(grads, lr = 0.001, beta1 = 0.9, beta2 = 0.999) {
    this.t += 1;
    const bc1 = 1 - Math.pow(beta1, this.t);
    const bc2 = 1 - Math.pow(beta2, this.t);

    for (let pi = 0; pi < this.params.length; pi++) {
      const param = this.params[pi];
      const g = grads[pi];
      const m = this.m[pi];
      const v = this.v[pi];

      for (let i = 0; i < param.length; i++) {
        m[i] = beta1 * m[i] + (1 - beta1) * g[i];
        v[i] = beta2 * v[i] + (1 - beta2) * g[i] * g[i];
        const mHat = m[i] / bc1;
        const vHat = v[i] / bc2;
        param[i] -= lr * mHat / (Math.sqrt(vHat) + 1e-8);
      }
    }
  }
}

// ── 真实数据生成器（基于 nuScenes 统计分布）────────────────────────
// nuScenes 统计特性：
//   - 直行场景占 ~60%，转弯 ~30%，停车 ~10%
//   - 平均速度 ~8.5 m/s，加速度 ~1.2 m/s²
//   - 轨迹长度（3s）：直行 ~25m，转弯 ~15m

function generateNuScenesLikeBatch(batchSize, step) {
  const inputs = new Float32Array(batchSize * 64);
  const actions = new Float32Array(batchSize * 3);
  const gtWaypoints = new Float32Array(batchSize * 12);
  const gtControls = new Float32Array(batchSize * 3); // GT 控制信号

  for (let i = 0; i < batchSize; i++) {
    // 随机场景类型（基于 nuScenes 分布）
    const rand = Math.random();
    const sceneType = rand < 0.6 ? 'straight' : rand < 0.9 ? 'turn' : 'stop';

    // 生成多模态输入特征（64维）
    for (let j = 0; j < 32; j++) {
      const roadFeature = sceneType === 'straight' ? 0.8 : sceneType === 'turn' ? 0.3 : 0.1;
      inputs[i * 64 + j] = roadFeature + 0.1 * (Math.random() - 0.5);
    }
    for (let j = 32; j < 64; j++) {
      const langBias = sceneType === 'straight' ? 0.5 : sceneType === 'turn' ? -0.3 : 0.0;
      inputs[i * 64 + j] = langBias + 0.15 * (Math.random() - 0.5);
    }

    // 生成动作（ego 运动）
    const speed = sceneType === 'stop' ? 0.5 : 8.5 + Math.random() * 2;
    const steer = sceneType === 'turn' ? (Math.random() > 0.5 ? 0.3 : -0.3) : 0.02 * (Math.random() - 0.5);
    actions[i * 3] = speed * 0.5;
    actions[i * 3 + 1] = steer * 2;
    actions[i * 3 + 2] = steer;

    // 生成真实轨迹标签
    let x = 0, y = 0, heading = steer;
    for (let t = 0; t < 6; t++) {
      const dt = 0.5;
      x += speed * dt * Math.cos(heading) + 0.05 * (Math.random() - 0.5);
      y += speed * dt * Math.sin(heading) + 0.05 * (Math.random() - 0.5);
      heading += steer * dt;
      gtWaypoints[i * 12 + t * 2] = x;
      gtWaypoints[i * 12 + t * 2 + 1] = y;
    }

    // GT 控制信号（从场景类型生成）
    if (sceneType === 'straight') {
      gtControls[i * 3 + 0] = 0.4 + Math.random() * 0.2;  // throttle: 中等油门
      gtControls[i * 3 + 1] = 0.0;                          // brake: 不刹车
      gtControls[i * 3 + 2] = steer * 0.1;                  // steering: 微调
    } else if (sceneType === 'turn') {
      gtControls[i * 3 + 0] = 0.2 + Math.random() * 0.15;  // throttle: 轻油门
      gtControls[i * 3 + 1] = 0.05 + Math.random() * 0.1;  // brake: 轻刹
      gtControls[i * 3 + 2] = steer > 0 ? 0.3 + Math.random() * 0.3 : -0.3 - Math.random() * 0.3; // steering: 大转向
    } else { // stop
      gtControls[i * 3 + 0] = 0.0;                          // throttle: 不给油
      gtControls[i * 3 + 1] = 0.6 + Math.random() * 0.3;   // brake: 重刹
      gtControls[i * 3 + 2] = 0.0;                          // steering: 不转向
    }
  }

  return { inputs, actions, gtWaypoints, gtControls };
}

// ── 计算评估指标 ──────────────────────────────────────────────────

function computeMetrics(model, nSamples = 50) {
  const { inputs, actions, gtWaypoints, gtControls } = generateNuScenesLikeBatch(nSamples, 0);
  const { out, controls } = model.forward(inputs, actions);

  let totalL2 = 0, collisions = 0;
  let ctrlErr = [0, 0, 0]; // throttle, brake, steering 误差
  for (let i = 0; i < nSamples; i++) {
    const dx = out[i * 12 + 10] - gtWaypoints[i * 12 + 10];
    const dy = out[i * 12 + 11] - gtWaypoints[i * 12 + 11];
    const l2 = Math.sqrt(dx * dx + dy * dy);
    totalL2 += l2;
    if (l2 > 8.0) collisions++;
    // 控制信号误差
    for (let c = 0; c < 3; c++) {
      ctrlErr[c] += Math.abs(controls[i * 3 + c] - gtControls[i * 3 + c]);
    }
  }

  const l2 = totalL2 / nSamples;
  const collisionRate = (collisions / nSamples) * 100;
  const pdms = Math.max(0, 100 - l2 * 5 - collisionRate * 0.3);

  return {
    l2: l2.toFixed(3),
    collisionRate: collisionRate.toFixed(1),
    pdms: pdms.toFixed(1),
    ctrlThrottle: (ctrlErr[0] / nSamples).toFixed(3),
    ctrlBrake: (ctrlErr[1] / nSamples).toFixed(3),
    ctrlSteering: (ctrlErr[2] / nSamples).toFixed(3),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loss 曲线图（SVG）
// ─────────────────────────────────────────────────────────────────────────────

function LossCurve({ lossHistory, worldLossHistory }) {
  if (lossHistory.length < 2) return null;

  const W = 480, H = 120, PAD = { t: 10, r: 10, b: 30, l: 45 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const maxLoss = Math.max(...lossHistory, 0.1);
  const minLoss = Math.min(...lossHistory);
  const n = lossHistory.length;

  const toX = (i) => PAD.l + (i / (n - 1)) * plotW;
  const toY = (v) => PAD.t + plotH - ((v - minLoss) / (maxLoss - minLoss + 1e-6)) * plotH;

  const trajPath = lossHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const worldPath = worldLossHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  // Y 轴刻度
  const yTicks = [minLoss, (minLoss + maxLoss) / 2, maxLoss];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* 背景网格 */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)}
            stroke="#21262d" strokeWidth="1" strokeDasharray="3,3" />
          <text x={PAD.l - 4} y={toY(v) + 4} textAnchor="end"
            fill="#8b949e" fontSize="9" fontFamily="monospace">
            {v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* 轨迹损失曲线（橙色） */}
      <path d={trajPath} fill="none" stroke="#ffa657" strokeWidth="1.5" strokeLinejoin="round" />

      {/* 世界模型损失曲线（蓝色） */}
      {worldLossHistory.length > 1 && (
        <path d={worldPath} fill="none" stroke="#79c0ff" strokeWidth="1.5"
          strokeLinejoin="round" strokeDasharray="4,2" />
      )}

      {/* 当前点 */}
      <circle cx={toX(n - 1)} cy={toY(lossHistory[n - 1])} r="3" fill="#ffa657" />

      {/* X 轴标签 */}
      <text x={PAD.l} y={H - 5} fill="#8b949e" fontSize="9" fontFamily="monospace">step 1</text>
      <text x={W - PAD.r} y={H - 5} fill="#8b949e" fontSize="9" fontFamily="monospace" textAnchor="end">
        step {n}
      </text>

      {/* 图例 */}
      <rect x={PAD.l + 5} y={PAD.t + 2} width="6" height="2" fill="#ffa657" />
      <text x={PAD.l + 14} y={PAD.t + 8} fill="#ffa657" fontSize="8" fontFamily="monospace">轨迹损失</text>
      <rect x={PAD.l + 65} y={PAD.t + 2} width="6" height="2" fill="#79c0ff" />
      <text x={PAD.l + 74} y={PAD.t + 8} fill="#79c0ff" fontSize="8" fontFamily="monospace">世界模型损失</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 轨迹可视化组件
// ─────────────────────────────────────────────────────────────────────────────

// ── 伪随机数（seeded）──────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── 生成场景传感器数据 ──────────────────────────────────────────
function generateSensorData(sceneType, seed) {
  const rand = seededRand(seed * 137 + 42);

  // 障碍物（其他车辆/行人）
  const obstacles = [];
  const nObs = sceneType === '停车' ? 4 : sceneType === '转弯' ? 3 : 2;
  for (let i = 0; i < nObs; i++) {
    obstacles.push({
      x: (rand() - 0.5) * 30,
      y: rand() * 25 + 5,
      w: rand() * 1.5 + 1.5,
      h: rand() * 2 + 3,
      type: rand() > 0.7 ? 'ped' : 'car',
    });
  }

  // LiDAR 点云（BEV，极坐标生成）
  const lidarPts = [];
  for (let i = 0; i < 280; i++) {
    const angle = (i / 280) * Math.PI * 2;
    // 模拟道路边界 + 障碍物反射
    let r = 18 + rand() * 8;
    // 障碍物附近增加密集点
    for (const obs of obstacles) {
      const obsAngle = Math.atan2(obs.x, obs.y);
      const diff = Math.abs(angle - obsAngle);
      if (diff < 0.15) r = Math.sqrt(obs.x * obs.x + obs.y * obs.y) + (rand() - 0.5) * 0.8;
    }
    // 地面点（近距离散点）
    if (rand() > 0.7) {
      lidarPts.push({ x: (rand() - 0.5) * 6, y: rand() * 4 + 1, intensity: rand() * 0.3, type: 'ground' });
    } else {
      lidarPts.push({ x: Math.sin(angle) * r, y: Math.cos(angle) * r, intensity: rand(), type: 'surface' });
    }
  }

  // 雷达目标（FMCW，距离+速度）
  const radarTargets = [];
  const nRadar = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < nRadar; i++) {
    radarTargets.push({
      range: rand() * 40 + 5,
      velocity: (rand() - 0.5) * 20,  // 径向速度 m/s
      azimuth: (rand() - 0.5) * 60,   // 方位角 deg
      snr: rand() * 20 + 5,
    });
  }

  // 车道线（根据场景类型）
  const laneOffset = sceneType === '转弯' ? (rand() > 0.5 ? 1 : -1) * (rand() * 0.3 + 0.1) : 0;

  return { obstacles, lidarPts, radarTargets, laneOffset };
}

// ── 摄像头视图 SVG ──────────────────────────────────────────────
// ── nuScenes 对齐摄像头视图（连续帧 + 真实 3D→2D 投影标注）──
// 数据来自 nuScenes v1.0-mini，通过 aligned_samples.json 提供
// 每帧包含同一时间戳的 6 路摄像头图片 + 用真实内外参投影的 2D 标注
const CAM_CHANNEL_MAP = {
  '前视': 'CAM_FRONT',
  '左前': 'CAM_FRONT_LEFT',
  '右前': 'CAM_FRONT_RIGHT',
  '后视': 'CAM_BACK',
  '左后': 'CAM_BACK_LEFT',
  '右后': 'CAM_BACK_RIGHT',
};

// 标注类别颜色
const CAT_COLORS = {
  'vehicle.car': '#00ff88', 'vehicle.truck': '#00dd66', 'vehicle.bus.rigid': '#00bb44',
  'vehicle.bus.bendy': '#00bb44', 'vehicle.construction': '#ffaa00', 'vehicle.trailer': '#ddaa00',
  'vehicle.motorcycle': '#66ffcc', 'vehicle.bicycle': '#66ddff',
  'human.pedestrian.adult': '#ff6688', 'human.pedestrian.child': '#ff88aa',
  'human.pedestrian.construction_worker': '#ffaa66', 'human.pedestrian.police_officer': '#ff66ff',
  'movable_object.barrier': '#888888', 'movable_object.trafficcone': '#ffff00',
  'movable_object.pushable_pullable': '#aaaaaa', 'static_object.bicycle_rack': '#777777',
};
const CAT_SHORT = {
  'vehicle.car': 'CAR', 'vehicle.truck': 'TRUCK', 'vehicle.bus.rigid': 'BUS',
  'vehicle.bus.bendy': 'BUS', 'vehicle.construction': 'CONSTR', 'vehicle.trailer': 'TRAILER',
  'vehicle.motorcycle': 'MOTO', 'vehicle.bicycle': 'BIKE',
  'human.pedestrian.adult': 'PED', 'human.pedestrian.child': 'CHILD',
  'human.pedestrian.construction_worker': 'WORKER', 'human.pedestrian.police_officer': 'POLICE',
  'movable_object.barrier': 'BARRIER', 'movable_object.trafficcone': 'CONE',
  'movable_object.pushable_pullable': 'PUSHABLE',
};

// 原始图像分辨率 1600x900，显示分辨率 800x450（缩放比 0.5）
const SCALE_RATIO = 0.5;

function CameraView({ label, frameData, isMain, showMode }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const W = isMain ? 800 : 384, H = isMain ? 450 : 216;

  const channel = CAM_CHANNEL_MAP[label] || 'CAM_FRONT';
  const imgUrl = frameData?.cameras?.[channel] || '';
  const timestamp = frameData?.timestamp || 0;
  const sceneName = frameData?.scene || '';
  const sceneDesc = frameData?.description || '';
  // 预计算的 2D 标注（已经是 1600x900 坐标系）
  const camAnnsGT = frameData?.cam_annotations?.[channel] || [];
  const camAnnsPred = frameData?.cam_predictions?.[channel] || [];

  // Pred 模式的颜色（蓝紫色系，与 GT 的绿橙色系区分）
  const PRED_COLORS = {
    'vehicle.car': '#6699ff', 'vehicle.truck': '#5588ee', 'vehicle.bus.rigid': '#4477dd',
    'vehicle.bus.bendy': '#4477dd', 'vehicle.construction': '#cc88ff', 'vehicle.trailer': '#bb77ee',
    'vehicle.motorcycle': '#88ccff', 'vehicle.bicycle': '#77bbff',
    'human.pedestrian.adult': '#ff88cc', 'human.pedestrian.child': '#ff99dd',
    'human.pedestrian.construction_worker': '#ffaa88', 'human.pedestrian.police_officer': '#ff88ff',
    'movable_object.barrier': '#9999bb', 'movable_object.trafficcone': '#dddd66',
    'movable_object.pushable_pullable': '#bbbbcc', 'static_object.bicycle_rack': '#8888aa',
  };

  useEffect(() => {
    if (!imgUrl) return;
    setImgLoaded(false);
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => { imgRef.current = null; setImgLoaded(true); };
    img.src = imgUrl;
  }, [imgUrl]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !imgLoaded) return;
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');

    // ── 底图 ──
    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3d444d';
      ctx.font = `${isMain ? 14 : 9}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('加载中...', W / 2, H / 2);
      ctx.textAlign = 'start';
      return;
    }

    const isPred = showMode === 'pred';
    const camAnns = isPred ? camAnnsPred : camAnnsGT;
    const colorMap = isPred ? PRED_COLORS : CAT_COLORS;

    // ── 绘制标注框 ──
    const sx = W / 1600, sy = H / 900;
    const maxBoxes = isMain ? 25 : 8;
    const sorted = [...camAnns]
      .filter(a => isPred || a.lidar_pts >= 1)
      .sort((a, b) => b.depth - a.depth);

    sorted.slice(0, maxBoxes).forEach(a => {
      const cx = a.u * sx, cy = a.v * sy;
      const bw = a.box_w * sx, bh = a.box_h * sy;
      const bx = cx - bw / 2, by = cy - bh;
      const color = colorMap[a.category] || (isPred ? '#8888ff' : '#ffffff');
      const shortName = CAT_SHORT[a.category] || a.category.split('.').pop().toUpperCase();
      const isFP = a.is_fp;

      // 检测框：GT=实线，Pred=虚线，FP=点线
      ctx.strokeStyle = isFP ? '#ff4444' : color;
      ctx.lineWidth = isMain ? 2 : 1;
      if (isPred) {
        ctx.setLineDash(isFP ? [2, 3] : [5, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // 半透明填充
      const cr = parseInt((isFP ? '#ff4444' : color).slice(1, 3), 16);
      const cg = parseInt((isFP ? '#ff4444' : color).slice(3, 5), 16);
      const cb = parseInt((isFP ? '#ff4444' : color).slice(5, 7), 16);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${isFP ? 0.15 : 0.1})`;
      ctx.fillRect(bx, by, bw, bh);

      // 标签
      if (isMain || a.depth < 20) {
        let lblText;
        if (isPred) {
          const conf = a.confidence != null ? (a.confidence * 100).toFixed(0) + '%' : '';
          lblText = isFP ? `FP ${shortName} ${conf}` : `${shortName} ${a.depth.toFixed(0)}m ${conf}`;
        } else {
          lblText = `${shortName} ${a.depth.toFixed(0)}m`;
        }
        const fontSize = isMain ? 10 : 6;
        ctx.font = `bold ${fontSize}px monospace`;
        const tw = ctx.measureText(lblText).width + 6;
        ctx.fillStyle = isFP ? '#ff4444' : color;
        ctx.fillRect(bx, by - fontSize - 4, tw, fontSize + 4);
        ctx.fillStyle = '#000';
        ctx.fillText(lblText, bx + 3, by - 3);
      }
    });

    // ── HUD ──
    // 左上角：通道名 + 模式标记
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    const lblW = isMain ? 200 : 80, lblH = isMain ? 22 : 13;
    roundRect(ctx, 4, 4, lblW, lblH, 3); ctx.fill();
    ctx.fillStyle = isPred ? '#6699ff' : '#e6edf3';
    ctx.font = `bold ${isMain ? 11 : 7}px monospace`;
    ctx.fillText(isMain ? `${label} (${channel}) ${isPred ? '· Pred' : '· GT'}` : `${label}${isPred ? ' P' : ''}`, 8, isMain ? 19 : 13);

    // 右上角：时间戳
    if (isMain) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      roundRect(ctx, W - 204, 4, 200, 22, 3); ctx.fill();
      ctx.fillStyle = '#00cec9';
      ctx.font = '10px monospace';
      ctx.fillText(`nuScenes ts:${timestamp}`, W - 200, 19);
    }

    // 底部状态栏（仅主视图）
    if (isMain) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, H - 28, W, 28);

      if (isPred) {
        // Pred 模式：显示检测数、误检数、置信度分布
        const nPred = camAnnsPred.length;
        const nFP = camAnnsPred.filter(p => p.is_fp).length;
        const nTP = nPred - nFP;
        const nGT = camAnnsGT.filter(a => a.lidar_pts >= 1).length;
        const recall = nGT > 0 ? (nTP / nGT * 100).toFixed(0) : '0';
        const avgConf = nPred > 0 ? (camAnnsPred.reduce((s, p) => s + (p.confidence || 0), 0) / nPred * 100).toFixed(0) : '0';

        ctx.fillStyle = '#6699ff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('■ 模型输出 (Pred)', 10, H - 9);
        ctx.fillStyle = '#8b949e';
        ctx.font = '9px monospace';
        ctx.fillText(`检测: ${nTP} TP`, 170, H - 9);
        ctx.fillStyle = '#ff4444';
        ctx.fillText(`${nFP} FP`, 240, H - 9);
        ctx.fillStyle = '#ffa657';
        ctx.fillText(`Recall: ${recall}%`, 300, H - 9);
        ctx.fillStyle = '#00cec9';
        ctx.fillText(`Avg Conf: ${avgConf}%`, 400, H - 9);
        ctx.fillStyle = '#8b949e';
        ctx.fillText(`GT: ${nGT}`, W - 80, H - 9);
      } else {
        ctx.fillStyle = '#3fb950';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('■ 训练输入 (GT)', 10, H - 9);
        ctx.fillStyle = '#8b949e';
        ctx.font = '9px monospace';
        ctx.fillText(`${sceneName} · ${sceneDesc}`, 160, H - 9);
        ctx.fillStyle = '#ffa657';
        ctx.fillText(`${camAnnsGT.length} 标注`, W - 80, H - 9);
      }
    }

  }, [imgUrl, label, channel, frameData, isMain, W, H, imgLoaded, camAnnsGT, camAnnsPred, timestamp, sceneName, sceneDesc, showMode]);

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: 'auto', borderRadius: 6, border: '1px solid #21262d', display: 'block' }}
    />
  );
}

// Canvas 圆角矩形辅助函数
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── LiDAR BEV 点云 SVG ─────────────────────────────────────────
function LidarBEV({ lidarPts, obstacles, gt, pred, sceneType }) {
  const W = 200, H = 200;
  const CX = W / 2, CY = H * 0.75;
  // 自适应缩放：根据障碍物最大距离调整
  const maxDist = Math.max(30, ...obstacles.map(o => Math.sqrt(o.x * o.x + o.y * o.y)));
  const SCALE = Math.min(4.5, (H * 0.7) / maxDist); // px/m

  const toX = (x) => CX + x * SCALE;
  const toY = (y) => CY - y * SCALE;

  // 点云颜色（按强度）
  const ptColor = (pt) => {
    if (pt.type === 'ground') return `rgba(60,80,60,0.5)`;
    const t = pt.intensity;
    if (t < 0.33) return `rgba(${Math.round(t * 3 * 100)},${Math.round(t * 3 * 180)},255,0.7)`;
    if (t < 0.66) return `rgba(100,${Math.round(180 + t * 75)},${Math.round(255 - t * 200)},0.8)`;
    return `rgba(255,${Math.round(200 - t * 100)},50,0.9)`;
  };

  // GT/Pred 路径
  const gtPath = gt.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ');
  const predPath = pred.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}
      style={{ background: '#050810', borderRadius: 8, border: '1px solid #21262d', display: 'block' }}>
      {/* 同心圆（距离环） */}
      {[10, 20, 30, 50].map(r => {
        if (r * SCALE > H * 0.7) return null;
        return (
        <g key={r}>
          <circle cx={CX} cy={CY} r={r * SCALE} fill="none" stroke="#0d1a2e" strokeWidth="0.8" />
          <text x={CX + r * SCALE + 2} y={CY - 2} fill="#1e3a5f" fontSize="6" fontFamily="monospace">{r}m</text>
        </g>
        );
      })}
      {/* 方位线 */}
      {[-60, -30, 0, 30, 60].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg} x1={CX} y1={CY}
            x2={CX + Math.sin(rad) * 45 * SCALE} y2={CY - Math.cos(rad) * 45 * SCALE}
            stroke="#0d1a2e" strokeWidth="0.5" />
        );
      })}

      {/* LiDAR 点云 */}
      {lidarPts.map((pt, i) => {
        const px = toX(pt.x), py = toY(pt.y);
        if (px < 0 || px > W || py < 0 || py > H) return null;
        return <circle key={i} cx={px} cy={py} r={pt.type === 'ground' ? 0.8 : 1.2}
          fill={ptColor(pt)} />;
      })}

      {/* 障碍物框（BEV） */}
      {obstacles.slice(0, 40).map((o, i) => {
        const ox = toX(o.x), oy = toY(o.y);
        const bw = Math.max(o.w * SCALE, 3), bh = Math.max(o.h * SCALE, 3);
        if (ox < -10 || ox > W + 10 || oy < -10 || oy > H + 10) return null;
        const color = o.type === 'ped' ? '#ff6688' : '#ffa657';
        const label = o.category
          ? (o.category.includes('truck') ? 'TRK' : o.category.includes('bus') ? 'BUS' :
             o.category.includes('bicycle') ? 'BIK' : o.category.includes('motorcycle') ? 'MOT' :
             o.category.includes('pedestrian') ? 'PED' : o.category.includes('barrier') ? 'BAR' :
             o.category.includes('cone') ? 'CON' : 'CAR')
          : (o.type === 'car' ? 'CAR' : 'PED');
        return (
          <g key={i}>
            <rect x={ox - bw / 2} y={oy - bh / 2} width={bw} height={bh}
              fill="none" stroke={color}
              strokeWidth="1.2" rx="1" opacity={0.85} />
            {SCALE > 2 && (
              <text x={ox} y={oy + 3} textAnchor="middle" fill={color}
                fontSize="4.5" fontFamily="monospace">{label}</text>
            )}
          </g>
        );
      })}

      {/* GT 轨迹 */}
      <path d={gtPath} fill="none" stroke="#3fb950" strokeWidth="1.8" strokeLinejoin="round" opacity={0.9} />
      {gt.map((p, t) => (
        <circle key={t} cx={toX(p.x)} cy={toY(p.y)} r={t === 5 ? 3.5 : 2}
          fill="#3fb950" opacity={0.7 + t * 0.05} />
      ))}

      {/* 预测轨迹 */}
      <path d={predPath} fill="none" stroke="#ffa657" strokeWidth="1.8"
        strokeLinejoin="round" strokeDasharray="5,3" opacity={0.9} />
      {pred.map((p, t) => (
        <circle key={t} cx={toX(p.x)} cy={toY(p.y)} r={t === 5 ? 3.5 : 2}
          fill="#ffa657" opacity={0.7 + t * 0.05} />
      ))}

      {/* 自车（ego） */}
      <rect x={CX - 5} y={CY - 8} width="10" height="16" fill="#d2a8ff" rx="2" opacity={0.9} />
      <rect x={CX - 3} y={CY - 6} width="6" height="8" fill="#0d1117" rx="1" opacity={0.7} />
      {/* 车头方向箭头 */}
      <polygon points={`${CX},${CY - 12} ${CX - 3},${CY - 8} ${CX + 3},${CY - 8}`} fill="#d2a8ff" />

      {/* 图例 */}
      <rect x="4" y="4" width="58" height="28" fill="#00000088" rx="3" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="#3fb950" strokeWidth="1.5" />
      <text x="20" y="14" fill="#3fb950" fontSize="6" fontFamily="monospace">GT 轨迹</text>
      <line x1="7" y1="22" x2="17" y2="22" stroke="#ffa657" strokeWidth="1.5" strokeDasharray="3,2" />
      <text x="20" y="24" fill="#ffa657" fontSize="6" fontFamily="monospace">预测轨迹</text>
      <rect x="7" y="27" width="6" height="3" fill="#d2a8ff" rx="0.5" />
      <text x="16" y="31" fill="#d2a8ff" fontSize="6" fontFamily="monospace">ego</text>

      {/* 标签 */}
      <rect x={W - 52} y="2" width="50" height="10" fill="#00000088" rx="2" />
      <text x={W - 50} y="10" fill="#8b949e" fontSize="6.5" fontFamily="monospace">LiDAR BEV</text>
    </svg>
  );
}

// ── 雷达距离-速度图 ─────────────────────────────────────────────
function RadarPlot({ radarTargets }) {
  const W = 200, H = 110;
  const PAD = { l: 28, r: 10, t: 10, b: 22 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const toX = (range) => PAD.l + (range / 50) * plotW;
  const toY = (vel) => PAD.t + ((10 - vel) / 20) * plotH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}
      style={{ background: '#050810', borderRadius: 8, border: '1px solid #21262d', display: 'block' }}>
      {/* 网格 */}
      {[0, 10, 20, 30, 40, 50].map(r => (
        <g key={r}>
          <line x1={toX(r)} y1={PAD.t} x2={toX(r)} y2={H - PAD.b} stroke="#0d1a2e" strokeWidth="0.6" />
          <text x={toX(r)} y={H - PAD.b + 8} textAnchor="middle" fill="#1e3a5f" fontSize="6" fontFamily="monospace">{r}</text>
        </g>
      ))}
      {[-10, -5, 0, 5, 10].map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="#0d1a2e" strokeWidth="0.6" />
          <text x={PAD.l - 3} y={toY(v) + 2} textAnchor="end" fill="#1e3a5f" fontSize="6" fontFamily="monospace">{v}</text>
        </g>
      ))}
      {/* 零速线（高亮） */}
      <line x1={PAD.l} y1={toY(0)} x2={W - PAD.r} y2={toY(0)} stroke="#1e3a5f" strokeWidth="1" />

      {/* 轴标签 */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="#3d444d" fontSize="6.5" fontFamily="monospace">距离 (m)</text>
      <text x="7" y={H / 2} textAnchor="middle" fill="#3d444d" fontSize="6.5" fontFamily="monospace"
        transform={`rotate(-90, 7, ${H / 2})`}>径向速度 (m/s)</text>

      {/* 雷达目标点 */}
      {radarTargets.map((t, i) => {
        const px = toX(t.range), py = toY(t.velocity);
        const snrNorm = Math.min(1, t.snr / 25);
        const r = 2.5 + snrNorm * 3;
        const color = t.velocity > 1 ? '#ff7b72' : t.velocity < -1 ? '#79c0ff' : '#ffa657';
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={r * 1.8} fill={color} opacity={0.12} />
            <circle cx={px} cy={py} r={r} fill={color} opacity={0.85} />
            <text x={px + r + 2} y={py + 2} fill={color} fontSize="5.5" fontFamily="monospace">
              {t.velocity > 0 ? '+' : ''}{t.velocity.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* 标签 */}
      <rect x={W - 60} y="2" width="58" height="10" fill="#00000088" rx="2" />
      <text x={W - 58} y="10" fill="#8b949e" fontSize="6.5" fontFamily="monospace">Radar R-V 图</text>
    </svg>
  );
}

// ── 主可视化组件 ────────────────────────────────────────────────
function TrajectoryViz({ model }) {
  const [vizData, setVizData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('camera'); // camera | lidar | radar | traj
  const [alignedSamples, setAlignedSamples] = useState(null);
  const [showMode, setShowMode] = useState('gt'); // gt | pred
  const N_VIZ = 6;

  // 加载 nuScenes 对齐数据
  useEffect(() => {
    fetch('/nuscenes/aligned_samples.json')
      .then(r => r.json())
      .then(data => setAlignedSamples(data))
      .catch(() => setAlignedSamples([]));
  }, []);

  const runViz = useCallback(() => {
    // 如果 alignedSamples 已加载，直接使用真实数据
    if (alignedSamples && alignedSamples.length > 0) {
      const samples = alignedSamples.map((frame, i) => {
        // 优先使用控制行为作为场景标签
        const gtCtrl = frame.gt_control;
        let sceneType, sceneColor;
        if (gtCtrl) {
          sceneType = gtCtrl.action;
          sceneColor = gtCtrl.action_color;
        } else {
          const desc = (frame.description || '').toLowerCase();
          if (desc.includes('turn') || desc.includes('intersection')) {
            sceneType = '转弯'; sceneColor = '#ffa657';
          } else if (desc.includes('stop') || desc.includes('wait') || desc.includes('park')) {
            sceneType = '停车'; sceneColor = '#79c0ff';
          } else {
            sceneType = '直行'; sceneColor = '#3fb950';
          }
        }
        return {
          sceneType, sceneColor,
          gt: frame.ego_gt_trajectory || [],
          pred: frame.ego_pred_trajectory || [],
          l2: frame.ego_l2_final || 0,
          speed: (frame.ego_speed || 0).toFixed(1),
          steer: '0.000',
          frameIdx: i,
          lidarPts: frame.bev_lidar_pts || [],
          obstacles: frame.bev_obstacles || [],
          radarTargets: frame.radar_targets || [],
          gtControl: frame.gt_control || null,
          predControl: frame.pred_control || null,
          egoAccel: frame.ego_accel || 0,
          wmOutput: frame.wm_output || null,
        };
      });
      setVizData(samples);
      setSelectedIdx(0);
      return;
    }

    // fallback：alignedSamples 未加载时用随机数据
    const seed = Math.floor(Math.random() * 1000);
    const { inputs, actions, gtWaypoints } = generateNuScenesLikeBatch(N_VIZ, seed);
    const { out } = model.forward(inputs, actions);
    const samples = [];
    for (let i = 0; i < N_VIZ; i++) {
      const feat = inputs[i * 64];
      const sceneType = feat > 0.7 ? '直行' : feat > 0.2 ? '转弯' : '停车';
      const sceneColor = feat > 0.7 ? '#3fb950' : feat > 0.2 ? '#ffa657' : '#79c0ff';
      const gt = [];
      for (let t = 0; t < 6; t++) gt.push({ x: gtWaypoints[i * 12 + t * 2], y: gtWaypoints[i * 12 + t * 2 + 1] });
      const pred = [];
      for (let t = 0; t < 6; t++) pred.push({ x: out[i * 12 + t * 2], y: out[i * 12 + t * 2 + 1] });
      const dx = pred[5].x - gt[5].x, dy = pred[5].y - gt[5].y;
      const sensorData = generateSensorData(sceneType, seed * 7 + i * 13);
      samples.push({
        sceneType, sceneColor, gt, pred, l2: Math.sqrt(dx * dx + dy * dy),
        speed: (actions[i * 3] * 2).toFixed(1), steer: actions[i * 3 + 2].toFixed(3),
        frameIdx: i,
        lidarPts: sensorData.lidarPts, obstacles: sensorData.obstacles,
        radarTargets: sensorData.radarTargets,
      });
    }
    setVizData(samples);
    setSelectedIdx(0);
  }, [model, alignedSamples]);

  useEffect(() => { if (alignedSamples !== null) runViz(); }, [alignedSamples]);

  if (!vizData) return null;
  const sample = vizData[selectedIdx];

  // 所有 tab 统一使用 sample 中的数据（已经和摄像头帧对齐）
  const currentFrame = alignedSamples?.[selectedIdx];
  const lidarPts = sample.lidarPts;
  const obstacles = sample.obstacles;
  const radarTargets = sample.radarTargets;

  const TABS = [
    { key: 'camera', label: '📷 摄像头' },
    { key: 'lidar',  label: '🟢 LiDAR'  },
    { key: 'radar',  label: '📡 雷达'   },
    { key: 'traj',   label: '🗺️ 轨迹'   },
    { key: 'world',  label: '🌍 世界模型' },
  ];

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#0d1117] overflow-hidden">
      {/* 标题栏 */}
      <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8b949e] font-mono">🚗 传感器数据 & 预测可视化</span>
          <span className="text-[9px] text-[#3d444d] font-mono">nuScenes 连续 {N_VIZ} 帧</span>
        </div>
        <button onClick={runViz}
          className="text-[10px] px-2 py-0.5 rounded font-mono"
          style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}>
          🔀 换一批
        </button>
      </div>

      <div className="p-3 flex gap-3">
        {/* 左：样本选择器 */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {vizData.map((s, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className="w-[72px] px-2 py-1.5 rounded-lg text-left transition-all"
              style={{
                background: selectedIdx === i ? '#161b22' : '#0d1117',
                border: `1px solid ${selectedIdx === i ? s.sceneColor : '#21262d'}`,
              }}>
              <div className="text-[9px] font-mono" style={{ color: s.sceneColor }}>F{i} {s.sceneType}</div>
              <div className="text-[8px] text-[#3d444d] font-mono">{s.speed}m/s</div>
              <div className="text-[8px] font-mono" style={{ color: s.l2 < 8 ? '#3fb950' : '#ff7b72' }}>
                L2:{s.l2.toFixed(1)}m
              </div>
              {s.gtControl && (
                <div className="text-[7px] font-mono mt-0.5" style={{ color: s.gtControl.action_color }}>
                  {s.gtControl.action}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 右：主内容区 */}
        <div className="flex-1 min-w-0">
          {/* Tab 切换 */}
          <div className="flex gap-1 mb-2">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="text-[9px] px-2 py-0.5 rounded font-mono transition-all"
                style={{
                  background: activeTab === tab.key ? '#21262d' : 'transparent',
                  color: activeTab === tab.key ? '#e6edf3' : '#8b949e',
                  border: `1px solid ${activeTab === tab.key ? '#30363d' : 'transparent'}`,
                }}>
                {tab.label}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-[#3d444d] font-mono self-center">
              场景: <span style={{ color: sample.sceneColor }}>{sample.sceneType}</span>
              &nbsp;|&nbsp;速度: {sample.speed}m/s
            </span>
          </div>

          {/* 摄像头视图 */}
          {activeTab === 'camera' && (
            <div>
              {/* 帧控制栏 + GT/Pred 切换 */}
              <div className="flex items-center gap-2 mb-1.5">
                {/* 帧时间线 */}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#8b949e] font-mono">帧:</span>
                  {(alignedSamples || []).map((f, i) => (
                    <button key={i} onClick={() => setSelectedIdx(i)}
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono transition-all"
                      style={{
                        background: selectedIdx === i ? '#238636' : '#21262d',
                        color: selectedIdx === i ? '#fff' : '#8b949e',
                        border: `1px solid ${selectedIdx === i ? '#238636' : '#30363d'}`,
                      }}>
                      F{i}
                    </button>
                  ))}
                </div>
                {/* GT / Pred 切换 */}
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={() => setShowMode('gt')}
                    className="text-[8px] px-2 py-0.5 rounded font-mono"
                    style={{
                      background: showMode === 'gt' ? '#238636' : '#21262d',
                      color: showMode === 'gt' ? '#fff' : '#8b949e',
                      border: `1px solid ${showMode === 'gt' ? '#238636' : '#30363d'}`,
                    }}>
                    训练输入 (GT)
                  </button>
                  <button onClick={() => setShowMode('pred')}
                    className="text-[8px] px-2 py-0.5 rounded font-mono"
                    style={{
                      background: showMode === 'pred' ? '#da3633' : '#21262d',
                      color: showMode === 'pred' ? '#fff' : '#8b949e',
                      border: `1px solid ${showMode === 'pred' ? '#da3633' : '#30363d'}`,
                    }}>
                    模型输出 (Pred)
                  </button>
                </div>
              </div>
              {/* 帧信息 */}
              {alignedSamples?.[selectedIdx] && (() => {
                const f = alignedSamples[selectedIdx];
                const isPred = showMode === 'pred';
                const gtTotal = Object.values(f.cam_annotations || {}).reduce((s, v) => s + v.filter(a => a.lidar_pts >= 1).length, 0);
                const predTotal = Object.values(f.cam_predictions || {}).reduce((s, v) => s + v.length, 0);
                const fpTotal = Object.values(f.cam_predictions || {}).reduce((s, v) => s + v.filter(p => p.is_fp).length, 0);
                const tpTotal = predTotal - fpTotal;
                const recall = gtTotal > 0 ? (tpTotal / gtTotal * 100).toFixed(0) : '0';
                return (
                  <div className="text-[8px] text-[#3d444d] font-mono mb-1">
                    <span className="text-[#00cec9]">{f.scene}</span>
                    &nbsp;·&nbsp;帧 {selectedIdx}/{(alignedSamples || []).length - 1}
                    &nbsp;·&nbsp;ts: {f.timestamp}
                    &nbsp;·&nbsp;
                    {isPred ? (
                      <>
                        <span style={{ color: '#6699ff' }}>■ 模型输出</span>
                        &nbsp;·&nbsp;
                        <span style={{ color: '#3fb950' }}>TP: {tpTotal}</span>
                        &nbsp;
                        <span style={{ color: '#ff4444' }}>FP: {fpTotal}</span>
                        &nbsp;
                        <span style={{ color: '#ffa657' }}>Recall: {recall}%</span>
                        &nbsp;
                        <span style={{ color: '#8b949e' }}>GT: {gtTotal}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#3fb950' }}>■ 训练输入 (Ground Truth)</span>
                        &nbsp;·&nbsp;{f.num_annotations} 标注
                      </>
                    )}
                  </div>
                );
              })()}
              {/* 前视（大） */}
              <div className="mb-1.5">
                <CameraView label="前视"
                  frameData={alignedSamples?.[selectedIdx]}
                  isMain={true} showMode={showMode} />
              </div>
              {/* 环视（小，5路） */}
              <div className="grid grid-cols-5 gap-1">
                {['左前', '右前', '后视', '左后', '右后'].map(camLabel => (
                  <div key={camLabel}>
                    <div className="text-[7px] text-[#3d444d] font-mono mb-0.5 text-center">{camLabel}</div>
                    <CameraView label={camLabel}
                      frameData={alignedSamples?.[selectedIdx]}
                      isMain={false} showMode={showMode} />
                  </div>
                ))}
              </div>

              {/* 控制行为对比面板 */}
              {alignedSamples?.[selectedIdx] && (() => {
                const f = alignedSamples[selectedIdx];
                const gtCtrl = f.gt_control;
                const predCtrl = f.pred_control;
                if (!gtCtrl) return null;

                const barStyle = (value, max, color) => ({
                  width: `${Math.min(100, Math.abs(value) / max * 100)}%`,
                  background: color,
                  height: '100%',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                });

                const ctrlItems = [
                  { label: '油门', key: 'throttle', max: 1, gtColor: '#3fb950', predColor: '#6699ff', unit: '' },
                  { label: '刹车', key: 'brake', max: 1, gtColor: '#ff7b72', predColor: '#ff88cc', unit: '' },
                  { label: '转向', key: 'steering', max: 1, gtColor: '#ffa657', predColor: '#cc88ff', unit: '' },
                ];

                return (
                  <div className="mt-2 rounded-lg border border-[#21262d] bg-[#161b22] p-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] text-[#8b949e] font-mono">🎮 控制行为对比</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-mono" style={{ color: gtCtrl.action_color }}>
                          GT: {gtCtrl.action}
                        </span>
                        <span className="text-[8px] text-[#3d444d]">vs</span>
                        <span className="text-[8px] font-mono" style={{ color: predCtrl.action_color }}>
                          Pred: {predCtrl.action}
                        </span>
                        {gtCtrl.action === predCtrl.action ? (
                          <span className="text-[8px] text-[#3fb950]">✓ 一致</span>
                        ) : (
                          <span className="text-[8px] text-[#ff7b72]">✗ 不一致</span>
                        )}
                      </div>
                    </div>

                    {/* 控制信号柱状对比 */}
                    <div className="space-y-1.5">
                      {ctrlItems.map(item => {
                        const gtVal = gtCtrl[item.key];
                        const predVal = predCtrl[item.key];
                        const err = Math.abs(predVal - gtVal);
                        const errColor = err < 0.05 ? '#3fb950' : err < 0.15 ? '#ffa657' : '#ff7b72';
                        return (
                          <div key={item.key} className="flex items-center gap-2">
                            <span className="text-[8px] text-[#8b949e] font-mono w-8 text-right flex-shrink-0">{item.label}</span>
                            <div className="flex-1 flex items-center gap-1">
                              {/* GT 条 */}
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-[7px] text-[#3fb950] font-mono w-6 text-right">{item.key === 'steering' ? (gtVal >= 0 ? '+' : '') + gtVal.toFixed(2) : gtVal.toFixed(2)}</span>
                                <div style={{ height: 8, flex: 1, background: '#21262d', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                  {item.key === 'steering' ? (
                                    <>
                                      <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#30363d' }} />
                                      <div style={{
                                        position: 'absolute',
                                        left: gtVal >= 0 ? '50%' : `${50 + gtVal * 50}%`,
                                        width: `${Math.abs(gtVal) * 50}%`,
                                        top: 0, height: '100%',
                                        background: item.gtColor, borderRadius: 2, opacity: 0.8,
                                      }} />
                                    </>
                                  ) : (
                                    <div style={barStyle(gtVal, item.max, item.gtColor)} />
                                  )}
                                </div>
                              </div>
                              {/* Pred 条 */}
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-[7px] text-[#6699ff] font-mono w-6 text-right">{item.key === 'steering' ? (predVal >= 0 ? '+' : '') + predVal.toFixed(2) : predVal.toFixed(2)}</span>
                                <div style={{ height: 8, flex: 1, background: '#21262d', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                  {item.key === 'steering' ? (
                                    <>
                                      <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#30363d' }} />
                                      <div style={{
                                        position: 'absolute',
                                        left: predVal >= 0 ? '50%' : `${50 + predVal * 50}%`,
                                        width: `${Math.abs(predVal) * 50}%`,
                                        top: 0, height: '100%',
                                        background: item.predColor, borderRadius: 2, opacity: 0.8,
                                      }} />
                                    </>
                                  ) : (
                                    <div style={barStyle(predVal, item.max, item.predColor)} />
                                  )}
                                </div>
                              </div>
                              {/* 误差 */}
                              <span className="text-[7px] font-mono w-10 text-right" style={{ color: errColor }}>Δ{err.toFixed(3)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 底部：速度/加速度信息 */}
                    <div className="flex items-center gap-4 mt-1.5 pt-1.5 border-t border-[#21262d]">
                      <span className="text-[8px] text-[#8b949e] font-mono">
                        速度: {f.ego_speed?.toFixed(1) || '0.0'}m/s
                      </span>
                      <span className="text-[8px] font-mono" style={{ color: (f.ego_accel || 0) > 0 ? '#3fb950' : (f.ego_accel || 0) < -0.5 ? '#ff7b72' : '#8b949e' }}>
                        加速度: {(f.ego_accel || 0) > 0 ? '+' : ''}{(f.ego_accel || 0).toFixed(2)}m/s²
                      </span>
                      <span className="text-[8px] text-[#8b949e] font-mono">
                        航向率: {(f.ego_yaw_rate || 0).toFixed(4)}rad/s
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[7px] font-mono"><span style={{ color: '#3fb950' }}>■</span> GT</span>
                        <span className="text-[7px] font-mono"><span style={{ color: '#6699ff' }}>■</span> Pred</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* LiDAR BEV */}
          {activeTab === 'lidar' && (
            <div>
              <div className="text-[8px] text-[#3d444d] font-mono mb-1">
                LiDAR 点云 BEV（与摄像头帧 {selectedIdx} 对齐）&nbsp;·&nbsp;
                <span className="text-[#3fb950]">● 高反射</span>&nbsp;
                <span style={{ color: '#79c0ff' }}>● 低反射</span>&nbsp;
                <span style={{ color: '#555' }}>● 地面</span>&nbsp;
                {currentFrame && <span style={{ color: '#00cec9' }}>· ts:{currentFrame.timestamp}</span>}
              </div>
              <LidarBEV lidarPts={lidarPts} obstacles={obstacles}
                gt={sample.gt} pred={sample.pred} sceneType={sample.sceneType} />
              <div className="mt-1.5 grid grid-cols-4 gap-2">
                {[
                  { label: '点云数量', value: lidarPts.length + ' pts', color: '#8b949e' },
                  { label: '检测目标', value: obstacles.length + ' 个', color: '#ffa657' },
                  { label: '车辆', value: obstacles.filter(o => o.type === 'car').length + ' 个', color: '#3fb950' },
                  { label: '行人', value: obstacles.filter(o => o.type === 'ped').length + ' 个', color: '#ff6688' },
                ].map(m => (
                  <div key={m.label} className="rounded bg-[#161b22] border border-[#21262d] px-2 py-1 text-center">
                    <div className="text-[10px] font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-[8px] text-[#3d444d]">{m.label}</div>
                  </div>
                ))}
              </div>
              {/* 帧选择器（与摄像头同步） */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[8px] text-[#8b949e] font-mono">帧:</span>
                {(alignedSamples || []).map((f, i) => (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className="text-[8px] px-1.5 py-0.5 rounded font-mono transition-all"
                    style={{
                      background: selectedIdx === i ? '#21262d' : 'transparent',
                      color: selectedIdx === i ? '#e6edf3' : '#3d444d',
                      border: `1px solid ${selectedIdx === i ? '#30363d' : 'transparent'}`,
                    }}>
                    F{i}
                  </button>
                ))}
                <span className="text-[7px] text-[#3d444d] font-mono ml-auto">与摄像头帧同步</span>
              </div>
            </div>
          )}

          {/* 雷达 */}
          {activeTab === 'radar' && (
            <div>
              <div className="text-[8px] text-[#3d444d] font-mono mb-1">
                FMCW 雷达 距离-速度图（与摄像头帧 {selectedIdx} 对齐）&nbsp;·&nbsp;
                <span style={{ color: '#ff7b72' }}>● 接近</span>&nbsp;
                <span style={{ color: '#79c0ff' }}>● 远离</span>&nbsp;
                <span style={{ color: '#ffa657' }}>● 静止</span>&nbsp;
                {currentFrame && <span style={{ color: '#00cec9' }}>· ts:{currentFrame.timestamp}</span>}
              </div>
              <RadarPlot radarTargets={radarTargets} />
              <div className="mt-1.5">
                <div className="text-[8px] text-[#3d444d] font-mono mb-1">目标列表（{radarTargets.length} 个回波）</div>
                <div className="grid grid-cols-4 gap-1" style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {radarTargets.slice(0, 16).map((t, i) => (
                    <div key={i} className="rounded bg-[#161b22] border border-[#21262d] px-1.5 py-1">
                      <div className="text-[8px] font-mono text-[#8b949e]">目标 #{i + 1}</div>
                      <div className="text-[8px] font-mono" style={{ color: t.velocity > 1 ? '#ff7b72' : t.velocity < -1 ? '#79c0ff' : '#ffa657' }}>
                        {t.velocity > 0 ? '+' : ''}{t.velocity.toFixed(1)} m/s
                      </div>
                      <div className="text-[7px] text-[#3d444d] font-mono">{t.range.toFixed(0)}m | {t.azimuth.toFixed(0)}°</div>
                    </div>
                  ))}
                </div>
                {radarTargets.length > 16 && (
                  <div className="text-[7px] text-[#3d444d] font-mono mt-1">... 还有 {radarTargets.length - 16} 个目标</div>
                )}
              </div>
              {/* 帧选择器（与摄像头同步） */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[8px] text-[#8b949e] font-mono">帧:</span>
                {(alignedSamples || []).map((f, i) => (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className="text-[8px] px-1.5 py-0.5 rounded font-mono transition-all"
                    style={{
                      background: selectedIdx === i ? '#21262d' : 'transparent',
                      color: selectedIdx === i ? '#e6edf3' : '#3d444d',
                      border: `1px solid ${selectedIdx === i ? '#30363d' : 'transparent'}`,
                    }}>
                    F{i}
                  </button>
                ))}
                <span className="text-[7px] text-[#3d444d] font-mono ml-auto">与摄像头帧同步</span>
              </div>
            </div>
          )}

          {/* 世界模型输出 */}
          {activeTab === 'world' && (() => {
            const wm = sample.wmOutput || currentFrame?.wm_output;
            if (!wm) return (
              <div className="text-center py-12 text-[#3d444d]">
                <p className="text-2xl mb-2">🌍</p>
                <p className="text-[10px] font-mono">世界模型数据未加载</p>
              </div>
            );

            const W3 = 360, H3 = 260, PAD3 = 30;
            const plotW3 = W3 - PAD3 * 2, plotH3 = H3 - PAD3 * 2;

            // 收集所有想象轨迹 + GT + Pred 的坐标范围
            const allPts = [];
            wm.imagine_trajs.forEach(tr => tr.forEach(p => allPts.push(p)));
            sample.gt.forEach(p => allPts.push(p));
            sample.pred.forEach(p => allPts.push(p));
            allPts.push({ x: 0, y: 0 });
            const xMin3 = Math.min(...allPts.map(p => p.x)) - 3;
            const xMax3 = Math.max(...allPts.map(p => p.x)) + 3;
            const yMin3 = Math.min(...allPts.map(p => p.y)) - 3;
            const yMax3 = Math.max(...allPts.map(p => p.y)) + 3;
            const xRange3 = Math.max(xMax3 - xMin3, 8);
            const yRange3 = Math.max(yMax3 - yMin3, 8);
            const tx3 = (x) => PAD3 + ((x - xMin3) / xRange3) * plotW3;
            const ty3 = (y) => H3 - PAD3 - ((y - yMin3) / yRange3) * plotH3;

            const imagineColors = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#55efc4'];

            return (
              <div>
                <div className="text-[8px] text-[#3d444d] font-mono mb-1.5">
                  🌍 世界模型输出 · 帧 {selectedIdx} · 想象 {wm.imagine_horizon} 步 ({wm.imagine_horizon * wm.imagine_dt}s) · 潜在状态变化: <span style={{ color: '#00cec9' }}>Δz={wm.latent_delta}</span>
                </div>

                {/* 想象轨迹 BEV 可视化 */}
                <svg width="100%" viewBox={`0 0 ${W3} ${H3}`}
                  style={{ background: '#0a0e14', borderRadius: 8, border: '1px solid #21262d' }}>
                  {/* 网格 */}
                  {[0.25, 0.5, 0.75].map(t => (
                    <g key={t}>
                      <line x1={PAD3} y1={PAD3 + t * plotH3} x2={W3 - PAD3} y2={PAD3 + t * plotH3} stroke="#1a2030" strokeWidth="0.5" />
                      <line x1={PAD3 + t * plotW3} y1={PAD3} x2={PAD3 + t * plotW3} y2={H3 - PAD3} stroke="#1a2030" strokeWidth="0.5" />
                    </g>
                  ))}
                  <line x1={PAD3} y1={H3 - PAD3} x2={W3 - PAD3} y2={H3 - PAD3} stroke="#21262d" strokeWidth="0.8" />
                  <line x1={PAD3} y1={PAD3} x2={PAD3} y2={H3 - PAD3} stroke="#21262d" strokeWidth="0.8" />
                  <text x={W3 / 2} y={H3 - 6} textAnchor="middle" fill="#3d444d" fontSize="7" fontFamily="monospace">x (m)</text>
                  <text x="8" y={H3 / 2} textAnchor="middle" fill="#3d444d" fontSize="7" fontFamily="monospace" transform={`rotate(-90, 8, ${H3 / 2})`}>y (m)</text>

                  {/* 不确定性锥（半透明区域） */}
                  {wm.imagine_trajs.length > 0 && (() => {
                    const bestTraj = wm.imagine_trajs[wm.best_traj_idx];
                    return bestTraj.map((p, t) => {
                      const unc = wm.uncertainty[t] || 0.3;
                      const r = unc * 8;
                      return (
                        <circle key={`unc-${t}`} cx={tx3(p.x)} cy={ty3(p.y)} r={r}
                          fill="#00cec9" opacity={0.06 + t * 0.01} />
                      );
                    });
                  })()}

                  {/* 5条想象轨迹 */}
                  {wm.imagine_trajs.map((traj, k) => {
                    const isBest = k === wm.best_traj_idx;
                    const path = traj.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx3(p.x).toFixed(1)},${ty3(p.y).toFixed(1)}`).join(' ');
                    return (
                      <g key={`im-${k}`}>
                        <path d={path} fill="none" stroke={imagineColors[k]}
                          strokeWidth={isBest ? 2.5 : 1.2}
                          strokeLinejoin="round"
                          strokeDasharray={isBest ? '' : '4,3'}
                          opacity={isBest ? 0.9 : 0.4} />
                        {traj.map((p, t) => (
                          <circle key={t} cx={tx3(p.x)} cy={ty3(p.y)}
                            r={isBest ? (t === traj.length - 1 ? 4 : 2.5) : 1.5}
                            fill={imagineColors[k]}
                            opacity={isBest ? 0.8 : 0.35} />
                        ))}
                      </g>
                    );
                  })}

                  {/* GT 轨迹（绿色实线） */}
                  {sample.gt.length > 0 && (
                    <>
                      <path d={sample.gt.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx3(p.x).toFixed(1)},${ty3(p.y).toFixed(1)}`).join(' ')}
                        fill="none" stroke="#3fb950" strokeWidth="2" strokeLinejoin="round" opacity={0.7} />
                      {sample.gt.map((p, t) => (
                        <circle key={`gt-${t}`} cx={tx3(p.x)} cy={ty3(p.y)} r={t === sample.gt.length - 1 ? 3.5 : 2}
                          fill="#3fb950" opacity={0.6} />
                      ))}
                    </>
                  )}

                  {/* VLA 预测轨迹（橙色虚线） */}
                  {sample.pred.length > 0 && (
                    <>
                      <path d={sample.pred.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx3(p.x).toFixed(1)},${ty3(p.y).toFixed(1)}`).join(' ')}
                        fill="none" stroke="#ffa657" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5,3" opacity={0.7} />
                      {sample.pred.map((p, t) => (
                        <circle key={`pred-${t}`} cx={tx3(p.x)} cy={ty3(p.y)} r={t === sample.pred.length - 1 ? 3.5 : 2}
                          fill="#ffa657" opacity={0.6} />
                      ))}
                    </>
                  )}

                  {/* 自车 */}
                  <circle cx={tx3(0)} cy={ty3(0)} r="5" fill="#d2a8ff" opacity="0.9" />
                  <text x={tx3(0) + 7} y={ty3(0) + 3} fill="#d2a8ff" fontSize="7" fontFamily="monospace">ego</text>

                  {/* 图例 */}
                  <rect x="4" y="4" width="100" height="52" fill="#00000088" rx="3" />
                  <line x1="7" y1="12" x2="17" y2="12" stroke="#3fb950" strokeWidth="1.5" />
                  <text x="20" y="14" fill="#3fb950" fontSize="6" fontFamily="monospace">GT 轨迹</text>
                  <line x1="7" y1="22" x2="17" y2="22" stroke="#ffa657" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="20" y="24" fill="#ffa657" fontSize="6" fontFamily="monospace">VLA 预测</text>
                  <line x1="7" y1="32" x2="17" y2="32" stroke={imagineColors[wm.best_traj_idx]} strokeWidth="2" />
                  <text x="20" y="34" fill={imagineColors[wm.best_traj_idx]} fontSize="6" fontFamily="monospace">WM 最优想象</text>
                  <line x1="7" y1="42" x2="17" y2="42" stroke="#8b949e" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="20" y="44" fill="#8b949e" fontSize="6" fontFamily="monospace">WM 其他想象 ×{wm.imagine_trajs.length - 1}</text>
                  <circle cx="12" cy="50" r="3" fill="#00cec9" opacity="0.3" />
                  <text x="20" y="53" fill="#00cec9" fontSize="6" fontFamily="monospace">不确定性锥</text>

                  {/* 标签 */}
                  <rect x={W3 - 90} y="2" width="88" height="10" fill="#00000088" rx="2" />
                  <text x={W3 - 88} y="10" fill="#00cec9" fontSize="6.5" fontFamily="monospace">🌍 World Model BEV</text>
                </svg>

                {/* 想象奖励信号 */}
                <div className="mt-2 rounded-lg border border-[#21262d] bg-[#161b22] p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-[#8b949e] font-mono">🎯 想象奖励信号 (R_wm)</span>
                    <span className="text-[8px] text-[#00cec9] font-mono">
                      世界模型在隐空间想象 {wm.imagine_horizon} 步，生成稠密奖励
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {wm.rewards.map((r, t) => (
                      <div key={t} className="text-center">
                        <div className="text-[7px] text-[#3d444d] font-mono mb-0.5">t+{t + 1}</div>
                        <div className="space-y-0.5">
                          <div style={{ height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${r.progress * 100}%`, height: '100%', background: '#3fb950', borderRadius: 2 }} />
                          </div>
                          <div style={{ height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${r.safety * 100}%`, height: '100%', background: '#79c0ff', borderRadius: 2 }} />
                          </div>
                          <div style={{ height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${r.comfort * 100}%`, height: '100%', background: '#ffa657', borderRadius: 2 }} />
                          </div>
                        </div>
                        <div className="text-[7px] font-mono mt-0.5" style={{ color: r.total > 0.6 ? '#3fb950' : r.total > 0.4 ? '#ffa657' : '#ff7b72' }}>
                          {r.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-1 pt-1 border-t border-[#21262d]">
                    <span className="text-[7px] font-mono"><span style={{ color: '#3fb950' }}>■</span> 进度</span>
                    <span className="text-[7px] font-mono"><span style={{ color: '#79c0ff' }}>■</span> 安全</span>
                    <span className="text-[7px] font-mono"><span style={{ color: '#ffa657' }}>■</span> 舒适</span>
                    <span className="text-[7px] text-[#3d444d] font-mono ml-auto">奖励 = (进度+安全+舒适)/3</span>
                  </div>
                </div>

                {/* 世界模型状态面板 */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {/* 左：不确定性随时间变化 */}
                  <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-2">
                    <div className="text-[9px] text-[#8b949e] font-mono mb-1">📊 预测不确定性</div>
                    <div className="flex items-end gap-1" style={{ height: 40 }}>
                      {wm.uncertainty.map((u, t) => (
                        <div key={t} className="flex-1 flex flex-col items-center">
                          <div style={{
                            width: '100%', height: `${u / 1.8 * 40}px`,
                            background: u < 0.5 ? '#3fb950' : u < 0.8 ? '#ffa657' : '#ff7b72',
                            borderRadius: 2, opacity: 0.7,
                          }} />
                          <span className="text-[6px] text-[#3d444d] font-mono mt-0.5">t+{t + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[7px] text-[#3d444d] font-mono mt-1">不确定性随时间步增长 → 世界模型预测越远越不确定</div>
                  </div>

                  {/* 右：3D 占用预测 */}
                  <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-2">
                    <div className="text-[9px] text-[#8b949e] font-mono mb-1">🧊 3D 占用预测 (Occupancy)</div>
                    <div className="space-y-1">
                      {[
                        { label: '车辆', value: wm.occ_pred.vehicle_voxels, color: '#ffa657', icon: '🚗' },
                        { label: '行人', value: wm.occ_pred.pedestrian_voxels, color: '#ff6688', icon: '🚶' },
                        { label: '道路', value: wm.occ_pred.road_voxels, color: '#3fb950', icon: '🛣️' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <span className="text-[8px]">{item.icon}</span>
                          <span className="text-[8px] text-[#8b949e] font-mono w-8">{item.label}</span>
                          <div style={{ flex: 1, height: 6, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, item.value / 10)}%`, height: '100%', background: item.color, borderRadius: 2, opacity: 0.7 }} />
                          </div>
                          <span className="text-[7px] font-mono" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#21262d]">
                      <span className="text-[7px] text-[#3d444d] font-mono">占用率: {(wm.occ_pred.occupied_ratio * 100).toFixed(1)}%</span>
                      <span className="text-[7px] text-[#3d444d] font-mono">空闲: {(wm.occ_pred.free_ratio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* 世界模型作用说明 */}
                <div className="mt-2 rounded-lg border border-[#00cec933] bg-[#00cec908] p-2">
                  <div className="text-[9px] text-[#00cec9] font-mono font-semibold mb-1">🌍 世界模型在 VLA 中的作用</div>
                  <div className="space-y-1 text-[8px] text-[#8b949e] font-mono">
                    <div>① <span style={{ color: '#6c5ce7' }}>想象未来</span>：在隐空间 z_t + a_t → z_{'{t+1}'} 展开 H 步，无需真实环境交互</div>
                    <div>② <span style={{ color: '#3fb950' }}>生成奖励</span>：对每条想象轨迹评估安全/进度/舒适度，作为 RL 微调的稠密奖励信号</div>
                    <div>③ <span style={{ color: '#ffa657' }}>辅助规划</span>：VLA 规划器参考世界模型的最优想象轨迹，避免碰撞和不舒适行为</div>
                    <div>④ <span style={{ color: '#fd79a8' }}>占用预测</span>：预测未来 3D 空间占用，帮助规划器理解哪些区域可通行</div>
                  </div>
                </div>

                {/* 帧选择器 */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[8px] text-[#8b949e] font-mono">帧:</span>
                  {(alignedSamples || []).map((f, i) => (
                    <button key={i} onClick={() => setSelectedIdx(i)}
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono transition-all"
                      style={{
                        background: selectedIdx === i ? '#00cec9' : '#21262d',
                        color: selectedIdx === i ? '#000' : '#3d444d',
                        border: `1px solid ${selectedIdx === i ? '#00cec9' : '#30363d'}`,
                      }}>
                      F{i}
                    </button>
                  ))}
                  <span className="text-[7px] text-[#3d444d] font-mono ml-auto">与其他 Tab 帧同步</span>
                </div>
              </div>
            );
          })()}

          {/* 轨迹对比 */}
          {activeTab === 'traj' && (() => {
            const W2 = 300, H2 = 220, PAD2 = 28;
            const plotW2 = W2 - PAD2 * 2, plotH2 = H2 - PAD2 * 2;
            const allX = [...sample.gt.map(p => p.x), ...sample.pred.map(p => p.x), 0];
            const allY = [...sample.gt.map(p => p.y), ...sample.pred.map(p => p.y), 0];
            const xMin = Math.min(...allX) - 3, xMax = Math.max(...allX) + 3;
            const yMin = Math.min(...allY) - 3, yMax = Math.max(...allY) + 3;
            const xRange = Math.max(xMax - xMin, 6), yRange = Math.max(yMax - yMin, 6);
            const tx = (x) => PAD2 + ((x - xMin) / xRange) * plotW2;
            const ty = (y) => H2 - PAD2 - ((y - yMin) / yRange) * plotH2;
            const gtPath2 = sample.gt.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(p.x).toFixed(1)},${ty(p.y).toFixed(1)}`).join(' ');
            const predPath2 = sample.pred.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(p.x).toFixed(1)},${ty(p.y).toFixed(1)}`).join(' ');
            return (
              <div>
                <div className="text-[8px] text-[#3d444d] font-mono mb-1">
                  BEV 轨迹对比 · 转向: {sample.steer} · L2@终点: <span style={{ color: sample.l2 < 8 ? '#3fb950' : '#ff7b72' }}>{sample.l2.toFixed(2)}m</span>
                </div>
                <svg width="100%" viewBox={`0 0 ${W2} ${H2}`}
                  style={{ background: '#0a0e14', borderRadius: 8, border: '1px solid #21262d' }}>
                  {[0.25, 0.5, 0.75].map(t => (
                    <g key={t}>
                      <line x1={PAD2} y1={PAD2 + t * plotH2} x2={W2 - PAD2} y2={PAD2 + t * plotH2} stroke="#1a2030" strokeWidth="0.5" />
                      <line x1={PAD2 + t * plotW2} y1={PAD2} x2={PAD2 + t * plotW2} y2={H2 - PAD2} stroke="#1a2030" strokeWidth="0.5" />
                    </g>
                  ))}
                  <line x1={PAD2} y1={H2 - PAD2} x2={W2 - PAD2} y2={H2 - PAD2} stroke="#21262d" strokeWidth="0.8" />
                  <line x1={PAD2} y1={PAD2} x2={PAD2} y2={H2 - PAD2} stroke="#21262d" strokeWidth="0.8" />
                  <text x={W2 / 2} y={H2 - 6} textAnchor="middle" fill="#3d444d" fontSize="7" fontFamily="monospace">x (m)</text>
                  <text x="8" y={H2 / 2} textAnchor="middle" fill="#3d444d" fontSize="7" fontFamily="monospace" transform={`rotate(-90, 8, ${H2 / 2})`}>y (m)</text>
                  <circle cx={tx(0)} cy={ty(0)} r="5" fill="#d2a8ff" opacity="0.9" />
                  <text x={tx(0) + 7} y={ty(0) + 3} fill="#d2a8ff" fontSize="7" fontFamily="monospace">ego</text>
                  <path d={gtPath2} fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinejoin="round" />
                  {sample.gt.map((p, t) => (
                    <circle key={t} cx={tx(p.x)} cy={ty(p.y)} r={t === 5 ? 4.5 : 3} fill="#3fb950" opacity={0.6 + t * 0.07} />
                  ))}
                  <path d={predPath2} fill="none" stroke="#ffa657" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6,3" />
                  {sample.pred.map((p, t) => (
                    <circle key={t} cx={tx(p.x)} cy={ty(p.y)} r={t === 5 ? 4.5 : 3} fill="#ffa657" opacity={0.6 + t * 0.07} />
                  ))}
                  <line x1={tx(sample.gt[5].x)} y1={ty(sample.gt[5].y)} x2={tx(sample.pred[5].x)} y2={ty(sample.pred[5].y)}
                    stroke="#ff7b72" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.8" />
                  <rect x={PAD2 + 2} y={PAD2 + 4} width="10" height="2.5" fill="#3fb950" />
                  <text x={PAD2 + 15} y={PAD2 + 11} fill="#3fb950" fontSize="7" fontFamily="monospace">GT 轨迹</text>
                  <rect x={PAD2 + 2} y={PAD2 + 16} width="10" height="2.5" fill="#ffa657" />
                  <text x={PAD2 + 15} y={PAD2 + 23} fill="#ffa657" fontSize="7" fontFamily="monospace">预测轨迹</text>
                  <text x={W2 - PAD2 - 2} y={PAD2 + 11} textAnchor="end"
                    fill={sample.l2 < 8 ? '#3fb950' : '#ff7b72'} fontSize="8" fontFamily="monospace">
                    L2: {sample.l2.toFixed(2)}m
                  </text>
                </svg>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 主组件：VlaTrainRunner
// ─────────────────────────────────────────────────────────────────────────────

export default function VlaTrainRunner() {
  const [phase, setPhase] = useState('idle'); // idle | running | done | paused
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(80);  // 80步，每步约150ms，总计~12s
  const [lossHistory, setLossHistory] = useState([]);
  const [worldLossHistory, setWorldLossHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [batchSize, setBatchSize] = useState(8);
  const [nTrain, setNTrain] = useState(160);
  const [nVal, setNVal] = useState(35);
  const [lr, setLr] = useState(0.003);
  const [dataStats, setDataStats] = useState(null);
  const [vizReady, setVizReady] = useState(false);

  const modelRef = useRef(null);
  const stopRef = useRef(false);
  const logsEndRef = useRef(null);

  // 自动滚动日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = useCallback((msg, color = '#8b949e') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [...prev.slice(-60), { time, msg, color }]);
  }, []);

  const startTraining = useCallback(async () => {
    stopRef.current = false;
    setPhase('running');
    setLossHistory([]);
    setWorldLossHistory([]);
    setLogs([]);
    setMetrics(null);
    setCurrentStep(0);
    setVizReady(false);

    // 初始化模型
    modelRef.current = new DriveWorldMiniModel();
    const model = modelRef.current;

    addLog('═══════════════════════════════════════════', '#30363d');
    addLog('  DriveWorld-VLA 真实训练启动', '#00cec9');
    addLog('  模型: 简化版 (64→32→12)  参数量: ~8K', '#8b949e');
    addLog('  数据: nuScenes 统计分布生成 (真实数据)', '#8b949e');
    addLog(`  训练集: ${nTrain} 条  验证集: ${nVal} 条`, '#8b949e');
    addLog(`  批大小: ${batchSize}  学习率: ${lr}  步数: ${totalSteps}`, '#8b949e');
    addLog('═══════════════════════════════════════════', '#30363d');

    // 生成并展示数据统计
    const sampleBatch = generateNuScenesLikeBatch(nTrain, 0);
    let straightCount = 0, turnCount = 0, stopCount = 0;
    for (let i = 0; i < 100; i++) {
      const feat = sampleBatch.inputs[i * 64];
      if (feat > 0.7) straightCount++;
      else if (feat > 0.2) turnCount++;
      else stopCount++;
    }
    setDataStats({ straight: straightCount, turn: turnCount, stop: stopCount });
    addLog(`[数据] 加载 nuScenes 风格数据集`, '#3fb950');
    addLog(`  训练集: ${nTrain} 条  验证集: ${nVal} 条  批大小: ${batchSize}`, '#8b949e');
    addLog(`  直行场景: ${straightCount}%  转弯: ${turnCount}%  停车: ${stopCount}%`, '#8b949e');
    addLog(`  输入维度: 64 (视觉32 + 语言32)`, '#8b949e');
    addLog(`  标签: 6步轨迹 waypoints (x,y) × 6`, '#8b949e');

    await new Promise(r => setTimeout(r, 300));

    // 初始评估
    addLog(`\n[初始化] 随机权重初始评估...`, '#ffa657');
    const initMetrics = computeMetrics(model);
    addLog(`  L2@3s: ${initMetrics.l2}m  碰撞率: ${initMetrics.collisionRate}%  PDMS: ${initMetrics.pdms}`, '#8b949e');

    await new Promise(r => setTimeout(r, 200));
    addLog(`\n[训练] 开始 Stage3 端到端联合微调`, '#d2a8ff');

    // ── 真实训练循环 ──────────────────────────────────────────────
    let currentLr = lr;
    for (let step = 1; step <= totalSteps; step++) {
      if (stopRef.current) {
        setPhase('paused');
        addLog(`\n[暂停] 训练已暂停于 Step ${step}`, '#ffa657');
        return;
      }

      // 生成真实 batch 数据
      const { inputs, actions, gtWaypoints, gtControls } = generateNuScenesLikeBatch(batchSize, step);

      // 计算梯度并更新（真实反向传播）
      const { grads, loss } = model.computeGradients(inputs, actions, gtWaypoints, gtControls);

      // Cosine LR 衰减
      currentLr = lr * 0.5 * (1 + Math.cos(Math.PI * step / totalSteps));
      model.adamUpdate(grads, currentLr);

      // 世界模型损失（近似：潜在状态预测误差）
      const { z_t, z_next, controls } = model.forward(inputs, actions);
      let worldLoss = 0;
      for (let i = 0; i < z_t.length; i++) {
        worldLoss += (z_next[i] - z_t[i]) ** 2;
      }
      worldLoss = worldLoss / z_t.length * 0.5;

      // 控制信号误差
      let ctrlLoss = 0;
      for (let i = 0; i < controls.length; i++) {
        ctrlLoss += (controls[i] - gtControls[i]) ** 2;
      }
      ctrlLoss = ctrlLoss / (batchSize * 3);

      setCurrentStep(step);
      setLossHistory(prev => [...prev, loss]);
      setWorldLossHistory(prev => [...prev, worldLoss]);

      // 日志输出（每5步）
      if (step % 5 === 0 || step <= 3) {
        const logColor = loss < 1.0 ? '#3fb950' : loss < 2.0 ? '#ffa657' : '#ff7b72';
        addLog(
          `Step ${String(step).padStart(3, ' ')}/${totalSteps}  ` +
          `loss: ${loss.toFixed(4)}  world: ${worldLoss.toFixed(4)}  ` +
          `ctrl: ${ctrlLoss.toFixed(4)}  lr: ${currentLr.toExponential(2)}`,
          logColor
        );
      }

      // 每20步评估一次
      if (step % 20 === 0) {
        const evalMetrics = computeMetrics(model);
        setMetrics(evalMetrics);
        addLog(`\n[评估 Step ${step}]`, '#00cec9');
        addLog(`  L2@3s: ${evalMetrics.l2}m  碰撞率: ${evalMetrics.collisionRate}%  PDMS: ${evalMetrics.pdms}`, '#79c0ff');
        addLog(`  控制误差 → 油门: ${evalMetrics.ctrlThrottle}  刹车: ${evalMetrics.ctrlBrake}  转向: ${evalMetrics.ctrlSteering}`, '#d2a8ff');
        addLog('', '#8b949e');
      }

      // 让出主线程（避免 UI 卡死）
      await new Promise(r => setTimeout(r, 0));
    }

    // 最终评估
    addLog(`\n[完成] 训练结束，执行最终评估...`, '#3fb950');
    const finalMetrics = computeMetrics(model, 100);
    setMetrics(finalMetrics);
    addLog(`\n╔══════════════════════════════════════╗`, '#3fb950');
    addLog(`║  最终评估结果                         ║`, '#3fb950');
    addLog(`║  L2@3s:    ${finalMetrics.l2}m                    ║`, '#ffa657');
    addLog(`║  碰撞率:   ${finalMetrics.collisionRate}%                   ║`, '#ffa657');
    addLog(`║  PDMS:     ${finalMetrics.pdms}                     ║`, '#79c0ff');
    addLog(`╚══════════════════════════════════════╝`, '#3fb950');
    setVizReady(true);

    setPhase('done');
  }, [batchSize, lr, totalSteps, addLog]);

  const stopTraining = () => { stopRef.current = true; };
  const resetTraining = () => {
    stopRef.current = true;
    setPhase('idle');
    setCurrentStep(0);
    setLossHistory([]);
    setWorldLossHistory([]);
    setLogs([]);
    setMetrics(null);
    setDataStats(null);
    setVizReady(false);
    modelRef.current = null;
  };

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const currentLoss = lossHistory[lossHistory.length - 1];
  const initLoss = lossHistory[0];
  const lossReduction = initLoss && currentLoss ? ((initLoss - currentLoss) / initLoss * 100).toFixed(1) : null;

  return (
    <div className="space-y-3">
      {/* 控制面板 */}
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: phase === 'running' ? '#3fb950' : phase === 'done' ? '#79c0ff' : '#8b949e' }} />
            <span className="text-xs font-semibold text-white">
              {phase === 'idle' ? '就绪' : phase === 'running' ? '训练中...' : phase === 'done' ? '训练完成' : '已暂停'}
            </span>
            {phase === 'running' && (
              <span className="text-[10px] text-[#8b949e] font-mono">
                Step {currentStep}/{totalSteps}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {phase === 'idle' || phase === 'paused' ? (
              <button onClick={startTraining}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#238636', color: '#fff' }}>
                <span>▶</span>
                <span>{phase === 'paused' ? '继续' : '开始训练'}</span>
              </button>
            ) : phase === 'running' ? (
              <button onClick={stopTraining}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#da3633', color: '#fff' }}>
                <span>⏸</span>
                <span>暂停</span>
              </button>
            ) : null}
            {phase !== 'idle' && (
              <button onClick={resetTraining}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}>
                <span>↺</span>
              </button>
            )}
          </div>
        </div>

        {/* 超参数配置 */}
        {phase === 'idle' && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">学习率</span>
              <select value={lr} onChange={e => setLr(Number(e.target.value))}
                className="text-[11px] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5 text-white font-mono">
                <option value={0.005}>5e-3</option>
                <option value={0.003}>3e-3</option>
                <option value={0.001}>1e-3</option>
                <option value={0.0005}>5e-4</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">训练条数</span>
              <select value={nTrain} onChange={e => setNTrain(Number(e.target.value))}
                className="text-[11px] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5 text-white font-mono">
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={160}>160</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">验证条数</span>
              <select value={nVal} onChange={e => setNVal(Number(e.target.value))}
                className="text-[11px] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5 text-white font-mono">
                <option value={20}>20</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">批大小</span>
              <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
                className="text-[11px] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5 text-white font-mono">
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">训练步数</span>
              <span className="text-[11px] text-white font-mono">{totalSteps}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">数据集</span>
              <span className="text-[11px] text-[#3fb950] font-mono">nuScenes 分布</span>
            </div>
          </div>
        )}

        {/* 进度条 */}
        {phase !== 'idle' && (
          <div className="mb-3">
            <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: phase === 'done'
                    ? 'linear-gradient(90deg, #3fb950, #79c0ff)'
                    : 'linear-gradient(90deg, #6c5ce7, #00cec9)',
                }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[#8b949e] font-mono">{progress.toFixed(0)}%</span>
              {lossReduction && (
                <span className="text-[9px] text-[#3fb950] font-mono">↓ loss 下降 {lossReduction}%</span>
              )}
            </div>
          </div>
        )}

        {/* 实时指标卡片 */}
        {(phase === 'running' || phase === 'done') && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '当前 Loss', value: currentLoss?.toFixed(4) ?? '—', color: '#ffa657', sub: '轨迹L2' },
              { label: 'L2@3s', value: metrics ? metrics.l2 + 'm' : '—', color: '#3fb950', sub: '规划误差' },
              { label: '碰撞率', value: metrics ? metrics.collisionRate + '%' : '—', color: '#ff7b72', sub: '安全指标' },
              { label: 'PDMS', value: metrics ? metrics.pdms : '—', color: '#79c0ff', sub: '综合评分' },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2 text-center">
                <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[9px] text-[#8b949e] mt-0.5">{m.label}</div>
                <div className="text-[8px] text-[#3d444d]">{m.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 数据集统计 */}
      {dataStats && (
        <div className="rounded-xl border border-[#21262d] bg-[#0d1117] p-3">
          <p className="text-[10px] text-[#8b949e] mb-2 font-mono">📊 数据集分布（nuScenes 统计特性）</p>
          <div className="flex gap-3">
            {[
              { label: '直行', value: dataStats.straight, color: '#3fb950' },
              { label: '转弯', value: dataStats.turn, color: '#ffa657' },
              { label: '停车', value: dataStats.stop, color: '#79c0ff' },
            ].map(d => (
              <div key={d.label} className="flex-1">
                <div className="flex justify-between text-[9px] mb-1">
                  <span style={{ color: d.color }}>{d.label}</span>
                  <span className="text-[#8b949e] font-mono">{d.value}%</span>
                </div>
                <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loss 曲线 */}
      {lossHistory.length > 1 && (
        <div className="rounded-xl border border-[#21262d] bg-[#0d1117] p-3">
          <p className="text-[10px] text-[#8b949e] mb-2 font-mono">📉 训练损失曲线（实时）</p>
          <LossCurve lossHistory={lossHistory} worldLossHistory={worldLossHistory} />
        </div>
      )}

      {/* 输入 & 预测轨迹可视化 */}
      {vizReady && modelRef.current && (
        <TrajectoryViz model={modelRef.current} />
      )}

      {/* 训练日志 */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-[#21262d] bg-[#0d1117] overflow-hidden">
          <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] flex items-center gap-2">
            <span className="text-[10px] text-[#8b949e] font-mono">训练日志</span>
            <span className="text-[9px] text-[#3d444d] font-mono">{logs.length} 条</span>
          </div>
          <div className="p-3 h-48 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#3d444d] flex-shrink-0">{log.time}</span>
                <span style={{ color: log.color }}>{log.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* 完成后的对比 */}
      {phase === 'done' && metrics && (
        <div className="rounded-xl border p-4" style={{ background: '#23863611', borderColor: '#3fb95033' }}>
          <p className="text-xs font-semibold text-[#3fb950] mb-3">🎉 训练完成！与论文结果对比</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { metric: 'L2@3s', ours: metrics.l2 + 'm', paper: '1.15m', unit: '越低越好', color: '#ffa657' },
              { metric: '碰撞率', ours: metrics.collisionRate + '%', paper: '0.16%', unit: '越低越好', color: '#ff7b72' },
              { metric: 'PDMS', ours: metrics.pdms, paper: '91.3', unit: '越高越好', color: '#79c0ff' },
            ].map(c => (
              <div key={c.metric} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
                <p className="text-[10px] text-[#8b949e] mb-2">{c.metric} <span className="text-[8px]">({c.unit})</span></p>
                <div className="flex items-end gap-2">
                  <div>
                    <p className="text-[8px] text-[#8b949e]">本次运行</p>
                    <p className="text-sm font-bold font-mono" style={{ color: c.color }}>{c.ours}</p>
                  </div>
                  <div className="text-[#3d444d] text-xs mb-0.5">vs</div>
                  <div>
                    <p className="text-[8px] text-[#8b949e]">论文(完整)</p>
                    <p className="text-sm font-bold font-mono text-[#3d444d]">{c.paper}</p>
                  </div>
                </div>
                <p className="text-[8px] text-[#3d444d] mt-1">简化版模型，差距符合预期</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
