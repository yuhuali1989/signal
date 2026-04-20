'use client';

import { useState } from 'react';

// ════════════════════════════════════════════════════════════════
// Seed-AD 数据闭环（8 层架构）
// 相比 DriveWorld-VLA 的 7 层，多了 UniSim 2.0 合成数据层
// ════════════════════════════════════════════════════════════════

const LAYERS = [
  {
    id: 'collect',
    step: '01',
    title: '车端采集',
    icon: '📷',
    color: '#10b981',
    inputs: ['6 摄像头 @ 10Hz', '5 LiDAR 32 线', '5 Radar', 'IMU + GPS'],
    outputs: ['原始传感器数据', '时间戳对齐', '事件触发上报'],
    tech: ['ROS 2 采集栈', '硬件时钟同步 PTP', '边缘预过滤（去重/去噪）'],
    seedAd: '车端 13B 模型实时推理，反思信号触发关键帧上报（减 80% 带宽）',
  },
  {
    id: 'mining',
    step: '02',
    title: '难例挖掘',
    icon: '🔍',
    color: '#00cec9',
    inputs: ['全量车端数据', '反思风险信号'],
    outputs: ['Hard Case 池', '长尾场景索引', 'Active Learning 候选'],
    tech: ['不确定性采样', '反思触发回传', '场景聚类（DBSCAN）'],
    seedAd: '反思 collision > 0.3 自动入难例池，覆盖切入/行人/施工等 Long-Tail',
  },
  {
    id: 'annotate',
    step: '03',
    title: '自动标注',
    icon: '🏷️',
    color: '#6c5ce7',
    inputs: ['Hard Case 原始数据'],
    outputs: ['3D 框', '语义分割', '意图标签', '文本描述'],
    tech: ['4D 标注工具', 'VLM 辅助描述（Qwen3-VL）', '人工校验 < 5%'],
    seedAd: '基于 Seed-AD 70B 本身做伪标签，反思信号辅助边缘 case 识别',
  },
  {
    id: 'lake',
    step: '04',
    title: '真实数据湖',
    icon: '💾',
    color: '#3498db',
    inputs: ['标注完成数据'],
    outputs: ['结构化数据集', 'PB 级存储', '索引 / 版本控制'],
    tech: ['Apache Iceberg', 'S3 + Lakehouse', 'DeltaLake'],
    seedAd: '与 Databricks UC 集成，支持按场景/天气/地域多维切片',
  },
  {
    id: 'unisim',
    step: '05',
    title: 'UniSim 2.0 合成',
    icon: '🎨',
    color: '#f39c12',
    inputs: ['真实数据 Layout', '长尾场景缺口'],
    outputs: ['合成多模态数据', '32 种天气/光照', '无限扩展'],
    tech: ['物理引擎渲染', '神经辐射场 NeRF', '对抗域适应'],
    seedAd: '★ Seed-AD 专属创新：基于 UniSim 2.0 扩展的合成数据工具链，补齐长尾',
    highlight: true,
  },
  {
    id: 'mix',
    step: '06',
    title: '混合数据集',
    icon: '🥣',
    color: '#e74c3c',
    inputs: ['真实数据', '合成数据'],
    outputs: ['课程学习数据集', '比例 65:35 真合成'],
    tech: ['Curriculum Learning', '难度渐进', '动态重采样'],
    seedAd: '动态配比：训练早期 80% 真实 / 后期加大合成比例到 40%',
  },
  {
    id: 'train',
    step: '07',
    title: '三阶段训练',
    icon: '🏋️',
    color: '#9b59b6',
    inputs: ['混合数据集'],
    outputs: ['Seed-AD 70B 云端', 'Seed-AD 13B 车端'],
    tech: ['2048 × H100', 'FSDP + Sequence Parallel', '31 天总时长'],
    seedAd: 'Stage1 预训练 21 天 → Stage2 联合 7 天 → Stage3 蒸馏 3 天',
  },
  {
    id: 'deploy',
    step: '08',
    title: '部署回采',
    icon: '🚀',
    color: '#fd79a8',
    inputs: ['Seed-AD 13B'],
    outputs: ['Orin X 车端推理', '云端 70B 影子模式', '回采数据'],
    tech: ['TensorRT-LLM INT4', 'OTA 灰度发布', 'Shadow Mode 对比'],
    seedAd: '车端 45ms 推理 + 云端 70B 影子模式对比，差异大的 case 回采闭环',
  },
];

