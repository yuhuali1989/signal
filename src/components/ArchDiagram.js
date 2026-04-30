'use client';

/**
 * ArchDiagram — Sebastian Raschka 风格 LLM 架构图
 * 精确对齐原图：U 形残差跳线、粉色覆盖整个 Block、shape 标注、参数标注
 */

/* ── 颜色 ── */
const COLORS = {
  blue:    { fill: '#007AFF', stroke: '#0056B3', text: '#ffffff', light: '#EBF5FB' },
  green:   { fill: '#34C759', stroke: '#248A3D', text: '#ffffff', light: '#E8F5E9' },
  orange:  { fill: '#FF9500', stroke: '#C45500', text: '#ffffff', light: '#FFF8E1' },
  red:     { fill: '#FF3B30', stroke: '#D70015', text: '#ffffff', light: '#FFEBEE' },
  purple:  { fill: '#AF52DE', stroke: '#8944AB', text: '#ffffff', light: '#F3E5F5' },
  gray:    { fill: '#F2F2F7', stroke: '#8E8E93', text: '#1a1a2e', light: '#F9F9F9' },
  cyan:    { fill: '#00C7BE', stroke: '#009E97', text: '#ffffff', light: '#E0F7FA' },
};

const M = '#5B6770';       // 深灰蓝标注色（替代品红，不刺眼）
const BLOCK_BG = '#EEF1F5'; // Block 内浅灰蓝背景（替代粉色）
const ATTN_BG = '#4A5568';  // Attention 深灰蓝
const BG = '#FAFBFC';       // 外层背景（更白）
const BD = '#CBD5E0';       // 边框灰蓝
const OUTER = '#D2D8E0';    // Block 外框
const MOE_BG = '#E8ECF1';   // MoE 区域背景
const MOE_BD = '#8896A6';   // MoE 区域边框
const EXPERT_FILL = '#B0BEC5'; // Expert 统一填充色
const EXPERT_BD = '#78909C';   // Expert 统一边框色
const ACCENT = '#37474F';   // 强调色（深灰蓝）

const FONT = "'Helvetica Neue', Arial, 'PingFang SC', sans-serif";

/* ── 圆角矩形 ── */
function Box({ x, y, w, h, label, fill = '#fff', stroke = BD, color = '#333', fs = 11, rx = 6, sub }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 5 : h / 2)} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={fs} fontWeight="500">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={fs - 2} opacity="0.7">{sub}</text>}
    </g>
  );
}

/* ── ⊕ 残差符号 ── */
function Plus({ cx, cy, r = 11 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={BD} strokeWidth="1.2" />
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#333" strokeWidth="1.5" />
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="#333" strokeWidth="1.5" />
    </g>
  );
}

/* ── × 乘法符号 ── */
function Cross({ cx, cy, r = 9 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={BD} strokeWidth="1.2" />
      <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} stroke="#333" strokeWidth="1.5" />
      <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} stroke="#333" strokeWidth="1.5" />
    </g>
  );
}

/* ── 虚线标注 ── */
function Note({ x1, y1, x2, y2, label, value, side = 'right' }) {
  const dx = side === 'right' ? 6 : -6;
  const anchor = side === 'right' ? 'start' : 'end';
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth="1" strokeDasharray="4 3" />
      <circle cx={x1} cy={y1} r="2.5" fill="#999" />
      {label && <text x={x2 + dx} y={y2 - 3} textAnchor={anchor} fill="#546E7A" fontSize="10" fontWeight="600">{label}</text>}
      {value && <text x={x2 + dx} y={y2 + 11} textAnchor={anchor} fill="#37474F" fontSize="10" fontWeight="700">{value}</text>}
    </g>
  );
}

/* ── Shape 标注（层间小字） ── */
function Shape({ x, y, text, anchor = 'middle' }) {
  if (!text) return null;
  return <text x={x} y={y} textAnchor={anchor} fill="#8896A6" fontSize="9" fontStyle="italic">{text}</text>;
}

/* ── 箭头线 ── */
function Arr({ x1, y1, x2, y2, id = 'arr' }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="1.5" markerEnd={`url(#${id})`} />;
}

/* ══════════════════════════════════════════════════════════════
   TransformerBlockSVG — Raschka 风格 Decoder-Only
   ══════════════════════════════════════════════════════════════ */
function TransformerBlockSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'Decoder-Only Transformer';
  const layers = f.layers || '?';
  const hidden = f.hiddenSize || '';
  const heads = f.heads || '';
  const kvHeads = f.kvHeads || '';
  const vocab = f.vocab || '?';
  const ctx = f.context || f.ctx || '';
  const act = f.activation || 'SwiGLU';
  const attn = f.attention || 'Grouped-query attention';
  const norm = f.normalization || 'RMSNorm';
  const pos = f.positionalEncoding || 'RoPE';
  const emb = f.embeddingDim || hidden || '';
  const ffn = f.ffnDim || (hidden ? `${Math.round(parseInt(hidden.replace(/,/g, '')) * 3.5)}` : '');

  // 去掉逗号的纯数字版本，用于 shape 标注
  const d = emb ? emb.replace(/,/g, '') : '';
  const dFFN = ffn ? ffn.replace(/,/g, '') : '';
  const V = vocab !== '?' ? vocab.replace(/,/g, '') : '';

  // 布局常量
  const W = 680;
  const cx = 250;       // 主轴中心
  const bw = 200;       // 层宽
  const bx = cx - bw / 2;  // 层左边
  const skipX = bx + bw + 25; // 残差跳线 x（右侧）

  // shape 文字 — 只在关键变化点标注
  const shEmb = d ? `(B, T, ${d})` : '';
  const shFFN = dFFN ? `(B, T, ${dFFN})` : '';
  const shOut = V ? `(B, T, ${V})` : '';

  return (
    <svg viewBox={`0 0 ${W} 720`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>

      {/* 外层背景 */}
      <rect x="5" y="5" width={W - 10} height="710" rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      {/* 标题 */}
      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="15" fontWeight="800">{name}</text>

      {/* ── 顶部 ── */}
      {/* Output shape — 只在最顶部标注 vocab 维度 */}
      <Shape x={cx} y={44} text={shOut} />
      {/* Linear output */}
      <Box x={bx} y={52} w={bw} h={28} label="Linear output layer" />
      <Arr x1={cx} y1={80} x2={cx} y2={95} id="arr" />

      {/* Final Norm */}
      <Box x={bx} y={95} w={bw} h={28} label={`Final ${norm}`} />
      {/* shape: Block 输出维度 */}
      <Shape x={cx} y={140} text={shEmb} />
      <Arr x1={cx} y1={123} x2={cx} y2={150} id="arr" />

      {/* ══ Transformer Block 外框 ══ */}
      <rect x={bx - 35} y={150} width={bw + 70} height={360} rx="12" fill={OUTER} stroke={BD} strokeWidth="1" />

      {/* Block 内背景 */}
      <rect x={bx - 25} y={160} width={bw + 50} height={340} rx="10" fill={BLOCK_BG} stroke="none" />

      {/* ── ⊕ Residual 2 (FFN 后) ── */}
      <Plus cx={cx} cy={178} />
      <path d={`M${skipX},${310} L${skipX},${178} L${cx + 11},${178}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <Arr x1={cx} y1={189} x2={cx} y2={210} id="arr" />

      {/* Feed forward */}
      <Box x={bx + 10} y={210} w={bw - 20} h={32} label="Feed forward" />
      <Arr x1={cx} y1={242} x2={cx} y2={265} id="arr" />

      {/* Norm 2 */}
      <Box x={bx + 10} y={265} w={bw - 20} h={28} label={`${norm} 2`} />
      <Arr x1={cx} y1={293} x2={cx} y2={320} id="arr" />
      <circle cx={cx} cy={305} r="2" fill="#78909C" />
      <line x1={cx} y1={305} x2={skipX} y2={305} stroke="#78909C" strokeWidth="1" />

      {/* ── ⊕ Residual 1 (Attention 后) ── */}
      <Plus cx={cx} cy={330} />
      <path d={`M${skipX},${460} L${skipX},${330} L${cx + 11},${330}`} fill="none" stroke="#78909C" strokeWidth="1" />
      {/* shape: 只在 Attention 输入处标注一次 */}
      <Shape x={cx} y={357} text={shEmb} />
      <Arr x1={cx} y1={341} x2={cx} y2={365} id="arr" />

      {/* Attention */}
      <Box x={bx + 15} y={365} w={bw - 30} h={42} label={`Masked ${attn}`}
        fill={ATTN_BG} stroke="#37474F" color="#fff"
        fs={attn.length > 22 ? 8.5 : attn.length > 16 ? 9.5 : 10.5} />
      <Arr x1={cx} y1={407} x2={cx} y2={430} id="arr" />

      {/* Norm 1 */}
      <Box x={bx + 10} y={430} w={bw - 20} h={28} label={`${norm} 1`} />
      <Arr x1={cx} y1={458} x2={cx} y2={490} id="arr" />
      <circle cx={cx} cy={468} r="2" fill="#78909C" />
      <line x1={cx} y1={468} x2={skipX} y2={468} stroke="#78909C" strokeWidth="1" />

      {/* Block 重复次数 */}
      <text x={bx - 30} y={505} textAnchor="end" fill={ACCENT} fontSize="14" fontWeight="700">{layers} ×</text>

      {/* ── RoPE 外挂（左侧） ── */}
      <Box x={bx - 130} y={375} w={75} h={26} label={pos} fs={10} />
      <line x1={bx - 55} y1={388} x2={bx + 15} y2={388} stroke="#666" strokeWidth="1" markerEnd="url(#arr)" />

      {/* Block → Embedding */}
      <Arr x1={cx} y1={510} x2={cx} y2={555} id="arr" />
      {/* shape: Embedding 输出维度 */}
      <Shape x={cx} y={540} text={shEmb} />

      {/* Embedding */}
      <Box x={bx - 15} y={555} w={bw + 30} h={32} label="Token + positional embedding layer" fs={10} />
      <Arr x1={cx} y1={587} x2={cx} y2={620} id="arr" />

      {/* Tokenized text */}
      <Box x={bx + 5} y={620} w={bw - 10} h={28} label="Tokenized text" />

      {/* Input label */}
      <text x={cx} y={665} textAnchor="middle" fill="#999" fontSize="9" fontStyle="italic">Sample input text</text>
      <Arr x1={cx} y1={660} x2={cx} y2={648} id="arr" />

      {/* ══════════ 右侧参数标注 ══════════ */}
      {/* Vocabulary size */}
      <Note x1={bx + bw + 5} y1={62} x2={W - 190} y2={48} label="Vocab size" value={vocab !== '?' ? vocab : undefined} />

      {/* Heads */}
      {heads && (
        <Note x1={bx + bw - 15} y1={375} x2={W - 190} y2={365}
          label={kvHeads ? `${heads}Q / ${kvHeads}KV heads` : `${heads} heads`}
          value="" />
      )}

      {/* Hidden + FFN dimension */}
      {hidden && (
        <Note x1={bx + bw - 10} y1={225} x2={W - 190} y2={215}
          label={`d_model=${hidden}${ffn ? `  d_ffn=${ffn}` : ''}`}
          value="" />
      )}

      {/* Embedding dimension */}
      {emb && (
        <Note x1={bx + bw + 20} y1={570} x2={W - 190} y2={570}
          label={`d_emb = ${emb}`} value="" />
      )}

      {/* Context length — RoPE 下方 */}
      {ctx && (
        <text x={bx - 92} y={415} textAnchor="middle" fill="#546E7A" fontSize="9" fontWeight="600">ctx = {ctx}</text>
      )}

      {/* ══════════ 右侧 FFN 展开 ══════════ */}
      <g transform={`translate(${W - 195}, 270)`}>
        <rect x="0" y="0" width="170" height="120" rx="10" fill="#FAFBFC" stroke={BD} strokeWidth="0.8" />
        <text x="85" y="14" textAnchor="middle" fill="#8896A6" fontSize="7.5" fontWeight="600">FFN Detail ({act})</text>

        {/* 上层两个 Linear */}
        <Box x={10} y={22} w={65} h={20} label="Linear" fs={7.5} rx={5} />
        <Box x={95} y={22} w={65} h={20} label="Linear" fs={7.5} rx={5} />

        {/* SiLU */}
        <Box x={10} y={55} w={65} h={20} label="SiLU" fs={7} rx={5} />

        {/* × */}
        <Cross cx={128} cy={65} r={8} />

        {/* 下层 Linear */}
        <Box x={35} y={90} w={65} h={20} label="Linear" fs={7.5} rx={5} />

        {/* 连线 */}
        <line x1="42" y1="42" x2="42" y2="55" stroke="#78909C" strokeWidth="0.8" />
        <line x1="128" y1="42" x2="128" y2="57" stroke="#78909C" strokeWidth="0.8" />
        <line x1="42" y1="75" x2="42" y2="82" stroke="#78909C" strokeWidth="0.8" />
        <line x1="120" y1="65" x2="75" y2="65" stroke="#78909C" strokeWidth="0.8" />
        <line x1="42" y1="82" x2="67" y2="90" stroke="#78909C" strokeWidth="0.8" markerEnd="url(#arr)" />
        <line x1="128" y1="73" x2="100" y2="90" stroke="#78909C" strokeWidth="0.8" />
      </g>
      {/* FFN 展开连线 */}
      <line x1={bx + bw - 10} y1={226} x2={W - 195} y2={310} stroke="#B0BEC5" strokeWidth="0.8" strokeDasharray="3 3" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MoEArchSVG — Raschka 风格 MoE 架构图
   ══════════════════════════════════════════════════════════════ */
function MoEArchSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'MoE Transformer';
  const layers = f.layers || '?';
  const hidden = f.hiddenSize || '';
  const vocab = f.vocab || '?';
  const attn = f.attention || 'MLA';
  const experts = f.experts || '';
  const norm = f.normalization || 'RMSNorm';
  const pos = f.positionalEncoding || 'RoPE';
  const act = f.activation || 'SwiGLU';
  const precision = f.precision || '';
  const ctx = f.context || '';
  const emb = f.embeddingDim || hidden || '';

  // 去掉逗号的纯数字版本，用于 shape 标注
  const d = emb ? emb.replace(/,/g, '') : '';
  const V = vocab !== '?' ? vocab.replace(/,/g, '') : '';
  const dFFN = f.ffnDim ? f.ffnDim.replace(/,/g, '') : '';

  const W = 700;
  const cx = 270;
  const bw = 210;
  const bx = cx - bw / 2;
  const skipX = bx + bw + 30;

  const shEmb = d ? `(B, T, ${d})` : '';
  const shOut = V ? `(B, T, ${V})` : '';

  return (
    <svg viewBox={`0 0 ${W} 820`} className="w-full max-w-[700px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-moe" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>

      <rect x="5" y="5" width={W - 10} height="810" rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      {/* 标题 */}
      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="15" fontWeight="800">{name}</text>

      {/* ── 顶部 ── */}
      <Shape x={cx} y={44} text={shOut} />
      <Box x={bx} y={52} w={bw} h={28} label="Linear output layer" />
      <Arr x1={cx} y1={80} x2={cx} y2={100} id="arr-moe" />
      <Box x={bx} y={100} w={bw} h={28} label={`Final ${norm}`} />
      <Shape x={cx} y={142} text={shEmb} />
      <Arr x1={cx} y1={128} x2={cx} y2={155} id="arr-moe" />

      {/* ══ MoE Block 外框 ══ */}
      <rect x={bx - 40} y={155} width={bw + 80} height={460} rx="12" fill={OUTER} stroke={BD} strokeWidth="1" />
      <rect x={bx - 30} y={165} width={bw + 60} height={440} rx="10" fill={BLOCK_BG} stroke="none" />

      {/* ── ⊕ Residual 2 ── */}
      <Plus cx={cx} cy={185} />
      <path d={`M${skipX},${340} L${skipX},${185} L${cx + 11},${185}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <Arr x1={cx} y1={196} x2={cx} y2={215} id="arr-moe" />

      {/* MoE 区域 */}
      <rect x={bx - 15} y={215} width={bw + 30} height={155} rx="8" fill={MOE_BG} stroke={MOE_BD} strokeWidth="1" />
      <text x={cx} y={230} textAnchor="middle" fill={ACCENT} fontSize="9" fontWeight="700">MoE FFN</text>

      {/* Router */}
      <Box x={bx + 10} y={238} w={bw - 20} h={24} label="Router (Sigmoid → Top-K)" fill="#90A4AE" stroke="#607D8B" color="#fff" fs={9} />

      {/* Experts — 统一灰蓝色调 */}
      {[
        { x: bx - 5, label: 'Shared', fill: '#B0BEC5', stroke: '#78909C' },
        { x: bx + 48, label: 'Expert 1', fill: EXPERT_FILL, stroke: EXPERT_BD },
        { x: bx + 101, label: 'Expert 2', fill: EXPERT_FILL, stroke: EXPERT_BD },
        { x: bx + 154, label: '···', fill: 'none', stroke: 'none' },
      ].map((e, i) => (
        <g key={i}>
          {e.fill !== 'none' ? (
            <>
              <rect x={e.x} y={275} width={46} height={30} rx="5" fill={e.fill} stroke={e.stroke} strokeWidth="1" />
              <text x={e.x + 23} y={286} textAnchor="middle" fill="#37474F" fontSize="7" fontWeight="600">{e.label}</text>
              <text x={e.x + 23} y={298} textAnchor="middle" fill="#546E7A" fontSize="6">{act}</text>
            </>
          ) : (
            <text x={e.x + 23} y={293} textAnchor="middle" fill="#78909C" fontSize="14" fontWeight="700">···</text>
          )}
          {e.fill !== 'none' && <line x1={cx} y1={262} x2={e.x + 23} y2={275} stroke="#90A4AE" strokeWidth="0.8" />}
        </g>
      ))}

      {/* 加权合并 */}
      <Box x={bx + 10} y={318} w={bw - 20} h={22} label="Weighted merge" fill="#CFD8DC" stroke={MOE_BD} color={ACCENT} fs={9} />
      {[bx + 18, bx + 71, bx + 124].map((ex, i) => (
        <line key={i} x1={ex} y1={305} x2={cx} y2={318} stroke="#90A4AE" strokeWidth="0.8" opacity="0.5" />
      ))}

      {/* shape: MoE 输出 */}
      <Shape x={cx} y={358} text={shEmb} />
      <Arr x1={cx} y1={370} x2={cx} y2={395} id="arr-moe" />

      {/* Norm 2 */}
      <Box x={bx + 10} y={395} w={bw - 20} h={26} label={`${norm} 2`} />
      <Arr x1={cx} y1={421} x2={cx} y2={448} id="arr-moe" />
      <circle cx={cx} cy={435} r="2" fill="#78909C" />
      <line x1={cx} y1={435} x2={skipX} y2={435} stroke="#78909C" strokeWidth="1" />

      {/* ── ⊕ Residual 1 ── */}
      <Plus cx={cx} cy={458} />
      <path d={`M${skipX},${570} L${skipX},${458} L${cx + 11},${458}`} fill="none" stroke="#78909C" strokeWidth="1" />
      {/* shape: Attention 输入 */}
      <Shape x={cx} y={484} text={shEmb} />
      <Arr x1={cx} y1={469} x2={cx} y2={492} id="arr-moe" />

      {/* Attention */}
      <Box x={bx + 15} y={492} w={bw - 30} h={40} label={attn}
        fill={ATTN_BG} stroke="#37474F" color="#fff"
        fs={attn.length > 20 ? 8.5 : attn.length > 14 ? 9.5 : 11} />
      <Arr x1={cx} y1={532} x2={cx} y2={555} id="arr-moe" />

      {/* Norm 1 */}
      <Box x={bx + 10} y={555} w={bw - 20} h={26} label={`${norm} 1`} />
      <Arr x1={cx} y1={581} x2={cx} y2={600} id="arr-moe" />
      <circle cx={cx} cy={590} r="2" fill="#78909C" />
      <line x1={cx} y1={590} x2={skipX} y2={590} stroke="#78909C" strokeWidth="1" />

      {/* RoPE */}
      <Box x={bx - 130} y={500} w={70} h={24} label={pos} fs={9} />
      <line x1={bx - 60} y1={512} x2={bx + 15} y2={512} stroke="#666" strokeWidth="1" markerEnd="url(#arr-moe)" />

      {/* Block 重复次数 */}
      <text x={bx - 35} y={610} textAnchor="end" fill={ACCENT} fontSize="14" fontWeight="700">{layers} ×</text>

      {/* Block → Embedding */}
      <Arr x1={cx} y1={615} x2={cx} y2={650} id="arr-moe" />
      <Shape x={cx} y={640} text={shEmb} />

      {/* Embedding */}
      <Box x={bx - 15} y={650} w={bw + 30} h={30} label="Token embedding layer" />
      <Arr x1={cx} y1={680} x2={cx} y2={710} id="arr-moe" />

      {/* Tokenized text */}
      <Box x={bx + 5} y={710} w={bw - 10} h={26} label="Tokenized text" />
      <text x={cx} y={752} textAnchor="middle" fill="#999" fontSize="9" fontStyle="italic">Sample input text</text>
      <Arr x1={cx} y1={748} x2={cx} y2={736} id="arr-moe" />

      {/* ══════════ 右侧参数标注 ══════════ */}
      <Note x1={bx + bw + 5} y1={62} x2={W - 195} y2={48} label="Vocab size" value={vocab !== '?' ? vocab : undefined} />

      {experts && (
        <Note x1={bx + bw - 10} y1={290} x2={W - 195} y2={280}
          label="Experts:" value={experts.length > 35 ? experts.slice(0, 35) + '…' : experts} />
      )}

      {attn && (
        <Note x1={bx + bw - 15} y1={505} x2={W - 195} y2={500} label="Attention:" value={attn} />
      )}

      {/* Context length — RoPE 下方 */}
      {ctx && (
        <text x={bx - 95} y={538} textAnchor="middle" fill="#546E7A" fontSize="9" fontWeight="600">ctx = {ctx}</text>
      )}

      {emb && (
        <Note x1={bx + bw + 20} y1={665} x2={W - 195} y2={660}
          label={`d_emb = ${emb}`} value="" />
      )}

      {precision && (
        <Note x1={bx + bw - 10} y1={340} x2={W - 195} y2={330}
          label={`Precision: ${precision}`} value="" />
      )}

      {/* MTP 模块 */}
      <rect x={W - 195} y={55} width={130} height={38} rx="8" fill="none" stroke={MOE_BD} strokeWidth="1" strokeDasharray="4 3" />
      <text x={W - 130} y={70} textAnchor="middle" fill={ACCENT} fontSize="8.5" fontWeight="600">MTP Module</text>
      <text x={W - 130} y={82} textAnchor="middle" fill="#8896A6" fontSize="7">Multi-Token Prediction</text>
      <line x1={bx + bw} y1={66} x2={W - 195} y2={74} stroke={MOE_BD} strokeWidth="0.8" strokeDasharray="3 3" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   EvolutionPathSVG — 演进路线图
   ══════════════════════════════════════════════════════════════ */
function EvolutionPathSVG({ path, color }) {
  const w = 700;
  const h = 70;
  const nodeW = 100;
  const gap = (w - 40 - path.length * nodeW) / (path.length - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ fontFamily: FONT }}>
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

/* ══════════════════════════════════════════════════════════════
   AutonomousArchSVG — 自动驾驶 / VLA 架构图
   Camera → BEV Encoder → Temporal Fusion → Planning Head
   ══════════════════════════════════════════════════════════════ */
function AutonomousArchSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'Autonomous Driving Model';
  const arch = f.architecture || 'BEV Transformer';
  const attn = f.attention || 'Deformable Attn';
  const bev  = f['BEV'] || f['BEV分辨率'] || '';
  const tasks = f.tasks || f['输出'] || '';
  const backbone = f.backbone || f['backbone'] || 'ViT / ResNet';
  const isVLA = arch.toLowerCase().includes('vla') || arch.toLowerCase().includes('llm') || arch.toLowerCase().includes('language');

  const W = 680, H = 680;
  const cx = 260;
  const bw = 200, bx = cx - bw / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-ad" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
      <rect x="5" y="5" width={W-10} height={H-10} rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      {/* 标题 */}
      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="14" fontWeight="800">{name}</text>
      <text x={cx} y="46" textAnchor="middle" fill="#8896A6" fontSize="9">{arch}</text>

      {/* ── 输入层：多路相机 ── */}
      <rect x={bx-30} y={60} width={bw+60} height={36} rx="8" fill="#f3f0ff" stroke="#a29bfe" strokeWidth="1.2" />
      <text x={cx} y={82} textAnchor="middle" fill="#6c5ce7" fontSize="10" fontWeight="600">📷 多路环视相机输入</text>
      <text x={cx} y={92} textAnchor="middle" fill="#a29bfe" fontSize="8">6-cam RGB · 多帧时序</text>

      <line x1={cx} y1={96} x2={cx} y2={116} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />

      {/* ── Backbone ── */}
      <rect x={bx} y={116} width={bw} height={30} rx="7" fill="#e8f4fd" stroke="#74b9ff" strokeWidth="1.2" />
      <text x={cx} y={135} textAnchor="middle" fill="#0984e3" fontSize="10" fontWeight="600">Backbone: {backbone}</text>

      <line x1={cx} y1={146} x2={cx} y2={166} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />

      {/* ── BEV Encoder ── */}
      <rect x={bx-20} y={166} width={bw+40} height={50} rx="8" fill="#e8fdf5" stroke="#00cec9" strokeWidth="1.5" />
      <text x={cx} y={186} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="700">BEV Encoder</text>
      <text x={cx} y={200} textAnchor="middle" fill="#00cec9" fontSize="8.5">{attn}</text>
      {bev && <text x={cx} y={212} textAnchor="middle" fill="#55efc4" fontSize="8">BEV: {bev}</text>}

      <line x1={cx} y1={216} x2={cx} y2={236} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />

      {/* ── Temporal Fusion ── */}
      <rect x={bx+10} y={236} width={bw-20} height={28} rx="7" fill="#fff5f7" stroke="#fd79a8" strokeWidth="1.2" />
      <text x={cx} y={254} textAnchor="middle" fill="#e84393" fontSize="10" fontWeight="600">Temporal Fusion</text>

      <line x1={cx} y1={264} x2={cx} y2={284} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />

      {/* ── VLA LLM（仅 VLA 模型显示） ── */}
      {isVLA ? (
        <>
          <rect x={bx-10} y={284} width={bw+20} height={40} rx="8" fill="#4A5568" stroke="#37474F" strokeWidth="1.5" />
          <text x={cx} y={302} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">LLM Backbone</text>
          <text x={cx} y={316} textAnchor="middle" fill="#a0aec0" fontSize="8.5">语言指令 + 多模态对齐</text>
          <line x1={cx} y1={324} x2={cx} y2={344} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />
          {/* Planning Head */}
          <rect x={bx-20} y={344} width={bw+40} height={50} rx="8" fill="#fff8e1" stroke="#fdcb6e" strokeWidth="1.5" />
          <text x={cx} y={364} textAnchor="middle" fill="#e17055" fontSize="10" fontWeight="700">Planning Head</text>
          <text x={cx} y={378} textAnchor="middle" fill="#fdcb6e" fontSize="8.5">Waypoints · Control · World Model</text>
          <line x1={cx} y1={394} x2={cx} y2={414} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />
          {/* 输出 */}
          <rect x={bx} y={414} width={bw} height={28} rx="7" fill="#e8f5e9" stroke="#55efc4" strokeWidth="1.2" />
          <text x={cx} y={432} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="600">轨迹 + 控制指令输出</text>
        </>
      ) : (
        <>
          {/* Transformer Decoder */}
          <rect x={bx-10} y={284} width={bw+20} height={40} rx="8" fill="#4A5568" stroke="#37474F" strokeWidth="1.5" />
          <text x={cx} y={302} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">Transformer Decoder</text>
          <text x={cx} y={316} textAnchor="middle" fill="#a0aec0" fontSize="8.5">Query-based · Sparse Attn</text>
          <line x1={cx} y1={324} x2={cx} y2={344} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />
          {/* 多任务输出头 */}
          <rect x={bx-30} y={344} width={bw+60} height={50} rx="8" fill="#fff8e1" stroke="#fdcb6e" strokeWidth="1.5" />
          <text x={cx} y={364} textAnchor="middle" fill="#e17055" fontSize="10" fontWeight="700">多任务输出头</text>
          <text x={cx} y={378} textAnchor="middle" fill="#fdcb6e" fontSize="8.5">{tasks ? tasks.slice(0,40) : '检测 · 跟踪 · 建图 · 规划'}</text>
          <line x1={cx} y1={394} x2={cx} y2={414} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ad)" />
          {/* 输出 */}
          <rect x={bx} y={414} width={bw} height={28} rx="7" fill="#e8f5e9" stroke="#55efc4" strokeWidth="1.2" />
          <text x={cx} y={432} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="600">规划轨迹 / 3D 检测输出</text>
        </>
      )}

      {/* 右侧标注 */}
      <text x={W-20} y={82} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">输入层</text>
      <text x={W-20} y={135} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">特征提取</text>
      <text x={W-20} y={195} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">BEV 融合</text>
      <text x={W-20} y={254} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">时序建模</text>
      <text x={W-20} y={305} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">决策主干</text>
      <text x={W-20} y={370} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">任务头</text>
      <text x={W-20} y={432} textAnchor="end" fill="#8896A6" fontSize="8.5" fontWeight="600">输出</text>

      {/* 底部说明 */}
      <text x={cx} y={H-20} textAnchor="middle" fill="#b0bec5" fontSize="8" fontStyle="italic">
        Autonomous Driving / VLA Architecture
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MultimodalArchSVG — 多模态模型架构图
   Vision Encoder → Projector → LLM Decoder
   ══════════════════════════════════════════════════════════════ */
function MultimodalArchSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'Multimodal Model';
  const arch = f.architecture || 'ViT + LLM';
  const attn = f.attention || 'GQA';
  const ctx  = f.context || '';
  const res  = f.resolution || '';

  const W = 680, H = 660;
  const cx = 260;
  const bw = 200, bx = cx - bw / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-mm" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
      <rect x="5" y="5" width={W-10} height={H-10} rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="14" fontWeight="800">{name}</text>
      <text x={cx} y="46" textAnchor="middle" fill="#8896A6" fontSize="9">{arch}</text>

      {/* 双输入：图像 + 文本 */}
      <rect x={bx-40} y={60} width={90} height={32} rx="7" fill="#f3f0ff" stroke="#a29bfe" strokeWidth="1.2" />
      <text x={bx+5} y={80} textAnchor="middle" fill="#6c5ce7" fontSize="9.5" fontWeight="600">🖼️ 图像输入</text>
      {res && <text x={bx+5} y={90} textAnchor="middle" fill="#a29bfe" fontSize="7.5">{res}</text>}

      <rect x={bx+110} y={60} width={90} height={32} rx="7" fill="#e8f4fd" stroke="#74b9ff" strokeWidth="1.2" />
      <text x={bx+155} y={80} textAnchor="middle" fill="#0984e3" fontSize="9.5" fontWeight="600">💬 文本输入</text>

      {/* 连线到各自编码器 */}
      <line x1={bx+5} y1={92} x2={bx+5} y2={112} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />
      <line x1={bx+155} y1={92} x2={bx+155} y2={112} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      {/* Vision Encoder */}
      <rect x={bx-40} y={112} width={90} height={36} rx="7" fill="#e8fdf5" stroke="#00cec9" strokeWidth="1.5" />
      <text x={bx+5} y={128} textAnchor="middle" fill="#00b894" fontSize="9.5" fontWeight="700">Vision Encoder</text>
      <text x={bx+5} y={140} textAnchor="middle" fill="#55efc4" fontSize="8">ViT / CLIP</text>

      {/* Text Tokenizer */}
      <rect x={bx+110} y={112} width={90} height={36} rx="7" fill="#fff5f7" stroke="#fd79a8" strokeWidth="1.2" />
      <text x={bx+155} y={128} textAnchor="middle" fill="#e84393" fontSize="9.5" fontWeight="600">Tokenizer</text>
      <text x={bx+155} y={140} textAnchor="middle" fill="#fd79a8" fontSize="8">BPE / SentencePiece</text>

      {/* 连线到 Projector */}
      <line x1={bx+5} y1={148} x2={cx-10} y2={178} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />
      <line x1={bx+155} y1={148} x2={cx+10} y2={178} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      {/* Projector / Cross-Attention */}
      <rect x={bx-10} y={178} width={bw+20} height={34} rx="8" fill="#fff8e1" stroke="#fdcb6e" strokeWidth="1.5" />
      <text x={cx} y={196} textAnchor="middle" fill="#e17055" fontSize="10" fontWeight="700">Projector / Cross-Attention</text>
      <text x={cx} y={207} textAnchor="middle" fill="#fdcb6e" fontSize="8">视觉 token → 语言空间对齐</text>

      <line x1={cx} y1={212} x2={cx} y2={232} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      {/* LLM Decoder Block */}
      <rect x={bx-30} y={232} width={bw+60} height={200} rx="12" fill={OUTER} stroke={BD} strokeWidth="1" />
      <rect x={bx-20} y={242} width={bw+40} height={180} rx="10" fill={BLOCK_BG} stroke="none" />
      <text x={cx} y={258} textAnchor="middle" fill={ACCENT} fontSize="9" fontWeight="700">LLM Decoder Block × N</text>

      {/* Residual 2 */}
      <Plus cx={cx} cy={272} />
      <path d={`M${bx+bw+10},${340} L${bx+bw+10},${272} L${cx+11},${272}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={283} x2={cx} y2={298} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      <Box x={bx+10} y={298} w={bw-20} h={26} label="Feed Forward (SwiGLU)" fs={9} />
      <line x1={cx} y1={324} x2={cx} y2={342} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />
      <circle cx={cx} cy={332} r="2" fill="#78909C" />
      <line x1={cx} y1={332} x2={bx+bw+10} y2={332} stroke="#78909C" strokeWidth="1" />

      {/* Residual 1 */}
      <Plus cx={cx} cy={352} />
      <path d={`M${bx+bw+10},${410} L${bx+bw+10},${352} L${cx+11},${352}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={363} x2={cx} y2={378} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      <Box x={bx+15} y={378} w={bw-30} h={36} label={`${attn}`}
        fill={ATTN_BG} stroke="#37474F" color="#fff" fs={9.5} />
      <line x1={cx} y1={414} x2={cx} y2={432} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />
      <circle cx={cx} cy={422} r="2" fill="#78909C" />
      <line x1={cx} y1={422} x2={bx+bw+10} y2={422} stroke="#78909C" strokeWidth="1" />

      <line x1={cx} y1={432} x2={cx} y2={452} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-mm)" />

      {/* 输出 */}
      <rect x={bx} y={452} width={bw} height={28} rx="7" fill="#e8f5e9" stroke="#55efc4" strokeWidth="1.2" />
      <text x={cx} y={470} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="600">多模态理解 / 生成输出</text>

      {/* 右侧标注 */}
      {ctx && <text x={W-20} y={400} textAnchor="end" fill="#546E7A" fontSize="8.5" fontWeight="600">ctx = {ctx}</text>}
      <text x={W-20} y={80} textAnchor="end" fill="#8896A6" fontSize="8.5">视觉输入</text>
      <text x={W-20} y={130} textAnchor="end" fill="#8896A6" fontSize="8.5">视觉编码</text>
      <text x={W-20} y={200} textAnchor="end" fill="#8896A6" fontSize="8.5">模态对齐</text>
      <text x={W-20} y={310} textAnchor="end" fill="#8896A6" fontSize="8.5">LLM 主干</text>
      <text x={W-20} y={470} textAnchor="end" fill="#8896A6" fontSize="8.5">输出</text>

      <text x={cx} y={H-20} textAnchor="middle" fill="#b0bec5" fontSize="8" fontStyle="italic">
        Multimodal Architecture (Vision + Language)
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   SSMArchSVG — SSM / Mamba / Linear Attention 架构图
   ══════════════════════════════════════════════════════════════ */
function SSMArchSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'SSM / Mamba Model';
  const arch = f.architecture || 'SSM';
  const attn = f.attention || '线性注意力 O(N)';
  const ctx  = f.context || '理论无限';
  const vocab = f.vocab || '';

  const W = 680, H = 680;
  const cx = 250;
  const bw = 200, bx = cx - bw / 2;
  const skipX = bx + bw + 30;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-ssm" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
      <rect x="5" y="5" width={W-10} height={H-10} rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="14" fontWeight="800">{name}</text>
      <text x={cx} y="46" textAnchor="middle" fill="#8896A6" fontSize="9">{arch} · {attn}</text>

      {/* 顶部输出 */}
      {vocab && <text x={cx} y={62} textAnchor="middle" fill="#8896A6" fontSize="8" fontStyle="italic">(B, T, {vocab.replace(/,/g,'')})</text>}
      <Box x={bx} y={68} w={bw} h={28} label="Linear output layer" />
      <line x1={cx} y1={96} x2={cx} y2={112} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <Box x={bx} y={112} w={bw} h={26} label="Final RMSNorm" />
      <line x1={cx} y1={138} x2={cx} y2={158} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />

      {/* SSM Block 外框 */}
      <rect x={bx-35} y={158} width={bw+70} height={330} rx="12" fill={OUTER} stroke={BD} strokeWidth="1" />
      <rect x={bx-25} y={168} width={bw+50} height={310} rx="10" fill={BLOCK_BG} stroke="none" />

      {/* Residual 2 */}
      <Plus cx={cx} cy={185} />
      <path d={`M${skipX},${310} L${skipX},${185} L${cx+11},${185}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={196} x2={cx} y2={215} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />

      {/* FFN */}
      <Box x={bx+10} y={215} w={bw-20} h={30} label="Feed Forward (SwiGLU)" fs={9.5} />
      <line x1={cx} y1={245} x2={cx} y2={265} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <Box x={bx+10} y={265} w={bw-20} h={26} label="RMSNorm 2" />
      <line x1={cx} y1={291} x2={cx} y2={315} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <circle cx={cx} cy={302} r="2" fill="#78909C" />
      <line x1={cx} y1={302} x2={skipX} y2={302} stroke="#78909C" strokeWidth="1" />

      {/* Residual 1 */}
      <Plus cx={cx} cy={325} />
      <path d={`M${skipX},${450} L${skipX},${325} L${cx+11},${325}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={336} x2={cx} y2={358} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />

      {/* SSM Core Block */}
      <rect x={bx+10} y={358} width={bw-20} height={60} rx="8" fill="#00cec9" stroke="#00b894" strokeWidth="1.5" />
      <text x={cx} y={380} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">SSM / Mamba Block</text>
      <text x={cx} y={394} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8.5">状态空间模型 · 线性递推</text>
      <text x={cx} y={408} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">h_t = A·h_{t-1} + B·x_t · O(N)</text>

      <line x1={cx} y1={418} x2={cx} y2={438} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <Box x={bx+10} y={438} w={bw-20} h={26} label="RMSNorm 1" />
      <line x1={cx} y1={464} x2={cx} y2={490} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <circle cx={cx} cy={474} r="2" fill="#78909C" />
      <line x1={cx} y1={474} x2={skipX} y2={474} stroke="#78909C" strokeWidth="1" />

      {/* Block 重复 */}
      <text x={bx-30} y={500} textAnchor="end" fill={ACCENT} fontSize="14" fontWeight="700">N ×</text>

      {/* Embedding */}
      <line x1={cx} y1={490} x2={cx} y2={530} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <Box x={bx-15} y={530} w={bw+30} h={30} label="Token Embedding" />
      <line x1={cx} y1={560} x2={cx} y2={590} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
      <Box x={bx+5} y={590} w={bw-10} h={26} label="Tokenized text" />

      {/* 右侧标注 */}
      <text x={W-20} y={82} textAnchor="end" fill="#546E7A" fontSize="8.5" fontWeight="600">输出层</text>
      <text x={W-20} y={390} textAnchor="end" fill="#00cec9" fontSize="8.5" fontWeight="700">SSM Core</text>
      <text x={W-20} y={400} textAnchor="end" fill="#546E7A" fontSize="8">O(N) 线性复杂度</text>
      {ctx && <text x={W-20} y={415} textAnchor="end" fill="#546E7A" fontSize="8">ctx: {ctx}</text>}

      {/* 右侧 SSM 展开说明 */}
      <rect x={W-185} y={230} width={160} height={100} rx="8" fill="#FAFBFC" stroke={BD} strokeWidth="0.8" />
      <text x={W-105} y={244} textAnchor="middle" fill="#8896A6" fontSize="7.5" fontWeight="600">SSM vs Attention</text>
      <text x={W-185+8} y={260} fill="#546E7A" fontSize="7">• Attention: O(N²) 全局</text>
      <text x={W-185+8} y={274} fill="#00b894" fontSize="7">• SSM: O(N) 线性递推</text>
      <text x={W-185+8} y={288} fill="#546E7A" fontSize="7">• 无限上下文（理论）</text>
      <text x={W-185+8} y={302} fill="#546E7A" fontSize="7">• 推理时固定内存</text>
      <text x={W-185+8} y={316} fill="#546E7A" fontSize="7">• 训练可并行化</text>

      <text x={cx} y={H-20} textAnchor="middle" fill="#b0bec5" fontSize="8" fontStyle="italic">
        SSM / Mamba / Linear Attention Architecture
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   VideoGenArchSVG — 视频/图像生成模型架构图
   DiT / Diffusion Transformer
   ══════════════════════════════════════════════════════════════ */
function VideoGenArchSVG({ factSheet = {}, modelName = '' }) {
  const f = factSheet;
  const name = modelName || 'Video Generation Model';
  const arch = f.architecture || 'DiT';
  const attn = f.attention || '3D Full Attention';
  const scheduler = f.scheduler || 'Flow Matching / DDPM';
  const ctx  = f.context || '';
  const isImage = arch.toLowerCase().includes('flux') || arch.toLowerCase().includes('image') || (f.params || '').includes('image');

  const W = 680, H = 660;
  const cx = 260;
  const bw = 200, bx = cx - bw / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-vg" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>
      <rect x="5" y="5" width={W-10} height={H-10} rx="16" fill={BG} stroke={BD} strokeWidth="0.8" />

      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="14" fontWeight="800">{name}</text>
      <text x={cx} y="46" textAnchor="middle" fill="#8896A6" fontSize="9">{arch} · {scheduler}</text>

      {/* 输入：噪声 + 条件 */}
      <rect x={bx-40} y={60} width={90} height={32} rx="7" fill="#f3f0ff" stroke="#a29bfe" strokeWidth="1.2" />
      <text x={bx+5} y={78} textAnchor="middle" fill="#6c5ce7" fontSize="9.5" fontWeight="600">🎲 噪声输入 z_T</text>

      <rect x={bx+110} y={60} width={90} height={32} rx="7" fill="#e8f4fd" stroke="#74b9ff" strokeWidth="1.2" />
      <text x={bx+155} y={78} textAnchor="middle" fill="#0984e3" fontSize="9.5" fontWeight="600">💬 条件输入</text>
      <text x={bx+155} y={88} textAnchor="middle" fill="#74b9ff" fontSize="7.5">文本 / 图像 / 动作</text>

      <line x1={bx+5} y1={92} x2={cx-20} y2={118} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />
      <line x1={bx+155} y1={92} x2={cx+20} y2={118} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      {/* VAE Encoder */}
      <rect x={bx-10} y={118} width={bw+20} height={30} rx="7" fill="#e8fdf5" stroke="#00cec9" strokeWidth="1.5" />
      <text x={cx} y={137} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="700">
        {isImage ? '3D Causal VAE' : '3D Causal VAE / Patchify'}
      </text>

      <line x1={cx} y1={148} x2={cx} y2={168} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      {/* DiT Block */}
      <rect x={bx-35} y={168} width={bw+70} height={240} rx="12" fill={OUTER} stroke={BD} strokeWidth="1" />
      <rect x={bx-25} y={178} width={bw+50} height={220} rx="10" fill={BLOCK_BG} stroke="none" />
      <text x={cx} y={194} textAnchor="middle" fill={ACCENT} fontSize="9" fontWeight="700">DiT Block × N</text>

      {/* Residual 2 */}
      <Plus cx={cx} cy={208} />
      <path d={`M${bx+bw+30},${310} L${bx+bw+30},${208} L${cx+11},${208}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={219} x2={cx} y2={238} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      <Box x={bx+10} y={238} w={bw-20} h={28} label="Feed Forward" />
      <line x1={cx} y1={266} x2={cx} y2={286} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />
      <Box x={bx+10} y={286} w={bw-20} h={24} label="AdaLN-Zero (条件注入)" fs={9} />
      <line x1={cx} y1={310} x2={cx} y2={330} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />
      <circle cx={cx} cy={320} r="2" fill="#78909C" />
      <line x1={cx} y1={320} x2={bx+bw+30} y2={320} stroke="#78909C" strokeWidth="1" />

      {/* Residual 1 */}
      <Plus cx={cx} cy={340} />
      <path d={`M${bx+bw+30},${390} L${bx+bw+30},${340} L${cx+11},${340}`} fill="none" stroke="#78909C" strokeWidth="1" />
      <line x1={cx} y1={351} x2={cx} y2={368} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      <Box x={bx+15} y={368} w={bw-30} h={36} label={attn}
        fill={ATTN_BG} stroke="#37474F" color="#fff"
        fs={attn.length > 18 ? 8.5 : 10} />
      <line x1={cx} y1={404} x2={cx} y2={420} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />
      <circle cx={cx} cy={412} r="2" fill="#78909C" />
      <line x1={cx} y1={412} x2={bx+bw+30} y2={412} stroke="#78909C" strokeWidth="1" />

      {/* Block 重复 */}
      <text x={bx-30} y={430} textAnchor="end" fill={ACCENT} fontSize="14" fontWeight="700">N ×</text>

      <line x1={cx} y1={420} x2={cx} y2={445} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      {/* VAE Decoder */}
      <rect x={bx-10} y={445} width={bw+20} height={30} rx="7" fill="#fff5f7" stroke="#fd79a8" strokeWidth="1.5" />
      <text x={cx} y={464} textAnchor="middle" fill="#e84393" fontSize="10" fontWeight="700">VAE Decoder / Unpatchify</text>

      <line x1={cx} y1={475} x2={cx} y2={495} stroke="#666" strokeWidth="1.5" markerEnd="url(#arr-vg)" />

      {/* 输出 */}
      <rect x={bx} y={495} width={bw} height={30} rx="7" fill="#e8f5e9" stroke="#55efc4" strokeWidth="1.2" />
      <text x={cx} y={514} textAnchor="middle" fill="#00b894" fontSize="10" fontWeight="600">
        {isImage ? '高质量图像输出' : '视频帧序列输出'}
      </text>

      {/* 右侧标注 */}
      <text x={W-20} y={80} textAnchor="end" fill="#8896A6" fontSize="8.5">输入</text>
      <text x={W-20} y={137} textAnchor="end" fill="#8896A6" fontSize="8.5">潜空间编码</text>
      <text x={W-20} y={300} textAnchor="end" fill="#8896A6" fontSize="8.5">DiT 主干</text>
      <text x={W-20} y={464} textAnchor="end" fill="#8896A6" fontSize="8.5">解码</text>
      {ctx && <text x={W-20} y={514} textAnchor="end" fill="#546E7A" fontSize="8">{ctx}</text>}

      {/* 去噪步骤说明 */}
      <rect x={W-185} y={200} width={160} height={80} rx="8" fill="#FAFBFC" stroke={BD} strokeWidth="0.8" />
      <text x={W-105} y={214} textAnchor="middle" fill="#8896A6" fontSize="7.5" fontWeight="600">去噪过程</text>
      <text x={W-185+8} y={230} fill="#546E7A" fontSize="7">{'z_T → z_{T-1} → ... → z_0'}</text>
      <text x={W-185+8} y={244} fill="#546E7A" fontSize="7">调度器: {scheduler.slice(0,20)}</text>
      <text x={W-185+8} y={258} fill="#546E7A" fontSize="7">条件注入: AdaLN-Zero</text>
      <text x={W-185+8} y={272} fill="#546E7A" fontSize="7">CFG: 无分类器引导</text>

      <text x={cx} y={H-20} textAnchor="middle" fill="#b0bec5" fontSize="8" fontStyle="italic">
        Diffusion Transformer (DiT) Architecture
      </text>
    </svg>
  );
}

export { TransformerBlockSVG, MoEArchSVG, EvolutionPathSVG, COLORS, AutonomousArchSVG, MultimodalArchSVG, SSMArchSVG, VideoGenArchSVG };