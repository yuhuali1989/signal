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
    badge: '10B · NVIDIA Research',
    badgeColor: '#00cec9',
    status: '跟踪中',
    statusColor: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    desc: 'NVIDIA Research 10B 参数 Reasoning-VLA，CES 2026 首次公开演示。引入 Chain-of-Thought 推理链，慢思考后输出控制指令，目标对齐 DRIVE AGX 车端算力。',
    tags: ['10B', 'R1-style', 'CoT', 'NVIDIA DRIVE AGX'],
    icon: '🧠',
    active: false,
  },
  {
    id: 'unidrivevla',
    title: 'UniDriveVLA',
    badge: 'Unified · April 2026',
    badgeColor: '#f59e0b',
    status: '新论文',
    statusColor: 'bg-amber-50 text-amber-600 border-amber-100',
    desc: '2026 年 4 月 arXiv 新作，统一框架同时支持 nuScenes 和 Bench2Drive 双基准，实现多场景 SOTA。简化现有多头架构，单一解码器同时输出轨迹与世界预测。',
    tags: ['arXiv 2604.02190', 'nuScenes', 'Bench2Drive', 'SOTA'],
    icon: '🚀',
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
          <span>·</span>
          <span className="text-amber-500 font-medium">🆕 UniDriveVLA April 2026</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
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
      {(activeProject === 'driveworld' || activeProject === 'seedad' || activeProject === 'alpamayo' || activeProject === 'unidrivevla') && (
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
                : activeProject === 'unidrivevla'
                  ? 'UniDriveVLA 三步技术栈（统一框架 · nuScenes + Bench2Drive 双 SOTA）'
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
              <span className="text-[10px] text-gray-400 ml-auto">NVIDIA Research · CES 2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600 leading-relaxed">
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">💡 核心创新</div>
                把 DeepSeek-R1 风格的「显式推理 + RL 后训练」范式迁移到自动驾驶：10B 参数 VLA 在输出控制指令之前，先产出可解释思考链，再用仿真环境的稠密奖励做策略优化。CES 2026 首次公开演示，目标对齐 NVIDIA DRIVE AGX 车端算力。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">📈 关键卖点</div>
                <ul className="space-y-1 list-disc list-inside marker:text-cyan-500">
                  <li>10B 参数，车端推理友好</li>
                  <li>可解释：输出推理链，便于事故复盘与安全审计</li>
                  <li>长尾能力：复杂场景通过率显著优于无 CoT 的基线 VLA</li>
                  <li>RL 友好：推理链天然适合 GRPO 等过程奖励训练</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">🔍 与 DriveWorld / Seed-AD 的差异</div>
                DriveWorld-VLA 强调统一隐空间 + 世界模型预测；Seed-AD 强调 70B 想象-反思-行动三阶段；Alpamayo-R1 不押注世界模型或超大参数量，而是押注「推理链 × RL」这一 LLM 侧被验证过的 Scaling 路径。参数量仅 10B 但在复杂场景决策质量上具备竞争力。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-cyan-600 mb-1">📌 当前状态</div>
                论文与技术细节尚未完整公开，仅有 NVIDIA DRIVE Labs 的 CES 2026 公开演示。参考：<a href="https://www.slashgear.com/news/nvidia-alpamayo-r1" target="_blank" rel="noopener" className="text-cyan-600 underline">SlashGear 报道</a>。本模块持续跟踪：①论文正式发布 ②开源进展 ③公开 benchmark 数据，届时升级到「深度解读」。
              </div>
            </div>
          </div>
        </>
      )}

      {/* UniDriveVLA 三步骤详情（精简版，新论文） */}
      {activeProject === 'unidrivevla' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
            {[
              {
                step: '01',
                title: '数据准备（双基准）',
                desc: 'nuScenes（6路环视 + LiDAR，核心 benchmark）+ Bench2Drive（闭环仿真评估，Town系列场景）+ DriveLM（460K 语言标注）。统一数据 loader 同时支持两个 benchmark，避免分叉维护。',
                icon: '🗄️',
                color: '#f59e0b',
                tags: ['nuScenes', 'Bench2Drive', 'DriveLM', '双基准统一'],
              },
              {
                step: '02',
                title: '统一模型架构',
                desc: '单一视觉-语言主干（VLM backbone）→ Unified Decoder 同时输出：① 轨迹（控制指令）② 场景占用预测（世界建模）。去掉多头切换的复杂设计，端到端单次前向推理完成规划+预测。',
                icon: '🧠',
                color: '#d97706',
                tags: ['Unified Decoder', 'VLM Backbone', '轨迹 + 占用预测', '单次前向'],
              },
              {
                step: '03',
                title: '双基准 SOTA 结果',
                desc: '在 nuScenes 开环评估和 Bench2Drive 闭环评估双项均达 SOTA。统一框架避免了「针对单一 benchmark 过拟合」的问题，泛化性更强。arXiv 2604.02190，2026 年 4 月发布。',
                icon: '📊',
                color: '#b45309',
                tags: ['nuScenes SOTA', 'Bench2Drive SOTA', 'arXiv 2604.02190', 'Apr 2026'],
              },
            ].map((item, idx, arr) => (
              <div key={item.step} className="relative rounded-xl border-2 border-dashed p-4 bg-white hover:bg-gray-50/50 transition-colors"
                style={{ borderColor: item.color + '55' }}>
                <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border-2"
                  style={{ borderColor: item.color }}>
                  <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: item.color }}>STEP {item.step}</span>
                </div>
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

          {/* 研究概要卡 */}
          <div className="mt-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚀</span>
              <h3 className="text-sm font-semibold text-gray-800">UniDriveVLA · 研究概要</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-200 bg-white text-amber-600 font-medium ml-1">新论文</span>
              <span className="text-[10px] text-gray-400 ml-auto">arXiv 2604.02190 · April 2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600 leading-relaxed">
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-amber-600 mb-1">💡 核心创新</div>
                提出统一驾驶 VLA 框架，解决现有方案「只刷 nuScenes 或只刷 Bench2Drive」的局限。单一模型架构在两大权威 benchmark 上同时实现 SOTA，证明统一框架的泛化能力优于专项优化方案。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-amber-600 mb-1">📊 关键结果</div>
                <ul className="space-y-1 list-disc list-inside marker:text-amber-500">
                  <li>nuScenes 开环评估：新 SOTA</li>
                  <li>Bench2Drive 闭环评估：新 SOTA</li>
                  <li>统一解码器：轨迹 + 世界预测单次前向</li>
                  <li>消融实验证明统一框架优于双头分离方案</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-amber-600 mb-1">🔍 与现有方案的对比</div>
                DriveWorld-VLA 和 Seed-AD 均主要在 nuScenes 上评估；Alpamayo-R1 无公开 benchmark 数据；UniDriveVLA 是首个在两大主流 benchmark 上均达 SOTA 的统一框架，具有更强的实用价值。
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="text-[10px] font-bold tracking-wider text-amber-600 mb-1">📌 论文信息</div>
                arXiv: <a href="https://arxiv.org/abs/2604.02190" target="_blank" rel="noopener" className="text-amber-600 underline font-mono">2604.02190</a>，发布于 2026 年 4 月。论文暂未附带开源代码，后续将跟踪代码发布与 benchmark 对比数据。
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
  { id: 'os-nav',   label: '车载 OS & 导航', icon: '🖥️', color: '#e17055', desc: '自动驾驶操作系统（QNX / Linux / RTOS）· 导航如何深度影响感知-规划-决策 · HD Map vs Mapless' },
];

export default function VlaPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <VlaPageContent />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════════════
   车载 OS & 导航（新增 Tab）
   ═══════════════════════════════════════════════════════════ */
function OsNavSection() {
  const [subTab, setSubTab] = useState('os');

  const SUB_TABS = [
    { id: 'os',       label: '车载 OS',       icon: '🖥️', color: '#e17055' },
    { id: 'nav',      label: '导航 × 自动驾驶', icon: '🗺️', color: '#6c5ce7' },
    { id: 'hdmap',    label: 'HD Map vs Mapless', icon: '🛰️', color: '#00cec9' },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">🖥️ 车载 OS & 导航</h1>
        <p className="text-sm text-gray-500">
          自动驾驶操作系统全景（QNX / Linux / RTOS / Android Automotive）· 导航如何深度影响感知-规划-决策 · HD Map vs Mapless 之争
        </p>
      </div>

      {/* 二级 Tab */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={subTab === t.id
              ? { background: '#fff', color: t.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${t.color}33` }
              : { color: '#94a3b8' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'os'    && <OsSubSection />}
      {subTab === 'nav'   && <NavSubSection />}
      {subTab === 'hdmap' && <HdMapSubSection />}
    </div>
  );
}

/* ── 车载 OS 子板块 ── */
function OsSubSection() {
  const osList = [
    {
      name: 'QNX Neutrino RTOS',
      vendor: 'BlackBerry',
      color: '#e17055',
      type: '微内核 RTOS',
      share: '~75% 量产车',
      cert: 'ISO 26262 ASIL-D · IEC 61508 SIL-3',
      arch: '微内核架构：内核仅 ~64KB，驱动/文件系统/网络栈全部运行在用户态进程中。单个驱动崩溃不影响内核和其他进程。',
      strengths: ['确定性实时调度（硬实时 <10μs 中断延迟）', '功能安全认证最完整（ASIL-D）', '量产验证最成熟，OEM 信任度最高', '支持 POSIX API，移植 Linux 应用相对容易'],
      weaknesses: ['闭源商业授权，License 费用高', '生态不如 Linux 丰富，AI/ML 框架支持有限', '不适合跑大模型推理（缺少 GPU 驱动生态）'],
      usecase: '安全域控制器（制动/转向/气囊）、ADAS 实时控制层、仪表盘',
      users: 'BMW · Mercedes · Audi · Toyota · 蔚来（安全域）',
    },
    {
      name: 'Linux（含 AGL / AUTOSAR AP）',
      vendor: '开源社区 / 各 OEM',
      color: '#3fb950',
      type: '宏内核 · 通用 OS',
      share: '~60% 智能座舱 + ~40% 自动驾驶计算域',
      cert: 'ELISA 项目推进 ASIL-B 认证 · 尚无 ASIL-D',
      arch: '宏内核架构：驱动运行在内核态，性能高但隔离性弱。通过 PREEMPT_RT 补丁实现软实时（~100μs 级）。Yocto / Buildroot 定制裁剪。',
      strengths: ['开源免费，生态最丰富（CUDA / TensorRT / ROS2 全支持）', '适合跑大模型推理（GPU/NPU 驱动完善）', 'PREEMPT_RT 可达软实时', '社区活跃，迭代快'],
      weaknesses: ['宏内核隔离性差，单驱动崩溃可能导致内核 panic', '功能安全认证困难（代码量 >3000 万行）', '实时性不如 QNX（软实时 vs 硬实时）'],
      usecase: '自动驾驶计算域（感知/规划/预测）、智能座舱、OTA 服务',
      users: 'Tesla（自研 Linux）· Waymo · 小鹏 · 理想 · 华为 MDC',
    },
    {
      name: 'Android Automotive OS (AAOS)',
      vendor: 'Google',
      color: '#6c5ce7',
      type: '基于 Linux 的车载 Android',
      share: '~30% 智能座舱（快速增长）',
      cert: '无功能安全认证（仅用于座舱域）',
      arch: '基于 Android 的车载定制版：Vehicle HAL 抽象车辆硬件、Car Service 管理车辆状态、支持 Google Play 车载应用生态。与手机 Android Auto 不同——AAOS 直接运行在车机上。',
      strengths: ['应用生态最丰富（Google Maps / Spotify / 微信车载版）', '开发者友好（Java/Kotlin + Android SDK）', 'Google 持续投入，OEM 接入成本低', '支持多屏（仪表+中控+后排）'],
      weaknesses: ['不适合安全关键域（无 ASIL 认证）', '启动慢（冷启动 ~8-15s）', 'Google 依赖（GMS 服务在中国受限）', '内存占用大（>2GB RAM）'],
      usecase: '智能座舱（导航/娱乐/语音助手/应用商店）',
      users: 'Volvo/Polestar · GM · Ford · 吉利（Flyme Auto 基于 AAOS）',
    },
    {
      name: '自研 RTOS / 混合 OS',
      vendor: '各 OEM / Tier-1',
      color: '#ffa657',
      type: '定制实时操作系统',
      share: '新势力 + 华为',
      cert: '视具体实现',
      arch: '混合架构：安全域用微内核 RTOS（自研或 QNX），智能域用 Linux，通过 Hypervisor（如 ACRN / Xen / 自研）隔离。典型：华为 HarmonyOS 车机版（鸿蒙微内核 + Linux 容器）。',
      strengths: ['完全自主可控，不受供应商制约', '可针对自家芯片深度优化', '混合架构兼顾安全性和生态'],
      weaknesses: ['研发成本极高（需要数百人团队）', '生态从零建设', '功能安全认证周期长（2-3 年）'],
      usecase: '全栈自研的 OEM（安全域 + 智能域 + 座舱域统一管理）',
      users: 'Tesla（自研 Linux + 自研 RTOS）· 华为（鸿蒙）· 小鹏（自研 XOS）· 蔚来（自研 SkyOS）',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 概述 */}
      <div className="bg-gradient-to-br from-red-50/40 to-amber-50/40 rounded-2xl border border-red-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🖥️ 自动驾驶操作系统全景</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          自动驾驶汽车通常有<span className="text-gray-700 font-medium">3-4 个域控制器</span>，每个域可能运行不同的 OS：
          <span className="text-gray-700 font-medium">安全域</span>（制动/转向）用 QNX 或自研 RTOS，
          <span className="text-gray-700 font-medium">智能驾驶域</span>（感知/规划）用 Linux，
          <span className="text-gray-700 font-medium">座舱域</span>（导航/娱乐）用 AAOS 或鸿蒙。
          它们通过<span className="text-gray-700 font-medium"> Hypervisor + 以太网 + SOME/IP</span> 协同工作。
        </p>
      </div>

      {/* 域控架构图 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🏗️ 典型域控架构（E/E 架构）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { domain: '安全域', os: 'QNX / RTOS', chip: 'MCU (TC397)', func: '制动 · 转向 · 气囊 · ESP', color: '#e17055', level: 'ASIL-D' },
            { domain: '智能驾驶域', os: 'Linux', chip: 'Orin X / MDC 810', func: '感知 · 规划 · 预测 · 控制', color: '#3fb950', level: 'ASIL-B' },
            { domain: '座舱域', os: 'AAOS / 鸿蒙', chip: '8295P / 8155', func: '导航 · 娱乐 · 语音 · HUD', color: '#6c5ce7', level: 'QM' },
            { domain: '车身域', os: 'RTOS', chip: 'MCU', func: '车灯 · 车窗 · 空调 · 门锁', color: '#ffa657', level: 'ASIL-A' },
          ].map(d => (
            <div key={d.domain} className="rounded-xl border p-3 text-center" style={{ borderColor: d.color + '33', background: d.color + '04' }}>
              <div className="text-xs font-bold mb-1" style={{ color: d.color }}>{d.domain}</div>
              <div className="text-[10px] font-mono text-gray-700 mb-1">{d.os}</div>
              <div className="text-[9px] text-gray-400 mb-1">{d.chip}</div>
              <div className="text-[10px] text-gray-500 leading-relaxed">{d.func}</div>
              <div className="mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full inline-block" style={{ background: d.color + '15', color: d.color }}>{d.level}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center italic">
          域间通信：车载以太网（1Gbps / 10Gbps）+ SOME/IP 服务发现 + DDS（自动驾驶域内）
        </p>
      </div>

      {/* 四大 OS 详细卡片 */}
      {osList.map(os => (
        <div key={os.name} className="bg-white rounded-2xl border p-5" style={{ borderColor: os.color + '33' }}>
          <div className="flex items-baseline justify-between mb-2">
            <h4 className="text-sm font-semibold" style={{ color: os.color }}>{os.name}</h4>
            <span className="text-[10px] text-gray-400">{os.vendor}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: os.color + '12', color: os.color }}>{os.type}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">市占：{os.share}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{os.cert}</span>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">架构</div>
              <div className="text-gray-700">{os.arch}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border" style={{ borderColor: os.color + '22', background: os.color + '06' }}>
                <div className="text-[10px] font-medium mb-1" style={{ color: os.color }}>✅ 优势</div>
                <ul className="space-y-0.5">{os.strengths.map((s, i) => <li key={i} className="text-gray-600 text-[12px]">▸ {s}</li>)}</ul>
              </div>
              <div className="p-3 rounded-lg border border-red-100 bg-red-50/40">
                <div className="text-[10px] font-medium mb-1 text-red-500">⚠️ 局限</div>
                <ul className="space-y-0.5">{os.weaknesses.map((w, i) => <li key={i} className="text-gray-600 text-[12px]">▸ {w}</li>)}</ul>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🎯 典型场景：</span>
              <span className="text-gray-600">{os.usecase}</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🏭 代表用户：</span>
              <span className="text-gray-600 font-mono">{os.users}</span>
            </div>
          </div>
        </div>
      ))}

      {/* OS 对比表 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚖️ 四大车载 OS 横向对比</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">维度</th>
              <th className="py-2 px-3 font-medium">QNX</th>
              <th className="py-2 px-3 font-medium">Linux</th>
              <th className="py-2 px-3 font-medium">AAOS</th>
              <th className="py-2 px-3 font-medium">自研 RTOS</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {[
              ['内核类型',     '微内核',           '宏内核',           '宏内核（Android）', '微内核 / 混合'],
              ['实时性',       '硬实时 <10μs',     '软实时 ~100μs',    '非实时',           '硬实时（视实现）'],
              ['功能安全',     'ASIL-D ✅',        'ASIL-B（推进中）', '无',               '视认证进度'],
              ['AI/ML 生态',   '弱',               '最强（CUDA/TRT）', '中（Android ML）', '视集成度'],
              ['应用生态',     '弱',               '中',               '最强（Play Store）', '从零建设'],
              ['License',     '商业闭源',          '开源免费',         '开源（GMS 收费）',  '自主可控'],
              ['启动速度',     '<1s',              '~3-5s',            '~8-15s',           '<1s'],
              ['适用域',       '安全域',           '智驾域',           '座舱域',           '全域（混合）'],
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-gray-700">{row[0]}</td>
                {row.slice(1).map((c, j) => <td key={j} className="py-2 px-3">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OS 与大模型的关系 */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5">
        <h3 className="text-base font-semibold text-amber-700 mb-3">🧠 OS 与大模型推理的关系</h3>
        <p className="text-[12.5px] text-gray-600 leading-relaxed mb-3">
          VLA 大模型（如 Seed-AD 13B）需要在车端实时推理，这对 OS 提出了特殊要求：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { k: 'GPU/NPU 驱动', v: 'TensorRT / CUDA 只在 Linux 上有完整支持；QNX 上 NVIDIA 提供有限的 DriveOS 驱动，功能受限', color: '#3fb950' },
            { k: '内存管理', v: '大模型需要 >8GB 显存 + 大页内存（Huge Pages）+ 零拷贝 DMA，Linux 的 mmap / io_uring 生态更成熟', color: '#6c5ce7' },
            { k: '实时性保障', v: '模型推理 ~45ms 需要确定性调度；Linux PREEMPT_RT + CPU 亲和性 + SCHED_FIFO 可达到要求', color: '#e17055' },
          ].map(x => (
            <div key={x.k} className="p-3 rounded-xl border text-[12px]" style={{ borderColor: x.color + '33' }}>
              <div className="font-semibold text-gray-800 mb-1">{x.k}</div>
              <div className="text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          结论：大模型推理几乎只能跑在 Linux 上。安全关键的控制指令由 QNX/RTOS 执行，两者通过 Hypervisor 隔离。
        </p>
      </div>
    </div>
  );
}

/* ── 导航 × 自动驾驶 子板块 ── */
function NavSubSection() {
  const layers = [
    {
      title: '🗺️ 导航在自动驾驶中的角色演变',
      color: '#6c5ce7',
      content: [
        { era: '传统导航（~2015）', desc: '纯路径规划：A* / Dijkstra 在道路图上搜索最短/最快路径 → 转弯语音提示。与车辆控制完全解耦，只是"建议"。', impact: '对自动驾驶无直接影响——人类司机是执行者。' },
        { era: 'ADAS 时代（2015-2020）', desc: '导航开始与 ADAS 耦合：前方弯道 → 自适应巡航提前减速；高速出口 → 提前变道建议。导航提供"前瞻信息"。', impact: '导航成为 ADAS 的"预知眼"——提前 500m-2km 告知路况，辅助纵向控制。' },
        { era: '高精地图时代（2020-2024）', desc: 'HD Map（厘米级精度）成为自动驾驶的核心依赖：车道线、红绿灯位置、限速、坡度、曲率全部预编码。导航 = 高精地图 + 路径规划。', impact: '导航从"建议"变成"基础设施"——没有 HD Map，L3+ 自动驾驶几乎无法工作。' },
        { era: 'Mapless / 轻地图时代（2024-）', desc: 'Tesla / 华为 / 小鹏开始探索"去高精地图"：用实时感知（BEV + Transformer）替代预编码地图。导航退回到"粗粒度路径引导"。', impact: '导航的角色被重新定义——不再提供精确车道级信息，而是提供"去哪里"的全局意图。' },
      ],
    },
  ];

  const impacts = [
    {
      module: '感知（Perception）',
      icon: '👁️',
      color: '#e17055',
      how: '导航告诉感知模块"前方 200m 有路口"→ 感知提前切换到"路口模式"（增加行人/非机动车检测权重）；HD Map 提供先验车道线，感知只需做"验证"而非"发现"。',
      example: '特斯拉 FSD v12 去掉 HD Map 后，感知模块需要自己"发现"车道线，计算量增加 ~30%，但泛化性更强。',
      tradeoff: 'HD Map 降低感知难度但增加维护成本；Mapless 增加感知难度但消除地图依赖。',
    },
    {
      module: '预测（Prediction）',
      icon: '🔮',
      color: '#a29bfe',
      how: '导航提供路口拓扑 → 预测模块知道其他车辆的"可能意图"（直行/左转/右转）→ 大幅缩小预测搜索空间。没有地图信息，预测模块需要从纯视觉推断意图。',
      example: 'Waymo 的 MultiPath++ 模型：输入包含 HD Map 的车道中心线，预测精度比无地图版本高 40%。',
      tradeoff: '地图信息是预测的"强先验"，但过度依赖会导致地图错误时预测完全失效（如施工改道）。',
    },
    {
      module: '规划（Planning）',
      icon: '📐',
      color: '#3fb950',
      how: '导航提供全局路径（A→B 的道路序列）→ 规划模块在此基础上做局部规划（车道选择/超车/避障）。全局路径是规划的"骨架"，局部规划是"肌肉"。',
      example: '没有导航的全局路径，规划模块不知道该在哪个路口转弯——这是最基本的依赖。即使 Mapless 方案，也需要导航级别的路径引导。',
      tradeoff: '全局规划依赖导航是刚需；但车道级精细规划正在从"地图驱动"转向"感知驱动"。',
    },
    {
      module: '决策（Decision Making）',
      icon: '🧠',
      color: '#6c5ce7',
      how: '导航信息影响高层决策：距离目的地 500m → 开始寻找停车位；高速出口 2km → 开始向右变道。VLA 模型中，导航指令作为"语言 prompt"输入。',
      example: 'Seed-AD 的"行动头"接收导航指令（"前方 300m 右转"）作为条件输入，生成条件式轨迹。',
      tradeoff: '导航指令的粒度很关键——太粗（"向东"）无法执行，太细（"在第 3 车道保持 2.3m 偏移"）则过度依赖地图精度。',
    },
    {
      module: '控制（Control）',
      icon: '🎮',
      color: '#fd79a8',
      how: '导航间接影响控制：前方弯道曲率 → 提前降速 + 预转向。HD Map 提供精确曲率，控制器可以做前馈补偿；Mapless 则依赖实时感知估计曲率。',
      example: '高精地图提供前方 200m 的曲率序列 → MPC 控制器做前馈 → 过弯更平滑、乘客更舒适。',
      tradeoff: '前馈控制依赖地图精度；地图误差 >10cm 时前馈反而有害，需要回退到纯反馈控制。',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 角色演变 */}
      {layers.map(l => (
        <div key={l.title} className="bg-white rounded-2xl border p-5" style={{ borderColor: l.color + '33' }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: l.color }}>{l.title}</h3>
          <div className="space-y-3">
            {l.content.map(c => (
              <div key={c.era} className="rounded-xl border border-gray-100 p-3">
                <div className="text-[12px] font-semibold text-gray-800 mb-1">{c.era}</div>
                <div className="text-[12px] text-gray-600 leading-relaxed mb-1">{c.desc}</div>
                <div className="text-[11px] text-gray-500 italic">💡 对自动驾驶的影响：{c.impact}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 导航对 5 大模块的影响 */}
      <div className="bg-gradient-to-br from-purple-50/40 to-green-50/40 rounded-2xl border border-purple-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🔗 导航如何影响自动驾驶的 5 大模块</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          导航信息（全局路径 + 地图先验）渗透到自动驾驶的<span className="text-gray-700 font-medium">每一个环节</span>——
          从感知的注意力分配，到预测的搜索空间，到规划的全局骨架，到决策的意图理解，再到控制的前馈补偿。
        </p>
      </div>

      {impacts.map(m => (
        <div key={m.module} className="bg-white rounded-2xl border p-5" style={{ borderColor: m.color + '33' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{m.icon}</span>
            <h4 className="text-sm font-semibold" style={{ color: m.color }}>{m.module}</h4>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🔧 导航如何影响：</span>
              <span className="text-gray-700">{m.how}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-[10px] text-gray-400 mb-0.5">📌 实例</div>
              <div className="text-[12px] text-gray-700">{m.example}</div>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">⚖️ 权衡：</span>
              <span className="text-gray-600 italic">{m.tradeoff}</span>
            </div>
          </div>
        </div>
      ))}

      {/* 导航数据流图 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">📊 导航信息在自动驾驶 Pipeline 中的数据流</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
          {[
            { label: '用户设定目的地', color: '#6c5ce7' },
            { label: '→', color: '#94a3b8' },
            { label: '全局路径规划\n(A* on Road Graph)', color: '#6c5ce7' },
            { label: '→', color: '#94a3b8' },
            { label: '路径 + 地图先验\n下发给各模块', color: '#00cec9' },
            { label: '→', color: '#94a3b8' },
            { label: '感知：注意力引导\n预测：意图约束\n规划：全局骨架\n决策：意图理解\n控制：前馈曲率', color: '#3fb950' },
            { label: '→', color: '#94a3b8' },
            { label: '车辆执行\n(转向/油门/制动)', color: '#e17055' },
          ].map((item, i) => (
            <div key={i} className={item.label === '→' ? 'text-gray-400 text-lg' : 'px-3 py-2 rounded-xl border text-center whitespace-pre-line'}
              style={item.label !== '→' ? { borderColor: item.color + '33', background: item.color + '06', color: item.color } : {}}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── HD Map vs Mapless 子板块 ── */
function HdMapSubSection() {
  const comparison = [
    { dim: '地图精度',     hdmap: '厘米级（车道线/红绿灯/限速牌精确位置）', mapless: '无预编码地图，实时感知生成', winner: 'HD Map' },
    { dim: '维护成本',     hdmap: '极高（需要采集车队持续更新，每公里 ¥1-5 万）', mapless: '几乎为零（不依赖预制地图）', winner: 'Mapless' },
    { dim: '覆盖范围',     hdmap: '有限（仅覆盖已采集区域，中国 ~30 万公里高速+城市）', mapless: '理论上无限（有摄像头就能跑）', winner: 'Mapless' },
    { dim: '感知难度',     hdmap: '低（地图提供先验，感知只需验证）', mapless: '高（感知需要从零发现车道线/拓扑）', winner: 'HD Map' },
    { dim: '泛化能力',     hdmap: '弱（施工/改道/新路段地图失效）', mapless: '强（实时感知适应任何场景）', winner: 'Mapless' },
    { dim: '规划质量',     hdmap: '高（精确车道级规划）', mapless: '中（依赖感知精度，可能抖动）', winner: 'HD Map' },
    { dim: '法规要求',     hdmap: '中国：高精地图需甲级测绘资质（仅 ~20 家）', mapless: '无地图资质限制', winner: 'Mapless' },
    { dim: '量产难度',     hdmap: '高（地图更新延迟 → 安全风险）', mapless: '中（模型泛化性需要大量数据验证）', winner: '平手' },
    { dim: '代表方案',     hdmap: 'Waymo · Mobileye · 百度 Apollo', mapless: 'Tesla FSD v12 · 华为 ADS 3.0 · 小鹏 XNGP', winner: '—' },
  ];

  const timeline = [
    { year: '2018-2020', event: 'HD Map 黄金期', desc: 'Waymo / 百度 / Mobileye 全面依赖高精地图，被视为 L4 的"必需品"', color: '#6c5ce7' },
    { year: '2021',      event: 'Tesla 去 HD Map', desc: 'Elon Musk 宣布 FSD 不使用高精地图，引发行业争议', color: '#e17055' },
    { year: '2022',      event: '华为跟进', desc: '华为 ADS 2.0 开始"轻地图"方案，用 BEV + Transformer 替代部分 HD Map 依赖', color: '#ffa657' },
    { year: '2023',      event: '中国政策收紧', desc: '高精地图测绘资质审查趋严，倒逼国内车企加速"去图化"', color: '#fd79a8' },
    { year: '2024',      event: '轻地图成主流', desc: '小鹏 XNGP / 理想 AD Max / 蔚来 NOP+ 均转向"轻地图"或"无图"方案', color: '#3fb950' },
    { year: '2025-2026', event: 'VLA + 导航融合', desc: 'VLA 模型（Seed-AD / DriveWorld）将导航指令作为语言 prompt 输入，地图信息被"内化"到模型中', color: '#00cec9' },
  ];

  return (
    <div className="space-y-4">
      {/* 概述 */}
      <div className="bg-gradient-to-br from-cyan-50/40 to-purple-50/40 rounded-2xl border border-cyan-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🛰️ HD Map vs Mapless：自动驾驶最大的路线之争</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          <span className="text-gray-700 font-medium">高精地图派</span>认为厘米级先验是安全的基石；
          <span className="text-gray-700 font-medium">去图派</span>认为实时感知才是终极方案。
          2024 年后，行业共识逐渐收敛到<span className="text-gray-700 font-medium">"轻地图"</span>——
          保留导航级路径引导（SD Map），但不依赖车道级高精地图（HD Map）。
        </p>
      </div>

      {/* 对比表 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚖️ 9 维度对比</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">维度</th>
              <th className="py-2 pr-3 font-medium">HD Map 方案</th>
              <th className="py-2 pr-3 font-medium">Mapless / 轻地图</th>
              <th className="py-2 font-medium">优势方</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((r, i) => (
              <tr key={r.dim} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-medium">{r.dim}</td>
                <td className="py-2 pr-3 text-gray-600">{r.hdmap}</td>
                <td className="py-2 pr-3 text-gray-600">{r.mapless}</td>
                <td className="py-2 text-gray-700 font-semibold">{r.winner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 时间线 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">📅 HD Map → Mapless 演进时间线</h3>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#6c5ce7] via-[#e17055] to-[#00cec9]" />
          <div className="space-y-4">
            {timeline.map(e => (
              <div key={e.year} className="relative">
                <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: e.color }} />
                <div className="flex items-baseline gap-3 mb-0.5">
                  <span className="text-xs font-mono font-bold" style={{ color: e.color }}>{e.year}</span>
                  <span className="text-sm font-semibold text-gray-800">{e.event}</span>
                </div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 三层地图体系 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🗂️ 三层地图体系（当前行业共识）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { level: 'SD Map（标准地图）', precision: '米级', source: '导航地图（高德/百度/Google Maps）', role: '全局路径规划 + 粗粒度道路拓扑', status: '✅ 所有方案都需要', color: '#3fb950' },
            { level: 'LD Map（轻量地图）', precision: '分米级', source: '众包采集（量产车回传）', role: '车道级引导 + 限速/坡度/曲率', status: '🟡 轻地图方案使用', color: '#ffa657' },
            { level: 'HD Map（高精地图）', precision: '厘米级', source: '专业采集车 + 人工标注', role: '精确车道线/红绿灯/路沿/停车位', status: '🔴 逐步被替代', color: '#e17055' },
          ].map(m => (
            <div key={m.level} className="rounded-xl border p-4" style={{ borderColor: m.color + '33', background: m.color + '04' }}>
              <div className="text-xs font-bold mb-1" style={{ color: m.color }}>{m.level}</div>
              <div className="text-[10px] text-gray-400 mb-2">精度：{m.precision} · 来源：{m.source}</div>
              <div className="text-[12px] text-gray-600 leading-relaxed mb-2">{m.role}</div>
              <div className="text-[10px] font-medium" style={{ color: m.color }}>{m.status}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          趋势：HD Map → LD Map（众包）→ SD Map + 实时感知。导航（SD Map）是不可替代的底层——即使最激进的 Mapless 方案也需要知道"去哪里"。
        </p>
      </div>

      {/* VLA 中导航的新角色 */}
      <div className="bg-white rounded-2xl border border-cyan-100 p-5">
        <h3 className="text-base font-semibold text-cyan-700 mb-3">🤖 VLA 时代：导航的新角色</h3>
        <p className="text-[12.5px] text-gray-600 leading-relaxed mb-3">
          在 VLA（Vision-Language-Action）模型中，导航信息以<span className="text-gray-800 font-medium">自然语言指令</span>的形式输入模型：
        </p>
        <div className="space-y-2">
          {[
            { prompt: '"前方 300m 路口右转，进入人民路"', effect: '行动头生成右转轨迹，感知模块增加路口区域注意力权重', model: 'Seed-AD / DriveWorld-VLA' },
            { prompt: '"沿当前道路直行 2km，注意前方施工"', effect: '预测模块降低前方车辆变道概率，规划模块预留避障空间', model: 'Alpamayo-R1（CoT 推理）' },
            { prompt: '"目的地在右侧 50m，寻找停车位"', effect: '决策模块切换到"泊车模式"，感知模块激活车位检测', model: '通用 VLA' },
          ].map(x => (
            <div key={x.prompt} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-72 flex-shrink-0">
                <div className="text-[10px] text-gray-400 mb-0.5">导航指令（语言 prompt）</div>
                <code className="text-[12px] text-cyan-700 font-mono">{x.prompt}</code>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 mb-0.5">模型响应</div>
                <div className="text-[12px] text-gray-600">{x.effect}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">适用：{x.model}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          核心洞察：在 VLA 时代，导航从"提供精确坐标"转变为"提供语义意图"——模型自己理解"右转"意味着什么，而不需要地图告诉它车道线在哪里。
        </p>
      </div>
    </div>
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

            {/* ── 行业动态速递（2026 年 4-5 月） ── */}
            <div className="mt-8 rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50/30 to-slate-50/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">📡</span>
                <h3 className="text-sm font-semibold text-gray-800">行业动态速递</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">2026 年 4–5 月</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    cat: '🌍 世界模型',
                    catColor: '#6c5ce7',
                    items: [
                      { title: 'Wayve 完成 86 亿美元 D 轮', date: '2026-04-22', desc: 'NVIDIA + Microsoft + Uber 领投，GAIA-2 世界模型将加速在量产车上的商业化部署。', link: null },
                      { title: 'Pony.ai 世界模型 2.0 发布', date: '2026-04-27', desc: '相比上一代训练成本降低 40–50%，已在北京/深圳/硅谷全量部署，用于自动标注与场景生成。', link: null },
                      { title: 'NVIDIA Cosmos 3 + GR00T N2 发布', date: '2026-04', desc: 'Cosmos 3 物理仿真世界模型更新，GR00T N2 机器人基础模型同步发布，支持具身智能闭环训练。', link: null },
                    ],
                  },
                  {
                    cat: '🚗 自动驾驶 VLA',
                    catColor: '#10b981',
                    items: [
                      { title: 'LatentVLA: NAVSIM PDMS 92.4 新 SOTA', date: '2026-01', desc: 'arXiv 2601.05611，在 NAVSIM 无反应评估集上刷新 SOTA（PDMS=92.4）。隐空间动作表示 + 多尺度世界建模。', link: 'https://arxiv.org/abs/2601.05611v1' },
                      { title: 'Tesla FSD v14.3 发布', date: '2026-04', desc: '通过 MLIR 编译优化，反应速度提升 20%；Autopilot 팀全面迁移到 VLA 端到端架构。', link: null },
                      { title: 'DeepRoute.ai 发布 40B VLA', date: '2026-03（GTC）', desc: 'NVIDIA GTC 2026 发布，基于 NVIDIA Orin 平台优化，面向 Robotaxi 商业化部署。', link: null },
                    ],
                  },
                  {
                    cat: '🤖 具身智能',
                    catColor: '#e17055',
                    items: [
                      { title: 'Unitree H1/Flash 完成北京半程马拉松', date: '2026-04-19', desc: 'H1 以 2:40:42 完赛，Flash 以 2:22:09 创下人形机器人半马世界纪录，零跌倒全程无人工干预。', link: null },
                      { title: 'Boston Dynamics Atlas 56-DOF 全液压升级', date: '2026-01（CES）', desc: 'CES 2026 展示，56 个自由度，计划 2028 年量产 3 万台/年，对标特斯拉 Optimus。', link: null },
                      { title: 'Figure 03 + Helix AI 发布', date: '2026', desc: 'Figure 03 搭载全新 Helix AI 系统，双手灵巧操作能力大幅提升，白宫活动公开演示。', link: null },
                    ],
                  },
                  {
                    cat: '🔧 数据闭环 & 工具链',
                    catColor: '#00b894',
                    items: [
                      { title: 'UniSim 2.0 集成进 Seed-AD 训练', date: '2026', desc: 'UniSim 2.0 合成数据工具链支持 32 种天气/光照组合，每条样本扩增 ×5，补齐长尾场景，已集成进 Seed-AD 训练管线。', link: null },
                      { title: 'NAVSIM v2 新增 PDMS++ 指标', date: '2026', desc: 'NAVSIM 评测集增加无反应代理（non-reactive agents）场景，更真实衡量 VLA 在动态环境中的决策质量。', link: null },
                    ],
                  },
                ].map(section => (
                  <div key={section.cat} className="rounded-xl border border-gray-100 bg-white p-3">
                    <div className="text-[10px] font-bold mb-2" style={{ color: section.catColor }}>{section.cat}</div>
                    <div className="space-y-2">
                      {section.items.map(item => (
                        <div key={item.title} className="border-b border-gray-50 last:border-0 pb-1.5 last:pb-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] font-medium text-gray-800 flex-1">
                              {item.link
                                ? <a href={item.link} target="_blank" rel="noopener" className="underline" style={{ color: section.catColor }}>{item.title}</a>
                                : item.title}
                            </span>
                            <span className="text-[9px] text-gray-400 flex-shrink-0 font-mono">{item.date}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 车载 OS & 导航 ── */}
        {topTab === 'os-nav' && <OsNavSection />}

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
