'use client';

/**
 * ArchDiagram — 专业的 SVG 模型架构图组件
 * 替代 ASCII 字符画（textArch），提供可交互的专业架构可视化
 */

/* ── 颜色方案（Apple 风格） ── */
const COLORS = {
  blue:    { fill: '#007AFF', stroke: '#0056B3', text: '#ffffff', light: '#EBF5FB' },
  green:   { fill: '#34C759', stroke: '#248A3D', text: '#ffffff', light: '#E8F5E9' },
  orange:  { fill: '#FF9500', stroke: '#C45500', text: '#ffffff', light: '#FFF8E1' },
  red:     { fill: '#FF3B30', stroke: '#D70015', text: '#ffffff', light: '#FFEBEE' },
  purple:  { fill: '#AF52DE', stroke: '#8944AB', text: '#ffffff', light: '#F3E5F5' },
  gray:    { fill: '#F2F2F7', stroke: '#8E8E93', text: '#1a1a2e', light: '#F9F9F9' },
  cyan:    { fill: '#00C7BE', stroke: '#009E97', text: '#ffffff', light: '#E0F7FA' },
};

/* ── 通用 Transformer Block SVG ── */
function TransformerBlockSVG({ width = 500, compact = false }) {
  const h = compact ? 380 : 520;
  const cx = width / 2;
  const bw = 180; // block width
  const bx = cx - bw / 2;

  const layers = [
    { y: 30,  h: 36, label: 'Input Tokens',           color: COLORS.gray,   sub: '' },
    { y: 80,  h: 40, label: 'Embedding',               color: COLORS.blue,   sub: 'vocab × d_model' },
    { y: 134, h: 36, label: '+ RoPE',                  color: COLORS.purple, sub: '旋转位置编码' },
    // Block start
    { y: 195, h: 36, label: 'RMSNorm',                 color: COLORS.green,  sub: '' },
    { y: 245, h: 42, label: 'Multi-Head Attention',    color: COLORS.orange, sub: 'MHA / GQA / MQA / MLA' },
    { y: 300, h: 30, label: '+ Residual',              color: COLORS.gray,   sub: '' },
    { y: 344, h: 36, label: 'RMSNorm',                 color: COLORS.green,  sub: '' },
    { y: 394, h: 42, label: 'FFN (SwiGLU) / MoE',     color: COLORS.purple, sub: 'd → 4d → d / Top-K Experts' },
    { y: 450, h: 30, label: '+ Residual',              color: COLORS.gray,   sub: '' },
  ];

  const bottom = [
    { y: compact ? 310 : 500, h: 36, label: 'RMSNorm (Final)',  color: COLORS.green, sub: '' },
    { y: compact ? 358 : 548, h: 40, label: 'LM Head',          color: COLORS.blue,  sub: 'd_model → vocab' },
    { y: compact ? 412 : 602, h: 36, label: 'Output Logits',    color: COLORS.gray,  sub: 'Next Token' },
  ];

  const totalH = compact ? 460 : 650;

  return (
    <svg viewBox={`0 0 ${width} ${totalH}`} className="w-full max-w-[500px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* 背景 */}
      <rect x="0" y="0" width={width} height={totalH} rx="12" fill="#FAFAFA" />

      {/* 上半部分：Embedding */}
      {layers.slice(0, 3).map((l, i) => (
        <g key={i}>
          <rect x={bx} y={l.y} width={bw} height={l.h} rx="8" fill={l.color.fill} stroke={l.color.stroke} strokeWidth="1.5" />
          <text x={cx} y={l.y + l.h / 2 - (l.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="11" fontWeight="600">{l.label}</text>
          {l.sub && <text x={cx} y={l.y + l.h / 2 + 10} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="8" opacity="0.7">{l.sub}</text>}
          {i < 2 && <line x1={cx} y1={l.y + l.h} x2={cx} y2={layers[i + 1].y} stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrow)" />}
        </g>
      ))}

      {/* 连接线到 Block */}
      <line x1={cx} y1={170} x2={cx} y2={185} stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrow)" />

      {/* Transformer Block 虚线框 */}
      <rect x={bx - 30} y={185} width={bw + 60} height={305} rx="10" fill="none" stroke="#007AFF" strokeWidth="2" strokeDasharray="6 4" />
      <rect x={cx - 70} y={182} width={140} height={18} rx="4" fill="#007AFF" />
      <text x={cx} y={192} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="9" fontWeight="700">× N Transformer Blocks</text>

      {/* Block 内部层 */}
      {layers.slice(3).map((l, i) => {
        const idx = i + 3;
        return (
          <g key={idx}>
            <rect x={bx} y={l.y} width={bw} height={l.h} rx="8" fill={l.color.fill} stroke={l.color.stroke} strokeWidth="1.5" />
            <text x={cx} y={l.y + l.h / 2 - (l.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="10" fontWeight="600">{l.label}</text>
            {l.sub && <text x={cx} y={l.y + l.h / 2 + 10} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="7.5" opacity="0.7">{l.sub}</text>}
            {idx < layers.length - 1 && <line x1={cx} y1={l.y + l.h} x2={cx} y2={layers[idx + 1].y} stroke="#C7C7CC" strokeWidth="1" markerEnd="url(#arrow)" />}
          </g>
        );
      })}

      {/* KV Cache 标注 */}
      <rect x={bx + bw + 15} y={252} width={70} height={28} rx="6" fill="#FF9500" stroke="#C45500" strokeWidth="1" opacity="0.7" />
      <text x={bx + bw + 50} y={267} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="8" fontWeight="600">KV Cache</text>
      <line x1={bx + bw} y1={266} x2={bx + bw + 15} y2={266} stroke="#FF9500" strokeWidth="1" strokeDasharray="3 2" />

      {/* Block 到 Final */}
      <line x1={cx} y1={490} x2={cx} y2={bottom[0].y} stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrow)" />

      {/* 底部层 */}
      {bottom.map((l, i) => (
        <g key={`b${i}`}>
          <rect x={bx} y={l.y} width={bw} height={l.h} rx="8" fill={l.color.fill} stroke={l.color.stroke} strokeWidth="1.5" />
          <text x={cx} y={l.y + l.h / 2 - (l.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="11" fontWeight="600">{l.label}</text>
          {l.sub && <text x={cx} y={l.y + l.h / 2 + 10} textAnchor="middle" dominantBaseline="middle" fill={l.color.text} fontSize="8" opacity="0.7">{l.sub}</text>}
          {i < bottom.length - 1 && <line x1={cx} y1={l.y + l.h} x2={cx} y2={bottom[i + 1].y} stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrow)" />}
        </g>
      ))}

      {/* 箭头定义 */}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#C7C7CC" />
        </marker>
      </defs>

      {/* 图例 */}
      <g transform="translate(15, 510)">
        <text x="0" y="0" fontSize="9" fontWeight="700" fill="#1a1a2e">图例</text>
        {[
          { color: COLORS.blue, label: 'Embedding / LM Head' },
          { color: COLORS.orange, label: 'Attention' },
          { color: COLORS.purple, label: 'FFN / Position' },
          { color: COLORS.green, label: 'Normalization' },
          { color: COLORS.red, label: 'MoE / MTP (可选)' },
        ].map((item, i) => (
          <g key={i} transform={`translate(0, ${14 + i * 18})`}>
            <rect x="0" y="0" width="14" height="10" rx="3" fill={item.color.fill} />
            <text x="20" y="8" fontSize="8" fill="#8E8E93">{item.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── MoE 架构 SVG ── */
function MoEArchSVG({ width = 560 }) {
  const cx = width / 2;
  const totalH = 480;

  return (
    <svg viewBox={`0 0 ${width} ${totalH}`} className="w-full max-w-[560px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <rect x="0" y="0" width={width} height={totalH} rx="12" fill="#FAFAFA" />

      {/* MLA 区域 */}
      <rect x="30" y="10" width={width - 60} height="180" rx="10" fill="#FFF8E1" stroke="#FF9500" strokeWidth="2" />
      <rect x={cx - 100} y="6" width="200" height="20" rx="4" fill="#FF9500" />
      <text x={cx} y="18" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="10" fontWeight="700">Multi-head Latent Attention (MLA)</text>

      {/* MLA 内部 */}
      <rect x="50" y="40" width="120" height="35" rx="6" fill="#FF9500" stroke="#C45500" strokeWidth="1" />
      <text x="110" y="58" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="600">Q Projection</text>

      <rect x={cx - 60} y="40" width="130" height="35" rx="6" fill="#FF3B30" stroke="#D70015" strokeWidth="1" />
      <text x={cx + 5} y="53" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="600">KV 低秩压缩</text>
      <text x={cx + 5} y="65" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="7" opacity="0.8">d → d_c (64× 压缩)</text>

      <rect x={width - 180} y="40" width="120" height="35" rx="6" fill="#AF52DE" stroke="#8944AB" strokeWidth="1" />
      <text x={width - 120} y="58" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="600">RoPE 解耦</text>

      {/* KV Cache */}
      <rect x="50" y="95" width="90" height="30" rx="6" fill="#FF3B30" stroke="#D70015" strokeWidth="1" opacity="0.8" />
      <text x="95" y="111" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="8" fontWeight="600">KV Cache</text>
      <text x="95" y="138" textAnchor="middle" dominantBaseline="middle" fill="#FF3B30" fontSize="7">仅存 d_c 向量</text>

      {/* Attention Compute */}
      <rect x={cx - 100} y="100" width="200" height="35" rx="6" fill="#FF9500" stroke="#C45500" strokeWidth="1.5" />
      <text x={cx} y="113" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="600">Attention Compute</text>
      <text x={cx} y="127" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="7" opacity="0.8">softmax(QK^T/√d)V</text>

      {/* 连线 Q → Attn */}
      <line x1="110" y1="75" x2="110" y2="85" stroke="#FF9500" strokeWidth="1" />
      <line x1="110" y1="85" x2={cx - 60} y2="85" stroke="#FF9500" strokeWidth="1" />
      <line x1={cx - 60} y1="85" x2={cx - 60} y2="100" stroke="#FF9500" strokeWidth="1" markerEnd="url(#arrowO)" />
      {/* KV → Attn */}
      <line x1={cx + 5} y1="75" x2={cx + 5} y2="100" stroke="#FF3B30" strokeWidth="1" markerEnd="url(#arrowR)" />
      {/* RoPE → Attn */}
      <line x1={width - 120} y1="75" x2={width - 120} y2="85" stroke="#AF52DE" strokeWidth="1" />
      <line x1={width - 120} y1="85" x2={cx + 60} y2="85" stroke="#AF52DE" strokeWidth="1" />
      <line x1={cx + 60} y1="85" x2={cx + 60} y2="100" stroke="#AF52DE" strokeWidth="1" markerEnd="url(#arrowP)" />

      {/* Residual */}
      <rect x={cx - 60} y="150" width="120" height="28" rx="6" fill="#F2F2F7" stroke="#8E8E93" strokeWidth="1" />
      <text x={cx} y="165" textAnchor="middle" dominantBaseline="middle" fill="#1a1a2e" fontSize="9" fontWeight="600">+ Residual</text>
      <line x1={cx} y1="135" x2={cx} y2="150" stroke="#C7C7CC" strokeWidth="1" markerEnd="url(#arrowG)" />

      {/* MoE 区域 */}
      <rect x="30" y="200" width={width - 60} height="230" rx="10" fill="#FFEBEE" stroke="#FF3B30" strokeWidth="2" />
      <rect x={cx - 90} y="196" width="180" height="20" rx="4" fill="#FF3B30" />
      <text x={cx} y="208" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="10" fontWeight="700">DeepSeekMoE (细粒度)</text>

      {/* Router */}
      <rect x={cx - 80} y="228" width="160" height="35" rx="6" fill="#FF3B30" stroke="#D70015" strokeWidth="1.5" />
      <text x={cx} y="241" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="600">Router (Sigmoid)</text>
      <text x={cx} y="255" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="7" opacity="0.8">无辅助损失负载均衡</text>

      <line x1={cx} y1="178" x2={cx} y2="228" stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrowG)" />

      {/* Experts */}
      {[
        { x: 50,  label: '共享专家', sub: '始终激活', color: COLORS.green },
        { x: 160, label: 'Expert 1', sub: 'SwiGLU', color: COLORS.purple },
        { x: 260, label: 'Expert 2', sub: 'SwiGLU', color: COLORS.purple },
        { x: 400, label: 'Expert 8', sub: 'SwiGLU', color: COLORS.purple },
      ].map((e, i) => (
        <g key={i}>
          <rect x={e.x} y="285" width="90" height="38" rx="6" fill={e.color.fill} stroke={e.color.stroke} strokeWidth="1" />
          <text x={e.x + 45} y="299" textAnchor="middle" dominantBaseline="middle" fill={e.color.text} fontSize="9" fontWeight="600">{e.label}</text>
          <text x={e.x + 45} y="314" textAnchor="middle" dominantBaseline="middle" fill={e.color.text} fontSize="7" opacity="0.8">{e.sub}</text>
          <line x1={cx} y1="263" x2={e.x + 45} y2="285" stroke={e.color.stroke} strokeWidth="1" opacity="0.6" />
        </g>
      ))}

      {/* 省略号 */}
      <text x="355" y="305" textAnchor="middle" dominantBaseline="middle" fill="#8944AB" fontSize="14" fontWeight="700">···</text>

      {/* 专家说明 */}
      <text x={cx} y="340" textAnchor="middle" dominantBaseline="middle" fill="#8944AB" fontSize="8" fontStyle="italic">256 个细粒度专家 · Top-8 激活 · d_ff=2048</text>

      {/* 加权合并 */}
      <rect x={cx - 80} y="355" width="160" height="30" rx="6" fill="#FF3B30" stroke="#D70015" strokeWidth="1" />
      <text x={cx} y="371" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="600">加权合并</text>

      {/* Experts → Merge */}
      {[95, 205, 305, 445].map((ex, i) => (
        <line key={i} x1={ex} y1="323" x2={cx} y2="355" stroke="#8944AB" strokeWidth="1" opacity="0.4" />
      ))}

      {/* Residual */}
      <rect x={cx - 60} y="400" width="120" height="28" rx="6" fill="#F2F2F7" stroke="#8E8E93" strokeWidth="1" />
      <text x={cx} y="415" textAnchor="middle" dominantBaseline="middle" fill="#1a1a2e" fontSize="9" fontWeight="600">+ Residual</text>
      <line x1={cx} y1="385" x2={cx} y2="400" stroke="#C7C7CC" strokeWidth="1" markerEnd="url(#arrowG)" />

      {/* LM Head + MTP */}
      <rect x={cx - 60} y="442" width="120" height="28" rx="6" fill="#007AFF" stroke="#0056B3" strokeWidth="1.5" />
      <text x={cx} y="457" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="600">LM Head</text>
      <line x1={cx} y1="428" x2={cx} y2="442" stroke="#C7C7CC" strokeWidth="1.5" markerEnd="url(#arrowG)" />

      <rect x={width - 150} y="442" width="100" height="28" rx="6" fill="#FF3B30" stroke="#D70015" strokeWidth="1" strokeDasharray="3 2" />
      <text x={width - 100} y="457" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="8" fontWeight="600">MTP Module</text>
      <line x1={cx + 60} y1="456" x2={width - 150} y2="456" stroke="#FF3B30" strokeWidth="1" strokeDasharray="3 2" />

      {/* 箭头定义 */}
      <defs>
        <marker id="arrowO" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5 Z" fill="#FF9500" /></marker>
        <marker id="arrowR" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5 Z" fill="#FF3B30" /></marker>
        <marker id="arrowP" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5 Z" fill="#AF52DE" /></marker>
        <marker id="arrowG" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5 Z" fill="#C7C7CC" /></marker>
      </defs>
    </svg>
  );
}

/* ── 架构演进路线 SVG ── */
function EvolutionPathSVG({ path, color, icon, title, benefit }) {
  const w = 700;
  const h = 70;
  const nodeW = 100;
  const gap = (w - 40 - path.length * nodeW) / (path.length - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <rect x="0" y="0" width={w} height={h} rx="10" fill={color.light} stroke={color.fill} strokeWidth="1.5" />
      {path.map((node, i) => {
        const x = 20 + i * (nodeW + gap);
        const isLast = i === path.length - 1;
        const isCurrent = i === path.length - 2;
        return (
          <g key={i}>
            <rect
              x={x} y={15} width={nodeW} height={40} rx="8"
              fill={isLast ? 'none' : isCurrent ? color.fill : i >= path.length - 3 ? color.fill : '#F2F2F7'}
              stroke={isLast ? color.fill : isCurrent ? color.stroke : '#8E8E93'}
              strokeWidth={isLast ? '1.5' : '1'}
              strokeDasharray={isLast ? '4 3' : 'none'}
              opacity={isLast ? 0.8 : 1}
            />
            <text
              x={x + nodeW / 2} y={30}
              textAnchor="middle" dominantBaseline="middle"
              fill={isLast ? color.fill : isCurrent || i >= path.length - 3 ? '#ffffff' : '#1a1a2e'}
              fontSize="9" fontWeight="600"
            >{node.name}</text>
            <text
              x={x + nodeW / 2} y={44}
              textAnchor="middle" dominantBaseline="middle"
              fill={isLast ? '#8E8E93' : isCurrent || i >= path.length - 3 ? 'rgba(255,255,255,0.7)' : '#8E8E93'}
              fontSize="7"
            >{node.model}</text>
            {i < path.length - 1 && (
              <line
                x1={x + nodeW} y1={35} x2={x + nodeW + gap} y2={35}
                stroke={color.fill} strokeWidth={isLast ? '1' : '1.5'}
                strokeDasharray={i === path.length - 2 ? '4 3' : 'none'}
                markerEnd={`url(#evo-arrow-${color.fill.replace('#', '')})`}
              />
            )}
          </g>
        );
      })}
      <defs>
        <marker id={`evo-arrow-${color.fill.replace('#', '')}`} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L6,2.5 L0,5 Z" fill={color.fill} />
        </marker>
      </defs>
    </svg>
  );
}

/* ── 导出主组件 ── */
export { TransformerBlockSVG, MoEArchSVG, EvolutionPathSVG, COLORS };