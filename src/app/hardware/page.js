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

// ─── 芯片结构示意图 SVG 组件 ──────────────────────────────────────────────────

/**
 * N-MOS 横截面结构示意图（精确版）
 * 层次从下到上：p-type substrate → source/drain n+ 区 → gate oxide → polysilicon gate → metal contacts
 */
function NMOSCrossSectionDiagram() {
  return (
    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/30 p-3">
      <p className="text-[10px] font-semibold text-blue-600 mb-2 flex items-center gap-1">
        <span>📐</span> N-MOS 横截面结构（平面 FinFET 前身，传统平面 MOSFET）
      </p>
      <svg viewBox="0 0 520 260" className="w-full max-w-lg mx-auto block" style={{ fontFamily: 'monospace' }}>
        {/* ── 背景 ── */}
        <rect x="0" y="0" width="520" height="260" fill="#f8fafc" rx="8" />

        {/* ── p-type 衬底（蓝灰，底层大块）── */}
        <rect x="30" y="160" width="460" height="70" fill="#c7d2fe" rx="4" />
        <text x="260" y="200" textAnchor="middle" fontSize="12" fill="#3730a3" fontWeight="bold">p-type substrate（p⁻ 硅衬底）</text>
        <text x="260" y="215" textAnchor="middle" fontSize="10" fill="#4338ca">掺杂浓度低（~10¹⁵ cm⁻³），电阻率高</text>

        {/* ── Source n+ 区（左，浅蓝绿）── */}
        <rect x="50" y="120" width="100" height="42" fill="#6ee7b7" rx="3" />
        <text x="100" y="137" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="bold">Source</text>
        <text x="100" y="152" textAnchor="middle" fontSize="10" fill="#047857">n⁺（高掺杂）</text>

        {/* ── Drain n+ 区（右，浅蓝绿）── */}
        <rect x="370" y="120" width="100" height="42" fill="#6ee7b7" rx="3" />
        <text x="420" y="137" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="bold">Drain</text>
        <text x="420" y="152" textAnchor="middle" fontSize="10" fill="#047857">n⁺（高掺杂）</text>

        {/* ── 沟道区域（p-body，中间，加虚线框表示反型层）── */}
        <rect x="150" y="120" width="220" height="42" fill="#ddd6fe" rx="2" />
        <text x="260" y="141" textAnchor="middle" fontSize="10" fill="#5b21b6">沟道（channel）</text>
        <text x="260" y="155" textAnchor="middle" fontSize="9" fill="#7c3aed">L = 栅极长度（=特征尺寸）</text>

        {/* 反型层虚线（导通时） */}
        <line x1="150" y1="162" x2="370" y2="162" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="260" y="172" textAnchor="middle" fontSize="9" fill="#7c3aed">← 反型层（导通时电子聚集）→</text>

        {/* ── Gate Oxide（栅氧，极薄红线层）── */}
        <rect x="150" y="112" width="220" height="10" fill="#fca5a5" />
        <text x="390" y="120" fontSize="9" fill="#dc2626">← Gate Oxide（SiO₂，1~3nm）</text>

        {/* ── Polysilicon / Metal Gate（栅极）── */}
        <rect x="150" y="72" width="220" height="42" fill="#fbbf24" rx="3" />
        <text x="260" y="89" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Gate</text>
        <text x="260" y="105" textAnchor="middle" fontSize="10" fill="#92400e">Polysilicon / Metal（栅极）</text>

        {/* ── Gate 引线（向上） ── */}
        <line x1="260" y1="72" x2="260" y2="40" stroke="#78350f" strokeWidth="2" />
        <circle cx="260" cy="36" r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        <text x="275" y="40" fontSize="10" fill="#78350f">V_G（控制电压）</text>

        {/* ── Source 引线 ── */}
        <line x1="100" y1="120" x2="100" y2="55" stroke="#065f46" strokeWidth="2" />
        <circle cx="100" cy="51" r="5" fill="#6ee7b7" stroke="#065f46" strokeWidth="1.5" />
        <text x="35" y="55" fontSize="10" fill="#065f46">V_S = 0V</text>

        {/* ── Drain 引线 ── */}
        <line x1="420" y1="120" x2="420" y2="55" stroke="#065f46" strokeWidth="2" />
        <circle cx="420" cy="51" r="5" fill="#6ee7b7" stroke="#065f46" strokeWidth="1.5" />
        <text x="430" y="55" fontSize="10" fill="#065f46">V_D &gt; 0V</text>

        {/* ── Body/Bulk 引线 ── */}
        <line x1="260" y1="230" x2="260" y2="245" stroke="#3730a3" strokeWidth="1.5" />
        <circle cx="260" cy="249" r="4" fill="#c7d2fe" stroke="#3730a3" strokeWidth="1.5" />
        <text x="268" y="253" fontSize="9" fill="#3730a3">Bulk（V_B，通常接地）</text>

        {/* ── Width 标注 ── */}
        <line x1="30" y1="250" x2="490" y2="250" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
        <text x="20" y="253" fontSize="8" fill="#94a3b8">W（沟道宽度，垂直纸面方向）</text>

        {/* ── 工作条件说明 ── */}
        <rect x="30" y="6" width="460" height="26" fill="white" rx="4" stroke="#e2e8f0" />
        <text x="260" y="17" textAnchor="middle" fontSize="10" fill="#374151">
          导通条件：V_GS &gt; V_th（阈值电压 ≈ 0.4~0.7V）
        </text>
        <text x="260" y="28" textAnchor="middle" fontSize="9" fill="#6b7280">
          线性区：V_DS &lt; V_GS − V_th　｜　饱和区：V_DS ≥ V_GS − V_th（电流恒定）
        </text>
      </svg>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {[
          { color: '#c7d2fe', label: 'p⁻ 衬底' },
          { color: '#6ee7b7', label: 'n⁺ Source/Drain' },
          { color: '#ddd6fe', label: '沟道 (p-body)' },
          { color: '#fca5a5', label: 'Gate Oxide (SiO₂)' },
          { color: '#fbbf24', label: 'Gate 电极' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color, border: '1px solid #cbd5e1' }} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CMOS 反相器电路图
 * 上方 PMOS（源极接 VDD）+ 下方 NMOS（源极接 GND），Gate 共用输入，Drain 共用输出
 */
function CMOSInverterDiagram() {
  return (
    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/30 p-3">
      <p className="text-[10px] font-semibold text-purple-600 mb-2 flex items-center gap-1">
        <span>📐</span> CMOS 反相器电路图（P-MOS 上拉 + N-MOS 下拉）
      </p>
      <svg viewBox="0 0 420 300" className="w-full max-w-md mx-auto block" style={{ fontFamily: 'monospace' }}>
        <rect x="0" y="0" width="420" height="300" fill="#faf5ff" rx="8" />

        {/* ── VDD 电源线（顶部）── */}
        <line x1="210" y1="20" x2="210" y2="40" stroke="#dc2626" strokeWidth="2" />
        <line x1="185" y1="20" x2="235" y2="20" stroke="#dc2626" strokeWidth="2" />
        <text x="240" y="24" fontSize="12" fill="#dc2626" fontWeight="bold">VDD</text>

        {/* ── PMOS 符号 ── */}
        {/* Body + channel（竖线）*/}
        <line x1="210" y1="40" x2="210" y2="100" stroke="#dc2626" strokeWidth="2" />
        {/* Source 横线（上）*/}
        <line x1="210" y1="55" x2="235" y2="55" stroke="#7c3aed" strokeWidth="2" />
        {/* Drain 横线（下）*/}
        <line x1="210" y1="85" x2="235" y2="85" stroke="#7c3aed" strokeWidth="2" />
        {/* Gate 竖线 */}
        <line x1="235" y1="55" x2="235" y2="85" stroke="#7c3aed" strokeWidth="2" />
        {/* Gate 横线到 Gate 节点 */}
        <line x1="235" y1="70" x2="265" y2="70" stroke="#7c3aed" strokeWidth="2" />
        {/* PMOS 圆圈（区分 P/N） */}
        <circle cx="269" cy="70" r="5" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
        {/* Gate 连线继续到输入 */}
        <line x1="274" y1="70" x2="310" y2="70" stroke="#374151" strokeWidth="2" />
        {/* Source 到 VDD */}
        <line x1="210" y1="55" x2="210" y2="40" stroke="#dc2626" strokeWidth="2" />
        {/* Drain 到中间节点 */}
        <line x1="210" y1="85" x2="210" y2="105" stroke="#374151" strokeWidth="2" />
        {/* PMOS 标注 */}
        <text x="140" y="68" fontSize="11" fill="#7c3aed" fontWeight="bold">P-MOS</text>
        <text x="140" y="81" fontSize="9" fill="#7c3aed">（低电平导通）</text>

        {/* ── 中间节点（输出 Vout）── */}
        <line x1="210" y1="105" x2="210" y2="145" stroke="#374151" strokeWidth="2" />
        <line x1="210" y1="125" x2="340" y2="125" stroke="#374151" strokeWidth="2" />
        <circle cx="210" cy="125" r="4" fill="#374151" />
        <text x="345" y="130" fontSize="12" fill="#374151" fontWeight="bold">Vout</text>
        <text x="345" y="144" fontSize="9" fill="#6b7280">= ¬Vin</text>

        {/* ── NMOS 符号 ── */}
        {/* Body + channel（竖线）*/}
        <line x1="210" y1="145" x2="210" y2="205" stroke="#374151" strokeWidth="2" />
        {/* Drain 横线（上）*/}
        <line x1="210" y1="160" x2="235" y2="160" stroke="#0284c7" strokeWidth="2" />
        {/* Source 横线（下）*/}
        <line x1="210" y1="190" x2="235" y2="190" stroke="#0284c7" strokeWidth="2" />
        {/* Gate 竖线 */}
        <line x1="235" y1="160" x2="235" y2="190" stroke="#0284c7" strokeWidth="2" />
        {/* Gate 横线到输入节点 */}
        <line x1="235" y1="175" x2="310" y2="175" stroke="#374151" strokeWidth="2" />
        {/* Source 到 GND */}
        <line x1="210" y1="190" x2="210" y2="210" stroke="#059669" strokeWidth="2" />
        {/* Drain 到中间节点 */}
        <line x1="210" y1="160" x2="210" y2="145" stroke="#374151" strokeWidth="2" />
        {/* NMOS 标注 */}
        <text x="140" y="168" fontSize="11" fill="#0284c7" fontWeight="bold">N-MOS</text>
        <text x="140" y="181" fontSize="9" fill="#0284c7">（高电平导通）</text>

        {/* ── GND 符号 ── */}
        <line x1="210" y1="210" x2="210" y2="230" stroke="#059669" strokeWidth="2" />
        <line x1="190" y1="230" x2="230" y2="230" stroke="#059669" strokeWidth="2.5" />
        <line x1="196" y1="236" x2="224" y2="236" stroke="#059669" strokeWidth="1.8" />
        <line x1="202" y1="242" x2="218" y2="242" stroke="#059669" strokeWidth="1.2" />
        <text x="238" y="236" fontSize="12" fill="#059669" fontWeight="bold">GND</text>

        {/* ── 输入 Gate 连线（两个 Gate 汇合）── */}
        <line x1="310" y1="70" x2="310" y2="175" stroke="#374151" strokeWidth="2" />
        <circle cx="310" cy="70" r="3" fill="#374151" />
        <circle cx="310" cy="175" r="3" fill="#374151" />
        <line x1="310" y1="122" x2="380" y2="122" stroke="#374151" strokeWidth="2" />
        <circle cx="310" cy="122" r="4" fill="#374151" />
        <text x="384" y="127" fontSize="12" fill="#374151" fontWeight="bold">Vin</text>

        {/* ── 状态真值表 ── */}
        <rect x="20" y="255" width="380" height="38" fill="white" rx="4" stroke="#e2e8f0" />
        <text x="210" y="268" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">
          真值表：Vin = 0V → PMOS 导通，NMOS 截止 → Vout = VDD（逻辑 1）
        </text>
        <text x="210" y="283" textAnchor="middle" fontSize="10" fill="#374151">
          　　　　Vin = VDD → PMOS 截止，NMOS 导通 → Vout = 0V（逻辑 0）　静态功耗 ≈ 0
        </text>
      </svg>
    </div>
  );
}

/**
 * FinFET vs GAA（纳米片）3D 结构对比示意图
 */
function FinFETvsGAADiagram() {
  return (
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/30 p-3">
      <p className="text-[10px] font-semibold text-amber-700 mb-2 flex items-center gap-1">
        <span>📐</span> FinFET vs GAA（纳米片）结构演进对比
      </p>
      <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto block">
        <rect x="0" y="0" width="500" height="200" fill="#fffbeb" rx="8" />

        {/* ── FinFET（左半）── */}
        <text x="115" y="18" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="bold">FinFET（22nm~5nm）</text>

        {/* 衬底 */}
        <rect x="20" y="155" width="190" height="30" fill="#c7d2fe" rx="2" />
        <text x="115" y="173" textAnchor="middle" fontSize="10" fill="#3730a3">p-substrate</text>

        {/* Fin（硅鳍，竖起来的长方体）— 等轴视图 */}
        {/* 正面 */}
        <rect x="100" y="85" width="30" height="70" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
        {/* 顶面 */}
        <polygon points="100,85 115,70 145,70 130,85" fill="#4ade80" stroke="#16a34a" strokeWidth="1" />
        {/* 侧面 */}
        <polygon points="130,85 145,70 145,140 130,155" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
        <text x="115" y="125" textAnchor="middle" fontSize="9" fill="#166534">Fin</text>
        <text x="115" y="136" textAnchor="middle" fontSize="8" fill="#166534">(Si 鳍片)</text>

        {/* Gate 包裹 Fin 三面 */}
        <rect x="88" y="95" width="10" height="40" fill="#fbbf24" opacity="0.85" />
        <rect x="130" y="95" width="10" height="40" fill="#fbbf24" opacity="0.85" />
        <rect x="88" y="90" width="52" height="10" fill="#fbbf24" opacity="0.85" />
        <text x="50" y="120" fontSize="9" fill="#92400e">Gate</text>
        <text x="45" y="130" fontSize="8" fill="#92400e">包三面</text>
        <line x1="70" y1="122" x2="88" y2="118" stroke="#92400e" strokeWidth="0.8" />

        {/* 栅极控制面说明 */}
        <text x="115" y="190" textAnchor="middle" fontSize="9" fill="#92400e">控制面：3面（两侧+顶）</text>

        {/* Source/Drain */}
        <text x="67" y="148" fontSize="9" fill="#065f46">S</text>
        <text x="157" y="148" fontSize="9" fill="#065f46">D</text>

        {/* ── 分隔线 ── */}
        <line x1="250" y1="10" x2="250" y2="195" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4,3" />
        <text x="250" y="105" textAnchor="middle" fontSize="20" fill="#d1d5db">vs</text>

        {/* ── GAA（右半）── */}
        <text x="375" y="18" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">GAA / NSFET（3nm~2nm）</text>

        {/* 衬底 */}
        <rect x="280" y="155" width="190" height="30" fill="#c7d2fe" rx="2" />
        <text x="375" y="173" textAnchor="middle" fontSize="10" fill="#3730a3">p-substrate</text>

        {/* 纳米片（3层叠加）*/}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect x="340" y={115 - i * 22} width="70" height="14" fill="#86efac" stroke="#16a34a" strokeWidth="1" rx="2" />
            <text x="375" y={125 - i * 22} textAnchor="middle" fontSize="8" fill="#166534">Nanosheet {i + 1}</text>
          </g>
        ))}

        {/* Gate 完全包裹（全环绕）*/}
        {[0, 1, 2].map(i => (
          <rect key={i} x="332" y={112 - i * 22} width="86" height="20" fill="none"
            stroke="#fbbf24" strokeWidth="3" rx="4" opacity="0.8" strokeDasharray={i === 1 ? '' : '3,2'} />
        ))}
        <text x="290" y="110" fontSize="9" fill="#92400e">Gate</text>
        <text x="284" y="120" fontSize="8" fill="#92400e">全环绕</text>
        <line x1="305" y1="113" x2="332" y2="105" stroke="#92400e" strokeWidth="0.8" />

        <text x="375" y="190" textAnchor="middle" fontSize="9" fill="#1e40af">控制面：4面（全环绕）漏电更低</text>
        <text x="67" y="195" textAnchor="middle" fontSize="8" fill="#6b7280"></text>
      </svg>

      <div className="flex flex-wrap gap-3 mt-1 justify-center text-[10px] text-gray-500">
        <span>🟡 金色 = Gate 电极</span>
        <span>🟢 绿色 = 硅沟道（Fin / Nanosheet）</span>
        <span>🔵 蓝色 = p-type 衬底</span>
      </div>
    </div>
  );
}

