'use client';

/**
 * ArchDiagram — Sebastian Raschka 风格的 LLM 架构图组件
 * 白底 + 灰色嵌套框 + 粉色 Attention Block + ⊕ 残差 + 右侧参数标注
 * 接受 factSheet 参数动态渲染每个模型的具体架构
 */

/* ── 颜色方案（Raschka 风格） ── */
const COLORS = {
  blue:    { fill: '#007AFF', stroke: '#0056B3', text: '#ffffff', light: '#EBF5FB' },
  green:   { fill: '#34C759', stroke: '#248A3D', text: '#ffffff', light: '#E8F5E9' },
  orange:  { fill: '#FF9500', stroke: '#C45500', text: '#ffffff', light: '#FFF8E1' },
  red:     { fill: '#FF3B30', stroke: '#D70015', text: '#ffffff', light: '#FFEBEE' },
  purple:  { fill: '#AF52DE', stroke: '#8944AB', text: '#ffffff', light: '#F3E5F5' },
  gray:    { fill: '#F2F2F7', stroke: '#8E8E93', text: '#1a1a2e', light: '#F9F9F9' },
  cyan:    { fill: '#00C7BE', stroke: '#009E97', text: '#ffffff', light: '#E0F7FA' },
};

const MAGENTA = '#C2185B';  // 参数标注高亮色（品红）
const PINK_BG = '#F3D9E0';  // Attention Block 背景
const DARK_ATTN = '#555555'; // Attention 层深灰
const LIGHT_GRAY = '#F5F5F5'; // 外层背景
const BORDER_GRAY = '#BDBDBD'; // 边框灰
const BLOCK_BG = '#E8E8E8';   // Block 外框背景

/* ── 通用圆角矩形 Layer ── */
function LayerBox({ x, y, w, h, label, fill = '#fff', stroke = BORDER_GRAY, textColor = '#333', fontSize = 11, rx = 8 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fill={textColor} fontSize={fontSize} fontWeight="500">{label}</text>
    </g>
  );
}

/* ── ⊕ 残差连接符号 ── */
function ResidualPlus({ cx, cy, r = 10 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={BORDER_GRAY} strokeWidth="1.5" />
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#333" strokeWidth="1.5" />
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="#333" strokeWidth="1.5" />
    </g>
  );
}

/* ── × 乘法符号 ── */
function MultiplyCross({ cx, cy, r = 10 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={BORDER_GRAY} strokeWidth="1.5" />
      <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} stroke="#333" strokeWidth="1.5" />
      <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} stroke="#333" strokeWidth="1.5" />
    </g>
  );
}

/* ── 虚线标注（右侧引出参数） ── */
function Annotation({ x1, y1, x2, y2, label, value, align = 'left' }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth="1" strokeDasharray="4 3" />
      <circle cx={x1} cy={y1} r="2" fill="#999" />
      <text x={x2 + (align === 'left' ? 6 : -6)} y={y2 - 4} textAnchor={align === 'left' ? 'start' : 'end'} fill="#333" fontSize="10" fontWeight="600">{label}</text>
      {value && <text x={x2 + (align === 'left' ? 6 : -6)} y={y2 + 10} textAnchor={align === 'left' ? 'start' : 'end'} fill={MAGENTA} fontSize="11" fontWeight="700">{value}</text>}
    </g>
  );
}

