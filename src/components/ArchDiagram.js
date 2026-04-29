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

const M = '#C2185B';       // 品红标注色
const PINK = '#F3D9E0';    // Block 内粉色背景
const ATTN_BG = '#555';    // Attention 深灰
const BG = '#F5F5F5';      // 外层背景
const BD = '#BDBDBD';      // 边框灰
const OUTER = '#D5D5D5';   // Block 外框

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
      {label && <text x={x2 + dx} y={y2 - 3} textAnchor={anchor} fill="#333" fontSize="10" fontWeight="600">{label}</text>}
      {value && <text x={x2 + dx} y={y2 + 11} textAnchor={anchor} fill={M} fontSize="11" fontWeight="700">{value}</text>}
    </g>
  );
}

/* ── Shape 标注（层间小字） ── */
function Shape({ x, y, text }) {
  if (!text) return null;
  return <text x={x} y={y} textAnchor="middle" fill="#999" fontSize="8" fontStyle="italic">{text}</text>;
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
  const ffn = f.ffnDim || (hidden ? `${Math.round(parseInt(hidden) * 3.5).toLocaleString()}` : '');

  // 布局常量
  const W = 680;
  const cx = 250;       // 主轴中心
  const bw = 200;       // 层宽
  const bx = cx - bw / 2;  // 层左边
  const skipX = bx + bw + 25; // 残差跳线 x（右侧）

  // shape 文字
  const shEmb = emb ? `(batch, seq, ${emb})` : '';
  const shHid = hidden && ffn ? `(batch, seq, ${ffn})` : '';
  const shOut = vocab !== '?' ? `(batch, seq, ${vocab})` : '';

  return (
    <svg viewBox={`0 0 ${W} 720`} className="w-full max-w-[680px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>

      {/* 外层背景 */}
      <rect x="5" y="5" width={W - 10} height="710" rx="16" fill={BG} stroke={BD} strokeWidth="1" />

      {/* 标题 */}
      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="15" fontWeight="800">{name}</text>

      {/* ── 顶部 ── */}
      {/* Linear output */}
      <Box x={bx} y={52} w={bw} h={28} label="Linear output layer" />
      <Shape x={cx} y={48} text={shOut} />
      <Arr x1={cx} y1={80} x2={cx} y2={95} id="arr" />

      {/* Final Norm */}
      <Box x={bx} y={95} w={bw} h={28} label={`Final ${norm}`} />
      <Shape x={cx} y={91} text={shEmb} />
      <Arr x1={cx} y1={123} x2={cx} y2={150} id="arr" />

      {/* ══ Transformer Block 外框（灰色） ══ */}
      <rect x={bx - 35} y={150} width={bw + 70} height={360} rx="12" fill={OUTER} stroke={BD} strokeWidth="1.5" />

      {/* Block 内粉色背景（覆盖整个内部） */}
      <rect x={bx - 25} y={160} width={bw + 50} height={340} rx="10" fill={PINK} stroke="none" />

      {/* ── ⊕ Residual 2 (FFN 后) ── */}
      <Plus cx={cx} cy={178} />
      {/* U 形残差跳线 2：从 Norm2 输出右侧绕到 ⊕ */}
      <path d={`M${skipX},${310} L${skipX},${178} L${cx + 11},${178}`} fill="none" stroke="#555" strokeWidth="1.2" />
      <Arr x1={cx} y1={189} x2={cx} y2={210} id="arr" />

      {/* Feed forward */}
      <Box x={bx + 10} y={210} w={bw - 20} h={32} label="Feed forward" />
      <Shape x={cx} y={206} text={shHid ? `→ ${shHid}` : ''} />
      <Arr x1={cx} y1={242} x2={cx} y2={265} id="arr" />

      {/* Norm 2 */}
      <Box x={bx + 10} y={265} w={bw - 20} h={28} label={`${norm} 2`} />
      {/* 分叉点：主线 + 跳线起点 */}
      <Arr x1={cx} y1={293} x2={cx} y2={320} id="arr" />
      {/* 跳线起点标记 */}
      <circle cx={cx} cy={305} r="2" fill="#555" />
      <line x1={cx} y1={305} x2={skipX} y2={305} stroke="#555" strokeWidth="1.2" />

      {/* ── ⊕ Residual 1 (Attention 后) ── */}
      <Plus cx={cx} cy={330} />
      {/* U 形残差跳线 1：从 Norm1 输出右侧绕到 ⊕ */}
      <path d={`M${skipX},${460} L${skipX},${330} L${cx + 11},${330}`} fill="none" stroke="#555" strokeWidth="1.2" />
      <Arr x1={cx} y1={341} x2={cx} y2={365} id="arr" />

      {/* Attention */}
      <Box x={bx + 15} y={365} w={bw - 30} h={42} label={`Masked ${attn}`}
        fill={ATTN_BG} stroke="#444" color="#fff"
        fs={attn.length > 22 ? 8.5 : attn.length > 16 ? 9.5 : 10.5} />
      <Shape x={cx} y={361} text={shEmb} />
      <Arr x1={cx} y1={407} x2={cx} y2={430} id="arr" />

      {/* Norm 1 */}
      <Box x={bx + 10} y={430} w={bw - 20} h={28} label={`${norm} 1`} />
      {/* 分叉点：主线 + 跳线起点 */}
      <Arr x1={cx} y1={458} x2={cx} y2={490} id="arr" />
      <circle cx={cx} cy={468} r="2" fill="#555" />
      <line x1={cx} y1={468} x2={skipX} y2={468} stroke="#555" strokeWidth="1.2" />

      {/* Block 重复次数（左下角品红） */}
      <text x={bx - 30} y={505} textAnchor="end" fill={M} fontSize="15" fontWeight="800">{layers} ×</text>

      {/* ── RoPE 外挂（左侧） ── */}
      <Box x={bx - 130} y={375} w={75} h={26} label={pos} fs={10} />
      <line x1={bx - 55} y1={388} x2={bx + 15} y2={388} stroke="#666" strokeWidth="1" markerEnd="url(#arr)" />

      {/* Block → Embedding */}
      <Arr x1={cx} y1={510} x2={cx} y2={555} id="arr" />
      <Shape x={cx} y={540} text={shEmb} />

      {/* Embedding */}
      <Box x={bx - 15} y={555} w={bw + 30} h={32} label="Token + positional embedding layer" fs={10} />
      <Arr x1={cx} y1={587} x2={cx} y2={620} id="arr" />

      {/* Tokenized text */}
      <Box x={bx + 5} y={620} w={bw - 10} h={28} label="Tokenized text" />

      {/* Input label */}
      <text x={cx} y={668} textAnchor="middle" fill="#666" fontSize="10" fontStyle="italic">Sample input text</text>
      <Arr x1={cx} y1={672} x2={cx} y2={648} id="arr" />

      {/* ══════════ 右侧参数标注 ══════════ */}
      {/* Vocabulary size */}
      <Note x1={bx + bw + 5} y1={62} x2={W - 190} y2={48} label="Vocabulary size of" value={vocab !== '?' ? vocab : undefined} />

      {/* Heads */}
      {heads && (
        <Note x1={bx + bw - 15} y1={375} x2={W - 190} y2={365}
          label={kvHeads ? `${heads} Q-heads / ${kvHeads} KV-heads` : `${heads} heads`}
          value="" />
      )}

      {/* Hidden dimension */}
      {hidden && (
        <Note x1={bx + bw - 10} y1={225} x2={W - 190} y2={215}
          label="Hidden layer dimension of" value={hidden} />
      )}

      {/* FFN dimension */}
      {ffn && (
        <Note x1={bx + bw - 10} y1={240} x2={W - 190} y2={248}
          label="FFN intermediate dim" value={ffn} />
      )}

      {/* Embedding dimension */}
      {emb && (
        <Note x1={bx + bw + 20} y1={570} x2={W - 190} y2={570}
          label="Embedding dimension of" value={emb} />
      )}

      {/* Context length */}
      {ctx && (
        <Note x1={bx - 30} y1={400} x2={15} y2={510}
          label="Supported context length of" value={ctx} side="left" />
      )}

      {/* ══════════ 右侧 FFN 展开 ══════════ */}
      <g transform={`translate(${W - 195}, 270)`}>
        <rect x="0" y="0" width="170" height="120" rx="10" fill="#fff" stroke={BD} strokeWidth="1" />
        <text x="85" y="14" textAnchor="middle" fill="#999" fontSize="7.5" fontWeight="600">Feed Forward Detail ({act})</text>

        {/* 上层两个 Linear */}
        <Box x={10} y={22} w={65} h={20} label="Linear layer" fs={7.5} rx={5} />
        <Box x={95} y={22} w={65} h={20} label="Linear layer" fs={7.5} rx={5} />

        {/* SiLU */}
        <Box x={10} y={55} w={65} h={20} label="SiLU activation" fs={7} rx={5} />

        {/* × */}
        <Cross cx={128} cy={65} r={8} />

        {/* 下层 Linear */}
        <Box x={35} y={90} w={65} h={20} label="Linear layer" fs={7.5} rx={5} />

        {/* 连线 */}
        <line x1="42" y1="42" x2="42" y2="55" stroke="#666" strokeWidth="0.8" />
        <line x1="128" y1="42" x2="128" y2="57" stroke="#666" strokeWidth="0.8" />
        <line x1="42" y1="75" x2="42" y2="82" stroke="#666" strokeWidth="0.8" />
        <line x1="120" y1="65" x2="75" y2="65" stroke="#666" strokeWidth="0.8" />
        <line x1="42" y1="82" x2="67" y2="90" stroke="#666" strokeWidth="0.8" markerEnd="url(#arr)" />
        <line x1="128" y1="73" x2="100" y2="90" stroke="#666" strokeWidth="0.8" />
      </g>
      {/* FFN 展开连线 */}
      <line x1={bx + bw - 10} y1={226} x2={W - 195} y2={310} stroke="#999" strokeWidth="0.8" strokeDasharray="3 3" />
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

  const W = 700;
  const cx = 270;
  const bw = 210;
  const bx = cx - bw / 2;
  const skipX = bx + bw + 30;

  const shEmb = emb ? `(batch, seq, ${emb})` : '';

  return (
    <svg viewBox={`0 0 ${W} 800`} className="w-full max-w-[700px]" style={{ fontFamily: FONT }}>
      <defs>
        <marker id="arr-moe" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
        </marker>
      </defs>

      <rect x="5" y="5" width={W - 10} height="790" rx="16" fill={BG} stroke={BD} strokeWidth="1" />

      {/* 标题 */}
      <text x={cx} y="30" textAnchor="middle" fill="#111" fontSize="15" fontWeight="800">{name}</text>

      {/* ── 顶部 ── */}
      <Box x={bx} y={52} w={bw} h={28} label="Linear output layer" />
      <Arr x1={cx} y1={80} x2={cx} y2={100} id="arr-moe" />
      <Box x={bx} y={100} w={bw} h={28} label={`Final ${norm}`} />
      <Shape x={cx} y={96} text={shEmb} />
      <Arr x1={cx} y1={128} x2={cx} y2={155} id="arr-moe" />

      {/* ══ MoE Block 外框 ══ */}
      <rect x={bx - 40} y={155} width={bw + 80} height={460} rx="12" fill={OUTER} stroke={BD} strokeWidth="1.5" />
      <rect x={bx - 30} y={165} width={bw + 60} height={440} rx="10" fill={PINK} stroke="none" />

      {/* ── ⊕ Residual 2 ── */}
      <Plus cx={cx} cy={185} />
      <path d={`M${skipX},${340} L${skipX},${185} L${cx + 11},${185}`} fill="none" stroke="#555" strokeWidth="1.2" />
      <Arr x1={cx} y1={196} x2={cx} y2={215} id="arr-moe" />

      {/* MoE 区域 */}
      <rect x={bx - 15} y={215} width={bw + 30} height={155} rx="8" fill="#FFF0F0" stroke="#E57373" strokeWidth="1.2" />
      <text x={cx} y={230} textAnchor="middle" fill="#C62828" fontSize="9" fontWeight="700">DeepSeekMoE / MoE FFN</text>

      {/* Router */}
      <Box x={bx + 10} y={238} w={bw - 20} h={24} label="Router (Sigmoid → Top-K)" fill="#E57373" stroke="#C62828" color="#fff" fs={9} />

      {/* Experts */}
      {[
        { x: bx - 5, label: 'Shared', fill: '#A5D6A7', stroke: '#66BB6A' },
        { x: bx + 48, label: 'Expert 1', fill: '#CE93D8', stroke: '#AB47BC' },
        { x: bx + 101, label: 'Expert 2', fill: '#CE93D8', stroke: '#AB47BC' },
        { x: bx + 154, label: '···', fill: 'none', stroke: 'none' },
      ].map((e, i) => (
        <g key={i}>
          {e.fill !== 'none' ? (
            <>
              <rect x={e.x} y={275} width={46} height={30} rx="5" fill={e.fill} stroke={e.stroke} strokeWidth="1" />
              <text x={e.x + 23} y={286} textAnchor="middle" fill="#333" fontSize="7" fontWeight="600">{e.label}</text>
              <text x={e.x + 23} y={298} textAnchor="middle" fill="#666" fontSize="6">{act}</text>
            </>
          ) : (
            <text x={e.x + 23} y={293} textAnchor="middle" fill="#AB47BC" fontSize="14" fontWeight="700">···</text>
          )}
          {e.fill !== 'none' && <line x1={cx} y1={262} x2={e.x + 23} y2={275} stroke="#999" strokeWidth="0.8" />}
        </g>
      ))}

      {/* 加权合并 */}
      <Box x={bx + 10} y={318} w={bw - 20} h={22} label="Weighted merge" fill="#FFCDD2" stroke="#E57373" color="#C62828" fs={9} />
      {[bx + 18, bx + 71, bx + 124].map((ex, i) => (
        <line key={i} x1={ex} y1={305} x2={cx} y2={318} stroke="#E57373" strokeWidth="0.8" opacity="0.5" />
      ))}

      <Arr x1={cx} y1={370} x2={cx} y2={395} id="arr-moe" />

      {/* Norm 2 */}
      <Box x={bx + 10} y={395} w={bw - 20} h={26} label={`${norm} 2`} />
      <Arr x1={cx} y1={421} x2={cx} y2={448} id="arr-moe" />
      <circle cx={cx} cy={435} r="2" fill="#555" />
      <line x1={cx} y1={435} x2={skipX} y2={435} stroke="#555" strokeWidth="1.2" />

      {/* ── ⊕ Residual 1 ── */}
      <Plus cx={cx} cy={458} />
      <path d={`M${skipX},${570} L${skipX},${458} L${cx + 11},${458}`} fill="none" stroke="#555" strokeWidth="1.2" />
      <Arr x1={cx} y1={469} x2={cx} y2={492} id="arr-moe" />

      {/* Attention */}
      <Box x={bx + 15} y={492} w={bw - 30} h={40} label={attn}
        fill={ATTN_BG} stroke="#444" color="#fff"
        fs={attn.length > 20 ? 8.5 : attn.length > 14 ? 9.5 : 11} />
      <Shape x={cx} y={488} text={shEmb} />
      <Arr x1={cx} y1={532} x2={cx} y2={555} id="arr-moe" />

      {/* Norm 1 */}
      <Box x={bx + 10} y={555} w={bw - 20} h={26} label={`${norm} 1`} />
      <Arr x1={cx} y1={581} x2={cx} y2={600} id="arr-moe" />
      <circle cx={cx} cy={590} r="2" fill="#555" />
      <line x1={cx} y1={590} x2={skipX} y2={590} stroke="#555" strokeWidth="1.2" />

      {/* RoPE */}
      <Box x={bx - 130} y={500} w={70} h={24} label={pos} fs={9} />
      <line x1={bx - 60} y1={512} x2={bx + 15} y2={512} stroke="#666" strokeWidth="1" markerEnd="url(#arr-moe)" />

      {/* Block 重复次数 */}
      <text x={bx - 35} y={610} textAnchor="end" fill={M} fontSize="15" fontWeight="800">{layers} ×</text>

      {/* Block → Embedding */}
      <Arr x1={cx} y1={615} x2={cx} y2={650} id="arr-moe" />
      <Shape x={cx} y={640} text={shEmb} />

      {/* Embedding */}
      <Box x={bx - 15} y={650} w={bw + 30} h={30} label="Token embedding layer" />
      <Arr x1={cx} y1={680} x2={cx} y2={710} id="arr-moe" />

      {/* Tokenized text */}
      <Box x={bx + 5} y={710} w={bw - 10} h={26} label="Tokenized text" />
      <text x={cx} y={755} textAnchor="middle" fill="#666" fontSize="10" fontStyle="italic">Sample input text</text>
      <Arr x1={cx} y1={758} x2={cx} y2={736} id="arr-moe" />

      {/* ══════════ 右侧参数标注 ══════════ */}
      <Note x1={bx + bw + 5} y1={62} x2={W - 195} y2={48} label="Vocabulary size of" value={vocab !== '?' ? vocab : undefined} />

      {experts && (
        <Note x1={bx + bw - 10} y1={290} x2={W - 195} y2={280}
          label="Experts:" value={experts.length > 35 ? experts.slice(0, 35) + '…' : experts} />
      )}

      {attn && (
        <Note x1={bx + bw - 15} y1={505} x2={W - 195} y2={500} label="Attention:" value={attn} />
      )}

      {ctx && (
        <Note x1={bx - 35} y1={520} x2={15} y2={615}
          label="Supported context length of" value={ctx} side="left" />
      )}

      {emb && (
        <Note x1={bx + bw + 20} y1={665} x2={W - 195} y2={660}
          label="Embedding dimension of" value={emb} />
      )}

      {precision && (
        <Note x1={bx + bw - 10} y1={340} x2={W - 195} y2={330}
          label="Training precision:" value={precision} />
      )}

      {/* MTP 模块 */}
      <rect x={W - 195} y={55} width={130} height={38} rx="8" fill="none" stroke={M} strokeWidth="1" strokeDasharray="4 3" />
      <text x={W - 130} y={70} textAnchor="middle" fill={M} fontSize="8.5" fontWeight="600">MTP Module</text>
      <text x={W - 130} y={82} textAnchor="middle" fill="#999" fontSize="7">Multi-Token Prediction</text>
      <line x1={bx + bw} y1={66} x2={W - 195} y2={74} stroke={M} strokeWidth="0.8" strokeDasharray="3 3" />
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

export { TransformerBlockSVG, MoEArchSVG, EvolutionPathSVG, COLORS };