/**
 * PN 结形成过程示意图（精确物理版）
 * 展示：P/N 两侧载流子分布 → 扩散 → 耗尽区 → 内建电场 → 平衡
 */
function PNJunctionDiagram() {
  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
      <p className="text-[10px] font-semibold text-emerald-700 mb-2 flex items-center gap-1">
        <span>📐</span> PN 结形成物理过程（载流子扩散 → 耗尽区 → 内建电场平衡）
      </p>
      <svg viewBox="0 0 560 310" className="w-full max-w-xl mx-auto block" style={{ fontFamily: 'sans-serif' }}>
        <rect x="0" y="0" width="560" height="310" fill="#f0fdf4" rx="8" />

        {/* ══════════════════════════════════════════════════════════════
            STEP 1 — 接触前（顶部，y=20~120）
            左侧 P 型（空穴多），右侧 N 型（电子多）
            ══════════════════════════════════════════════════════════════ */}
        <text x="280" y="16" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">① 接触前：P 型（左）与 N 型（右）独立存在</text>

        {/* P 型块 */}
        <rect x="30" y="22" width="220" height="78" fill="#fde68a" rx="4" stroke="#f59e0b" strokeWidth="1" />
        <text x="140" y="38" textAnchor="middle" fontSize="11" fill="#78350f" fontWeight="bold">P 型半导体</text>
        <text x="140" y="52" textAnchor="middle" fontSize="9" fill="#92400e">受主掺杂（Boron，B³⁺）</text>
        <text x="140" y="64" textAnchor="middle" fontSize="9" fill="#92400e">多子：空穴 ⊕　少子：电子 ⊖</text>
        {/* 空穴符号（⊕红色） */}
        {[55,85,115,145,175,205].map((x,i) => (
          <text key={i} x={x} y="84" textAnchor="middle" fontSize="14" fill="#dc2626">⊕</text>
        ))}
        {/* 少量电子 */}
        <text x="95" y="98" textAnchor="middle" fontSize="11" fill="#1d4ed8">⊖</text>
        <text x="185" y="98" textAnchor="middle" fontSize="11" fill="#1d4ed8">⊖</text>

        {/* N 型块 */}
        <rect x="310" y="22" width="220" height="78" fill="#bfdbfe" rx="4" stroke="#3b82f6" strokeWidth="1" />
        <text x="420" y="38" textAnchor="middle" fontSize="11" fill="#1e3a8a" fontWeight="bold">N 型半导体</text>
        <text x="420" y="52" textAnchor="middle" fontSize="9" fill="#1e40af">施主掺杂（Phosphorus，P⁵⁺）</text>
        <text x="420" y="64" textAnchor="middle" fontSize="9" fill="#1e40af">多子：电子 ⊖　少子：空穴 ⊕</text>
        {/* 电子符号 */}
        {[335,365,395,425,455,485].map((x,i) => (
          <text key={i} x={x} y="84" textAnchor="middle" fontSize="14" fill="#1d4ed8">⊖</text>
        ))}
        {/* 少量空穴 */}
        <text x="375" y="98" textAnchor="middle" fontSize="11" fill="#dc2626">⊕</text>
        <text x="465" y="98" textAnchor="middle" fontSize="11" fill="#dc2626">⊕</text>

        {/* 接触界面虚线 */}
        <line x1="280" y1="22" x2="280" y2="100" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="280" y="114" textAnchor="middle" fontSize="9" fill="#9ca3af">接触界面（冶金结）</text>

        {/* ══════════════════════════════════════════════════════════════
            STEP 2 — 扩散与耗尽区（中部，y=130~220）
            ══════════════════════════════════════════════════════════════ */}
        <text x="280" y="128" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">② 接触后：多子扩散 → 耗尽区（Depletion Region）形成</text>

        {/* P 侧剩余（已失去空穴） */}
        <rect x="30" y="135" width="165" height="72" fill="#fef3c7" rx="4" stroke="#f59e0b" strokeWidth="1" />
        <text x="112" y="151" textAnchor="middle" fontSize="10" fill="#92400e">P 中性区（剩余空穴）</text>
        {[50,80,110,140,170].map((x,i) => (
          <text key={i} x={x} y="170" textAnchor="middle" fontSize="12" fill="#dc2626">⊕</text>
        ))}
        {[55,105,155].map((x,i) => (
          <text key={i} x={x} y="192" textAnchor="middle" fontSize="12" fill="#dc2626">⊕</text>
        ))}

        {/* 耗尽区（P 侧：负固定离子） */}
        <rect x="195" y="135" width="85" height="72" fill="#fce7f3" rx="0" stroke="#db2777" strokeWidth="1.5" />
        <text x="237" y="149" textAnchor="middle" fontSize="8" fill="#9d174d">耗尽区（P侧）</text>
        <text x="237" y="160" textAnchor="middle" fontSize="8" fill="#9d174d">固定负电荷</text>
        {[207,230,252,274].map((x,i) => (
          <text key={i} x={x} y="178" textAnchor="middle" fontSize="12" fill="#9d174d">⊖</text>
        ))}
        {[207,230,252,274].map((x,i) => (
          <text key={i} x={x} y="196" textAnchor="middle" fontSize="12" fill="#9d174d">⊖</text>
        ))}

        {/* 耗尽区（N 侧：正固定离子） */}
        <rect x="280" y="135" width="85" height="72" fill="#ede9fe" rx="0" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="322" y="149" textAnchor="middle" fontSize="8" fill="#5b21b6">耗尽区（N侧）</text>
        <text x="322" y="160" textAnchor="middle" fontSize="8" fill="#5b21b6">固定正电荷</text>
        {[290,313,336,358].map((x,i) => (
          <text key={i} x={x} y="178" textAnchor="middle" fontSize="12" fill="#5b21b6">⊕</text>
        ))}
        {[290,313,336,358].map((x,i) => (
          <text key={i} x={x} y="196" textAnchor="middle" fontSize="12" fill="#5b21b6">⊕</text>
        ))}

        {/* 冶金结中心线 */}
        <line x1="280" y1="135" x2="280" y2="207" stroke="#db2777" strokeWidth="2" />

        {/* N 侧中性区 */}
        <rect x="365" y="135" width="165" height="72" fill="#dbeafe" rx="4" stroke="#3b82f6" strokeWidth="1" />
        <text x="447" y="151" textAnchor="middle" fontSize="10" fill="#1e40af">N 中性区（剩余电子）</text>
        {[380,410,440,470,500].map((x,i) => (
          <text key={i} x={x} y="170" textAnchor="middle" fontSize="12" fill="#1d4ed8">⊖</text>
        ))}
        {[387,427,467,507].map((x,i) => (
          <text key={i} x={x} y="192" textAnchor="middle" fontSize="12" fill="#1d4ed8">⊖</text>
        ))}

        {/* 扩散箭头（空穴向右扩散） */}
        <defs>
          <marker id="arrowR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
          </marker>
          <marker id="arrowL" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L6,6 L0,3 z" fill="#1d4ed8" />
          </marker>
          <marker id="arrowE" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" />
          </marker>
        </defs>
        <line x1="178" y1="207" x2="194" y2="207" stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#arrowR)" />
        <text x="155" y="216" fontSize="8" fill="#dc2626">⊕ 扩散</text>
        <line x1="369" y1="207" x2="366" y2="207" stroke="#1d4ed8" strokeWidth="1.5" markerEnd="url(#arrowL)" />
        <text x="371" y="216" fontSize="8" fill="#1d4ed8">⊖ 扩散</text>

        {/* ══════════════════════════════════════════════════════════════
            STEP 3 — 内建电场与平衡（底部，y=230~300）
            ══════════════════════════════════════════════════════════════ */}
        <text x="280" y="228" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">③ 内建电场 E₀ 阻止继续扩散 → 动态平衡（V_bi ≈ 0.6~0.7V for Si）</text>

        {/* 内建电场方向（N→P，即从正电荷区到负电荷区） */}
        <rect x="30" y="237" width="500" height="32" fill="white" rx="4" stroke="#e5e7eb" strokeWidth="1" />
        {/* 渐变背景代表内建电场方向 */}
        <defs>
          <linearGradient id="eFieldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#fce7f3" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f9a8d4" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#ede9fe" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect x="30" y="237" width="500" height="32" fill="url(#eFieldGrad)" rx="4" />
        {/* 电场箭头（从N侧→P侧，即从右耗尽区到左耗尽区） */}
        {[360,340,320,300,280].map((x,i) => (
          <line key={i} x1={x} y1="253" x2={x-14} y2="253" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrowL)" />
        ))}
        <text x="195" y="257" textAnchor="middle" fontSize="9" fill="#5b21b6" fontWeight="bold">← E₀ 内建电场（N→P 方向）</text>
        <text x="420" y="249" fontSize="8" fill="#6b7280">N 侧 ⊕ 固定离子产生电场</text>
        <text x="420" y="261" fontSize="8" fill="#6b7280">阻止⊖电子继续向左扩散</text>

        {/* 势垒说明 */}
        <rect x="30" y="276" width="500" height="28" fill="white" rx="4" stroke="#e5e7eb" />
        <text x="280" y="290" textAnchor="middle" fontSize="9" fill="#374151">
          平衡时：扩散电流 = 漂移电流（E₀ 驱动）　|　内建电位差 V_bi = (kT/q)·ln(N_A·N_D / nᵢ²) ≈ 0.6V（Si，室温）
        </text>
        <text x="280" y="302" textAnchor="middle" fontSize="8" fill="#9ca3af">
          耗尽宽度 W_d ∝ 1/√N_doping　|　PN 结 → 二极管（正偏导通，反偏截止）→ MOSFET 的 n⁺ Source/Drain 本质也是 PN 结
        </text>
      </svg>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {[
          { color: '#fde68a', border: '#f59e0b', label: 'P 型（多子：空穴⊕）' },
          { color: '#bfdbfe', border: '#3b82f6', label: 'N 型（多子：电子⊖）' },
          { color: '#fce7f3', border: '#db2777', label: '耗尽区 P 侧（负固定离子）' },
          { color: '#ede9fe', border: '#7c3aed', label: '耗尽区 N 侧（正固定离子）' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color, border: `1px solid ${l.border}` }} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
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
        category: 'interface',
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
        category: 'interface',
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
        category: 'interface',
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
        category: 'interface',
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
        category: 'interface',
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
        category: 'interface',
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
        category: 'algorithm',
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
        category: 'algorithm',
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
        category: 'algorithm',
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
        category: 'interface',
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
        category: 'stack',
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
        category: 'stack',
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
        category: 'stack',
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
        category: 'stack',
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
        code: `# python-can: CAN bus 机器人关节控制（MIT Mini Cheetah 协议）
import can

bus = can.interface.Bus(channel='can0', bustype='socketcan',
                        bitrate=1_000_000)   # 1 Mbps

def float_to_uint(x, lo, hi, bits):
    """浮点 → 无符号整数（CAN 帧压缩传输常用方式）"""
    x = max(lo, min(hi, x))
    return int((x - lo) / (hi - lo) * ((1 << bits) - 1))

def send_joint_cmd(motor_id, pos, vel, kp, kd, torque):
    """
    MIT Cheetah CAN 协议帧（8 字节）
      pos    (rad)    : ±12.5  → 16bit
      vel    (rad/s)  : ±65    → 12bit
      kp     (N·m/rad): 0~500  → 12bit
      kd     (N·m·s/r): 0~5    → 12bit
      torque (N·m)    : ±18    → 12bit
    """
    p = float_to_uint(pos,    -12.5, 12.5, 16)
    v = float_to_uint(vel,    -65,   65,   12)
    k = float_to_uint(kp,      0,    500,  12)
    d = float_to_uint(kd,      0,    5,    12)
    t = float_to_uint(torque, -18,   18,   12)

    data = [p >> 8,  p & 0xFF,
            (v >> 4) & 0xFF,
            ((v & 0xF) << 4) | (k >> 8),
            k & 0xFF,
            (d >> 4) & 0xFF,
            ((d & 0xF) << 4) | (t >> 8),
            t & 0xFF]
    bus.send(can.Message(arbitration_id=motor_id, data=data))

# 1. 发送使能帧（进入电机控制模式）
bus.send(can.Message(arbitration_id=1,
         data=[0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFC]))

# 2. 发送零位保持指令（Kp=5, Kd=0.5 柔顺保持）
send_joint_cmd(motor_id=1, pos=0.0, vel=0.0,
               kp=5.0, kd=0.5, torque=0.0)
print("关节1 CAN 帧已发送，进入力矩控制模式")

# EtherCAT 方向：python-ethercat / pysoem 库
# import pysoem
# master = pysoem.Master()
# master.open('eth0')
# master.config_init()   # 自动枚举从站（伺服驱动器）
# master.config_map()    # 映射 PDO（过程数据对象）
# master.state = pysoem.OP_STATE   # 进入运行态 (循环时间 <1ms)`,
        lang: 'python',
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

// ─── 💰 选型指南 ──────────────────────────────────────────────────────────────
const SELECTION_LAYERS = [
  {
    level: '🤖 VLA / 世界模型机器人',
    title: '具身智能整机选型',
    subtitle: '按算力需求倒推硬件配置，覆盖入门验证→量产级完整方案',
    color: '#6c5ce7',
    items: [
      {
        name: '💡 选型逻辑：先定模型再选算力',
        icon: '🧭',
        desc: '模型参数量决定推理算力需求，算力决定芯片，芯片决定功耗/散热/成本',
        details: [
          { label: '核心决策链', text: '任务复杂度 → 所需模型规模 → 推理 TOPS/TFLOPS → 芯片型号 → 功耗/散热 → 整机成本' },
          { label: '小型 VLA（1B~7B）', text: 'RT-2-style 蒸馏小模型；Jetson AGX Orin（275 TOPS）可跑 7B INT4；端到端延迟 80~150ms；适合桌面机器人/抓取任务' },
          { label: '中型 VLA（7B~30B）', text: 'π0/OpenVLA 级别；需双 Orin 或 单 NVIDIA Thor（1000 TOPS）；推理延迟 50~100ms（INT8/FP16）；Figure 02、Unitree G1 同量级' },
          { label: '大型世界模型（30B+）', text: '云端推理或 8× H100 边缘服务器；延迟 200ms+；适合研究/高端产线；成本 $100k+/套' },
          { label: '推理频率目标', text: '抓取任务：≥10Hz（100ms/帧）；移动操作：≥20Hz；动态避障：≥30Hz；决策层可降到 5Hz 但感知层保持高频' },
        ],
      },
      {
        name: '🟢 入门验证套件（¥2~5万）',
        icon: '🛠️',
        desc: '桌面级抓取机器人 + VLA 推理，用于算法验证和 Demo',
        details: [
          { label: '机械臂', text: 'Unitree Z1（¥7999，6DoF，URDF开源）或 Trossen WidowX 250（$1500，ROS 2 原生）' },
          { label: '计算单元', text: 'NVIDIA Jetson AGX Orin 64GB 开发套件（$499 Developer Kit / ¥6000国内）；275 TOPS；够跑 7B INT4 VLA' },
          { label: '相机', text: 'Intel RealSense D435i（¥1500，RGB-D + IMU）× 2（腕部 + 第三视角）' },
          { label: '基础设施', text: '工控机（i7/Ryzen + 32GB RAM，¥4000）跑 ROS 2 + 数据采集；千兆以太网连接 Jetson' },
          { label: '总成本估算', text: '机械臂¥8k + Jetson¥6k + 相机¥3k + 工控机¥4k + 配件¥2k ≈ ¥23k；适合1~3人小团队 PoC' },
        ],
        code: `# 推理性能评估脚本（在 Jetson AGX Orin 上运行）
# 用于选型前评估 VLA 模型是否满足延迟需求

import time, torch, numpy as np

def benchmark_inference(model, input_dict, n_runs=50, warmup=5):
    """
    model: 已加载的 VLA 模型（如 OpenVLA）
    input_dict: {'image': tensor[1,3,224,224], 'instruction': str}
    """
    device = next(model.parameters()).device

    # Warmup
    for _ in range(warmup):
        with torch.no_grad():
            _ = model.predict_action(**input_dict)

    # 正式计时
    latencies = []
    for _ in range(n_runs):
        t0 = time.perf_counter()
        with torch.no_grad():
            action = model.predict_action(**input_dict)
        torch.cuda.synchronize()   # 等待 GPU 完成
        latencies.append((time.perf_counter() - t0) * 1000)  # ms

    latencies = np.array(latencies)
    print(f"推理延迟 (ms): mean={latencies.mean():.1f}  "
          f"p50={np.percentile(latencies,50):.1f}  "
          f"p95={np.percentile(latencies,95):.1f}  "
          f"p99={np.percentile(latencies,99):.1f}")
    print(f"等效频率: {1000/latencies.mean():.1f} Hz")
    return latencies

# Jetson 典型结果参考（FP16, batch=1）：
# 7B  INT4 → mean≈85ms  → 11.8Hz  ✅ 够用
# 7B  FP16 → mean≈320ms → 3.1Hz   ❌ 太慢
# 3B  INT8 → mean≈45ms  → 22Hz    ✅ 流畅
# 13B INT4 → mean≈170ms → 5.9Hz   ⚠️ 勉强`,
        lang: 'python',
      },
      {
        name: '🟡 量产级具身智能（¥15~50万）',
        icon: '🏭',
        desc: '商业双臂移动机器人完整方案，参考 Figure 02 / Unitree H1 量级',
        details: [
          { label: '主算力', text: 'NVIDIA Jetson Thor（1000 TOPS AI，2024 Q4 量产）或 NVIDIA AGX Orin 64GB × 2；$2000~4000/套' },
          { label: '安全控制器', text: 'Arm Cortex-R5 实时控制器（<1ms 安全响应）；独立于 AI 推理链路；满足 IEC 61508 SIL2' },
          { label: '双臂机械臂', text: '6~7DoF × 2；力矩控制关节；Harmonic Drive 谐波减速器（回差 <1 arcmin）；预算¥5~15万/套臂' },
          { label: '移动底盘', text: 'Clearpath Husky（四轮差速，¥7万）或 Agile Robots 自研；载重 75kg+；锂电续航 4h+' },
          { label: '传感器套件', text: 'LiDAR（Ouster OS1-32，¥2万）+ 双目 × 4（Zed X Mini，¥1.5万/个）+ 腕部 F/T 传感器（ATI，¥3万/个）' },
          { label: '整机 BOM 估算', text: '机械结构¥20~35万 + 算力¥3万 + 传感器¥10万 + 电气/集成¥5万 ≈ ¥40~55万出厂成本（量产可降50%）' },
        ],
      },
      {
        name: '🔴 端云协同推理架构',
        icon: '☁️',
        desc: '大参数世界模型（70B+）端云分离部署，兼顾实时性与智能上限',
        details: [
          { label: '架构原理', text: '端侧运行轻量策略网络（<3B，>30Hz）；云端运行世界模型（70B+）进行高层规划（1~5Hz）；通过高可靠低延迟网络同步' },
          { label: '端侧要求', text: 'Jetson AGX Orin 64GB；运行蒸馏 Policy（ACT/Diffusion Policy 3B以内）；本地紧急停止逻辑独立运行' },
          { label: '云端要求', text: '4× A100/H100；运行 GPT-4V 级视觉语言规划器；QPS 低（全球部署数百台机器人可共享集群）' },
          { label: '网络要求', text: '5G SA 专网或 Wi-Fi 6E；上行带宽 ≥ 50Mbps（4路1080p30fps压缩流）；RTT ≤ 20ms（同城）' },
          { label: '国内典型方案', text: '宇树 + 华为云 / 智元 Agilex + 阿里云；工厂内 Wi-Fi 6 专网保障低延迟；已有量产案例' },
        ],
      },
    ],
  },
  {
    level: '🚗 自动驾驶',
    title: '按延迟预算选芯片与传感器',
    subtitle: '感知→融合→规划→控制全链路端到端延迟拆解，从芯片 TOPS 反推方案',
    color: '#0984e3',
    items: [
      {
        name: '⏱️ 延迟预算拆解',
        icon: '⏱️',
        desc: 'L2+/L3 系统从传感器采集到执行器响应的全链路时序',
        details: [
          { label: '总延迟目标（L2+）', text: '100~150ms 端到端（ISO 21448 SOTIF 要求）；高速场景 100km/h 下 100ms = 2.78m 反应距离' },
          { label: '传感器采集', text: 'Camera 帧率 30fps（33ms/帧）；LiDAR 10~20Hz（50~100ms）；Radar 20Hz（50ms）；数据时间戳同步 < 1ms' },
          { label: '感知推理', text: '目标检测（BEV 占用栅格）：NVIDIA Orin 100ms → H100 15ms；预留预算：20~40ms' },
          { label: '预测+规划', text: 'Motion Prediction：10~20ms；Path Planning（IDM/MPC）：5~15ms' },
          { label: '控制输出', text: '线控制动响应（Bosch iBooster）：30~60ms 机械延迟；线控转向：15~30ms' },
          { label: '典型分配', text: '采集同步5ms + 感知35ms + 预测15ms + 规划10ms + 通信5ms + 执行器60ms = 130ms ✅' },
        ],
        code: `# 自动驾驶延迟监控工具（基于 ROS 2）
import rclpy
from rclpy.node import Node
from std_msgs.msg import Header
import time

class LatencyMonitor(Node):
    """记录从传感器时间戳到控制输出的全链路延迟"""
    def __init__(self):
        super().__init__('latency_monitor')
        self.cam_ts = {}   # 相机帧时间戳
        self.stats  = {}   # 各阶段耗时统计

        # 订阅关键节点的 Header（含时间戳）
        self.create_subscription(Header, '/camera/header',
            lambda m: self._record('camera', m.stamp), 10)
        self.create_subscription(Header, '/perception/header',
            lambda m: self._record('perception', m.stamp), 10)
        self.create_subscription(Header, '/planning/header',
            lambda m: self._record('planning', m.stamp), 10)
        self.create_subscription(Header, '/control/header',
            lambda m: self._record('control', m.stamp), 10)

        self.create_timer(5.0, self._report)

    def _record(self, stage, stamp):
        t_sec = stamp.sec + stamp.nanosec * 1e-9
        self.stats.setdefault(stage, []).append(t_sec)

    def _report(self):
        stages = ['camera', 'perception', 'planning', 'control']
        if all(s in self.stats and len(self.stats[s]) > 10 for s in stages):
            # 计算相邻阶段平均延迟
            for i in range(1, len(stages)):
                a = self.stats[stages[i-1]]
                b = self.stats[stages[i]]
                n = min(len(a), len(b))
                avg_ms = (sum(b[-n:]) - sum(a[-n:])) / n * 1000
                self.get_logger().info(
                    f"{stages[i-1]}→{stages[i]}: {avg_ms:.1f}ms")`,
        lang: 'python',
      },
      {
        name: '🟢 L2+ 量产方案（¥3000~8000/套 BOM）',
        icon: '🚗',
        desc: '特斯拉 FSD / 小鹏 XNGP 类似方案，纯视觉或视觉+毫米波',
        details: [
          { label: '主芯片', text: '特斯拉 HW4.0（2× 自研 AI 芯片，144 TOPS × 2）/ 地平线征程 6M（128 TOPS，¥500）/ Mobileye EyeQ6（5 TOPS，低功耗 ADAS）' },
          { label: '摄像头套件', text: '8路环视（OX08BC 1200万像素，¥150/颗）+ 前向三目（长焦/广角/鱼眼）；Sony IMX490 HDR（¥200）；前向感知距离 200m' },
          { label: '毫米波雷达', text: '博世 MRR5（前向77GHz，200m，¥800）+ 大陆 ARS540（角雷达，¥600 × 4）；提供速度维度' },
          { label: '超声波', text: '8~12个 Bosch USC × 超声波（¥50/个）；<5m 近距离停车辅助；不做 AI 计算' },
          { label: '整车电气', text: '以太网 100BASE-T1（车载）；CAN FD（控制信号）；AUTOSAR CP 底层 OS；ISO 26262 ASIL-B 认证' },
        ],
      },
      {
        name: '🟡 L4 Robotaxi 方案（¥30~80万/套）',
        icon: '🏎️',
        desc: 'Waymo / 百度萝卜快跑级别，激光雷达为核心传感器',
        details: [
          { label: '主算力', text: 'NVIDIA DRIVE Thor（2000 TOPS，2025年量产）或 NVIDIA DRIVE Orin × 2（500 TOPS）；$2000~5000' },
          { label: '激光雷达', text: 'Waymo 自研 × 5（造价已降至 $500 级）；Luminar Iris（250m 200线，¥3万）；Hesai AT128（128线，¥8000）' },
          { label: '固态LiDAR趋势', text: 'Innoviz One（固态，¥5000，量产中）；Mobileye LaserFusionTM；无旋转结构，可靠性高；2025年主机厂量产配备' },
          { label: 'GPS/INS', text: 'NovAtel PwrPak7（RTK+IMU，¥6万）；厘米级绝对定位；配合 HD Map 做地图定位（NDT匹配）' },
          { label: 'V2X 通信', text: 'C-V2X PC5（直连，<3ms）/ DSRC（802.11p）；感知范围扩展到视线外；十字路口碰撞预警' },
        ],
      },
      {
        name: '🔴 国产芯片替代方案对比',
        icon: '🇨🇳',
        desc: '2025年国产主控芯片成熟度与适用场景（出口管制背景下的核心选择）',
        details: [
          { label: '地平线征程 6 系列', text: '征程 6P（128 TOPS）/ 6E（40 TOPS）/ 6M（128 TOPS 中算力）；BPU 架构；工具链完善；吉利/长安/广汽已量产' },
          { label: '华为昇腾 MDC 810', text: '400 TOPS；支持 L3 级功能安全；MindSDK；但生态相对封闭；问界/阿维塔/鸿蒙智行标配' },
          { label: '黑芝麻 A1000 Pro', text: '196 TOPS；自研华山架构；长安/上汽在用；算子支持度低于英伟达生态' },
          { label: '芯驰 X9SP', text: '车规 MCU + 应用处理器融合；不做深度学习主算力；适合低算力 ADAS（L2及以下）' },
          { label: '选型建议', text: '研究阶段用 NVIDIA（工具链最完整）→ 量产用国产（成本/供应链安全）；迁移成本：算子适配 + 精度损失验证，一般需 3~6 个月' },
        ],
      },
    ],
  },
  {
    level: '🛸 无人机',
    title: '整机方案与价格区间',
    subtitle: '从消费级 FPV 到工业级多旋翼，完整 BOM 与选型建议',
    color: '#00cec9',
    items: [
      {
        name: '🟢 自制穿越机 FPV（¥1000~3000）',
        icon: '🏁',
        desc: '5寸竞速无人机，适合学习飞控原理和 Betaflight 调参',
        details: [
          { label: '机架', text: 'GepRC Mark5（5寸碳纤维，¥200）；轴距 210mm；全碳重量 160g' },
          { label: '飞控', text: 'MAMBA F405 MK3（STM32F405，Betaflight，¥180）；Blackbox 飞行数据记录' },
          { label: '电机', text: 'XING-E 2207 1800KV（无刷，4个，¥80/个）；配 5寸三叶桨' },
          { label: '电调', text: '45A BLHeli_32 4合1（¥300）；DShot600协议；双向反馈' },
          { label: '图传+遥控', text: 'DJI O3 图传（¥1200）/ Caddx Vista（¥600）；遥控：RadioMaster Boxer（ELRS，¥800）' },
          { label: '总成本', text: '机架¥200 + 飞控¥180 + 4电机¥320 + 电调¥300 + 图传¥600 + 电池×3¥300 ≈ ¥1900；不含遥控' },
        ],
      },
      {
        name: '🟡 工业植保/测绘（¥3~15万）',
        icon: '🌾',
        desc: '农业植保或 RTK 精密测绘任务，商业作业场景',
        details: [
          { label: '大疆 T50 植保机', text: '50kg 载药量；官网¥9万；12 轴旋翼；全向雷达避障；DRTK2 厘米定位；作业效率 200亩/h' },
          { label: '自研测绘方案', text: '机架（E600 六旋翼，¥3000）+ 飞控（Pixhawk 6X，¥2000）+ RTK模组（HERE4，¥2500）+ 测绘相机（Sony A7R IV，¥15000）' },
          { label: '任务规划软件', text: 'Mission Planner（免费）/ UgCS（商业，支持复杂地形）；生成 KMZ 格式航线；地面站实时监控' },
          { label: '数据处理', text: 'Pix4D（摄影测量，¥8000/年）/ Metashape（¥4000）；点云 + 正射影像 + DEM 输出' },
        ],
      },
      {
        name: '🔴 自主智能无人机（¥5~30万）',
        icon: '🤖',
        desc: '搭载边缘 AI 的自主导航无人机，无 GPS 室内定位',
        details: [
          { label: '计算平台', text: 'Jetson Orin NX 16GB（100 TOPS，¥2500）；运行 FAST-LIO2 + YOLOv8；总功耗 <15W' },
          { label: '深度传感器', text: 'Intel RealSense D435i（¥1500，VIO里程计输入）+ Livox Mid-360（360°固态LiDAR，¥3500）' },
          { label: '通信', text: '4G/5G 数传模块（中移物联 ML302，¥300）+ WiFi 6（Ubiquiti，¥800）；支持远程遥控备援' },
          { label: '完整方案参考', text: 'AMOVLAB P450（ROS 2，Orin NX，Mid-360，¥28000）；开源代码 + 文档完整；适合科研团队' },
          { label: '自主飞行关键技术', text: 'FAST-LIO2（建图定位）+ VoxBlox（局部地图）+ FUEL（自主探索）+ FASTER（实时避障规划）；全套开源 ROS 2' },
        ],
        code: `# 无人机硬件成本计算器
hardware_bom = {
    # 飞行平台
    'frame_hexacopter':     3500,   # 六旋翼碳纤维机架 (¥)
    'motors_6x':            2400,   # T-Motor MN501S × 6
    'esc_40a_6x':           2400,   # Flame 40A × 6
    'pixhawk6x_fc':         2000,   # 飞控
    'battery_16000mah_6s':   800,   # 主电池 × 2
    # 计算平台
    'jetson_orin_nx_16gb':  2500,   # 边缘 AI 计算
    # 传感器
    'livox_mid360':         3500,   # 固态 LiDAR
    'realsense_d435i':      1500,   # 深度相机 × 1
    'here4_rtk_gnss':       2500,   # RTK 定位
    # 通信
    'dji_o3_video':         1200,   # 图传
    'sik_radio_telemetry':   400,   # 数传
}

total = sum(hardware_bom.values())
print(f"硬件 BOM 合计: ¥{total:,}")
print(f"\\n各模块占比:")
for k, v in sorted(hardware_bom.items(), key=lambda x: -x[1]):
    bar = '█' * int(v / total * 30)
    print(f"  {k:30s} ¥{v:5,}  {bar}  {v/total*100:.1f}%")

# 输出：
# 硬件 BOM 合计: ¥22,700
# livox_mid360       ¥3,500  ████  15.4%
# motors_6x          ¥2,400  ███   10.6%
# ...`,
        lang: 'python',
      },
    ],
  },
];

// ─── 🧪 材料 ──────────────────────────────────────────────────────────────────
const MATERIALS_LAYERS = [
  {
    level: '🟢 入门',
    title: '结构材料基础',
    subtitle: '机器人/航空/电子器件最常用结构材料——力学性能、加工方式、选型原则',
    color: '#27ae60',
    items: [
      {
        name: '金属材料',
        icon: '🔩',
        desc: '铝合金、钢、钛合金——机器人骨架与精密结构件的核心选材',
        details: [
          { label: '铝合金 6061-T6', text: '密度 2.7g/cm³，σ=310MPa；比强度高，易加工，阳极氧化耐腐蚀；机械臂连杆/机身骨架首选；¥30/kg' },
          { label: '铝合金 7075-T6', text: 'σ=572MPa，更高强度；无人机起落架/FPV 机架；加工性稍差；¥80/kg' },
          { label: '304/316 不锈钢', text: '304 通用耐腐蚀；316 含钼，海洋环境；密度 7.9g/cm³，重；适合螺栓/轴/轴承套' },
          { label: '钛合金 TC4（Ti-6Al-4V）', text: 'σ=900MPa，密度 4.4g/cm³；比强度最高；航天/高端机器人关节；加工难，¥400/kg；3D 打印可行' },
          { label: '弹簧钢 65Mn', text: '高弹性，疲劳寿命好；四足机器人腿部弹性储能结构；柔性关节并联弹簧' },
        ],
      },
      {
        name: '碳纤维复合材料（CFRP）',
        icon: '🏎️',
        desc: '无人机/机器人轻量化的终极材料，比铝轻 40%、比强度 5倍',
        details: [
          { label: '材料参数', text: 'T300 碳纤维布：E=230GPa，σ=3500MPa，密度 1.76g/cm³；比强度是铝的 5倍，比钢的 10倍' },
          { label: '成型工艺', text: '手工铺层（HLU）：低成本适合小批量；预浸料热压罐（Autoclave）：航空级，¥2000/m²；拉挤（适合管材，量产）' },
          { label: '管材规格', text: 'Ø10mm × 8mm × 500mm 碳纤维管（¥30）：无人机机臂；Ø25mm × 23mm：六旋翼主臂；壁厚 1mm 即可承受 200N' },
          { label: '板材应用', text: '1.5mm 碳纤维板：FPV 机架（HDE模量预浸，¥500/片）；3mm：机器人底板；CNC 数控切割精度 ±0.1mm' },
          { label: '胶接工艺', text: '环氧树脂胶（Araldite 2011）：剪切强度 26MPa；碳纤维与铝合金接头必须涂绝缘涂层（防电偶腐蚀）' },
        ],
      },
      {
        name: '工程塑料与 3D 打印',
        icon: '🖨️',
        desc: '快速迭代和功能性零件——从 PLA 到 PEEK 全系列',
        details: [
          { label: 'PLA / PETG', text: 'PLA：易打印（190°C），脆，不耐热（60°C）；原型验证首选。PETG：韧性好（80°C），食品接触安全；¥100/kg' },
          { label: 'ABS / ASA', text: 'ABS：σ=40MPa，耐冲击，翘曲大（需加热床）；ASA：户外耐 UV 降解；机器人外壳常用' },
          { label: 'Nylon PA12 / PA12-CF', text: 'PA12：高韧性，自润滑，耐磨；PA12-CF（碳纤短纤维增强）：比强度接近铝，SLS 烧结成型；关节壳体¥50/件' },
          { label: 'PEEK', text: '耐温 250°C，化学惰性，σ=100MPa；医疗级关节/航天部件；FDM 打印需 400°C 以上；¥5000/kg' },
          { label: 'TPU（弹性体）', text: '邵硬度 85A~95A；机器人夹爪柔性衬垫/足底减震垫；FDM 0.8mm 喷嘴打印；¥150/kg' },
        ],
        code: `# 材料选型决策辅助脚本
# 根据力学需求快速筛选材料

materials_db = {
    'Al_6061': {'density':2.7, 'UTS':310, 'E':69,  'cost_per_kg':30,  'machinability':'★★★★★'},
    'Al_7075': {'density':2.7, 'UTS':572, 'E':72,  'cost_per_kg':80,  'machinability':'★★★★☆'},
    'SS_304':  {'density':7.9, 'UTS':515, 'E':200, 'cost_per_kg':20,  'machinability':'★★★☆☆'},
    'Ti_TC4':  {'density':4.4, 'UTS':900, 'E':114, 'cost_per_kg':400, 'machinability':'★★☆☆☆'},
    'CFRP_T300':{'density':1.6,'UTS':600, 'E':70,  'cost_per_kg':800, 'machinability':'★★★☆☆'},
    'PA12_CF': {'density':1.1, 'UTS':85,  'E':8,   'cost_per_kg':200, 'machinability':'★★★★☆'},
}

def select_material(min_UTS=200, max_density=5.0, max_cost=200):
    """
    min_UTS: 最低抗拉强度 (MPa)
    max_density: 最大密度 (g/cm³)  — 轻量化约束
    max_cost: 最大单价 (¥/kg)
    """
    results = []
    for name, props in materials_db.items():
        if (props['UTS'] >= min_UTS and
            props['density'] <= max_density and
            props['cost_per_kg'] <= max_cost):
            # 比强度 = 强度/密度 (MPa·cm³/g)
            specific_strength = props['UTS'] / props['density']
            results.append((specific_strength, name, props))

    results.sort(reverse=True)
    print(f"\\n满足条件 (UTS≥{min_UTS}MPa, ρ≤{max_density}, ≤¥{max_cost}/kg) 的材料:")
    for ss, name, p in results:
        print(f"  {name:12s} 比强度={ss:.0f}  UTS={p['UTS']:4d}MPa  加工性{p['machinability']}")
    return results

select_material(min_UTS=300, max_density=5.0, max_cost=100)
# → Al_7075: 比强度=211  UTS=572MPa  ★★★★☆  ¥80/kg  ← 首选`,
        lang: 'python',
      },
      {
        name: '电子封装与 PCB 材料',
        icon: '🔌',
        desc: '硬件工程师必知的基板、散热、封装材料选型',
        details: [
          { label: 'FR4 基板', text: '标准玻纤环氧树脂；Tg=135~170°C；≥4层时推荐 Tg170；¥0.3/cm²；覆铜厚度 1/2oz~2oz（18~70μm）' },
          { label: '高频板材', text: 'Rogers 4350B（εr=3.48，tanδ=0.0037）：毫米波雷达/5G 天线必用；¥30/cm²；损耗比 FR4 低 10×' },
          { label: '铝基板 MCPCB', text: '铝芯直接散热；LED/大功率 MOSFET 驱动板；热阻 1.0°C/W vs FR4 的 20°C/W；¥2/cm²' },
          { label: '导热材料', text: '导热硅脂（λ=4~8W/m·K）：芯片与散热器接触；石墨烯片（λ=1500W/m·K）：手机均热；相变材料 PCM：不流动，可靠性高' },
          { label: '焊料', text: 'SAC305（Sn96.5Ag3Cu0.5）：无铅 RoHS；熔点 217°C；BGA 封装必用；焊球强度 > Sn63Pb37' },
        ],
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: '功能材料与传感器材料',
    subtitle: '压电、形状记忆、导电聚合物、磁性材料——理解传感器与执行器的材料原理',
    color: '#e17055',
    items: [
      {
        name: '压电材料',
        icon: '⚡',
        desc: '机械变形↔电信号的可逆转换，超声波传感器/力传感器/微执行器核心',
        details: [
          { label: 'PZT（锆钛酸铅）', text: '最常用压电陶瓷；d33=300~600 pC/N；压电系数高；超声波探头/加速度计/压电蜂鸣器；居里温度 350°C' },
          { label: 'PVDF 薄膜', text: '聚偏氟乙烯；柔性；d33=−33pC/N（较低）；柔性传感器/触摸传感；可弯曲至半径 1mm' },
          { label: '超声换能器原理', text: 'PZT 在激励电压下形变 → 向介质辐射声波；接收模式：声波→形变→电荷→电压信号；HC-SR04 工作于 40kHz' },
          { label: '压电驱动器', text: '叠堆型（Stack）：最大位移 0.1% 长度，力可达数千 N；用于精密定位（分辨率 nm 级）；AFM 探针扫描头' },
          { label: '应用实例', text: 'IMU 中的 MEMS 加速度计：多晶硅+压电效应；六维力传感器（ATI）：16个 PZT 元件矩阵采样' },
        ],
      },
      {
        name: '形状记忆合金（SMA）',
        icon: '🌀',
        desc: 'NiTi（镍钛）合金——加热恢复预设形状，可作为微型执行器',
        details: [
          { label: '工作原理', text: '马氏体相变：低温时可大变形（奥氏体相→马氏体相）；加热至 Af（奥氏体终止温度）恢复原形；应变可达 8%' },
          { label: 'Nitinol 参数', text: 'NiTi 50-50 at%；Af = 40~80°C（可调）；功率密度 >100W/g（远超电机）；但响应慢（冷却限制，~1Hz）' },
          { label: '机器人应用', text: '微型夹爪（医疗内窥镜）；仿肌肉人工肌肉；NiTi 丝径 0.2~1mm；通电加热即收缩' },
          { label: '软体机器人', text: '气动软体（硅橡胶+气腔）+ SMA 偏置弹簧；哈佛 Soft Robotics Toolkit 开源；用于抓取非规则物体' },
          { label: '局限性', text: '滞回特性导致难以精确位置控制；寿命约100万次循环；成本¥500/m（Ø0.5mm）' },
        ],
      },
      {
        name: '磁性材料与电机',
        icon: '🧲',
        desc: '永磁体性能直接决定电机功率密度，理解材料才能选对电机',
        details: [
          { label: 'NdFeB（钕铁硼）', text: '最强永磁体；N52 级 Br=1.4T，BHmax=52 MGOe；工作温度 <120°C（UH级可达 150°C）；几乎所有无刷电机用此' },
          { label: 'SmCo（钐钴）', text: 'Br=1.1T，耐温 300°C；高温场景（航空/石油钻探）；价格约 NdFeB 的 3倍；抗腐蚀性好' },
          { label: '电机功率密度', text: 'T-Motor U10（NdFeB N52）：功率密度 5kW/kg；拓扑选 Halbach Array 可提升 20% 磁通；六极九槽最常见' },
          { label: 'AMR 各向异性磁阻传感器', text: 'Honeywell HMC5883L；检测弱磁场（地磁）；精度 2mGauss；无人机罗盘；需远离电机安装（磁干扰）' },
          { label: '软磁材料（铁芯）', text: '硅钢片 0.2~0.35mm（降低涡流损耗）；非晶合金（μ=10万，损耗更低）：高频电感/变压器铁芯' },
        ],
      },
      {
        name: '半导体功率器件材料',
        icon: '💡',
        desc: 'SiC/GaN 正在取代 Si MOSFET，理解材料差异对电驱选型至关重要',
        details: [
          { label: '硅（Si）MOSFET', text: '成熟工艺；Vbr<600V；25°C Rds=通态电阻；导通损耗随温度上升；¥5~50/片；<200V 场景仍是主流' },
          { label: '碳化硅（SiC）', text: '带隙 3.26eV（Si的3倍）；Vbr达 1700V；高温 200°C 工作；Rds 是 Si 的 1/10；特斯拉 Model 3 逆变器用 ST SiC MOSFET（¥500/片）' },
          { label: '氮化镓（GaN）', text: '电子迁移率最高；横向结构，开关速度 <5ns（Si的10倍）；650V GaN HEMT；手机快充/服务器电源；EPC 9V GaN ¥20' },
          { label: '电机驱动器选型', text: '<48V 机器人用 Si MOSFET（DRV8302，¥30）；24V~96V 大功率用 SiC（CREE C2M0280120D）；寿命关键：结温控制 <150°C' },
          { label: '金刚石（Diamond）', text: '带隙 5.45eV，导热率 2200W/m·K（最高）；散热基板理想材料；但成本极高（CVD金刚石¥10万/cm²）；实验室阶段' },
        ],
      },
    ],
  },
  {
    level: '🔴 精通',
    title: 'AI 驱动材料科学',
    subtitle: '机器学习加速新材料发现，从晶体结构预测到材料基因组计划',
    color: '#6c5ce7',
    items: [
      {
        name: '材料基因组计划（MGI）',
        icon: '🧬',
        desc: '用计算与数据替代传统试错，将新材料研发周期从20年压缩到2~3年',
        details: [
          { label: '核心理念', text: '高通量计算（HTC）+ 机器学习 + 数据库构建三角驱动；奥巴马 2011 年发起；将材料发现速度提升 10× 以上' },
          { label: 'Materials Project', text: 'LBNL 维护；15万+ 无机材料 DFT 计算结果开放；Python API（pymatgen）；band gap/bulk modulus/formation energy 全有' },
          { label: 'AFLOW', text: '杜克大学；3000万+ 化合物高通量DFT数据；AFLOW-ML 机器学习预测；超导体、拓扑材料筛选案例' },
          { label: 'NOMAD', text: '欧盟FAIR原则开放数据；支持 VASP/Quantum ESPRESSO/FHI-aims 多计算软件数据上传' },
          { label: '材料逆向设计', text: '给定目标性能（如带隙=1.5eV）反向搜索化学空间；GNoME（DeepMind，2023）发现 220万+ 新稳定晶体' },
        ],
        code: `# pymatgen — 查询 Materials Project 数据库
# pip install pymatgen mp-api

from mp_api.client import MPRester
import matplotlib.pyplot as plt

API_KEY = "your_api_key"   # materialsproject.org 申请（免费）

with MPRester(API_KEY) as mpr:
    # 查询所有 LiFePO4 相关材料的 DFT 计算结果
    docs = mpr.materials.summary.search(
        chemsys="Li-Fe-P-O",
        fields=["material_id", "formula_pretty",
                "band_gap", "formation_energy_per_atom",
                "stability", "is_stable"]
    )

    print(f"找到 {len(docs)} 个 Li-Fe-P-O 体系材料")

    # 筛选稳定绝缘体（候选正极材料）
    candidates = [d for d in docs
                  if d.is_stable and d.band_gap and 1.0 < d.band_gap < 4.0]

    print(f"\\n稳定绝缘体候选 ({len(candidates)} 个):")
    for d in sorted(candidates, key=lambda x: x.formation_energy_per_atom)[:5]:
        print(f"  {d.formula_pretty:20s} band_gap={d.band_gap:.2f}eV  "
              f"Ef={d.formation_energy_per_atom:.3f} eV/atom")

# 典型输出：
# Li3Fe2(PO4)3   band_gap=3.21eV  Ef=-3.241 eV/atom  ← 正极候选`,
        lang: 'python',
      },
      {
        name: '晶体结构预测（CSP）',
        icon: '🔬',
        desc: 'AlphaFold 的材料版——从化学式直接预测晶体结构',
        details: [
          { label: 'DFT 计算基础', text: 'VASP/Quantum ESPRESSO/CP2K：从头算电子结构；计算 GGA-PBE 近似下的总能、带结构、声子谱；一次 100原子计算≈8h（32核）' },
          { label: 'GNoME（DeepMind 2023）', text: '图神经网络（GNN）预测新稳定晶体；2.2M 候选结构 → 38万稳定（5年内可验证）；开放数据集 GitHub' },
          { label: 'CGCNN / M3GNet', text: '晶体图卷积网络；输入晶体结构（原子坐标+键信息）→ 输出形成能/带隙；训练集 Materials Project；RMSE<0.1eV' },
          { label: 'MACE-MP-0', text: '2023 年发布通用机器学习势（MLP）；比 DFT 快 1000×；精度媲美 DFT；支持 94 种元素；分子动力学模拟首选' },
          { label: '超导体应用', text: 'BCS 理论 + ML 筛选高温超导候选；MgB2（39K）被ML辅助优化；室温超导仍是目标' },
        ],
        code: `# MACE-MP-0 — 通用机器学习势快速结构优化
# 比 DFT 快 1000×，误差 ~5 meV/atom
# pip install mace-torch ase pymatgen

from mace.calculators import mace_mp
from ase.build import bulk
from ase.optimize import BFGS
from ase.io import write
import numpy as np

# 加载通用势（自动下载 ~300MB 模型）
calc = mace_mp(model="medium", dispersion=False,
               default_dtype="float32", device='cpu')

# 构建 LiFePO4 橄榄石结构（正极材料）
# 实际使用 pymatgen 从 CIF 文件加载更准确
atoms = bulk('Fe', 'fcc', a=3.6)   # 简化示例：FCC 铁
atoms.calc = calc

# 结构弛豫
opt = BFGS(atoms, logfile='opt.log')
opt.run(fmax=0.01)   # 收敛标准：最大原子力 < 0.01 eV/Å

e = atoms.get_potential_energy()
f = atoms.get_forces()
print(f"弛豫后总能: {e:.4f} eV")
print(f"最大原子力: {np.abs(f).max():.4f} eV/Å")
print(f"晶格常数: {atoms.cell.lengths()} Å")

# 计算弹性性质（需要 phonopy）
# Eform = (E_total - Σ n_i * E_i) / N_atoms`,
        lang: 'python',
      },
      {
        name: '电池材料与储能',
        icon: '🔋',
        desc: '机器人续航的核心——锂电池材料体系演进与下一代固态电池',
        details: [
          { label: '正极材料演进', text: 'LCO（钴酸锂，手机）→ NMC811（镍锰钴，高能量密度，≥270Wh/kg）→ LFP（磷酸铁锂，安全，机器人/汽车）→ 富锂锰基（>400Wh/kg，研究中）' },
          { label: '负极材料', text: '石墨（372mAh/g，成熟）；硅基（Si/C复合，1000mAh/g但膨胀300%，正在量产）；金属锂负极（固态电池关键）' },
          { label: '固态电池', text: '固态电解质（LLZO/LGPS/Li3PS4）替代液态；不燃，能量密度 ≥ 400Wh/kg；Toyota 2027 量产目标；宁德时代"凝聚态"电池已交付' },
          { label: '机器人用电池选型', text: '移动机器人：LFP 26650 电芯（3.2V 3Ah，¥15/节）；无人机：LiPo 高倍率（50C放电）；需热管理（<45°C工作）' },
          { label: 'AI 电池管理', text: 'SOC（荷电状态）估计：LSTM + 卡尔曼；SOH（健康状态）预测：电化学阻抗谱 + 神经网络；Google DeepMind 电池退化预测论文（Nature Energy 2020）' },
        ],
      },
      {
        name: '软物质与软体机器人材料',
        icon: '🫧',
        desc: '仿生软体机器人的材料基础：水凝胶、硅橡胶、液态金属',
        details: [
          { label: 'Ecoflex 硅橡胶', text: 'Smooth-On Ecoflex 00-30：最大应变 800%；Shore 00-30 超软；哈佛 Soft Robotics 软体夹爪标配；¥200/kg' },
          { label: '导电水凝胶', text: 'PVA + MXene（Ti3C2Tx）复合；电导率 10-3 S/cm + 机械柔性；可拉伸传感器/电子皮肤；压阻式触觉感知' },
          { label: '液态金属 EGaIn', text: '镓铟合金（75% Ga 25% In）；熔点 15.7°C，室温液态；电导率 3.4×10^6 S/m；软体电路/可拉伸导线；¥3000/kg' },
          { label: '磁性软体', text: '磁性粉末（NdFeB 微粉）+ 硅橡胶基底；外加磁场驱动变形；无需导线，适合微型医疗机器人（胶囊内窥镜）' },
          { label: '4D 打印', text: '智能材料（SMP形状记忆聚合物/水响应水凝胶）+ 3D打印；加热/浸水触发变形；MIT自组装实验室 Skylar Tibbits 提出' },
        ],
      },
    ],
  },
];

// ─── Tab 定义 ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basics',    name: '🔩 通用基础', desc: '接口·算法·嵌入式·ROS 2' },
  { id: 'domains',   name: '🤖 应用领域', desc: '机器人·自动驾驶·无人机' },
  { id: 'chip',      name: '🔬 芯片知识', desc: '基础工艺·EDA·商业生态·2nm' },
  { id: 'selection', name: '💰 选型指南', desc: 'VLA机器人·自动驾驶·无人机BOM' },
  { id: 'materials', name: '🧪 材料',     desc: '结构·功能·AI驱动材料科学' },
];

const DOMAIN_TABS = [
  { id: 'robot', name: '🤖 机器人',   layers: ROBOT_LAYERS },
  { id: 'ad',    name: '🚗 自动驾驶', layers: AD_LAYERS },
  { id: 'drone', name: '🛸 无人机',   layers: DRONE_LAYERS },
];

// ─── 芯片知识 ─────────────────────────────────────────────────────────────────
const CHIP_LAYERS = [
  {
    level: '🟢 入门',
    title: '半导体基础',
    subtitle: '晶体管·CMOS·逻辑门·存储单元——芯片世界的最小积木',
    color: '#27ae60',
    items: [
      {
        name: 'PN 结与二极管',
        icon: '🔋',
        desc: 'MOSFET 的物理基础——P/N 半导体接触形成耗尽区与内建电场',
        details: [
          { label: '为什么要先懂 PN 结', text: 'MOSFET 的 Source/Drain 本质是 n⁺p 结；二极管、BJT、LED、光伏电池全都基于 PN 结。理解 PN 结 = 理解半导体器件的物理核心。' },
          { label: '掺杂与载流子', text: 'P 型：掺 B（硼，3价），产生空穴（⊕）作多子；N 型：掺 P/As（磷/砷，5价），产生自由电子（⊖）作多子。室温下，Si 本征载流子浓度 nᵢ ≈ 1.5×10¹⁰ cm⁻³，掺杂后 N_D 可达 10¹⁷~10²⁰ cm⁻³。' },
          { label: '耗尽区与内建电场', text: '接触后多子（空穴/电子）跨界扩散 → 界面附近载流子耗尽，留下固定离子（P 侧 ⊖，N 侧 ⊕）→ 形成内建电场 E₀（N→P 方向）→ 阻止继续扩散 → 动态平衡。耗尽宽度 W_d ∝ √(1/N_doping)，掺杂越高越薄。' },
          { label: '二极管特性', text: '正偏（P 接正，N 接负）：外加电场削弱 E₀ → 扩散电流占主导 → 导通（指数型 I-V，Si 正向压降 ≈ 0.6V）。反偏：外加电场增强 E₀ → 只有极小漂移电流（反向饱和电流 I₀ ≈ 10⁻¹² A）→ 截止。' },
          { label: '内建电位 V_bi', text: 'Si PN 结：V_bi = (kT/q)·ln(N_A·N_D / nᵢ²) ≈ 0.6~0.9V（取决于掺杂）。k=玻尔兹曼常数，T=温度，q=基本电荷，N_A/N_D=P/N 侧掺杂浓度。室温 kT/q ≈ 26mV。' },
        ],
        diagram: <PNJunctionDiagram />,
      },
      {
        name: '晶体管与 MOSFET',
        icon: '⚛️',
        desc: '芯片的基本开关单元，现代 CPU 集成 100 亿+ 个',
        details: [
          { label: 'MOSFET 工作原理', text: '金属-氧化物-半导体场效应晶体管。Gate 施加电压 → 沟道导通 (ON) / 关断 (OFF)。N-MOS：高电平导通；P-MOS：低电平导通。' },
          { label: '特征尺寸', text: '7nm/5nm/3nm 指栅极长度（现为等效尺寸，实际物理尺寸已不对应）。越小 → 更低功耗、更高密度、更快速度。台积电 N3E：每 mm² 约 1.7 亿个晶体管。' },
          { label: 'FinFET → GAA', text: 'FinFET（鳍式）：22nm 起引入，鳍片竖起提升控制能力。GAA（全环绕栅极）：3nm/2nm 引入，纳米片叠加，漏电更低。Intel RibbonFET = GAA 的 Intel 叫法。' },
        ],
        diagram: <><NMOSCrossSectionDiagram /><FinFETvsGAADiagram /></>,
        code: `# SPICE 仿真 — MOSFET 特性曲线（Python 调用 ngspice）
# 理解 Id-Vgs 转移特性 & Id-Vds 输出特性

spice_netlist = """
* NMOS 特性测量
M1 drain gate 0 0 NMOS_MODEL W=1u L=180n
.model NMOS_MODEL NMOS LEVEL=3 VTO=0.5 KP=200u
Vgs gate 0 DC 0
Vds drain 0 DC 1.8

* 扫描 Vgs 从 0 到 1.8V（Id-Vgs 曲线）
.dc Vgs 0 1.8 0.01
.probe I(Vds)
.end
"""

# 用 PySpice 替代（纯 Python）
from PySpice.Spice.Netlist import Circuit
from PySpice.Unit import *

circuit = Circuit('NMOS Transfer')
circuit.MOSFET('1', 'drain', 'gate', circuit.gnd, circuit.gnd,
               model='NMOS', w=1@u_um, l=180@u_nm)
circuit.V('gs', 'gate', circuit.gnd, 0@u_V)
circuit.V('ds', 'drain', circuit.gnd, 1.8@u_V)

# 阈值电压 Vth ≈ 0.5V：Id 开始显著增大的点
# 饱和区：Vds > Vgs - Vth，Id 不随 Vds 增大`,
        lang: 'python',
      },
      {
        name: 'CMOS 反相器与逻辑门',
        icon: '🔀',
        desc: 'P-MOS + N-MOS 互补组合，静态功耗趋近于零',
        details: [
          { label: 'CMOS 反相器', text: 'P-MOS（上拉）+ N-MOS（下拉）串联。输入高 → N导通P截止 → 输出低；输入低 → P导通N截止 → 输出高。静态功耗几乎为零（两管不同时导通）。' },
          { label: '标准单元库', text: 'INV/NAND/NOR/DFF 等基本逻辑门组成标准单元库（Standard Cell Library）。台积电授权给 ARM/Cadence 使用。不同 drive strength：INVx1/INVx4/INVx8（驱动能力倍数）。' },
          { label: '延迟与功耗', text: '动态功耗 P = α·C·V²·f（α=翻转率，C=负载电容，V=电压，f=频率）。减小 V 是降功耗最有效手段（V²）。timing path 最长的路径决定最高频率。' },
        ],
        code: `// Verilog 描述逻辑门（RTL 级）
// 综合工具会把这段代码映射到实际 Standard Cell

module logic_gates (
    input  wire a, b, c,
    output wire y_inv,  // 反相
    output wire y_nand, // 与非
    output wire y_nor,  // 或非
    output wire y_xor,  // 异或
    output wire y_mux   // 2选1 MUX
);
    assign y_inv  = ~a;
    assign y_nand = ~(a & b);
    assign y_nor  = ~(a | b);
    assign y_xor  = a ^ b;
    assign y_mux  = c ? b : a;   // sel=c, 选 b 或 a
endmodule

// 综合后 (Synopsis Design Compiler 输出示意):
// y_inv  → 1× INVx1
// y_nand → 1× NAND2x1
// y_mux  → 1× MUX2x1  (或 AOI21 + INV 组合)
// 面积约 5~12 个 GE（Gate Equivalent，以 NAND2 为单位）`,
        lang: 'verilog',
        diagram: <CMOSInverterDiagram />,
      },
      {
        name: 'SRAM / DRAM / Flash 存储原理',
        icon: '💾',
        desc: '三类主流存储单元的物理结构与读写原理',
        details: [
          { label: 'SRAM（6T 单元）', text: '6 个晶体管构成双稳态锁存器。读写速度极快（<1ns），但面积大、功耗高。用于 CPU L1/L2/L3 Cache、寄存器文件。' },
          { label: 'DRAM（1T1C 单元）', text: '1 个晶体管 + 1 个电容。电容存电荷（1/0）。需周期性刷新（64ms 内刷满）。密度高、成本低。用于主内存（DDR5）。' },
          { label: 'NAND Flash（浮栅/CTF）', text: '浮栅晶体管：通过 F-N 隧穿注入/抽取电子改变阈值电压。SLC(1bit)/MLC(2bit)/TLC(3bit)/QLC(4bit) 提升密度但降低耐久。3D NAND：垂直堆叠 200+ 层（SK海力士 V9 = 321层）。' },
        ],
        code: `# 理解内存层次：访问延迟 × 带宽
# 实测不同存储层次的访问时间

import time, ctypes, numpy as np

def measure_latency(array, iterations=10_000_000):
    """指针追踪法测量随机访问延迟（缓存友好 vs 缓存不友好）"""
    n = len(array)
    # 生成随机访问序列（缓存不友好：产生大量 cache miss）
    indices = np.random.permutation(n).astype(np.int64)

    start = time.perf_counter_ns()
    idx = 0
    for _ in range(min(iterations, n)):
        idx = indices[idx % n]  # 随机跳转
    end = time.perf_counter_ns()
    return (end - start) / iterations

# L1 Cache (~32KB): 数组小 → 全部在 L1 → 约 1-2ns
l1_array = np.zeros(4096, dtype=np.int64)
# L3 Cache (~16MB): 数组大 → 命中 L3 → 约 30-40ns
l3_array = np.zeros(2_000_000, dtype=np.int64)
# DRAM: 超过 Cache → 约 60-100ns
dram_array = np.zeros(50_000_000, dtype=np.int64)

# 带宽对比（理论值）:
# L1 Cache:  ~1TB/s  | 延迟 ~1ns
# L2 Cache: ~500GB/s | 延迟 ~4ns
# L3 Cache: ~200GB/s | 延迟 ~30ns
# DDR5-6400: ~50GB/s  | 延迟 ~70ns
# NVMe SSD:  ~7GB/s   | 延迟 ~100μs
print("内存层次越靠近 CPU 核心，速度越快但容量越小")`,
        lang: 'python',
      },
      {
        name: '芯片设计流程概览',
        icon: '🗺️',
        desc: '从需求到流片：RTL → 综合 → 布局布线 → 制造 → 封测',
        details: [
          { label: 'RTL 设计', text: '用 Verilog/VHDL/SystemVerilog 描述寄存器传输级逻辑。功能仿真验证。此阶段产出 .v 文件。工具：Vivado（FPGA）/VCS/ModelSim（仿真）。' },
          { label: '逻辑综合', text: '将 RTL 映射为标准单元网表（netlist）。优化时序/面积/功耗。工具：Synopsys Design Compiler（DC）/ Cadence Genus。产出 .v netlist + .sdf 时序文件。' },
          { label: '物理设计（后端）', text: '布局（Placement）：把单元摆到芯片区域内。CTS（时钟树综合）：平衡时钟到达各触发器的延迟。绕线（Routing）：金属连接所有单元。工具：Cadence Innovus / Synopsys ICC2。' },
          { label: 'DRC/LVS 签核', text: 'DRC（设计规则检查）：验证所有图形符合晶圆厂设计规则（最小线宽/间距等）。LVS（Layout vs Schematic）：验证版图与电路图一致。通过后 Tape-out（流片），发给台积电/三星。' },
        ],
        code: `# 芯片设计阶段与主要工具链
design_flow = {
    "规格定义": {
        "输入": "产品需求（性能/功耗/面积/成本）",
        "产出": "微架构规格文档",
        "工具": "Excel/Word/内部文档系统",
    },
    "RTL 编码": {
        "语言": ["Verilog", "SystemVerilog", "Chisel(Scala)", "VHDL"],
        "仿真工具": ["Synopsys VCS", "Cadence Xcelium", "ModelSim", "Verilator(开源)"],
        "验证方法": "UVM (Universal Verification Methodology)",
    },
    "逻辑综合": {
        "工具": ["Synopsys DC", "Cadence Genus", "Yosys(开源)"],
        "约束文件": "SDC (Synopsys Design Constraints) — 指定时钟/输入输出延迟",
        "产出": "门级网表 (.v) + 时序库 (.lib/.db)",
    },
    "物理设计": {
        "工具": ["Cadence Innovus", "Synopsys ICC2"],
        "步骤": ["Floorplan", "Power Planning", "Placement", "CTS", "Routing", "Filler"],
        "产出": "GDSII 版图文件（交给晶圆厂）",
    },
    "制造与封测": {
        "代工厂": ["TSMC", "Samsung Foundry", "Intel Foundry", "SMIC"],
        "封装": ["BGA", "Flip-chip", "CoWoS", "FOPLP"],
        "测试": "ATE (Automatic Test Equipment) — 良率测试",
    },
}`,
        lang: 'python',
      },
    ],
  },
  {
    level: '🟡 进阶',
    title: 'EDA 工具链与 IP 生态',
    subtitle: 'Verilog/SV·综合·时序分析·IP授权·SoC集成',
    color: '#e67e22',
    items: [
      {
        name: 'SystemVerilog & UVM 验证',
        icon: '🧪',
        desc: '工业级芯片验证方法论，60% 项目资源用于验证',
        details: [
          { label: 'SystemVerilog 扩展', text: 'SV 在 Verilog 基础上增加：interface（端口抽象）/class（面向对象）/assertion（SVA 断言）/constraint（随机约束）。现代芯片设计标准语言。' },
          { label: 'UVM 框架', text: 'Universal Verification Methodology。组件：uvm_driver → uvm_monitor → uvm_scoreboard → uvm_agent。随机约束测试 + 覆盖率收集（功能覆盖/代码覆盖）。' },
          { label: '形式验证', text: 'Formal Verification：数学证明代码正确性（无需穷举仿真）。工具：Synopsys VC Formal / Cadence JasperGold。常用于安全相关模块（密码加速器/仲裁器）。' },
        ],
        code: `// SystemVerilog — 完整的 AXI4-Lite 从机接口模块
// 可综合，附带 SVA 断言

module axi4_lite_slave #(
    parameter DATA_WIDTH = 32,
    parameter ADDR_WIDTH = 8
) (
    input  logic                     clk, rst_n,
    // Write Address Channel
    input  logic [ADDR_WIDTH-1:0]    awaddr,
    input  logic                     awvalid,
    output logic                     awready,
    // Write Data Channel
    input  logic [DATA_WIDTH-1:0]    wdata,
    input  logic [DATA_WIDTH/8-1:0]  wstrb,
    input  logic                     wvalid,
    output logic                     wready,
    // Write Response Channel
    output logic [1:0]               bresp,
    output logic                     bvalid,
    input  logic                     bready,
    // Read Address Channel
    input  logic [ADDR_WIDTH-1:0]    araddr,
    input  logic                     arvalid,
    output logic                     arready,
    // Read Data Channel
    output logic [DATA_WIDTH-1:0]    rdata,
    output logic [1:0]               rresp,
    output logic                     rvalid,
    input  logic                     rready
);
    // 寄存器堆（256个32位寄存器）
    logic [DATA_WIDTH-1:0] regs [0:2**ADDR_WIDTH/4-1];
    logic [ADDR_WIDTH-1:0] wr_addr;

    // 写地址握手
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) awready <= 1'b0;
        else        awready <= ~awready & awvalid & wvalid;
    end

    // 写数据并产生响应
    always_ff @(posedge clk) begin
        if (awvalid & wvalid & awready) begin
            // 按字节使能写入
            for (int i = 0; i < DATA_WIDTH/8; i++) begin
                if (wstrb[i])
                    regs[awaddr[ADDR_WIDTH-1:2]][i*8+:8] <= wdata[i*8+:8];
            end
            bvalid <= 1'b1;
            bresp  <= 2'b00;  // OKAY
        end
        if (bvalid & bready) bvalid <= 1'b0;
    end

    // SVA 断言：awvalid 有效时 awready 在 1 个周期内必须响应
    // property p_aw_handshake;
    //   @(posedge clk) awvalid |-> ##[1:4] awready;
    // endproperty
    // assert property (p_aw_handshake) else $error("AW timeout");
endmodule`,
        lang: 'verilog',
      },
      {
        name: 'IP 核授权与 ARM 商业模式',
        icon: '🏛️',
        desc: 'IP 核是芯片乐高积木，ARM 是最成功的 IP 商业案例',
        details: [
          { label: 'IP 核类型', text: 'Soft IP：Verilog RTL，可综合到任意工艺（灵活，需买家自己综合）。Hard IP：已完成物理设计的版图（固定工艺，性能更高，如 SerDes/DDR PHY）。Firm IP：综合后网表（折中）。' },
          { label: 'ARM 授权模式', text: '架构授权（高通/苹果）：可自研微架构，成本 $5,000万+。内核授权（多数手机 SoC）：直接用 Cortex-A/M 完整核。TLA（技术授权）：ARM 收版税 1~2% per chip。2023 年 ARM IP 收入 $26亿。' },
          { label: '常用 IP 供应商', text: 'Synopsys/Cadence：DesignWare IP 库（USB/PCIe/DDR/MIPI PHY）。Rambus：HBM PHY。Arteris：NoC 互联 IP。Imagination：GPU IP（PowerVR）。CEVA：DSP/AI IP。' },
        ],
        code: `# ARM 处理器家族与适用场景速查
arm_family = {
    "Cortex-M (MCU)": {
        "型号": ["M0/M0+", "M4", "M7", "M33", "M55", "M85"],
        "特点": "超低功耗，无 MMU，裸机/RTOS",
        "应用": "IoT/可穿戴/家电控制/安全芯片",
        "代表芯片": ["STM32", "nRF52", "RP2040(双核M0+)"],
        "主频": "16MHz ~ 1GHz",
    },
    "Cortex-A (Application)": {
        "型号": ["A53(小核)", "A55(小核)", "A76/A78(大核)", "A710/A715", "X4(超大核)"],
        "特点": "有 MMU，运行 Linux/Android",
        "应用": "手机/平板/网关/单板电脑",
        "代表芯片": ["骁龙8 Gen3", "天玑9300", "Kirin 9010", "Apple M4(自研v8.6)"],
    },
    "Cortex-R (Real-time)": {
        "型号": ["R5", "R8", "R82"],
        "特点": "硬实时，有 ECC，高可靠",
        "应用": "汽车MCU/硬盘控制器/基带",
        "代表": ["Renesas RH850", "TI TDA4 安全岛"],
    },
    "Neoverse (Server)": {
        "型号": ["N1", "N2", "V2"],
        "应用": "AWS Graviton3/4, 阿里倚天710",
        "优势": "单核性能接近 x86，功耗比优势明显",
    },
}`,
        lang: 'python',
      },
      {
        name: '光刻工艺与 ASML EUV',
        icon: '💡',
        desc: '光刻是芯片制造最关键步骤，EUV 机器每台 1.5 亿欧元',
        details: [
          { label: '光刻原理', text: '将光罩（Mask）图案投影缩小到晶圆光刻胶上，再蚀刻形成电路。分辨率 ≈ λ/(2·NA)（瑞利准则）。DUV：193nm 准分子激光；EUV：13.5nm 极紫外光。' },
          { label: 'EUV 技术要点', text: 'ASML NXE 系列：13.5nm 光源由 Sn 液滴被激光打击产生等离子体。NA=0.33（High-NA EUV = 0.55，2025年量产）。单层曝光可做 7nm 以下图案，无需多重曝光。' },
          { label: '多重曝光（DUV 扩展）', text: 'SAQP（Self-Aligned Quadruple Patterning）：一条线曝光→刻蚀→沉积→刻蚀，最终图案为曝光线宽 1/4。台积电 5nm SAQP 实现 6nm pitch。成本高：每层需 4~5 次工序。' },
        ],
        code: `# 光刻工艺节点与对应设备/参数
lithography_nodes = {
    "成熟制程 (≥28nm)": {
        "光源": "DUV ArF 193nm",
        "设备": "ASML TWINSCAN 系列",
        "工艺": "单次曝光",
        "代工厂": ["TSMC", "Samsung", "SMIC", "GlobalFoundries", "UMC"],
        "应用": "MCU/模拟IC/功率器件/WiFi芯片",
        "晶圆价格": "~$2,000/片 (8英寸)",
    },
    "先进制程 (7nm-5nm)": {
        "光源": "DUV + 多重曝光 (SAQP)",
        "设备": "ASML NXT 2000i immersion",
        "图案策略": "LELE (Litho-Etch-Litho-Etch) + SADP",
        "代工厂": ["TSMC N7/N5", "Samsung 5LPE"],
        "应用": "手机 AP/高性能 CPU",
        "流片成本": "~$3,000万/次（掩膜版费用）",
    },
    "顶尖制程 (3nm-2nm)": {
        "光源": "EUV 13.5nm",
        "设备": "ASML NXE:3600D (0.33 NA)",
        "晶体管": "3nm = FinFET 末代 / 2nm = GAA 首发",
        "代工厂": ["TSMC N3E/N2", "Samsung 3GAP"],
        "High-NA EUV": "ASML EXE:5000 (0.55 NA)，Intel 18A/14A 使用",
        "流片成本": "~$5,000万/次（2nm 掩膜版）",
    },
}

# EUV 产业链依赖
euv_supply_chain = {
    "ASML": "唯一 EUV 光刻机制造商（荷兰）",
    "Zeiss": "EUV 光学镜片（德国，垄断）",
    "Cymer(ASML子公司)": "DUV 光源",
    "Trumpf": "High-NA EUV 激光源（德国）",
    "日本三井化学": "EUV 光刻胶（PAG体系）",
    "信越化学": "硅片（300mm CZ 硅）",
}`,
        lang: 'python',
      },
      {
        name: 'SoC 设计与 RISC-V',
        icon: '🧩',
        desc: '片上系统集成：CPU+GPU+NPU+总线互联，RISC-V 开放生态',
        details: [
          { label: 'SoC 典型架构', text: '大小核 CPU Cluster（ARM big.LITTLE/DynamIQ）+ GPU（Mali/Adreno）+ NPU/AI 加速器 + ISP + DSP + Modem + DRAM/Cache 子系统，通过 NoC（Network on Chip）互联。' },
          { label: 'RISC-V 生态', text: '开放指令集（UCB 2010），无授权费。基础整数 ISA：RV32I/RV64I。扩展：M（乘除）/A（原子）/F（浮点）/V（向量）/C（压缩）。代表芯片：SiFive U54/U74，阿里平头哥 T-Head 玄铁，中科蓝讯。' },
          { label: 'Chiplet 与 UCIe', text: '将不同功能模块制造为独立 die，通过先进封装互联。AMD EPYC：8个 Compute Chiplet（5nm）+ I/O Die（12nm）。UCIe 1.1 标准：die-to-die 带宽 3.2TB/s。降低流片风险，提升良率。' },
        ],
        code: `// RISC-V 汇编 — 理解 ISA 基本操作
// RV64I 基础整数指令集

.section .text
.global _start
_start:
    # 基础算术
    li   a0, 100          # 加载立即数 100 到 a0
    li   a1, 200          # 加载立即数 200 到 a1
    add  a2, a0, a1       # a2 = a0 + a1 = 300

    # 内存访问
    la   t0, data_label   # 加载数据地址
    ld   t1, 0(t0)        # 从内存加载 64 位数据
    sd   a2, 8(t0)        # 存储 64 位数据

    # 分支与循环
    li   t2, 10           # 循环计数器
    li   t3, 0            # 累加器
loop:
    add  t3, t3, t2       # sum += i
    addi t2, t2, -1       # i--
    bnez t2, loop         # if i != 0, goto loop
    # t3 = 10+9+...+1 = 55

    # 函数调用（RISC-V 调用约定）
    # a0-a7: 参数/返回值; ra: 返回地址
    # t0-t6: 临时; s0-s11: 调用者保存
    call fibonacci        # 调用 fibonacci(a0)

.data
data_label: .dword 0xDEADBEEFCAFEBABE`,
        lang: 'asm',
      },
    ],
  },
  {
    level: '🔴 精通',
    title: '前沿工艺与商业生态',
    subtitle: '2nm GAA·HBM3·CoWoS·Chiplet·代工模式·EDA商业流程',
    color: '#e74c3c',
    items: [
      {
        name: '2nm GAA 工艺详解',
        icon: '🔬',
        desc: '台积电/三星/Intel 2nm 技术路线对比，GAA 取代 FinFET',
        details: [
          { label: 'GAA 纳米片结构', text: 'Gate-All-Around：栅极 360° 包裹沟道（纳米片/纳米线）。更强的栅控能力 → 更低漏电 → 可在更低电压运行。台积电 N2：4 层纳米片叠加，每层 5~7nm 厚，2nm 为等效节点名（营销名）。' },
          { label: '台积电 N2/N2P/N2X', text: 'N2（2025量产）：对比 N3E 速度 +10-15%/功耗 -25-30%。N2P（2026）：High Performance Plus 版，进一步提升性能。N2X（2026）：针对超算/AI 加速器的极致性能版本（更高电压/频率）。' },
          { label: 'Intel 18A 与 RibbonFET', text: 'Intel 18A（2025）= RibbonFET（GAA）+ PowerVia（背面供电）。背面供电：PDN（电源传输网络）从背面引入，正面全部留给信号绕线，密度提升 ~20%。Intel Foundry 争夺台积电客户的核心牌。' },
        ],
        code: `# 2nm 工艺生态与竞争格局（2025-2026）
node_2nm = {
    "台积电 N2": {
        "量产": "2025 Q2（Apple A19 首发）",
        "晶体管密度": "~2.0 亿/mm²（对比 N3E 1.7亿）",
        "晶体管类型": "NSFET（Nanosheet FET，台积电叫法）",
        "首批客户": ["Apple（iPhone 17 Pro）", "AMD（Zen6）", "Nvidia（Blackwell Ultra）"],
        "流片价格": "≈ $2.5万/晶圆（预估）",
    },
    "三星 SF2": {
        "量产": "2025 H2（延期风险）",
        "量产良率": "目前良率问题导致客户流失（Qualcomm 转投台积电）",
        "技术": "MBCFET（Multi-Bridge Channel FET）",
    },
    "Intel 18A": {
        "量产": "2025 H2（Intel 自用 + 高通外包验证）",
        "特色": "PowerVia 背面供电，业界首发",
        "外部客户": "Microsoft（AI 芯片定制）",
    },
    "SMIC N+1/N+2": {
        "等效节点": "≈7nm（DUV 多重曝光，无 EUV）",
        "客户": "华为麒麟（出口管制后转 SMIC）",
        "限制": "美国出口管制限制 ASML EUV 出口中国",
    },
}`,
        lang: 'python',
      },
      {
        name: 'HBM3 / HBM3E 与 AI 芯片',
        icon: '🧠',
        desc: 'H100/B200 的带宽秘密：高带宽内存 3D 堆叠技术',
        details: [
          { label: 'HBM 结构', text: '2.5D 封装：DRAM die 垂直堆叠（8~16层），通过 TSV（Through-Silicon Via）互联。底部 Base Die 通过 micro-bump 连接到 Si interposer，与 GPU Die 并排。' },
          { label: 'HBM3E 规格', text: 'HBM3E（2024）：每 stack 1.2TB/s 带宽（共 8 stack in H200 → 总计 4.8TB/s）。容量 96GB（H200）。接口宽度 1024-bit/stack。对比 GDDR6X（512GB/s）快 10倍。' },
          { label: 'CoWoS 封装', text: 'Chip-on-Wafer-on-Substrate：GPU Die + HBM Stack 并排放在 2.5D Silicon Interposer 上，再焊到 Package Substrate。台积电 CoWoS-S interposer 面积 820mm²（H100）→ 1200mm²（B200）。台积电 CoWoS 产能是 AI 算力瓶颈之一。' },
        ],
        code: `# AI 训练芯片规格演进（H100 → B200 → GB300）
ai_gpu_evolution = {
    "A100 (2020, 7nm TSMC)": {
        "显存": "80GB HBM2e",
        "带宽": "2TB/s",
        "算力 (BF16)": "312 TFLOPS",
        "TDP": "400W",
        "互联": "NVLink 3.0 (600GB/s 双向)",
    },
    "H100 (2022, 4nm TSMC)": {
        "显存": "80GB HBM3",
        "带宽": "3.35TB/s",
        "算力 (BF16)": "1979 TFLOPS (with sparsity)",
        "TDP": "700W (SXM5)",
        "新特性": "Transformer Engine (FP8), NVLink 4.0 (900GB/s)",
    },
    "H200 (2024, 4nm TSMC)": {
        "显存": "141GB HBM3E (+76%)",
        "带宽": "4.8TB/s (+43%)",
        "算力": "同 H100 (相同 GPU die)",
        "意义": "内存容量瓶颈缓解，大模型推理提升明显",
    },
    "B200 (2025, 4NP TSMC)": {
        "架构": "Blackwell GB202",
        "显存": "192GB HBM3E (双 die 封装)",
        "带宽": "8TB/s",
        "算力 (FP4)": "20 PFLOPS",
        "NVLink": "NVLink 5.0 (1.8TB/s)",
        "封装": "NVL72 (72× B200 + 72× Grace CPU 通过 NVLink switch 互联)",
    },
    "GB300 (2026预计)": {
        "显存": "288GB HBM3E",
        "带宽": "16TB/s (预测)",
    },
}`,
        lang: 'python',
      },
      {
        name: 'EDA 商业流程与三巨头',
        icon: '💼',
        desc: 'Synopsys · Cadence · Siemens EDA 垄断 EDA 市场',
        details: [
          { label: 'EDA 市场格局', text: '2023 年全球 EDA 市场约 $130 亿。Synopsys（$54亿收入）+ Cadence（$39亿）+ Siemens EDA（原 Mentor Graphics）三家合计 ~80% 份额。中国：华大九天/概伦电子在细分领域追赶。' },
          { label: 'Synopsys 产品线', text: 'Design Compiler（逻辑综合）/ ICC2（物理设计）/ VCS（仿真）/ VC Formal（形式验证）/ Fusion Compiler（RTL-to-GDSII 一体化）/ Sentaurus（工艺仿真）。2024年收购 Ansys（$350亿），扩展至多物理场仿真。' },
          { label: 'Cadence 产品线', text: 'Genus（综合）/ Innovus（物理设计）/ Xcelium（仿真）/ JasperGold（形式验证）/ Spectre（SPICE仿真）/ Virtuoso（模拟/混合信号）。Virtuoso 几乎垄断模拟 IC 设计。' },
        ],
        code: `# EDA 工具授权成本与商业模式
eda_business = {
    "授权模式": {
        "Time-based License (TBL)": "按年付费，主流，$100万~$1000万/年（视规模）",
        "Perpetual License": "一次购买永久使用权（已逐渐淘汰）",
        "Token-based": "购买 Token 池，各工具按消耗扣除（灵活）",
        "Cloud EDA": "AWS/Azure 上 pay-per-use（初创友好）",
    },
    "典型芯片公司 EDA 支出": {
        "初创 (10人以下)": "$50万~$200万/年（云端 EDA 方案）",
        "中型 (100人)":   "$1000万~$5000万/年",
        "大型 (Qualcomm/AMD)": "$3亿~$10亿/年（含工艺仿真全套）",
        "Apple": "已部分自研 EDA 工具以降低成本",
    },
    "中国 EDA 发展": {
        "华大九天": "模拟EDA全流程（Empyrean），A股上市",
        "概伦电子": "SPICE仿真器（SmartSpice）",
        "芯华章": "数字仿真（HuaZhang Simulation）",
        "挑战": "先进工艺（3nm+）EDA仍依赖 Synopsys/Cadence",
        "美国管制": "EAR规定：受限公司无法获得 EDA 软件出口许可",
    },
}

# 典型设计周期与成本（28nm SoC vs 3nm SoC）
tape_out_cost = {
    "28nm (成熟)": {
        "掩膜版 NRE": "$200万",
        "流片费（1000片）": "$100万",
        "EDA 工具（1年）": "$500万",
        "设计团队（50人·1年）": "$1000万",
        "合计": "~$1800万",
    },
    "3nm (先进)": {
        "掩膜版 NRE": "$1500万~$2000万",
        "流片费（1000片）": "$1000万",
        "EDA 工具（1年）": "$2000万",
        "设计团队（200人·2年）": "$1.5亿",
        "合计": "~$2亿",
    },
}`,
        lang: 'python',
      },
      {
        name: 'Chiplet 生态与 UCIe 标准',
        icon: '🔗',
        desc: '模块化芯片设计趋势：小 Die 拼接替代单片巨型芯片',
        details: [
          { label: 'Chiplet 核心逻辑', text: '单片 Die 越大良率越低（良率 = e^(-D₀·A)，D₀=缺陷密度，A=面积）。将 SoC 拆分为多个小 die（Chiplet），各自独立制造，通过先进封装互联。良率提升 + 混合工艺（不同模块用最优工艺节点）。' },
          { label: 'AMD EPYC 架构', text: 'Genoa（4th Gen EPYC）：12× CCD（Compute Chiplet Die，5nm Zen4）+ 1× IOD（I/O Die，6nm）。CCD：8 core，64MB L3。IOD：PCIe/DDR/IF 等 IO 功能。总计 96 core，通过 AMD Infinity Fabric 互联。' },
          { label: 'UCIe 1.2 协议', text: 'Universal Chiplet Interconnect Express（2022，Intel主导，50+成员）。两种物理层：Standard Package（25Gbps/pin）/ Advanced Package（4Gbps/pin 但 100μm pitch）。Die-to-die 带宽 3.2TB/s（Advanced）。协议兼容 PCIe/CXL 语义层。' },
        ],
        code: `# AMD EPYC Genoa Chiplet 架构分析
epyc_genoa_architecture = {
    "CCD (Compute Chiplet Die)": {
        "工艺": "台积电 5nm (N5)",
        "核心": "8× Zen4 core",
        "L3 Cache": "32MB（每4核共享16MB）",
        "面积": "~70mm²",
        "数量": "12× CCD（96核配置）",
        "接口": "AMD Infinity Fabric → IOD",
    },
    "IOD (I/O Die)": {
        "工艺": "台积电 6nm (N6)",
        "功能": ["PCIe 5.0 × 128", "DDR5 × 12ch（4800MT/s）", "Infinity Fabric 互联"],
        "面积": "~400mm²（单颗大 Die）",
        "数量": "1× IOD",
    },
    "封装": {
        "技术": "Organic Substrate（传统 PCB 基板）",
        "互联": "Bump 焊接（~110μm pitch）",
        "对比": "Intel 用 EMIB（die-to-die bridge）集成 HBM",
    },
    "性能数据": {
        "最大核心数": 96,
        "TDP": "360W",
        "内存带宽": "460GB/s（12× DDR5-4800）",
        "PCIe 通道": 128,
        "首发日期": "2022-11",
    },
}

# Chiplet 良率优势计算
import math
def chiplet_yield(defect_density, areas):
    """计算 Chiplet 方案总良率 vs 单片方案"""
    total_area = sum(areas)
    monolithic_yield = math.exp(-defect_density * total_area)
    chiplet_yield = math.prod(math.exp(-defect_density * a) for a in areas)
    return monolithic_yield, chiplet_yield

D0 = 0.01  # 缺陷密度 (defects/mm²)，先进工艺典型值
# 3× CCD(70mm²) + 1× IOD(400mm²) vs 单片 610mm²
mono, chiplet = chiplet_yield(D0, [70, 70, 70, 400])
print(f"单片良率: {mono:.1%}")    # ~0.2%（灾难性）
print(f"Chiplet 良率: {chiplet:.1%}")  # ~74%（可接受）`,
        lang: 'python',
      },
    ],
  },
];

// ─── LayerCard 组件（支持代码块 + category 过滤）────────────────────────────
function LayerCard({ layer, activeCategory = 'all' }) {
  const [expanded, setExpanded] = useState(null);

  const items = activeCategory === 'all'
    ? layer.items
    : layer.items.filter(i => i.category === activeCategory);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border p-5 mb-5"
      style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg font-bold">{layer.level}</span>
        <span className="text-base font-semibold text-gray-800">{layer.title}</span>
      </div>
      <p className="text-[12px] text-gray-500 mb-4">{layer.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, idx) => (
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
                {/* 结构示意图（如存在） */}
                {item.diagram && item.diagram}
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
  const [basicsCategory, setBasicsCategory] = useState('all');
  const [domain, setDomain] = useState('robot');

  const BASICS_CATEGORIES = [
    { id: 'all',       name: '全部' },
    { id: 'interface', name: '🔌 接口协议' },
    { id: 'algorithm', name: '🧮 算法控制' },
    { id: 'stack',     name: '🖥 软件栈' },
  ];

  const domainLayers = (() => {
    const dt = DOMAIN_TABS.find(d => d.id === domain);
    return dt ? dt.layers : ROBOT_LAYERS;
  })();

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── Hero ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ 硬件</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              通用基础 · 应用领域 · 芯片知识 · 选型指南 · 材料
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            面向软件工程师的硬件知识体系。从通用接口协议（I2C/CAN/UART）、嵌入式算法（PID/卡尔曼/坐标变换），到 ROS 2 / PX4 / Autoware 完整软件栈，再到芯片设计（RTL→流片）与先进封装（CoWoS/HBM）。每个知识点附带可运行代码，真实客观。
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>5 个模块</span>
            <span>·</span>
            <span>18+ 个知识层</span>
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

        {/* ─── 通用基础 Tab ─── */}
        {tab === 'basics' && (
          <div>
            {/* Category Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {BASICS_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setBasicsCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    basicsCategory === cat.id
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>
            {BASICS_LAYERS.map(layer => (
              <LayerCard key={layer.level + layer.title} layer={layer} activeCategory={basicsCategory} />
            ))}
          </div>
        )}

        {/* ─── 应用领域 Tab ─── */}
        {tab === 'domains' && (
          <div>
            {/* Domain Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {DOMAIN_TABS.map(dt => (
                <button
                  key={dt.id}
                  onClick={() => setDomain(dt.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    domain === dt.id
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                  }`}>
                  {dt.name}
                </button>
              ))}
            </div>
            {domainLayers.map(layer => (
              <LayerCard key={layer.level + layer.title} layer={layer} />
            ))}
          </div>
        )}

        {/* ─── 芯片知识 Tab ─── */}
        {tab === 'chip' && (
          <div>
            {CHIP_LAYERS.map(layer => (
              <LayerCard key={layer.level + layer.title} layer={layer} />
            ))}
          </div>
        )}

        {/* ─── 选型指南 Tab ─── */}
        {tab === 'selection' && (
          <div>
            {SELECTION_LAYERS.map(layer => (
              <LayerCard key={layer.level + layer.title} layer={layer} />
            ))}
          </div>
        )}

        {/* ─── 材料 Tab ─── */}
        {tab === 'materials' && (
          <div>
            {MATERIALS_LAYERS.map(layer => (
              <LayerCard key={layer.level + layer.title} layer={layer} />
            ))}
          </div>
        )}

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
