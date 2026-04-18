'use client';

import { useState } from 'react';

// ─── 核心数据 ────────────────────────────────────────────────────────────────

const FED_DATA = {
  currentRate: 4.25,
  lastMeeting: '2026-03-19',
  nextMeeting: '2026-05-07',
  dotPlotMedian2026: 3.75,
  dotPlotMedian2027: 3.25,
  balance_sheet_trn: 6.8,
  qe_status: '缩表中（QT）',
  inflation_target: 2.0,
  pce_latest: 2.6,
  core_pce_latest: 2.8,
  cpi_latest: 2.7,
  unemployment: 4.1,
  gdp_q1_2026: 1.8,
  cuts_expected_2026: 2,
  market_implied_rate_end2026: 3.75,
  fomc_minutes_summary: '委员会对通胀回落进程持谨慎态度，就业市场韧性强于预期，多数委员倾向于在更多数据确认通胀可持续回落至 2% 目标前维持利率不变。',
};

const CHINA_DATA = {
  gdp_growth_2025: 5.0,
  gdp_growth_2026_target: '5% 左右',
  cpi_latest: 0.1,
  ppi_latest: -2.1,
  m2_growth: 7.2,
  fx_reserve_trn: 3.24,
  current_account_gdp: 1.8,
  trade_surplus_2025_bn: 992,
  pboc_rate_7d_repo: 1.5,
  pboc_lpr_1y: 3.1,
  pboc_lpr_5y: 3.6,
  rrr_large_banks: 9.5,
  youth_unemployment: 16.5,
  property_investment_yoy: -9.8,
  export_yoy_2026q1: 6.2,
  import_yoy_2026q1: -3.1,
  fiscal_deficit_gdp: 3.8,
  special_bond_quota_bn: 4600,
};

const USD_CNY_HISTORY = [
  { period: '2020 年底', rate: 6.52, note: '疫情后人民币升值' },
  { period: '2021 年底', rate: 6.37, note: '出口强劲，人民币持续升值' },
  { period: '2022 年底', rate: 6.90, note: '美联储激进加息，人民币贬值' },
  { period: '2023 年底', rate: 7.10, note: '中美利差扩大，资本外流压力' },
  { period: '2024 年底', rate: 7.29, note: '美元强势，人民币承压' },
  { period: '2025 年底', rate: 7.18, note: '美联储降息预期升温，人民币小幅回升' },
  { period: '2026 年 Q1', rate: 7.24, note: '关税摩擦升温，人民币短暂承压' },
  { period: '当前（2026-04）', rate: 6.81, note: '关税冲击美元信用，人民币大幅升值' },
];

const FORECAST_SCENARIOS = [
  {
    id: 'base',
    label: '基准情景',
    probability: 50,
    color: '#6c5ce7',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    rate_q2_2026: 6.85,
    rate_q3_2026: 6.90,
    rate_q4_2026: 6.95,
    rate_q1_2027: 7.00,
    assumptions: [
      '美联储 2026 年降息 2-3 次，年底联邦基金利率 3.50-3.75%',
      '中美贸易摩擦阶段性缓和，关税部分回撤或豁免',
      '中国经济增速维持 5% 左右，财政政策适度发力',
      '美元指数（DXY）在 98-102 区间震荡，美元信用修复',
      '人民币升值后出口商结汇压力释放，汇率小幅回调',
    ],
    drivers: '美元信用受损后修复 + 中美贸易缓和 → 人民币从极端升值水平温和回调',
    risks: '若美元持续走弱，人民币可能进一步升值至 6.5 以内',
  },
  {
    id: 'bull',
    label: '人民币升值情景',
    probability: 25,
    color: '#00b894',
    bg: 'bg-green-50',
    border: 'border-green-200',
    rate_q2_2026: 6.60,
    rate_q3_2026: 6.45,
    rate_q4_2026: 6.30,
    rate_q1_2027: 6.20,
    assumptions: [
      '美联储超预期降息 4-5 次，美元持续大幅走弱',
      '美国经济衰退风险上升，美元避险地位进一步受损',
      '中美贸易谈判取得实质进展，外资大规模回流',
      '中国经济超预期复苏，A 股和债市吸引力显著提升',
      '美元指数（DXY）跌破 95，创多年新低',
    ],
    drivers: '美元信用危机深化 + 去美元化加速 → 人民币持续大幅升值',
    risks: '央行可能通过降息、降准等方式对冲过快升值对出口的冲击',
  },
  {
    id: 'bear',
    label: '人民币贬值情景',
    probability: 25,
    color: '#e17055',
    bg: 'bg-red-50',
    border: 'border-red-200',
    rate_q2_2026: 7.10,
    rate_q3_2026: 7.20,
    rate_q4_2026: 7.25,
    rate_q1_2027: 7.30,
    assumptions: [
      '中美贸易战全面升级，关税提高至 145%+ 并长期维持',
      '美国通胀反弹，美联储被迫暂停降息，美元阶段性反弹',
      '中国出口大幅萎缩，贸易顺差收窄，经济增速跌破 4%',
      '美元指数（DXY）从低位反弹至 104-108 区间',
      '资本外流压力加剧，外汇储备下降至 3.0T 以下',
    ],
    drivers: '贸易战冲击出口 + 美元阶段性反弹 → 人民币从极端升值水平大幅回调',
    risks: '央行可能通过降息、降准等方式对冲，但效果有限',
  },
];