const STATS = [
  { label: '数据采集规模', value: '50 PB/年', color: '#10b981' },
  { label: '难例回传率', value: '2.3%', color: '#00cec9' },
  { label: '标注自动化率', value: '95%', color: '#6c5ce7' },
  { label: '合成数据占比', value: '35%', color: '#f39c12' },
  { label: '闭环周期', value: '14 天', color: '#e74c3c' },
  { label: '版本迭代频率', value: '月 / 次', color: '#9b59b6' },
];

export default function SeedAdDataLoop() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      {/* Hero */}
      <div className="mb-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-orange-50/40 border border-emerald-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🔄</span>
          <span className="text-sm font-semibold text-gray-800">Seed-AD 八层数据闭环</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-medium">
            +UniSim 2.0 合成
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          相比 DriveWorld-VLA 的 7 层闭环，Seed-AD 多了 <span className="font-semibold text-orange-600">UniSim 2.0 合成数据层</span>，
          以物理一致性渲染补齐长尾场景，每条真实样本扩增 ×5。车端 13B 模型实时反思，
          <span className="font-semibold text-emerald-700">只回传风险 case</span>，减少 80% 带宽。
        </p>
      </div>

      {/* 统计指标 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-5">
        {STATS.map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-white border border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5">{s.label}</div>
            <div className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 闭环流程图（简化：横向8 格 + 下方详情） */}
      <div className="mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {LAYERS.map((layer, i) => {
            const isSel = selected === layer.id;
            return (
              <button key={layer.id} onClick={() => setSelected(isSel ? null : layer.id)}
                className="relative p-3 rounded-xl border transition-all text-left"
                style={{
                  borderColor: isSel ? layer.color : layer.color + '33',
                  background: isSel ? layer.color + '15' : layer.color + '06',
                  boxShadow: isSel ? `0 2px 8px ${layer.color}22` : 'none',
                }}>
                {layer.highlight && (
                  <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                    NEW
                  </span>
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{layer.icon}</span>
                  <span className="text-[9px] font-bold font-mono" style={{ color: layer.color }}>
                    {layer.step}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-gray-800">{layer.title}</div>
              </button>
            );
          })}
        </div>

        {/* 选中层详情 */}
        {selected && (() => {
          const layer = LAYERS.find(l => l.id === selected);
          return (
            <div className="mt-3 p-5 rounded-2xl border" style={{ borderColor: layer.color + '44', background: layer.color + '06' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{layer.icon}</span>
                <span className="text-base font-semibold text-gray-800">{layer.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                  style={{ background: layer.color + '22', color: layer.color }}>
                  STEP {layer.step}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 mb-1.5">📥 输入</div>
                  <ul className="space-y-1">
                    {layer.inputs.map(x => (
                      <li key={x} className="text-gray-700 text-[11px]">• {x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 mb-1.5">📤 输出</div>
                  <ul className="space-y-1">
                    {layer.outputs.map(x => (
                      <li key={x} className="text-gray-700 text-[11px]">• {x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 mb-1.5">🛠️ 关键技术</div>
                  <ul className="space-y-1">
                    {layer.tech.map(x => (
                      <li key={x} className="text-gray-700 text-[11px]">• {x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-[11px] text-gray-700 leading-relaxed"
                style={{ borderColor: layer.color + '33' }}>
                <span className="font-semibold" style={{ color: layer.color }}>🌱 Seed-AD 创新点：</span>
                {layer.seedAd}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 各层详情卡（全量展开） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LAYERS.map(layer => (
          <div key={layer.id}
            className="p-4 rounded-2xl border bg-white"
            style={{ borderColor: layer.color + '22' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{layer.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{layer.title}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ml-auto"
                style={{ background: layer.color + '1a', color: layer.color }}>
                {layer.step}
              </span>
              {layer.highlight && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                  Seed-AD 新增
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 leading-relaxed">
              {layer.seedAd}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {layer.tech.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
