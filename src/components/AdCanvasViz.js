'use client';

import { useEffect, useRef } from 'react';

// ─── 工具：世界坐标 → Canvas 像素 ─────────────────────────────
function worldToCanvas(x, y, cx, cy, scale) {
  // nuScenes: x=前, y=左；Canvas: 右下为正
  return [cx - y * scale, cy - x * scale];
}

// ─── BEV LiDAR + 3D 框 Canvas ─────────────────────────────────
export function BevCanvas({ sample, width = 500, height = 500, showVelocity = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const SCALE = W / 110; // 1m = SCALE px，显示 ±55m

    // 背景
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // 网格
    ctx.strokeStyle = '#1e2130';
    ctx.lineWidth = 1;
    for (let r = 10; r <= 55; r += 10) {
      const pr = r * SCALE;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.stroke();
      // 距离标注
      ctx.fillStyle = '#3a3f52';
      ctx.font = '10px monospace';
      ctx.fillText(`${r}m`, cx + pr + 2, cy - 2);
    }
    // 十字线
    ctx.strokeStyle = '#2a2f42';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    // 前向指示
    ctx.fillStyle = '#4a5568';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('▲ FRONT', cx - 28, 18);

    // ── LiDAR 点云 ──
    sample.lidar.forEach((pt) => {
      const [px, py] = worldToCanvas(pt.x, pt.y, cx, cy, SCALE);
      if (px < 0 || px > W || py < 0 || py > H) return;
      // 强度 → 颜色（蓝→青→绿→黄）
      const t = pt.intensity;
      let r, g, b;
      if (t < 0.33) { r = 0; g = Math.round(t * 3 * 200); b = 255; }
      else if (t < 0.66) { r = 0; g = 200; b = Math.round((1 - (t - 0.33) * 3) * 255); }
      else { r = Math.round((t - 0.66) * 3 * 255); g = 200; b = 0; }
      ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    });

    // ── 3D 检测框（BEV 旋转矩形） ──
    sample.boxes.forEach((box) => {
      const [bx, by] = worldToCanvas(box.x, box.y, cx, cy, SCALE);
      const bw = box.w * SCALE, bl = box.l * SCALE;
      const yaw = box.yaw;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-yaw); // nuScenes yaw 方向

      // 框体
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-bl / 2, -bw / 2, bl, bw);

      // 朝向指示（前端加粗线）
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bl / 2 - 4, -bw / 2);
      ctx.lineTo(bl / 2, 0);
      ctx.lineTo(bl / 2 - 4, bw / 2);
      ctx.stroke();

      // 填充（半透明）
      ctx.fillStyle = box.color + '22';
      ctx.fillRect(-bl / 2, -bw / 2, bl, bw);

      ctx.restore();

      // 速度箭头
      if (showVelocity && (Math.abs(box.vel_x) > 0.5 || Math.abs(box.vel_y) > 0.5)) {
        const vscale = SCALE * 0.4;
        const [vex, vey] = worldToCanvas(box.x + box.vel_x, box.y + box.vel_y, cx, cy, SCALE);
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(vex, vey);
        ctx.stroke();
        // 箭头头
        const angle = Math.atan2(vey - by, vex - bx);
        ctx.beginPath();
        ctx.moveTo(vex, vey);
        ctx.lineTo(vex - 6 * Math.cos(angle - 0.4), vey - 6 * Math.sin(angle - 0.4));
        ctx.lineTo(vex - 6 * Math.cos(angle + 0.4), vey - 6 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = '#ffd32a';
        ctx.fill();
      }

      // 类别标签
      ctx.fillStyle = box.color;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${box.cls.slice(0, 3)} ${box.score}`, bx + 4, by - 4);
    });

    // ── 自车（中心） ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    // 车身
    ctx.beginPath();
    ctx.roundRect(-8, -16, 16, 32, 3);
    ctx.fill();
    ctx.stroke();
    // 前向标记
    ctx.fillStyle = '#6c5ce7';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-5, -14);
    ctx.lineTo(5, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── 自车历史轨迹 ──
    if (sample.ego_traj.length > 1) {
      ctx.strokeStyle = '#6c5ce7aa';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      sample.ego_traj.forEach((pt, i) => {
        const [px, py] = worldToCanvas(-pt.x, -pt.y, cx, cy, SCALE);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 图例
    const legend = [
      { color: '#00c8ff', label: '点云（低强度）' },
      { color: '#ffd32a', label: '速度向量' },
      { color: '#ffffff', label: '自车' },
    ];
    legend.forEach((l, i) => {
      ctx.fillStyle = l.color;
      ctx.fillRect(8, H - 18 - i * 16, 10, 10);
      ctx.fillStyle = '#8892a4';
      ctx.font = '10px sans-serif';
      ctx.fillText(l.label, 22, H - 10 - i * 16);
    });
  }, [sample, showVelocity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl w-full"
      style={{ background: '#0f1117' }}
    />
  );
}

// ─── 相机帧 Canvas（单路） ─────────────────────────────────────
export function CamFrameCanvas({ cam, width = 320, height = 180, compact = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const scene = cam.scene;

    // 天空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    if (scene.timeOfDay === 'night') {
      skyGrad.addColorStop(0, '#0a0e1a');
      skyGrad.addColorStop(1, '#1a2035');
    } else if (scene.weather === 'rain') {
      skyGrad.addColorStop(0, '#6b7280');
      skyGrad.addColorStop(1, '#9ca3af');
    } else {
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(1, '#b8d4e8');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.55);

    // 地面
    const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    groundGrad.addColorStop(0, scene.timeOfDay === 'night' ? '#1a1f2e' : '#6b7280');
    groundGrad.addColorStop(1, scene.timeOfDay === 'night' ? '#0d1117' : '#4b5563');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    // 道路标线（透视）
    if (cam.name === 'FRONT' || cam.name === 'BACK') {
      ctx.strokeStyle = scene.timeOfDay === 'night' ? '#ffffff55' : '#ffffff88';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      // 左车道线
      ctx.beginPath();
      ctx.moveTo(W * 0.35, H * 0.55);
      ctx.lineTo(W * 0.46, H);
      ctx.stroke();
      // 右车道线
      ctx.beginPath();
      ctx.moveTo(W * 0.65, H * 0.55);
      ctx.lineTo(W * 0.54, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 雨效果
    if (scene.weather === 'rain') {
      ctx.strokeStyle = 'rgba(180,200,255,0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const rx = Math.random() * W;
        const ry = Math.random() * H;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 2, ry + 8);
        ctx.stroke();
      }
    }

    // 夜间路灯光晕
    if (scene.timeOfDay === 'night') {
      const glow = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.3);
      glow.addColorStop(0, 'rgba(255,220,100,0.15)');
      glow.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    // 目标物 + 2D 检测框
    scene.objects.forEach((obj) => {
      const ox = obj.x * W, oy = obj.y * H;
      const ow = obj.w * W, oh = obj.h * H;

      // 目标物体（简单色块）
      ctx.fillStyle = obj.color + 'cc';
      ctx.beginPath();
      ctx.roundRect(ox - ow / 2, oy - oh / 2, ow, oh, 3);
      ctx.fill();

      // 检测框
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = compact ? 1.5 : 2;
      ctx.strokeRect(ox - ow / 2 - 2, oy - oh / 2 - 2, ow + 4, oh + 4);

      // 角标
      if (!compact) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(ox - ow / 2 - 2, oy - oh / 2 - 14, ow + 4, 13);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${obj.cls.slice(0, 3)} ${obj.score}`, ox - ow / 2, oy - oh / 2 - 3);
      }
    });

    // 相机名称标注
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, compact ? 16 : 20);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${compact ? 9 : 11}px monospace`;
    ctx.fillText(`CAM_${cam.name}`, 5, compact ? 12 : 15);

    // 天气/时间标注
    if (!compact) {
      ctx.fillStyle = scene.timeOfDay === 'night' ? '#a29bfe' : '#fdcb6e';
      ctx.font = '9px sans-serif';
      ctx.fillText(`${scene.timeOfDay === 'night' ? '🌙' : '☀️'} ${scene.weather === 'rain' ? '🌧' : ''}`, W - 30, 14);
    }
  }, [cam, compact]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg w-full"
    />
  );
}

// ─── Radar 极坐标 Canvas ───────────────────────────────────────
export function RadarCanvas({ sample, width = 400, height = 400 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.85; // 自车在底部
    const SCALE = H * 0.8 / 250; // 250m 量程

    // 背景
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // 扇形扫描区域（前向 ±70°）
    const startAngle = -Math.PI / 2 - (70 * Math.PI / 180);
    const endAngle = -Math.PI / 2 + (70 * Math.PI / 180);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.8);
    grad.addColorStop(0, 'rgba(0,200,100,0.08)');
    grad.addColorStop(1, 'rgba(0,200,100,0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, H * 0.8, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // 距离圆弧
    [50, 100, 150, 200, 250].forEach((r) => {
      const pr = r * SCALE;
      ctx.strokeStyle = '#1a2f1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, startAngle, endAngle);
      ctx.stroke();
      ctx.fillStyle = '#2a4a2a';
      ctx.font = '9px monospace';
      ctx.fillText(`${r}m`, cx + pr * Math.cos(endAngle) + 3, cy + pr * Math.sin(endAngle));
    });

    // 角度线
    [-60, -30, 0, 30, 60].forEach((deg) => {
      const rad = (-90 + deg) * Math.PI / 180;
      ctx.strokeStyle = '#1a2f1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 250 * SCALE * Math.cos(rad), cy + 250 * SCALE * Math.sin(rad));
      ctx.stroke();
      ctx.fillStyle = '#2a4a2a';
      ctx.font = '9px monospace';
      ctx.fillText(`${deg}°`, cx + 210 * SCALE * Math.cos(rad) - 8, cy + 210 * SCALE * Math.sin(rad));
    });

    // Radar 点
    sample.radar.forEach((pt) => {
      const angle = -Math.PI / 2 + pt.angle;
      const px = cx + pt.r * SCALE * Math.cos(angle);
      const py = cy + pt.r * SCALE * Math.sin(angle);
      if (px < 0 || px > W || py < 0 || py > H) return;

      // 速度 → 颜色（蓝=远离，红=靠近）
      const vNorm = Math.max(-1, Math.min(1, pt.vr / 20));
      const r = vNorm > 0 ? Math.round(vNorm * 255) : 0;
      const b = vNorm < 0 ? Math.round(-vNorm * 255) : 0;
      const g = Math.round((1 - Math.abs(vNorm)) * 180);

      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // 速度标注（大速度才显示）
      if (Math.abs(pt.vr) > 8) {
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.font = '8px monospace';
        ctx.fillText(`${pt.vr > 0 ? '+' : ''}${pt.vr.toFixed(0)}`, px + 5, py + 3);
      }
    });

    // 自车
    ctx.fillStyle = '#6c5ce7';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('EGO', cx - 10, cy + 16);

    // 图例
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(8, H - 50, 10, 10);
    ctx.fillStyle = '#8892a4';
    ctx.font = '10px sans-serif';
    ctx.fillText('靠近 (vr<0)', 22, H - 42);
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(8, H - 34, 10, 10);
    ctx.fillText('远离 (vr>0)', 22, H - 26);
    ctx.fillStyle = '#00b464';
    ctx.fillRect(8, H - 18, 10, 10);
    ctx.fillText('静止', 22, H - 10);
  }, [sample]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl w-full"
      style={{ background: '#0a0e1a' }}
    />
  );
}