const KEY_INDICATORS = [
  {
    category: '美联储 & 美国',
    color: '#6c5ce7',
    items: [
      { label: '联邦基金利率', value: `${FED_DATA.currentRate}%`, trend: '↓ 预期降息', status: 'neutral' },
      { label: '核心 PCE（美联储目标通胀）', value: `${FED_DATA.core_pce_latest}%`, trend: '↓ 缓慢回落', status: 'warn' },
      { label: 'CPI 同比', value: `${FED_DATA.cpi_latest}%`, trend: '↓ 回落中', status: 'warn' },
      { label: '失业率', value: `${FED_DATA.unemployment}%`, trend: '→ 稳定', status: 'good' },
      { label: 'GDP 增速（2026 Q1）', value: `${FED_DATA.gdp_q1_2026}%`, trend: '↓ 放缓', status: 'warn' },
      { label: '美联储资产负债表', value: `$${FED_DATA.balance_sheet_trn}T`, trend: '↓ 缩表中', status: 'neutral' },
    ],
  },
  {
    category: '中国经济',
    color: '#e17055',
    items: [
      { label: 'GDP 增速目标（2026）', value: FED_DATA.gdp_q1_2026 + '% 左右', trend: '→ 维持目标', status: 'good' },
      { label: 'CPI 同比', value: `${CHINA_DATA.cpi_latest}%`, trend: '↓ 通缩压力', status: 'bad' },
      { label: 'PPI 同比', value: `${CHINA_DATA.ppi_latest}%`, trend: '↓ 持续负值', status: 'bad' },
      { label: '外汇储备', value: `$${CHINA_DATA.fx_reserve_trn}T`, trend: '→ 基本稳定', status: 'good' },
      { label: '贸易顺差（2025）', value: `$${CHINA_DATA.trade_surplus_2025_bn}B`, trend: '↑ 历史高位', status: 'good' },
      { label: '房地产投资同比', value: `${CHINA_DATA.property_investment_yoy}%`, trend: '↓ 持续下行', status: 'bad' },
    ],
  },
  {
    category: '汇率相关',
    color: '#00b894',
    items: [
      { label: '美元指数（DXY）', value: '99.0', trend: '↓ 大幅走弱', status: 'bad' },
      { label: '中美 10Y 国债利差', value: '-120bp', trend: '↑ 倒挂快速收窄', status: 'warn' },
      { label: 'USDCNY 即期', value: '6.81', trend: '↑ 人民币大幅升值', status: 'good' },
      { label: '离岸人民币（CNH）', value: '6.79', trend: '↑ CNH 领先升值', status: 'good' },
      { label: '央行中间价', value: '6.83', trend: '→ 跟随市场', status: 'neutral' },
      { label: '人民币 CFETS 指数', value: '102.3', trend: '↑ 显著升值', status: 'good' },
      { label: 'CNY/HKD（港币联系汇率）', value: '1.1464', trend: '→ 随美元联动', status: 'neutral' },
    ],
  },
];

