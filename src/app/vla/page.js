'use client';

import { useCallback, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

const ArchViz = dynamic(() => import('@/components/VlaArchViz'), { ssr: false, loading: () => <LoadingBlock /> });

const Notebook = dynamic(() => import('@/components/VlaNotebook'), { ssr: false, loading: () => <LoadingBlock /> });

const DataLoop = dynamic(() => import('@/components/DataLoopArch'), { ssr: false, loading: () => <LoadingBlock /> });
// DatalakeTab 已替换为自动驾驶业务全流程存储格式组件（AdStorageTab）

// Seed-AD 子模块（70B · 三阶段 想象→反思→行动）
const SeedAdArchViz  = dynamic(() => import('@/components/SeedAdArchViz'),  { ssr: false, loading: () => <LoadingBlock /> });
const SeedAdNotebook = dynamic(() => import('@/components/SeedAdNotebook'), { ssr: false, loading: () => <LoadingBlock /> });
const SeedAdDataLoop = dynamic(() => import('@/components/SeedAdDataLoop'), { ssr: false, loading: () => <LoadingBlock /> });

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center h-64 rounded-2xl bg-[#0a0d14] border border-[#1e2130]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00cec9] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#4a5568]">加载可视化组件...</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 自动驾驶业务全流程存储格式（替代通用数据湖仓）
// ─────────────────────────────────────────────────────────────
const AD_STORAGE_STAGES = [
  {
    id: 'collect',
    icon: '🚗',
    label: '车端采集',
    color: '#6c5ce7',
    formats: [
      { name: 'MCAP', role: '主格式', desc: '多模态原始数据容器，单文件封装 6路相机 + 5路LiDAR + 5路Radar + IMU/GPS，支持时间戳索引与随机访问', tags: ['foxglove/mcap', '替代 rosbag2', '压缩 LZ4/ZSTD'] },
      { name: 'rosbag2', role: '兼容格式', desc: 'ROS2 原生录制格式，部分车型仍在使用，可通过 mcap-ros2 工具链转换', tags: ['ROS2', '逐步迁移至 MCAP'] },
    ],
    note: '单次 Session 约 50-200 GB，触发式录制（corner case 优先），车端 NVMe 缓存后上传 S3',
  },
  {
    id: 'raw',
    icon: '☁️',
    label: '原始存储',
    color: '#00cec9',
    formats: [
      { name: 'MCAP on S3/OSS', role: '原始归档', desc: '原始 MCAP 文件直接上传对象存储，按 vehicle_id/date/session_id 分层目录，保留完整原始数据用于回溯', tags: ['S3 Standard-IA', '生命周期 → Glacier', '不可变存储'] },
      { name: 'Session 元数据 JSON', role: '索引', desc: '每个 Session 对应一条 JSON 元数据（时长/里程/触发原因/传感器状态/GPS轨迹摘要），写入 Iceberg 元数据表', tags: ['Iceberg 元数据表', '快速检索'] },
    ],
    note: '原始数据永久保留（合规要求），通过 Iceberg 时间旅行支持历史版本回溯',
  },
  {
    id: 'process',
    icon: '🔧',
    label: '解码 & 处理',
    color: '#fdcb6e',
    formats: [
      { name: 'JPEG / PNG', role: '图像帧', desc: '从 MCAP 解码的相机帧，JPEG 用于训练（压缩比高），PNG 用于标注（无损）。按 camera_id/timestamp 命名，存 S3', tags: ['6路相机', '10Hz', 'JPEG q=85'] },
      { name: 'PCD / NPY', role: '点云帧', desc: 'LiDAR 点云解码为 PCD（可视化）或 NPY（训练），每帧约 100K 点，10Hz 采样', tags: ['5路LiDAR', 'NPY float32', '10Hz'] },
      { name: 'Parquet', role: '结构化特征', desc: 'IMU/GPS/车速/转向角等时序传感器数据，按 session 分区存 Parquet，支持 Spark/DuckDB 直接查询', tags: ['列式存储', 'ZSTD压缩', 'Iceberg管理'] },
    ],
    note: '解码任务由 Spark/Ray 分布式执行，处理后数据写入 Iceberg 表，支持增量更新',
  },
  {
    id: 'annotate',
    icon: '🏷️',
    label: '标注数据',
    color: '#e17055',
    formats: [
      { name: 'JSON / JSONL', role: '标注结果', desc: '3D 框标注（BEV）、语义分割 mask、车道线、可行驶区域，每帧一个 JSON，JSONL 用于流式写入', tags: ['BEVFusion自动标注', 'SAM2分割', '人工复核'] },
      { name: 'Parquet on Iceberg', role: '标注元数据', desc: '标注任务状态、标注员 ID、质检分数、版本号等元数据，写入 Iceberg 表，支持 Schema 演化和时间旅行', tags: ['Iceberg v2', '版本化', 'MERGE INTO'] },
      { name: 'DriveLM 格式', role: '语言标注', desc: '视觉问答三元组 <图像, 问题, 答案>，用于 VLA 语言理解训练，460K 条，存 Parquet', tags: ['VQA三元组', '460K条', 'DriveLM兼容'] },
    ],
    note: '标注数据通过 Iceberg MERGE INTO 实现增量更新，支持多版本并存（不同标注策略对比）',
  },
  {
    id: 'train',
    icon: '🧠',
    label: '训练数据集',
    color: '#a29bfe',
    formats: [
      { name: 'HDF5', role: '多模态训练包', desc: '将多模态数据（图像+点云+标注+语言）打包为 HDF5，支持随机访问和内存映射，适合 PyTorch DataLoader', tags: ['h5py', '内存映射', 'PyTorch兼容'] },
      { name: 'Parquet + Arrow', role: '大规模训练', desc: '超大规模训练集（>1M 样本）使用 Parquet + Apache Arrow 格式，支持 Ray Data 流式读取，避免内存溢出', tags: ['Ray Data', 'Arrow IPC', '流式读取'] },
      { name: 'WebDataset (tar)', role: '分布式训练', desc: '将训练样本打包为 WebDataset tar 格式，支持 S3 流式读取，适合多机多卡分布式训练场景', tags: ['WebDataset', 'S3流式', '多机训练'] },
    ],
    note: '训练集通过 Iceberg 快照管理版本，支持 AS OF TIMESTAMP 回溯到任意历史版本的训练集',
  },
  {
    id: 'meta',
    icon: '📊',
    label: '元数据管理',
    color: '#00b894',
    formats: [
      { name: 'Apache Iceberg', role: '统一元数据层', desc: '所有结构化数据（Session元数据/标注/训练集版本/模型评测结果）统一用 Iceberg 管理，支持 ACID、时间旅行、Schema 演化', tags: ['Iceberg v2/v3', 'REST Catalog', 'Unity Catalog'] },
      { name: 'MLflow', role: '实验追踪', desc: '训练实验参数、指标、模型 artifact 版本管理，与 Iceberg 训练集版本双向绑定（训练集 snapshot_id → MLflow run_id）', tags: ['MLflow 3.x', 'Artifact Store', 'Model Registry'] },
    ],
    note: 'Iceberg + MLflow 双向绑定：每个 MLflow Run 记录对应的 Iceberg 训练集 snapshot_id，确保实验可复现',
  },
  {
    id: 'deploy',
    icon: '🚀',
    label: '模型部署',
    color: '#fd79a8',
    formats: [
      { name: 'ONNX', role: '跨平台中间格式', desc: '训练完成后导出 ONNX，作为跨框架部署的中间格式，支持 TensorRT / OpenVINO / ONNX Runtime 多后端', tags: ['PyTorch → ONNX', '跨框架', '量化友好'] },
      { name: 'TensorRT Engine', role: '车端推理', desc: 'ONNX → TensorRT 编译，针对 NVIDIA Orin 平台优化，INT8/FP16 量化，延迟 <45ms（Seed-AD 13B 蒸馏版）', tags: ['TensorRT 10.x', 'INT8量化', 'Orin X'] },
      { name: 'SafeTensors', role: '模型权重', desc: 'HuggingFace SafeTensors 格式存储模型权重，替代 pickle，支持安全加载和内存映射，存 S3 Model Registry', tags: ['SafeTensors', '安全加载', 'S3 Model Registry'] },
    ],
    note: '部署模型通过 MLflow Model Registry 版本化管理，支持 A/B 测试和灰度发布',
  },
];

function AdStorageTab() {
  const [activeStage, setActiveStage] = useState(null);

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/[0.03] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🗄️</span>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">自动驾驶业务全流程存储格式</div>
            <div className="text-[10px] text-gray-500 leading-relaxed">
              从车端采集到模型部署，各阶段数据的存储格式选型与最佳实践
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['MCAP', 'Parquet', 'HDF5', 'WebDataset', 'Iceberg', 'ONNX', 'TensorRT'].map(t => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: '#00cec915', color: '#00cec9', border: '1px solid #00cec930' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 流程时间轴 */}
      <div className="relative">
        {/* 连接线 */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#6c5ce7] via-[#00cec9] to-[#fd79a8] opacity-20 hidden sm:block" />

        <div className="space-y-3">
          {AD_STORAGE_STAGES.map((stage, idx) => (
            <div key={stage.id} className="relative">
              {/* 阶段卡片 */}
              <button
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                className="w-full text-left rounded-2xl border transition-all hover:shadow-sm"
                style={{
                  borderColor: activeStage === stage.id ? stage.color + '50' : '#e2e8f0',
                  background: activeStage === stage.id ? stage.color + '06' : '#fff',
                }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* 序号圆点 */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: stage.color }}>
                    {idx + 1}
                  </div>
                  <span className="text-base">{stage.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">{stage.label}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {stage.formats.map(f => (
                        <span key={f.name} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: stage.color + '15', color: stage.color }}>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {activeStage === stage.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* 展开详情 */}
              {activeStage === stage.id && (
                <div className="mt-1 rounded-2xl border p-4 space-y-3"
                  style={{ borderColor: stage.color + '30', background: stage.color + '04' }}>
                  {/* 格式列表 */}
                  <div className="space-y-2">
                    {stage.formats.map(f => (
                      <div key={f.name} className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                            style={{ background: stage.color + '15', color: stage.color }}>
                            {f.name}
                          </span>
                          <span className="text-[9px] text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded">
                            {f.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 leading-relaxed mb-2">{f.desc}</div>
                        <div className="flex flex-wrap gap-1">
                          {f.tags.map(tag => (
                            <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 阶段备注 */}
                  <div className="rounded-xl border p-2.5 text-[10px] text-gray-500 leading-relaxed"
                    style={{ borderColor: stage.color + '20', background: stage.color + '05' }}>
                    💡 {stage.note}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 全流程格式总览表 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="text-xs font-bold text-gray-700 mb-3">📋 全流程存储格式速查</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">阶段</th>
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">主格式</th>
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">辅助格式</th>
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">存储位置</th>
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">管理工具</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stage: '🚗 车端采集', main: 'MCAP', aux: 'rosbag2（兼容）', storage: 'NVMe → S3', tool: '车端录制 Agent' },
                { stage: '☁️ 原始存储', main: 'MCAP on S3', aux: 'Session JSON', storage: 'S3 Standard-IA', tool: 'Iceberg 元数据表' },
                { stage: '🔧 解码处理', main: 'JPEG/PNG + NPY', aux: 'Parquet（时序）', storage: 'S3 + Iceberg', tool: 'Spark / Ray' },
                { stage: '🏷️ 标注数据', main: 'JSON/JSONL', aux: 'Parquet on Iceberg', storage: 'S3 + Iceberg', tool: 'Iceberg MERGE INTO' },
                { stage: '🧠 训练集', main: 'HDF5 / Parquet', aux: 'WebDataset (tar)', storage: 'S3 + Iceberg 快照', tool: 'Ray Data / MLflow' },
                { stage: '📊 元数据', main: 'Apache Iceberg', aux: 'MLflow Tracking', storage: 'S3 + Catalog', tool: 'Unity Catalog' },
                { stage: '🚀 模型部署', main: 'TensorRT Engine', aux: 'ONNX / SafeTensors', storage: 'S3 Model Registry', tool: 'MLflow Registry' },
              ].map((row, i) => (
                <tr key={row.stage} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                  <td className="py-1.5 px-2 font-medium text-gray-700">{row.stage}</td>
                  <td className="py-1.5 px-2 font-mono text-[#6c5ce7]">{row.main}</td>
                  <td className="py-1.5 px-2 text-gray-500">{row.aux}</td>
                  <td className="py-1.5 px-2 text-gray-500">{row.storage}</td>
                  <td className="py-1.5 px-2 text-gray-500">{row.tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  {
    id: 'arch',
    label: '架构 & 数据',
    icon: '🏗️',
    desc: 'Unified Latent-Space 架构图 · 数据集选型 · 训练配置 · VLA 实验室',
    color: '#6c5ce7',
  },
  {
    id: 'notebook',
    label: '论文实践',
    icon: '📓',
    desc: '数据准备 → 模型搭建 → 训练运行 · 可逐步运行的 Notebook',
    color: '#e17055',
  },
];

// 研究项目卡片数据
const RESEARCH_PROJECTS = [
  {
    id: 'driveworld',
    title: 'DriveWorld-VLA',
    badge: 'Unified Latent-Space',
    badgeColor: '#6c5ce7',
    status: '深度解读',
    statusColor: 'bg-purple-50 text-purple-600 border-purple-100',
    desc: '统一隐空间同时驱动 VLA 规划 + 世界模型预测，端到端自动驾驶。L2 误差 0.42m，FVD 52，碰撞率 1.2%。',
    tags: ['VLA', 'World Model', 'nuScenes', 'NAVSIM'],
    icon: '🤖',
    active: true,
  },
  {
    id: 'seedad',
    title: 'Seed-AD',
    badge: '70B · 三阶段开源',
    badgeColor: '#10b981',
    status: '深度解读',
    statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    desc: '字节 70B VLA 三阶段推理（想象→反思→行动），nuScenes L2(3s) 0.54m / 碰撞率 0.11% 新 SOTA，车端 Orin X 45ms。',
    tags: ['70B-VLA', 'Imagination', 'Reflection', 'nuScenes-SOTA'],
    icon: '🌱',
    active: true,
  },
  {
    id: 'alpamayo',
    title: 'Alpamayo-R1',
    badge: 'Reasoning-VLA',
    badgeColor: '#00cec9',
    status: '跟踪中',
    statusColor: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    desc: '将 Chain-of-Thought 推理引入自动驾驶决策链，通过慢思考提升复杂场景处理能力。',
    tags: ['R1-style', 'CoT', 'Driving', 'Reasoning'],
    icon: '🧠',
    active: false,
  },
];

function PageHero({ activeProject, setActiveProject }) {
  return (
    <div className="mb-8">
      {/* 大标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">🚗 自动驾驶研究</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">持续追踪</span>
        </div>
        <p className="text-sm text-gray-500">大模型 × 自动驾驶前沿 — VLA、世界模型、推理驾驶的深度研究与实验</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{RESEARCH_PROJECTS.length} 个研究项目</span>
          <span>·</span>
          <span>覆盖 VLA · World Model · Reasoning-AD</span>
        </div>
      </div>

      {/* ───── 区块一：研究项目选择（论文/研究身份） ───── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
          <span className="inline-block w-1 h-3 bg-slate-400 rounded-sm"></span>
          📄 研究项目 · Research Projects
        </span>
        <span className="text-[11px] text-gray-400">选择一个项目查看其技术方案与实验</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {RESEARCH_PROJECTS.map(proj => {
          const isActive = activeProject === proj.id;
          return (
            <button
              key={proj.id}
              onClick={() => setActiveProject(proj.id)}
              className="relative text-left p-4 pl-5 rounded-2xl border-2 transition-all overflow-hidden group"
              style={isActive
                ? { borderColor: proj.badgeColor, background: `linear-gradient(135deg, ${proj.badgeColor}14 0%, ${proj.badgeColor}05 100%)`, boxShadow: `0 4px 16px ${proj.badgeColor}26` }
                : { borderColor: '#e2e8f0', background: '#fafbfc' }}
            >
              {/* 左侧色条 */}
              <span className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: isActive ? proj.badgeColor : '#cbd5e1' }}></span>
              {/* 顶部 PAPER 标识 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold tracking-widest uppercase"
                  style={{ color: isActive ? proj.badgeColor : '#94a3b8' }}>
                  📄 PAPER
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: proj.badgeColor + '18', color: proj.badgeColor, border: `1px solid ${proj.badgeColor}30` }}>
                  {proj.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{proj.icon}</span>
                <span className="text-base font-bold text-gray-900">{proj.title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{proj.desc}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {proj.tags.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white text-gray-500 rounded-md border border-gray-200">{t}</span>
                ))}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ml-auto ${proj.statusColor}`}>{proj.status}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ───── 区块二：技术方案分解（步骤） ───── */}
      {(activeProject === 'driveworld' || activeProject === 'seedad' || activeProject === 'alpamayo') && (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            <span className="inline-block w-1 h-3 bg-slate-400 rounded-sm"></span>
            🧩 技术方案分解 · Pipeline
          </span>
          <span className="text-[11px] text-gray-400">
            {activeProject === 'driveworld'
              ? 'DriveWorld-VLA 三步技术栈'
              : activeProject === 'seedad'
                ? 'Seed-AD 三步技术栈（70B 云端 + 13B 车端）'
                : 'Alpamayo-R1 三步技术栈（CoT × RL 推理驾驶，概要）'}
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent ml-2"></span>
        </div>
      )}

      {/* DriveWorld-VLA 三步骤详情（仅 active 时显示） */}
      {activeProject === 'driveworld' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          {[
            {
              step: '01',
              title: '数据准备 & 处理',
              desc: 'nuScenes（核心）+ DriveLM（语言标注）+ NAVSIM（闭环评估）+ OpenDV-2K（视觉预训练）。nuScenes 6路环视相机 + LiDAR + HD Map，配合 DriveLM 460K 语言标注构建 <视觉, 语言, 动作> 三元组，NAVSIM 提供闭环 RL 奖励信号。',
              icon: '🗄️',
              color: '#6c5ce7',
              tags: ['nuScenes', 'DriveLM', 'NAVSIM', 'OpenDV-2K'],
            },
            {
              step: '02',
              title: '模型架构',
              desc: 'InternViT-6B + PointPillar + MapTR + InternLM2-7B → Unified Projector → 统一隐状态 Z_t → VLA Head（规划）+ World Model Head（Diffusion预测）。',
              icon: '🧠',
              color: '#00cec9',
              tags: ['Unified Latent Z_t', 'Diffusion WM', 'AR VLA Head'],
            },
            {
              step: '03',
              title: '三阶段训练',
              desc: 'Stage1: 视觉-语言预训练(100k) → Stage2: VLA+WM联合训练(150k) → Stage3: 世界模型辅助RL微调(100k)。L2: 3.2→0.42m，FVD: 420→52，碰撞率: 3.8%→1.2%。',
              icon: '📊',
              color: '#fd79a8',
              tags: ['L2: 0.42m', 'FVD: 52', '碰撞率: 1.2%'],
            },
          ].map((item, idx, arr) => (
            <div key={item.step} className="relative rounded-xl border-2 border-dashed p-4 bg-white hover:bg-gray-50/50 transition-colors"
              style={{ borderColor: item.color + '55' }}>
              {/* 大号 STEP 角标 */}
              <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border-2"
                style={{ borderColor: item.color }}>
                <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: item.color }}>STEP {item.step}</span>
              </div>
              {/* 连接箭头（桌面端，非最后一个） */}
              {idx < arr.length - 1 && (
                <div className="hidden sm:flex absolute top-1/2 -right-[14px] -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6m0 0L5 2m3 3L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: item.color + '18', color: item.color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed-AD 三步骤详情 */}
      {activeProject === 'seedad' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          {[
            {
              step: '01',
              title: '数据 & UniSim 2.0 合成',
              desc: 'nuScenes（主，HuggingFace 真实加载）+ OpenDV-2K（2000 小时视觉预训练）+ DriveLM（460K 语言标注）+ nuPlan（闭环评估）+ ★ UniSim 2.0 合成数据工具链（32 种天气/光照组合，每条样本扩增 ×5，补齐长尾场景）。',
              icon: '🗄️',
              color: '#10b981',
              tags: ['nuScenes', 'OpenDV-2K', 'DriveLM', 'UniSim 2.0'],
            },
            {
              step: '02',
              title: '三阶段模型（70B / 13B）',
              desc: '共享骨干 40B（SwinT-Ultra 12B + Cross-Attn×8 + Temporal 28B）→ 想象头 10B（BEV 占用栅格预测）+ 反思头 10B（5 维风险评分）+ 行动头 10B（条件式轨迹生成）。车端蒸馏到 13B + INT4 + KV 共享 + SpecDec v3 → Orin X 45ms。',
              icon: '🧠',
              color: '#00cec9',
              tags: ['70B 云端', '13B 车端', 'Imagination', 'Reflection', 'Action'],
            },
            {
              step: '03',
              title: '三阶段训练（31 天）',
              desc: 'Stage1 共享骨干预训练（2048×H100，21 天，MIM+NFP+Con）→ Stage2 三阶段头联合微调（256×H100，7 天）→ Stage3 蒸馏到 13B 车端（32×H100，3 天）。nuScenes L2(3s)=0.54m，碰撞率 0.11%，FVD=47，全面超越 DriveWorld-VLA。',
              icon: '📊',
              color: '#fd79a8',
              tags: ['L2: 0.54m', '碰撞率: 0.11%', 'FVD: 47', 'Orin X 45ms'],
            },
          ].map((item, idx, arr) => (
            <div key={item.step} className="relative rounded-xl border-2 border-dashed p-4 bg-white hover:bg-gray-50/50 transition-colors"
              style={{ borderColor: item.color + '55' }}>
              {/* 大号 STEP 角标 */}
              <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border-2"
                style={{ borderColor: item.color }}>
                <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: item.color }}>STEP {item.step}</span>
              </div>
              {/* 连接箭头（桌面端，非最后一个） */}
              {idx < arr.length - 1 && (
                <div className="hidden sm:flex absolute top-1/2 -right-[14px] -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6m0 0L5 2m3 3L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: item.color + '18', color: item.color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alpamayo-R1 三步骤详情（精简版，跟踪中） */}
      {activeProject === 'alpamayo' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
            {[
              {
                step: '01',
                title: '数据 & 长尾场景',
                desc: 'NVIDIA DRIVE 内部数据（数千小时真实驾驶）+ CoT 推理链人类标注（为什么减速 / 为什么变道 / 让行逻辑）。重点覆盖长尾与复杂场景：施工路段、紧急车辆、非受控路口、恶劣天气，配合仿真环境做闭环 RL 采样。',
                icon: '🗄️',
                color: '#00cec9',
                tags: ['真实驾驶数据', 'CoT 标注', 'Corner Case', '仿真 RL'],
              },
              {
                step: '02',
                title: '模型架构（R1-style VLM）',
                desc: '多模态 VLM 主干（视觉 Encoder + LLM 解码器）→ 显式 Chain-of-Thought 推理 → 输出驾驶指令（横向/纵向控制 + 轨迹）。R1 范式：先"思考"（列出观察·风险·选项），再"决策"；推理链作为可解释中间产物同时用于训练监督信号。',
                icon: '🧠',
                color: '#0abab5',
                tags: ['VLM 主干', 'Chain-of-Thought', '可解释决策', '控制 + 轨迹'],
              },
              {
                step: '03',
                title: '训练范式（SFT + RL）',
                desc: '第一阶段 SFT：用人工 CoT 链做监督微调，学会"像人类司机一样思考"。第二阶段 RL：用仿真环境 + 规则化奖励（安全/舒适/进度/合规）做 GRPO 风格策略优化，对齐长尾决策。侧重复杂场景处理能力而非刷 nuScenes 点数。',
                icon: '📊',
                color: '#6c5ce7',
                tags: ['SFT on CoT', 'RL in Sim', 'GRPO', '长尾能力'],
              },
            ].map((item, idx, arr) => (
              <div key={item.step} className="relative rounded-xl border-2 border-dashed p-4 bg-white hover:bg-gray-50/50 transition-colors"
                style={{ borderColor: item.color + '55' }}>
                {/* 大号 STEP 角标 */}
                <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border-2"
                  style={{ borderColor: item.color }}>
                  <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: item.color }}>STEP {item.step}</span>
                </div>
                {/* 连接箭头（桌面端，非最后一个） */}
                {idx < arr.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-[14px] -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6m0 0L5 2m3 3L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: item.color + '18', color: item.color }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 研究概要卡（论文 / 核心创新 / 指标 / 现状） */}
          <div className="mt-4 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/40 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧠</span>
              <h3 className="text-sm font-semibold text-gray-800">Alpamayo-R1 · 研究概要</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-200 bg-white text-cyan-600 font-medium ml-1">跟踪中</span>
              <span className="text-[10px] text-gray-400 ml-auto">NVIDIA Research · 2025</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600 leading-relaxed">
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">💡 核心创新</div>
                把 DeepSeek-R1 风格的「显式推理 + RL 后训练」范式迁移到自动驾驶：让端到端模型在输出控制指令之前，先产出一段可解释的思考链，再用仿真环境的稠密奖励做策略优化。相比一步式 VLA，更擅长处理长尾与多步因果场景。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">📈 关键卖点</div>
                <ul className="space-y-1 list-disc list-inside marker:text-cyan-500">
                  <li>可解释：输出推理链，便于事故复盘与安全审计</li>
                  <li>长尾能力：复杂场景通过率显著优于无 CoT 的基线 VLA</li>
                  <li>RL 友好：推理链天然适合 GRPO 等过程奖励训练</li>
                  <li>工程化：目标对齐 NVIDIA DRIVE AGX 车端算力</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">🔍 与 DriveWorld / Seed-AD 的差异</div>
                DriveWorld-VLA 强调统一隐空间 + 世界模型预测；Seed-AD 强调 70B 想象-反思-行动三阶段；Alpamayo-R1 不押注世界模型或超大参数量，而是押注「推理链 × RL」这一 LLM 侧被验证过的 Scaling 路径。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">📌 当前状态</div>
                论文与技术细节尚未完整公开，仅有 NVIDIA DRIVE Labs 的公开演示与博客。本模块将持续跟踪：①论文正式发布 ②开源进展 ③公开 benchmark（nuScenes / NAVSIM / Bench2Drive）数据，届时升级到「深度解读」。
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Seed-AD 子 Tab 区域（与 DriveWorld 平行，独立状态） ────────
const SEEDAD_TABS = [
  { id: 'arch',     label: '架构 & 数据', icon: '🏗️', color: '#10b981',
    desc: '三阶段架构图（想象→反思→行动）· 对比 DriveWorld-VLA · 数据集选型 · 训练配置' },
  { id: 'notebook', label: '论文实践',  icon: '📓', color: '#f39c12',
    desc: '数据下载 → Tokenize → 三阶段模型搭建 → 三阶段训练 → 蒸馏到 13B → 预测可视化' },
];

function SeedAdSection({ seedTab, setSeedTab }) {
  const tab = seedTab || 'arch';
  const setTab = setSeedTab;
  const current = SEEDAD_TABS.find(t => t.id === tab);
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {SEEDAD_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={tab === t.id
              ? { background: '#fff', color: t.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${t.color}33` }
              : { color: '#94a3b8' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">{current?.icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-800">{current?.label}</h2>
          <p className="text-xs text-gray-400">{current?.desc}</p>
        </div>
      </div>

      <div>
        {tab === 'arch'     && <SeedAdArchViz />}
        {tab === 'notebook' && <SeedAdNotebook />}
      </div>

      <div className="mt-10 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-xs text-gray-500 leading-relaxed">
        <span className="font-medium text-emerald-700">🌱 Seed-AD 亮点：</span>
        字节跳动 Seed 团队开源的 <span className="font-mono text-emerald-700">70B VLA 自动驾驶大模型</span>，首次把
        <span className="font-mono text-emerald-700"> 想象-反思-行动</span> 三阶段推理工业级落地。
        nuScenes L2(3s) <span className="font-mono font-bold">0.54m</span> · 碰撞率
        <span className="font-mono font-bold"> 0.11%</span> 成为新 SOTA（超越 VLA-World 0.58m / 0.15%）。
        配套开源完整训练管线、基于 <span className="font-mono">UniSim 2.0</span> 扩展的合成数据工具链，
        以及 Orin X 车端推理 <span className="font-mono font-bold">45ms</span> 延迟的优化实现（INT4 + KV 共享 + SpecDec v3）。
      </div>
    </>
  );
}

// 顶层页签
const TOP_TABS = [
  { id: 'research', label: '论文实践', icon: '🔬', color: '#6c5ce7', desc: 'VLA · 世界模型 · 推理驾驶 · 深度解读与实验' },
  { id: 'dataloop', label: '数据闭环', icon: '🔄', color: '#00cec9', desc: '采集 → 上传 → 处理 → 存储 → 训练 → 部署 → 监控回采 · 全链路闭环架构 + 多模态存储方案' },
];

export default function VlaPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <VlaPageContent />
    </Suspense>
  );
}

function VlaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL 读取状态，提供默认值
  const topTab      = searchParams.get('tab')     || 'research';
  const activeProject = searchParams.get('project') || 'driveworld';
  const activeTab   = searchParams.get('view')    || 'arch';
  const dataloopTab = searchParams.get('dl')      || 'arch';
  const seedTab     = searchParams.get('seed')    || 'arch';

  // 统一更新 URL 的辅助函数
  const setParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setTopTab       = (v) => setParam('tab', v);
  const setActiveProject = (v) => setParam('project', v);
  const setActiveTab    = (v) => setParam('view', v);
  const setDataloopTab  = (v) => setParam('dl', v);
  const setSeedTab      = (v) => setParam('seed', v);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── 顶层页签 ── */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
          {TOP_TABS.map(t => (
            <button key={t.id} onClick={() => setTopTab(t.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={topTab === t.id
                ? { background: '#fff', color: t.color, boxShadow: '0 1px 6px rgba(0,0,0,0.10)', border: `1px solid ${t.color}33` }
                : { color: '#94a3b8' }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── 论文实践 ── */}
        {topTab === 'research' && (
          <>
            <PageHero activeProject={activeProject} setActiveProject={setActiveProject} />

            {/* DriveWorld-VLA 可视化 Tab */}
            {activeProject === 'driveworld' && (
              <>
                <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                  {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                      style={activeTab === tab.id
                        ? { background: '#fff', color: tab.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${tab.color}33` }
                        : { color: '#94a3b8' }}>
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mb-5 flex items-center gap-2">
                  <span className="text-lg">{TABS.find(t => t.id === activeTab)?.icon}</span>
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">{TABS.find(t => t.id === activeTab)?.label}</h2>
                    <p className="text-xs text-gray-400">{TABS.find(t => t.id === activeTab)?.desc}</p>
                  </div>
                </div>
                <div>
                  {activeTab === 'arch' && <ArchViz />}
                  {activeTab === 'notebook' && <Notebook />}
                </div>
                <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
                  <span className="font-medium text-gray-500">📌 说明：</span>
                  本页面基于 <span className="font-mono text-gray-600">DriveWorld-VLA: Unified Latent-Space World Modeling with VLA</span> 论文进行可视化演示。所有数据均为模拟数据，用于展示研究思路。
                  核心创新：<span className="font-mono">Unified Projector</span> 将多模态特征投影到统一隐状态 <span className="font-mono">Z_t</span>，
                  同时驱动 <span className="font-mono">VLA Head</span>（规划）和 <span className="font-mono">World Model Head</span>（Diffusion预测），
                  相比独立 BEV 融合减少 40% 参数量，FVD 提升 88%（420→52）。
                </div>
              </>
            )}

            {/* Seed-AD */}
            {activeProject === 'seedad' && <SeedAdSection seedTab={seedTab} setSeedTab={setSeedTab} />}
          </>
        )}

        {/* ── 数据闭环 ── */}
        {topTab === 'dataloop' && (
          <div>
            {/* 页面标题 */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">🔄 自动驾驶数据闭环</h1>
              <p className="text-sm text-gray-500">采集 → 上传 → 处理 → 存储 → 训练 → 部署 → 监控回采 · 全链路闭环架构与多模态存储方案</p>
            </div>

            {/* 二级目录 */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
              {[
                { id: 'arch',    label: '闭环架构',   icon: '🏗️', color: '#6c5ce7' },
                { id: 'storage', label: '存储方案',   icon: '🗄️', color: '#00cec9' },
              ].map(t => (
                <button key={t.id} onClick={() => setDataloopTab(t.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={dataloopTab === t.id
                    ? { background: '#fff', color: t.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${t.color}33` }
                    : { color: '#94a3b8' }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {dataloopTab === 'arch' && <DataLoop />}
            {dataloopTab === 'storage' && <AdStorageTab />}
          </div>
        )}

      </div>
      <Footer />
    </>
  );
}
