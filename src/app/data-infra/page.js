'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

const DataInfraViz = dynamic(() => import('@/components/DataInfraViz'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00cec9] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">加载可视化组件...</span>
      </div>
    </div>
  ),
});

const DataLoopArch = dynamic(() => import('@/components/DataLoopArch'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">加载可视化组件...</span>
      </div>
    </div>
  ),
});

const SECTIONS = [
  {
    id: 'infra',
    label: 'AI Infra 技术栈',
    icon: '☸️',
    desc: 'K8s 集群 · 数据湖仓 · MLOps · 可观测性 · 向量数据库 · 特征仓库',
    color: '#326ce5',
  },
  {
    id: 'loop',
            label: '闭环 Infra 链路',
    icon: '🔄',
    desc: '采集 → 上传 → 处理 → 存储 → 训练 → 部署 → 监控回采 · 全容器化云原生架构',
    color: '#6c5ce7',
  },
];

// 技术领域概览卡片
const TECH_DOMAINS = [
  {
    icon: '☸️', name: 'Kubernetes', desc: '3 套集群 · 200+ 节点 · Volcano GPU 调度',
    tags: ['容器编排', 'GPU 调度', 'GitOps'], color: '#326ce5',
  },
  {
    icon: '🏞️', name: '数据湖仓', desc: 'Apache Iceberg · WebDataset · LakeFS · Schema 设计 · IO 优化',
    tags: ['Iceberg', 'Parquet', 'WebDataset'], color: '#00cec9',
  },
  {
    icon: '⚙️', name: '数据流水线', desc: 'Airflow + Argo · 7 阶段 DAG · 2000 DAG/天',
    tags: ['ETL', 'Airflow', 'Spark'], color: '#fd79a8',
  },
  {
    icon: '⚡', name: '计算引擎', desc: 'Spark · Ray · Flink · Trino · RAPIDS · 场景选型矩阵',
    tags: ['Spark', 'Ray', 'Flink', 'Trino'], color: '#f39c12',
  },
  {
    icon: '🗂️', name: 'Unity Catalog', desc: '统一元数据 · 模型注册 · 数据集管理 · 列级血缘',
    tags: ['模型注册', '数据集管理', '数据血缘'], color: '#e84393',
  },
  {
    icon: '🧪', name: 'MLOps', desc: 'MLflow · DVC · CI/CD · A/B 测试 · 模型注册',
    tags: ['实验管理', '模型服务', 'Seldon'], color: '#3fb950',
  },
  {
    icon: '📊', name: '可观测性', desc: 'Prometheus · Grafana · ELK · Jaeger · 50+ 仪表盘',
    tags: ['监控', '日志', '追踪'], color: '#ffa657',
  },
  {
    icon: '🧬', name: '向量 & 特征', desc: 'Milvus 10B 向量 · Feast 特征仓库 · 场景挖掘',
    tags: ['向量DB', 'Feature Store', 'CLIP'], color: '#d2a8ff',
  },
];

export default function DataInfraPage() {
  const [activeSection, setActiveSection] = useState('infra');

  return (
    <>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">🔄 AI Infra 全景</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100 font-medium">
              全容器化
            </span>
          </div>
          <p className="text-sm text-gray-500">
            从数据采集到模型部署的全链路基础设施 — K8s · 数据湖仓 · 计算引擎 · Unity Catalog · MLOps · 可观测性 · 向量数据库
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>8 大技术领域</span>
            <span>·</span>
            <span>10 层闭环架构</span>
            <span>·</span>
            <span>基于 Kubernetes 全容器化</span>
          </div>
        </div>

        {/* 技术领域概览 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {TECH_DOMAINS.map(td => (
            <div key={td.name} className="rounded-xl border p-3 hover:shadow-sm transition-shadow"
              style={{ borderColor: td.color + '33', background: td.color + '04' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{td.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{td.name}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">{td.desc}</p>
              <div className="flex flex-wrap gap-1">
                {td.tags.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: td.color + '15', color: td.color }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section 切换 */}
        <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={activeSection === sec.id
                ? { background: '#fff', color: sec.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${sec.color}33` }
                : { color: '#94a3b8' }}>
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Section 标题 */}
        <div className="mb-5 flex items-center gap-2">
          <span className="text-lg">{SECTIONS.find(s => s.id === activeSection)?.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-xs text-gray-400">
              {SECTIONS.find(s => s.id === activeSection)?.desc}
            </p>
          </div>
        </div>

        {/* 内容区 */}
        <div>
          {activeSection === 'infra' && <DataInfraViz />}
          {activeSection === 'loop' && <DataLoopArch />}
        </div>

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          本页面展示自动驾驶数据闭环的完整基础设施架构设计。
          基于 <span className="font-mono text-gray-600">Kubernetes</span> 全容器化部署，
          支持 <span className="font-mono text-gray-600">AWS / 腾讯云 / 阿里云</span> 多云适配。
          数据湖采用 <span className="font-mono text-gray-600">Apache Iceberg</span> + <span className="font-mono text-gray-600">LakeFS</span> 实现 Git-like 数据版本管理，
          向量检索基于 <span className="font-mono text-gray-600">Milvus</span> 支持 10B+ 规模场景挖掘。
          MLOps 流水线覆盖从代码提交到模型灰度发布的全自动化链路。
        </div>
      </div>
      <Footer />
    </>
  );
}