const FOMC_CALENDAR = [
  { date: '2026-01-29', result: '维持 4.25-4.50%', change: 0 },
  { date: '2026-03-19', result: '维持 4.25-4.50%', change: 0 },
  { date: '2026-05-07', result: '预计维持', change: 0, future: true },
  { date: '2026-06-18', result: '预计降息 25bp', change: -25, future: true },
  { date: '2026-07-30', result: '预计维持', change: 0, future: true },
  { date: '2026-09-17', result: '预计降息 25bp', change: -25, future: true },
  { date: '2026-11-05', result: '预计维持', change: 0, future: true },
  { date: '2026-12-17', result: '预计维持', change: 0, future: true },
];

const RISK_FACTORS = [
  {
    factor: '美国通胀反弹',
    impact: '人民币贬值',
    probability: '中',
    magnitude: '高',
    color: 'text-red-600',
    bg: 'bg-red-50',
    desc: '若 PCE 重新升至 3%+，美联储暂停降息，美元走强，人民币承压。关键观察：每月 CPI/PCE 数据。',
  },
  {
    factor: '中美贸易摩擦升级',
    impact: '人民币贬值',
    probability: '中高',
    magnitude: '高',
    color: 'text-red-600',
    bg: 'bg-red-50',
    desc: '关税进一步提升至 60%+ 将直接冲击中国出口，贸易顺差收窄，人民币贬值压力加大。',
  },
  {
    factor: '美联储超预期降息',
    impact: '人民币升值',
    probability: '低',
    magnitude: '高',
    color: 'text-green-600',
    bg: 'bg-green-50',
    desc: '若美国经济硬着陆，美联储被迫快速降息，美元大幅走弱，人民币可能快速升值至 7.0 以内。',
  },
  {
    factor: '中国大规模财政刺激',
    impact: '人民币升值',
    probability: '中',
    magnitude: '中',
    color: 'text-green-600',
    bg: 'bg-green-50',
    desc: '若中国推出超预期刺激政策（如 10 万亿+），经济预期改善，外资回流，人民币升值。',
  },
  {
    factor: '地缘政治风险',
    impact: '人民币贬值',
    probability: '低中',
    magnitude: '极高',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    desc: '台海局势、俄乌冲突扩大等地缘风险将触发避险情绪，美元走强，人民币大幅贬值。',
  },
  {
    factor: '中国资本账户开放',
    impact: '人民币升值',
    probability: '低',
    magnitude: '中',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: '若中国加快资本账户开放，外资配置人民币资产需求增加，有助于人民币升值。',
  },
];

const TABS = [
  { id: 'forecast', label: '汇率预测', icon: '📈' },
  { id: 'fed', label: '美联储动态', icon: '🏦' },
  { id: 'us', label: '美国经济', icon: '🇺🇸' },
  { id: 'china', label: '中国经济', icon: '🇨🇳' },
  { id: 'dashboard', label: '数据看板', icon: '📊' },
  { id: 'risk', label: '风险因子', icon: '⚠️' },
];

// ─── 子组件 ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    good: 'bg-green-100 text-green-700',
    warn: 'bg-yellow-100 text-yellow-700',
    bad: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  };
  return null; // 仅用于颜色逻辑
}

function IndicatorCard({ item }) {
  const statusColor = {
    good: 'text-green-600',
    warn: 'text-yellow-600',
    bad: 'text-red-600',
    neutral: 'text-gray-500',
  }[item.status] || 'text-gray-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="text-xs text-gray-400 mb-1">{item.label}</div>
      <div className="text-xl font-bold text-gray-900">{item.value}</div>
      <div className={`text-xs mt-1 font-medium ${statusColor}`}>{item.trend}</div>
    </div>
  );
}