/* ── 箭头线 ── */
function Arrow({ x1, y1, x2, y2, color = '#666' }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" markerEnd="url(#raschka-arrow)" />;
}

/* ══════════════════════════════════════════════════════════════
   TransformerBlockSVG — Raschka 风格 Decoder-Only 架构图
   自下而上：Tokenized text → Embedding → Block × N → LM Head
   ══════════════════════════════════════════════════════════════ */
function TransformerBlockSVG({ factSheet = {}, modelName = '', width = 620 }) {
  const fs = factSheet;
  const name = modelName || 'Decoder-Only Transformer';
  const layers = fs.layers || 'N';
  const hiddenSize = fs.hiddenSize || 'd';
  const heads = fs.heads || 'H';
  const vocab = fs.vocab || 'V';
  const context = fs.context || fs.ctx || '';
  const activation = fs.activation || 'SwiGLU';
  const attnType = fs.attention || 'Grouped-query attention';
  const norm = fs.normalization || 'RMSNorm';
  const pos = fs.positionalEncoding || 'RoPE';

  // 计算 FFN 中间维度（约 4× hidden）
  const ffnDim = fs.ffnDim || (hiddenSize !== 'd' ? `${Math.round(parseInt(hiddenSize) * 3.5).toLocaleString()}` : '4d');

  const totalH = 780;
  const cx = 260;  // 主轴中心 x
  const bw = 200;  // layer 宽度
  const bx = cx - bw / 2; // layer 左边 x

  // 自下而上的 y 坐标
  const Y = {
    title: 22,
    output: 60,
    lmHead: 95,
    finalNorm: 145,
    // Block 区域
    blockTop: 185,
    plus2: 210,
    ffn: 240,
    norm2: 290,
    plus1: 330,
    attn: 360,
    norm1: 420,
    blockBot: 460,
    // Block 下方
    embed: 510,
    tokenized: 570,
    inputLabel: 610,
  };

  return (
    <svg viewBox={`0 0 ${width} 640`} className="w-full max-w-[620px]" style={{ fontFamily: "'Helvetica Neue', Arial, 'PingFang SC', sans-serif" }}>
      {/* 外层圆角背景 */}
      <rect x="5" y="5" width={width - 10} height="630" rx="16" fill={LIGHT_GRAY} stroke={BORDER_GRAY} strokeWidth="1" />

      {/* 标题 */}
      <text x={cx} y={Y.title} textAnchor="middle" dominantBaseline="central" fill="#111" fontSize="16" fontWeight="800">{name}</text>

      {/* ── 顶部：Linear output layer ── */}
      <LayerBox x={bx} y={Y.output} w={bw} h={30} label="Linear output layer" />
      <Arrow x1={cx} y1={Y.output + 30} x2={cx} y2={Y.lmHead} />

      {/* Final RMSNorm */}
      <LayerBox x={bx} y={Y.lmHead} w={bw} h={30} label={`Final ${norm}`} />
      <Arrow x1={cx} y1={Y.lmHead + 30} x2={cx} y2={Y.blockTop} />

      {/* ── Transformer Block 外框（灰色） ── */}
      <rect x={bx - 30} y={Y.blockTop} width={bw + 60} height={Y.blockBot - Y.blockTop} rx="12" fill={BLOCK_BG} stroke={BORDER_GRAY} strokeWidth="1.5" />

      {/* Attention 粉色背景区域 */}
      <rect x={bx - 20} y={Y.norm1 - 10} width={bw + 40} height={Y.plus1 - Y.norm1 + 40} rx="10" fill={PINK_BG} stroke="none" />

      {/* ⊕ Residual 2 (FFN 后) */}
      <ResidualPlus cx={cx + 30} cy={Y.plus2} />
      {/* 残差跳线 2 */}
      <path d={`M${cx + 30},${Y.norm2 + 30} L${cx + 30},${Y.plus2 + 10}`} fill="none" stroke="#666" strokeWidth="1" />
      <path d={`M${bx + bw + 30},${Y.norm2 + 15} L${cx + 40},${Y.plus2}`} fill="none" stroke="#666" strokeWidth="1" strokeDasharray="none" />
      {/* 右侧跳线 */}
      <path d={`M${bx + bw + 30},${Y.plus2} L${bx + bw + 30},${Y.norm2 + 15}`} fill="none" stroke="#666" strokeWidth="1" />

      {/* Feed forward */}
      <LayerBox x={bx} y={Y.ffn} w={bw} h={32} label="Feed forward" />
      <Arrow x1={cx} y1={Y.ffn + 32} x2={cx} y2={Y.norm2} />

      {/* RMSNorm 2 */}
      <LayerBox x={bx} y={Y.norm2} w={bw} h={28} label={`${norm} 2`} />
      <Arrow x1={cx} y1={Y.norm2 + 28} x2={cx} y2={Y.plus1 - 10} />

      {/* ⊕ Residual 1 (Attention 后) */}
      <ResidualPlus cx={cx + 30} cy={Y.plus1} />
      {/* 残差跳线 1 */}
      <path d={`M${bx + bw + 30},${Y.plus1} L${bx + bw + 30},${Y.norm1 + 14}`} fill="none" stroke="#666" strokeWidth="1" />

      {/* Masked grouped-query attention */}
      <LayerBox x={bx + 10} y={Y.attn} w={bw - 20} h={40} label={attnType.length > 20 ? attnType.slice(0, 20) : attnType} fill={DARK_ATTN} stroke="#444" textColor="#fff" fontSize={attnType.length > 18 ? 9 : 10} />

      {/* RMSNorm 1 */}
      <LayerBox x={bx} y={Y.norm1} w={bw} h={28} label={`${norm} 1`} />

      {/* Block 内连线 */}
      <Arrow x1={cx} y1={Y.plus2 + 10} x2={cx} y2={Y.ffn} />
      <Arrow x1={cx} y1={Y.attn + 40} x2={cx} y2={Y.plus1 - 10} />
      <Arrow x1={cx} y1={Y.norm1 + 28} x2={cx} y2={Y.attn} />

      {/* Block 重复次数标注（左下角，品红色） */}
      <text x={bx - 25} y={Y.blockBot - 5} textAnchor="end" fill={MAGENTA} fontSize="14" fontWeight="800">{layers} ×</text>

      {/* ── RoPE 外挂（左侧） ── */}
      <LayerBox x={bx - 120} y={Y.attn + 5} w={70} h={28} label={pos} fontSize={10} />
      <line x1={bx - 50} y1={Y.attn + 19} x2={bx + 10} y2={Y.attn + 19} stroke="#666" strokeWidth="1" markerEnd="url(#raschka-arrow)" />

      {/* Block → Embedding 连线 */}
      <Arrow x1={cx} y1={Y.blockBot} x2={cx} y2={Y.embed} />

      {/* ── Token embedding layer ── */}
      <LayerBox x={bx - 10} y={Y.embed} w={bw + 20} h={32} label="Token embedding layer" />
      <Arrow x1={cx} y1={Y.embed + 32} x2={cx} y2={Y.tokenized} />

      {/* Tokenized text */}
      <LayerBox x={bx + 10} y={Y.tokenized} w={bw - 20} h={28} label="Tokenized text" fill="#fff" stroke={BORDER_GRAY} />

      {/* Sample input text 标签 */}
      <text x={cx} y={Y.inputLabel} textAnchor="middle" fill="#666" fontSize="10" fontStyle="italic">Sample input text</text>
      <Arrow x1={cx} y1={Y.inputLabel + 6} x2={cx} y2={Y.tokenized + 28} />

      {/* ══════════ 右侧参数标注 ══════════ */}
      {/* Vocabulary size */}
      <Annotation x1={cx + 20} y1={Y.output - 5} x2={width - 150} y2={Y.output - 10} label="Vocabulary size of" value={vocab} />

      {/* Heads */}
      {heads !== 'H' && (
        <Annotation x1={bx + bw + 5} y1={Y.attn + 15} x2={width - 150} y2={Y.attn} label="" value={`${heads} heads`} />
      )}

      {/* Hidden layer dimension */}
      {hiddenSize !== 'd' && (
        <Annotation x1={bx + bw + 5} y1={Y.ffn + 16} x2={width - 150} y2={Y.ffn + 5} label="Hidden layer dimension of" value={hiddenSize} />
      )}

      {/* Embedding dimension */}
      {hiddenSize !== 'd' && (
        <Annotation x1={bx + bw + 15} y1={Y.embed + 16} x2={width - 150} y2={Y.embed + 10} label="Embedding dimension of" value={hiddenSize} />
      )}

      {/* Context length */}
      {context && (
        <Annotation x1={bx - 25} y1={Y.attn + 35} x2={20} y2={Y.blockBot + 5} label="Supported context length of" value={context} align="left" />
      )}

      {/* ══════════ 右侧 FFN 展开细节 ══════════ */}
      <g transform={`translate(${width - 175}, ${Y.norm2 - 60})`}>
        <rect x="0" y="0" width="155" height="110" rx="10" fill="#fff" stroke={BORDER_GRAY} strokeWidth="1" />
        {/* FFN 内部结构 */}
        <LayerBox x={10} y={10} w={60} h={22} label="Linear" fontSize={8} />
        <LayerBox x={85} y={10} w={60} h={22} label="Linear" fontSize={8} />
        <LayerBox x={10} y={75} w={60} h={22} label="Linear" fontSize={8} />
        {/* SiLU / SwiGLU */}
        <LayerBox x={25} y={42} w={55} h={22} label={activation.includes('SwiGLU') ? 'SiLU activation' : activation} fontSize={7.5} />
        {/* × 符号 */}
        <MultiplyCross cx={105} cy={53} r={8} />
        {/* 连线 */}
        <line x1="40" y1="32" x2="40" y2="42" stroke="#666" strokeWidth="1" />
        <line x1="52" y1="64" x2="52" y2="75" stroke="#666" strokeWidth="1" />
        <line x1="115" y1="32" x2="115" y2="45" stroke="#666" strokeWidth="1" />
        <line x1="105" y1="61" x2="70" y2="86" stroke="#666" strokeWidth="1" />
        <line x1="70" y1="86" x2="70" y2="75" stroke="#666" strokeWidth="1" markerEnd="url(#raschka-arrow)" />
        {/* 标注 */}
        <text x="78" y="105" textAnchor="middle" fill="#999" fontSize="7">Feed Forward Detail ({activation})</text>
      </g>
      {/* FFN 展开连线 */}
      <line x1={bx + bw} y1={Y.ffn + 16} x2={width - 175} y2={Y.norm2 - 5} stroke="#999" strokeWidth="0.8" strokeDasharray="3 3" />

      {/* 箭头定义 */}
      <defs>
        <marker id="raschka-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MoEArchSVG — Raschka 风格 MoE 架构图
   DeepSeek V3 / Qwen3 MoE 风格
   ══════════════════════════════════════════════════════════════ */
function MoEArchSVG({ factSheet = {}, modelName = '', width = 660 }) {
  const fs = factSheet;
  const name = modelName || 'MoE Transformer';
  const layers = fs.layers || 'N';
  const vocab = fs.vocab || '128K';
  const attnType = fs.attention || 'MLA';
  const experts = fs.experts || '256 experts + 1 shared, Top-8';
  const norm = fs.normalization || 'RMSNorm';
  const pos = fs.positionalEncoding || 'RoPE';
  const activation = fs.activation || 'SwiGLU';
  const precision = fs.precision || '';
  const context = fs.context || '';

  const cx = 280;
  const bw = 210;
  const bx = cx - bw / 2;

  return (
    <svg viewBox={`0 0 ${width} 750`} className="w-full max-w-[660px]" style={{ fontFamily: "'Helvetica Neue', Arial, 'PingFang SC', sans-serif" }}>
      {/* 外层背景 */}
      <rect x="5" y="5" width={width - 10} height="740" rx="16" fill={LIGHT_GRAY} stroke={BORDER_GRAY} strokeWidth="1" />

      {/* 标题 */}
      <text x={cx} y="28" textAnchor="middle" fill="#111" fontSize="16" fontWeight="800">{name}</text>

      {/* ── 顶部 ── */}
      <LayerBox x={bx} y={50} w={bw} h={28} label="Linear output layer" />
      <Arrow x1={cx} y1={78} x2={cx} y2={95} />
      <LayerBox x={bx} y={95} w={bw} h={28} label={`Final ${norm}`} />
      <Arrow x1={cx} y1={123} x2={cx} y2={140} />

      {/* ── MoE Block 外框 ── */}
      <rect x={bx - 35} y={140} width={bw + 70} height={420} rx="12" fill={BLOCK_BG} stroke={BORDER_GRAY} strokeWidth="1.5" />

      {/* ── MoE 部分（上半）── */}
      {/* ⊕ Residual 2 */}
      <ResidualPlus cx={cx + 35} cy={165} />
      <path d={`M${bx + bw + 35},${165} L${bx + bw + 35},${230}`} fill="none" stroke="#666" strokeWidth="1" />

      {/* DeepSeekMoE / MoE Router */}
      <rect x={bx - 15} y={190} width={bw + 30} height={140} rx="10" fill="#FFF0F0" stroke="#E57373" strokeWidth="1.5" />
      <text x={cx} y={205} textAnchor="middle" fill="#C62828" fontSize="9" fontWeight="700">DeepSeekMoE</text>

      {/* Router */}
      <LayerBox x={bx + 15} y={215} w={bw - 30} h={26} label="Router (Sigmoid → Top-K)" fill="#E57373" stroke="#C62828" textColor="#fff" fontSize={9} />

      {/* Experts 可视化 */}
      {[
        { x: bx - 5, label: 'Shared', sub: '始终激活', fill: '#A5D6A7', stroke: '#66BB6A' },
        { x: bx + 50, label: 'Expert 1', sub: activation, fill: '#CE93D8', stroke: '#AB47BC' },
        { x: bx + 105, label: 'Expert 2', sub: activation, fill: '#CE93D8', stroke: '#AB47BC' },
        { x: bx + 160, label: '···', sub: '', fill: 'none', stroke: 'none' },
      ].map((e, i) => (
        <g key={i}>
          {e.fill !== 'none' ? (
            <>
              <rect x={e.x} y={252} width={48} height={35} rx="5" fill={e.fill} stroke={e.stroke} strokeWidth="1" />
              <text x={e.x + 24} y={265} textAnchor="middle" fill="#333" fontSize="7" fontWeight="600">{e.label}</text>
              <text x={e.x + 24} y={278} textAnchor="middle" fill="#666" fontSize="6">{e.sub}</text>
            </>
          ) : (
            <text x={e.x + 24} y={272} textAnchor="middle" fill="#AB47BC" fontSize="14" fontWeight="700">···</text>
          )}
          {e.fill !== 'none' && <line x1={cx} y1={241} x2={e.x + 24} y2={252} stroke="#999" strokeWidth="0.8" />}
        </g>
      ))}

      {/* 加权合并 */}
      <LayerBox x={bx + 15} y={298} w={bw - 30} h={22} label="加权合并" fill="#FFCDD2" stroke="#E57373" textColor="#C62828" fontSize={9} />
      {/* Experts → Merge 连线 */}
      {[bx + 19, bx + 74, bx + 129].map((ex, i) => (
        <line key={i} x1={ex} y1={287} x2={cx} y2={298} stroke="#E57373" strokeWidth="0.8" opacity="0.5" />
      ))}

      <Arrow x1={cx} y1={320} x2={cx} y2={340} />

      {/* RMSNorm 2 */}
      <LayerBox x={bx} y={340} w={bw} h={26} label={`${norm} 2`} />
      <Arrow x1={cx} y1={366} x2={cx} y2={385} />

      {/* ⊕ Residual 1 */}
      <ResidualPlus cx={cx + 35} cy={390} />
      <path d={`M${bx + bw + 35},${390} L${bx + bw + 35},${450}`} fill="none" stroke="#666" strokeWidth="1" />

      {/* Attention 粉色背景 */}
      <rect x={bx - 15} y={410} width={bw + 30} height={70} rx="8" fill={PINK_BG} stroke="none" />

      {/* Attention */}
      <LayerBox x={bx + 10} y={420} w={bw - 20} h={36} label={attnType} fill={DARK_ATTN} stroke="#444" textColor="#fff" fontSize={attnType.length > 15 ? 9 : 10} />

      {/* RMSNorm 1 */}
      <LayerBox x={bx} y={500} w={bw} h={26} label={`${norm} 1`} />
      <Arrow x1={cx} y1={456} x2={cx} y2={500} />

      {/* Block 内连线 */}
      <Arrow x1={cx} y1={165 + 10} x2={cx} y2={190} />

      {/* RoPE 外挂 */}
      <LayerBox x={bx - 120} y={430} w={65} h={24} label={pos} fontSize={9} />
      <line x1={bx - 55} y1={442} x2={bx + 10} y2={442} stroke="#666" strokeWidth="1" markerEnd="url(#raschka-arrow-moe)" />

      {/* Block 重复次数 */}
      <text x={bx - 30} y={555} textAnchor="end" fill={MAGENTA} fontSize="14" fontWeight="800">{layers} ×</text>

      {/* Block → Embedding */}
      <Arrow x1={cx} y1={560} x2={cx} y2={585} />

      {/* Embedding */}
      <LayerBox x={bx - 10} y={585} w={bw + 20} h={30} label="Token embedding layer" />
      <Arrow x1={cx} y1={615} x2={cx} y2={640} />

      {/* Tokenized text */}
      <LayerBox x={bx + 10} y={640} w={bw - 20} h={26} label="Tokenized text" />

      <text x={cx} y={685} textAnchor="middle" fill="#666" fontSize="10" fontStyle="italic">Sample input text</text>

      {/* ══════════ 右侧参数标注 ══════════ */}
      <Annotation x1={cx + 30} y1={50} x2={width - 170} y2={42} label="Vocabulary size of" value={vocab} />

      <Annotation x1={bx + bw + 10} y1={440} x2={width - 170} y2={420} label="" value={attnType} />

      {context && (
        <Annotation x1={bx - 30} y1={500} x2={15} y2={560} label="Supported context length of" value={context} align="left" />
      )}

      <Annotation x1={bx + bw + 10} y1={260} x2={width - 170} y2={250} label="Experts:" value={experts.length > 30 ? experts.slice(0, 30) + '…' : experts} />

      {precision && (
        <Annotation x1={bx + bw + 10} y1={310} x2={width - 170} y2={305} label="Training precision:" value={precision} />
      )}

      <Annotation x1={bx + bw + 15} y1={595} x2={width - 170} y2={590} label="Embedding dimension of" value={fs.hiddenSize || 'd'} />

      {/* MTP 模块（可选，虚线） */}
      <rect x={width - 175} y={55} width={120} height={35} rx="8" fill="none" stroke={MAGENTA} strokeWidth="1" strokeDasharray="4 3" />
      <text x={width - 115} y={68} textAnchor="middle" fill={MAGENTA} fontSize="8" fontWeight="600">MTP Module</text>
      <text x={width - 115} y={80} textAnchor="middle" fill="#999" fontSize="7">Multi-Token Prediction</text>
      <line x1={bx + bw} y1={64} x2={width - 175} y2={72} stroke={MAGENTA} strokeWidth="0.8" strokeDasharray="3 3" />

      {/* 箭头定义 */}
      <defs>
        <marker id="raschka-arrow-moe" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   EvolutionPathSVG — 演进路线图（保持不变）
   ══════════════════════════════════════════════════════════════ */
function EvolutionPathSVG({ path, color }) {
  const w = 700;
  const h = 70;
  const nodeW = 100;
  const gap = (w - 40 - path.length * nodeW) / (path.length - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ fontFamily: "'Helvetica Neue', Arial, 'PingFang SC', sans-serif" }}>
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

/* ── 导出 ── */
export { TransformerBlockSVG, MoEArchSVG, EvolutionPathSVG, COLORS };