function ScenarioCard({ scenario, selected, onClick }) {
  return (
    <div
      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${scenario.bg} ${
        selected ? scenario.border + ' shadow-md' : 'border-transparent hover:border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{scenario.label}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: scenario.color }}
        >
          {scenario.probability}%
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[
          { label: 'Q2 2026', val: scenario.rate_q2_2026 },
          { label: 'Q3 2026', val: scenario.rate_q3_2026 },
          { label: 'Q4 2026', val: scenario.rate_q4_2026 },
          { label: 'Q1 2027', val: scenario.rate_q1_2027 },
        ].map(q => (
          <div key={q.label} className="text-center">
            <div className="text-[10px] text-gray-400">{q.label}</div>
            <div className="text-sm font-bold text-gray-800">{q.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 内容 ─────────────────────────────────────────────────────────────────

function ForecastTab() {
  const [selected, setSelected] = useState('base');
  const scenario = FORECAST_SCENARIOS.find(s => s.id === selected);

  return (
    <div className="space-y-6">
      {/* 标题说明 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
        <h3 className="font-bold text-gray-800 mb-1">美元/人民币汇率预测（2026 Q2 — 2027 Q1）</h3>
        <p className="text-sm text-gray-500">
          基于美联储货币政策路径、中美经济基本面、贸易格局、资本流动等多维度数据综合研判。
          当前即期汇率：<span className="font-bold text-purple-700">6.81</span>，
          央行中间价：<span className="font-bold text-purple-700">6.83</span>，
          CNY/HKD：<span className="font-bold text-purple-700">1.1464</span>（港币联系汇率 7.83，随美元联动）。
        </p>
        <div className="mt-2 text-xs text-orange-600 font-medium bg-orange-50 rounded-lg px-3 py-2">
          ⚡ 重要背景：2026 年 4 月美国大规模关税政策冲击美元信用，DXY 跌破 100，人民币从年初 7.24 大幅升值至 6.81，升幅约 6%，为近年罕见走势。
        </div>
        <div className="mt-3 text-xs text-gray-400">
          ⚠️ 本预测仅供研究参考，不构成投资建议。汇率受多重不确定因素影响，实际走势可能与预测存在较大偏差。
        </div>
      </div>

      {/* 历史走势 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">历史汇率走势</h4>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-end gap-2 h-32">
            {USD_CNY_HISTORY.map((d, i) => {
              const min = 6.3, max = 7.5;
              const height = ((d.rate - min) / (max - min)) * 100;
              const isLast = i === USD_CNY_HISTORY.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t-sm transition-all ${isLast ? 'bg-purple-500' : 'bg-purple-200 group-hover:bg-purple-400'}`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-[9px] text-gray-400 text-center leading-tight">{d.period.replace('年', '\n').replace(' ', '\n')}</div>
                  {/* tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {d.rate} — {d.note}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-300 mt-1">
            <span>6.30（低）</span>
            <span>7.50（高）</span>
          </div>
        </div>
      </div>

      {/* 情景选择 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">三大情景预测</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FORECAST_SCENARIOS.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={selected === s.id}
              onClick={() => setSelected(s.id)}
            />
          ))}
        </div>
      </div>

      {/* 情景详情 */}
      {scenario && (
        <div className={`rounded-xl border p-5 ${scenario.bg} ${scenario.border}`}>
          <h4 className="font-bold text-gray-800 mb-3">
            {scenario.label} — 详细分析
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">核心假设</div>
              <ul className="space-y-1.5">
                {scenario.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">主要驱动逻辑</div>
                <p className="text-sm text-gray-700">{scenario.drivers}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">主要风险</div>
                <p className="text-sm text-gray-700">{scenario.risks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 综合判断 */}
      <div className="bg-gray-900 rounded-xl p-5 text-white">
        <h4 className="font-bold mb-3">📌 综合研判</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <span className="text-white font-medium">基准预测：</span>
          未来 12 个月（至 2027 Q1），美元/人民币汇率大概率在
            <span className="text-purple-300 font-bold"> 6.60 — 7.10 </span>
            区间内运行，中枢约 <span className="text-purple-300 font-bold">6.85</span>，较当前（6.81）小幅双向波动。
          </p>
          <p>
            <span className="text-white font-medium">核心逻辑：</span>
            美元信用受关税政策冲击，DXY 跌破 100；美联储降息周期开启将进一步压制美元；
            中国贸易顺差维持高位提供基本面支撑；但人民币升值过快将压制出口，央行可能适度干预。
          </p>
          <p>
            <span className="text-white font-medium">最大不确定性：</span>
            中美贸易谈判走向（关税是否实质性回撤）和美元信用修复速度是决定汇率方向的两大关键变量。
          </p>
          <p>
            <span className="text-white font-medium">央行底线：</span>
            历史经验显示，央行对人民币过快升值同样存在容忍度限制，可能通过降低外汇存款准备金率、调整中间价等工具干预，防止出口受损。
          </p>
        </div>
      </div>
    </div>
  );
}

function FedTab() {
  return (
    <div className="space-y-6">
      {/* 当前利率状态 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '联邦基金利率目标区间', value: '4.25 — 4.50%', sub: '当前水平', color: 'text-purple-700' },
          { label: '点阵图中位数（2026 年底）', value: `${FED_DATA.dotPlotMedian2026}%`, sub: '预期降息 2 次', color: 'text-blue-700' },
          { label: '核心 PCE 通胀', value: `${FED_DATA.core_pce_latest}%`, sub: '目标 2.0%', color: 'text-orange-600' },
          { label: '资产负债表规模', value: `$${FED_DATA.balance_sheet_trn}T`, sub: FED_DATA.qe_status, color: 'text-gray-700' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1 leading-tight">{item.label}</div>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* FOMC 会议日历 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">2026 年 FOMC 会议日历</h4>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2.5">会议日期</th>
                <th className="text-left px-4 py-2.5">决议 / 预期</th>
                <th className="text-left px-4 py-2.5">变动</th>
                <th className="text-left px-4 py-2.5">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {FOMC_CALENDAR.map(m => (
                <tr key={m.date} className={m.future ? 'text-gray-400' : 'text-gray-700'}>
                  <td className="px-4 py-2.5 font-mono text-xs">{m.date}</td>
                  <td className="px-4 py-2.5">{m.result}</td>
                  <td className="px-4 py-2.5">
                    {m.change === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className={m.change < 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {m.change > 0 ? '+' : ''}{m.change}bp
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.future ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'}`}>
                      {m.future ? '预期' : '已公布'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOMC 纪要摘要 */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
        <h4 className="font-semibold text-blue-800 mb-2">最新 FOMC 纪要摘要（2026-03-19）</h4>
        <p className="text-sm text-blue-700 leading-relaxed">{FED_DATA.fomc_minutes_summary}</p>
      </div>

      {/* 美联储对汇率的影响路径 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">美联储政策 → 人民币汇率传导路径</h4>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 text-sm">
            {[
              { icon: '🏦', label: '美联储降息', desc: '联邦基金利率下调' },
              { icon: '📉', label: '美债收益率下行', desc: '10Y 美债收益率走低' },
              { icon: '💱', label: '中美利差收窄', desc: '倒挂幅度减小' },
              { icon: '📊', label: '美元走弱', desc: 'DXY 指数下行' },
              { icon: '🟢', label: '人民币升值', desc: 'USDCNY 下行' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-lg">{step.icon}</div>
                  <div className="text-xs font-medium text-gray-700 mt-1 text-center">{step.label}</div>
                  <div className="text-[10px] text-gray-400 text-center">{step.desc}</div>
                </div>
                {i < 4 && <span className="text-gray-300 text-lg hidden md:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsEconomyTab() {
  const indicators = KEY_INDICATORS.find(k => k.category === '美联储 & 美国');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {indicators.items.map(item => <IndicatorCard key={item.label} item={item} />)}
      </div>

      {/* 美国经济分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="font-semibold text-gray-800 mb-3">🔍 经济现状分析</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">增长：</span>2026 Q1 GDP 增速 1.8%，较 2025 年的 2.8% 明显放缓。消费支出韧性强，但企业投资受高利率压制。</p>
            <p><span className="font-medium text-gray-800">通胀：</span>核心 PCE 2.8%，高于 2% 目标，但下行趋势明确。住房通胀是主要粘性来源，预计 2026 年底回落至 2.3% 左右。</p>
            <p><span className="font-medium text-gray-800">就业：</span>失业率 4.1%，非农就业月均新增约 15 万，就业市场韧性强于预期，给美联储维持高利率提供了空间。</p>
            <p><span className="font-medium text-gray-800">财政：</span>联邦财政赤字占 GDP 约 6.5%，国债规模突破 $36T，长期财政可持续性存疑，但短期内不影响美元地位。</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="font-semibold text-gray-800 mb-3">📌 对人民币汇率的影响</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-red-500 flex-shrink-0">↑贬值压力</span>
              <span>美国经济韧性强 → 美联储降息节奏慢 → 美元维持强势 → 人民币承压</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-500 flex-shrink-0">↓升值动力</span>
              <span>美国经济放缓 → 美联储加速降息 → 美元走弱 → 人民币升值</span>
            </div>
            <div className="flex gap-2">
              <span className="text-orange-500 flex-shrink-0">⚠️ 关键变量</span>
              <span>每月 CPI/PCE 数据、非农就业数据是判断美联储政策路径的核心指标</span>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <strong>关注日历：</strong>每月第一个周五（非农）、每月中旬（CPI）、每月底（PCE）、每季度 FOMC 会议
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChinaEconomyTab() {
  const indicators = KEY_INDICATORS.find(k => k.category === '中国经济');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {indicators.items.map(item => <IndicatorCard key={item.label} item={item} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="font-semibold text-gray-800 mb-3">🔍 经济现状分析</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">增长：</span>2026 年 GDP 增速目标 5% 左右，出口是主要支撑（Q1 出口同比 +6.2%），内需偏弱，消费复苏缓慢。</p>
            <p><span className="font-medium text-gray-800">通缩压力：</span>CPI 接近零，PPI 持续负值（-2.1%），反映内需不足和产能过剩，与美国通胀形成鲜明对比。</p>
            <p><span className="font-medium text-gray-800">房地产：</span>房地产投资同比 -9.8%，仍是经济最大拖累。政策托底效果有限，去库存周期漫长。</p>
            <p><span className="font-medium text-gray-800">财政：</span>赤字率 3.8%，专项债额度 4.6 万亿，财政政策积极但空间有限，地方政府债务压力较大。</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="font-semibold text-gray-800 mb-3">🏦 央行政策工具箱</h4>
          <div className="space-y-2 text-sm">
            {[
              { tool: '7 天逆回购利率', value: `${CHINA_DATA.pboc_rate_7d_repo}%`, desc: '货币政策基准利率' },
              { tool: 'LPR 1 年期', value: `${CHINA_DATA.pboc_lpr_1y}%`, desc: '企业贷款参考利率' },
              { tool: 'LPR 5 年期', value: `${CHINA_DATA.pboc_lpr_5y}%`, desc: '房贷参考利率' },
              { tool: '大行存款准备金率', value: `${CHINA_DATA.rrr_large_banks}%`, desc: '仍有下调空间' },
              { tool: '外汇中间价', value: '7.21', desc: '逆周期因子调节' },
              { tool: '外汇存款准备金率', value: '4%', desc: '可下调释放外汇流动性' },
            ].map(t => (
              <div key={t.tool} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-gray-700">{t.tool}</div>
                  <div className="text-xs text-gray-400">{t.desc}</div>
                </div>
                <div className="font-bold text-gray-900">{t.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 贸易数据 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="font-semibold text-gray-800 mb-3">🌐 贸易格局与汇率支撑</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">${CHINA_DATA.trade_surplus_2025_bn}B</div>
            <div className="text-xs text-green-600 mt-1">2025 年贸易顺差（历史最高）</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">+{CHINA_DATA.export_yoy_2026q1}%</div>
            <div className="text-xs text-blue-600 mt-1">2026 Q1 出口同比</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{CHINA_DATA.import_yoy_2026q1}%</div>
            <div className="text-xs text-orange-600 mt-1">2026 Q1 进口同比（内需偏弱）</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          巨额贸易顺差是人民币汇率最重要的基本面支撑。即使资本账户存在净流出压力，经常账户顺差也能提供持续的美元供给，限制人民币大幅贬值空间。
        </p>
      </div>
    </div>
  );
}

function DashboardTab() {
  return (
    <div className="space-y-6">
      {KEY_INDICATORS.map(group => (
        <div key={group.category}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: group.color }} />
            {group.category}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {group.items.map(item => <IndicatorCard key={item.label} item={item} />)}
          </div>
        </div>
      ))}

      {/* 数据更新说明 */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <strong className="text-gray-500">数据说明：</strong>
        以上数据基于 2026 年 4 月公开数据整理。美联储数据来源：FOMC 声明、美联储官网；
        中国数据来源：国家统计局、央行、海关总署；汇率数据来源：中国外汇交易中心（CFETS）。
        数据每月更新一次。
      </div>
    </div>
  );
}

function RiskTab() {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-sm text-yellow-700">
        以下风险因子按对人民币汇率的潜在影响方向分类，概率和量级为定性评估，仅供参考。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RISK_FACTORS.map(r => (
          <div key={r.factor} className={`rounded-xl border border-gray-100 p-4 ${r.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-gray-800">{r.factor}</div>
              <div className={`text-xs font-bold ${r.color}`}>{r.impact}</div>
            </div>
            <div className="flex gap-3 mb-2 text-xs">
              <span className="text-gray-500">概率：<span className="font-medium text-gray-700">{r.probability}</span></span>
              <span className="text-gray-500">影响量级：<span className="font-medium text-gray-700">{r.magnitude}</span></span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* 风险矩阵 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="font-semibold text-gray-800 mb-4">风险矩阵（概率 × 影响）</h4>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div className="col-start-2 font-medium text-gray-500 pb-1">中等影响</div>
          <div className="font-medium text-gray-500 pb-1">高影响</div>
          <div className="font-medium text-gray-500 flex items-center justify-end pr-2">高概率</div>
          <div className="bg-orange-100 rounded p-2 text-orange-700">贸易摩擦升级</div>
          <div className="bg-red-100 rounded p-2 text-red-700">美国通胀反弹</div>
          <div className="font-medium text-gray-500 flex items-center justify-end pr-2">中概率</div>
          <div className="bg-green-100 rounded p-2 text-green-700">中国财政刺激</div>
          <div className="bg-orange-100 rounded p-2 text-orange-700">美联储超预期降息</div>
          <div className="font-medium text-gray-500 flex items-center justify-end pr-2">低概率</div>
          <div className="bg-blue-100 rounded p-2 text-blue-700">资本账户开放</div>
          <div className="bg-red-200 rounded p-2 text-red-800">地缘政治冲突</div>
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function EconomyResearch() {
  const [activeTab, setActiveTab] = useState('forecast');

  const renderTab = () => {
    switch (activeTab) {
      case 'forecast': return <ForecastTab />;
      case 'fed': return <FedTab />;
      case 'us': return <UsEconomyTab />;
      case 'china': return <ChinaEconomyTab />;
      case 'dashboard': return <DashboardTab />;
      case 'risk': return <RiskTab />;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 页头 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌐</span>
          <h1 className="text-2xl font-bold text-gray-900">全球经济与中国经济研究</h1>
        </div>
        <p className="text-gray-500 text-sm">
          综合美联储政策、美国经济数据、中国宏观指标、贸易格局等多维度数据，
          研判美元/人民币汇率走势。数据基于 2026 年 4 月公开信息。
        </p>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {renderTab()}
    </div>
  );
}
