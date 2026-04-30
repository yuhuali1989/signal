'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import useHashState from '@/hooks/useHashState';
import Footer from '@/components/Footer';

// ═══════════════════════════════════════════════════════════════
// 模拟器 / 仿真工具网站数据
// ═══════════════════════════════════════════════════════════════
const SIMULATOR_TOOLS = [
  // ── 自动驾驶仿真 ──────────────────────────────────────────
  {
    id: 'carla',
    name: 'CARLA',
    category: '自动驾驶仿真',
    logo: '🚗',
    tagline: '开源自动驾驶仿真平台',
    desc: '基于 Unreal Engine 的开源自动驾驶仿真器，支持传感器建模（Camera/LiDAR/Radar）、交通流生成、天气/光照变化，是学术界最广泛使用的 AD 仿真平台。',
    url: 'https://carla.org',
    github: 'https://github.com/carla-simulator/carla',
    stars: '11k+',
    license: 'MIT',
    tags: ['自动驾驶', '传感器仿真', 'Python API', 'Unreal Engine'],
    badge: '🔬 学术标准',
    badgeColor: '#6c5ce7',
    highlight: '支持 ROS2 集成，可直接对接 VLA 模型推理',
  },
  {
    id: 'waymax',
    name: 'Waymax',
    category: '自动驾驶仿真',
    logo: '🛣️',
    tagline: 'Waymo 开源加速仿真器',
    desc: 'Waymo 开源的基于 JAX 的轻量级自动驾驶仿真器，专为 RL 训练设计，支持 GPU/TPU 并行加速，可在单机上同时运行数千个仿真环境。基于真实 Waymo Open Dataset 场景。',
    url: 'https://github.com/waymo-research/waymax',
    github: 'https://github.com/waymo-research/waymax',
    stars: '1.2k+',
    license: 'Apache 2.0',
    tags: ['JAX', 'RL训练', 'GPU并行', 'Waymo数据'],
    badge: '⚡ RL 加速',
    badgeColor: '#e17055',
    highlight: '单 GPU 可并行 4096 个环境，RL 训练效率极高',
  },
  {
    id: 'metadrive',
    name: 'MetaDrive',
    category: '自动驾驶仿真',
    logo: '🌐',
    tagline: '可组合驾驶场景生成器',
    desc: '支持程序化生成无限多样化驾驶场景，内置 RL 环境接口（Gym/PettingZoo），支持多智能体交互，可导入真实地图（OpenStreetMap/Waymo/nuScenes）重建场景。',
    url: 'https://metadriverse.github.io/metadrive/',
    github: 'https://github.com/metadriverse/metadrive',
    stars: '1.1k+',
    license: 'Apache 2.0',
    tags: ['场景生成', 'RL环境', '多智能体', 'OpenStreetMap'],
    badge: '🎲 场景多样',
    badgeColor: '#00b894',
    highlight: '程序化生成场景，避免过拟合特定地图',
  },
  {
    id: 'lgsvl',
    name: 'SVL Simulator',
    category: '自动驾驶仿真',
    logo: '🏙️',
    tagline: 'LG 开源高保真 AD 仿真器',
    desc: 'LG Electronics 开源的高保真自动驾驶仿真平台，基于 Unity 引擎，支持多传感器配置、高精地图、ROS/ROS2/Cyber RT 接口，与 Apollo/Autoware 深度集成。',
    url: 'https://www.svlsimulator.com',
    github: 'https://github.com/lgsvl/simulator',
    stars: '2.2k+',
    license: 'Apache 2.0',
    tags: ['Unity', 'ROS2', 'Apollo', 'Autoware'],
    badge: '🏗️ 工程级',
    badgeColor: '#0984e3',
    highlight: '与 Baidu Apollo 官方集成，国内工程落地首选',
  },
  // ── 机器人仿真 ──────────────────────────────────────────
  {
    id: 'isaac-sim',
    name: 'NVIDIA Isaac Sim',
    category: '机器人仿真',
    logo: '🤖',
    tagline: 'NVIDIA 机器人仿真与合成数据平台',
    desc: '基于 Omniverse 的机器人仿真平台，支持物理精确的传感器仿真（Camera/LiDAR/IMU）、合成数据生成（Domain Randomization）、ROS2 集成，是具身智能训练数据生成的主流平台。',
    url: 'https://developer.nvidia.com/isaac-sim',
    github: 'https://github.com/isaac-sim',
    stars: '—',
    license: '免费（需 NVIDIA 账号）',
    tags: ['Omniverse', '合成数据', 'Domain Randomization', 'ROS2'],
    badge: '🏆 具身智能首选',
    badgeColor: '#76b900',
    highlight: 'RT-2/π0 等 VLA 模型的主要训练数据来源之一',
  },
  {
    id: 'mujoco',
    name: 'MuJoCo',
    category: '机器人仿真',
    logo: '⚙️',
    tagline: '高精度物理仿真引擎',
    desc: 'DeepMind 开源的高精度物理仿真引擎，专为接触力学、肌肉骨骼系统建模设计，是 RL 机器人控制研究的标准平台。OpenAI Gym 大量环境基于 MuJoCo 构建。',
    url: 'https://mujoco.org',
    github: 'https://github.com/google-deepmind/mujoco',
    stars: '8.5k+',
    license: 'Apache 2.0（2022年开源）',
    tags: ['物理仿真', 'RL', 'DeepMind', '接触力学'],
    badge: '🔬 RL 标准',
    badgeColor: '#6c5ce7',
    highlight: 'Humanoid 控制、灵巧手操作的首选仿真器',
  },
  {
    id: 'genesis',
    name: 'Genesis',
    category: '机器人仿真',
    logo: '🌱',
    tagline: '通用物理仿真平台（GPU 原生）',
    desc: '2024 年底发布的新一代 GPU 原生物理仿真平台，支持刚体/软体/流体/布料统一仿真，速度比 Isaac Sim 快 10-80x，内置生成式场景创建（文本→仿真场景），专为具身智能设计。',
    url: 'https://genesis-world.readthedocs.io',
    github: 'https://github.com/Genesis-Embodied-AI/Genesis',
    stars: '24k+',
    license: 'Apache 2.0',
    tags: ['GPU原生', '具身智能', '生成式场景', '统一物理'],
    badge: '🔥 2024 新星',
    badgeColor: '#e17055',
    highlight: '发布 48 小时 GitHub 破万 star，速度比 Isaac Sim 快 80x',
  },
  {
    id: 'gazebo',
    name: 'Gazebo / Ignition',
    category: '机器人仿真',
    logo: '🏭',
    tagline: 'ROS 官方机器人仿真器',
    desc: 'ROS 生态官方仿真器，支持复杂机器人系统建模、传感器仿真、多机器人协同，与 ROS/ROS2 无缝集成。新版 Ignition Gazebo（现更名 Gazebo）支持分布式仿真。',
    url: 'https://gazebosim.org',
    github: 'https://github.com/gazebosim/gz-sim',
    stars: '700+',
    license: 'Apache 2.0',
    tags: ['ROS', 'ROS2', '多机器人', '传感器仿真'],
    badge: '🔗 ROS 标准',
    badgeColor: '#00b894',
    highlight: 'ROS2 生态必备，工业机器人部署前验证首选',
  },
  // ── AI 世界模型 / 神经仿真 ──────────────────────────────
  {
    id: 'wayve-gaia',
    name: 'GAIA-1 (Wayve)',
    category: '神经世界模型',
    logo: '🌍',
    tagline: '自动驾驶神经世界模型',
    desc: 'Wayve 发布的生成式世界模型，可根据驾驶动作生成逼真的未来视频帧，用于自动驾驶场景的神经仿真。代表了从传统物理仿真向神经仿真的范式转变。',
    url: 'https://wayve.ai/thinking/scaling-gaia-1',
    github: null,
    stars: '—',
    license: '闭源',
    tags: ['世界模型', '视频生成', '神经仿真', '自动驾驶'],
    badge: '🧠 神经仿真',
    badgeColor: '#fd79a8',
    highlight: '首个大规模自动驾驶世界模型，开创神经仿真方向',
  },
  {
    id: 'unisim',
    name: 'UniSim (Google)',
    category: '神经世界模型',
    logo: '🎮',
    tagline: '通用神经交互仿真器',
    desc: 'Google Research 提出的通用神经仿真器，可模拟真实世界中的物理交互，支持机器人操作、自动驾驶等场景的神经渲染与交互仿真，是合成训练数据的重要来源。',
    url: 'https://universal-simulator.github.io',
    github: null,
    stars: '—',
    license: '研究用途',
    tags: ['神经渲染', '交互仿真', 'Google', '合成数据'],
    badge: '🔬 前沿研究',
    badgeColor: '#4285f4',
    highlight: 'Seed-AD 训练数据 UniSim 2.0 合成层的理论基础',
  },
  {
    id: 'dreamer',
    name: 'DreamerV3',
    category: '神经世界模型',
    logo: '💭',
    tagline: '基于世界模型的 RL 框架',
    desc: 'DeepMind 的 DreamerV3 在学习的世界模型内部进行 RL 训练，无需大量真实环境交互。在 Atari/DMControl/Minecraft 等多个 benchmark 上达到 SOTA，是世界模型 + RL 的代表性工作。',
    url: 'https://danijar.com/project/dreamerv3/',
    github: 'https://github.com/danijar/dreamerv3',
    stars: '2.3k+',
    license: 'MIT',
    tags: ['世界模型', 'RL', 'DeepMind', 'RSSM'],
    badge: '🏆 世界模型RL',
    badgeColor: '#6c5ce7',
    highlight: '单一算法在 7 个不同领域达到 SOTA，泛化能力极强',
  },
  // ── 物理 / 科学仿真 ──────────────────────────────────────
  {
    id: 'taichi',
    name: 'Taichi Lang',
    category: '物理仿真',
    logo: '☯️',
    tagline: '高性能并行计算 + 物理仿真',
    desc: '清华大学胡渊鸣开发的高性能并行计算语言，内嵌于 Python，支持 GPU/CPU 自动并行，内置 MPM/SPH/FEM 等物理仿真算法，广泛用于流体、布料、弹性体仿真研究。',
    url: 'https://taichi-lang.org',
    github: 'https://github.com/taichi-dev/taichi',
    stars: '26k+',
    license: 'Apache 2.0',
    tags: ['物理仿真', 'GPU并行', 'MPM', '流体仿真'],
    badge: '🇨🇳 国产之光',
    badgeColor: '#e17055',
    highlight: '清华出品，SIGGRAPH 最佳论文，国内物理仿真领域标杆',
  },
  {
    id: 'warp',
    name: 'NVIDIA Warp',
    category: '物理仿真',
    logo: '🌀',
    tagline: 'NVIDIA GPU 物理仿真框架',
    desc: 'NVIDIA 开源的 GPU 加速物理仿真框架，支持刚体/软体/流体/布料统一仿真，与 PyTorch 深度集成，支持可微分仿真（用于梯度优化），是 Isaac Sim 的底层物理引擎。',
    url: 'https://developer.nvidia.com/warp-python',
    github: 'https://github.com/NVIDIA/warp',
    stars: '4.5k+',
    license: 'Apache 2.0',
    tags: ['GPU仿真', '可微分', 'PyTorch集成', '刚体/软体'],
    badge: '⚡ 可微分仿真',
    badgeColor: '#76b900',
    highlight: '支持可微分仿真，可直接用梯度优化物理参数',
  },
  {
    id: 'brax',
    name: 'Brax',
    category: '物理仿真',
    logo: '🦾',
    tagline: 'Google JAX 物理仿真库',
    desc: 'Google 基于 JAX 开发的可微分物理仿真库，专为 RL 研究设计，支持 GPU/TPU 大规模并行，可在单 TPU Pod 上同时运行百万个仿真环境，速度比 MuJoCo 快 100x+。',
    url: 'https://github.com/google/brax',
    github: 'https://github.com/google/brax',
    stars: '2.2k+',
    license: 'Apache 2.0',
    tags: ['JAX', 'TPU并行', 'RL', '可微分'],
    badge: '🚀 百万并行',
    badgeColor: '#4285f4',
    highlight: '单 TPU Pod 可并行 100 万环境，RL 训练速度革命性提升',
  },
  // ── 交互式在线工具 ──────────────────────────────────────
  {
    id: 'physion',
    name: 'Physion',
    category: '在线交互仿真',
    logo: '🎯',
    tagline: '物理直觉评测基准',
    desc: 'MIT 开发的物理直觉评测平台，包含 8 类物理场景（碰撞/支撑/滚动/连接等），用于评测 AI 模型的物理常识推理能力，是世界模型物理理解能力的标准 benchmark。',
    url: 'https://physion-benchmark.github.io',
    github: 'https://github.com/cogtoolslab/physion',
    stars: '200+',
    license: 'MIT',
    tags: ['物理推理', 'Benchmark', '世界模型评测', 'MIT'],
    badge: '📊 评测基准',
    badgeColor: '#ffa657',
    highlight: '评测 AI 物理直觉的标准 benchmark，世界模型研究必备',
  },
  {
    id: 'matter-js',
    name: 'Matter.js Playground',
    category: '在线交互仿真',
    logo: '⚽',
    tagline: '2D 物理引擎在线演示',
    desc: '浏览器端 2D 物理引擎，支持刚体碰撞、约束、复合体等物理效果，提供在线 Playground 可实时调整参数观察物理行为，适合快速验证物理直觉和教学演示。',
    url: 'https://brm.io/matter-js/',
    github: 'https://github.com/liabru/matter-js',
    stars: '17k+',
    license: 'MIT',
    tags: ['2D物理', '浏览器端', '实时交互', '教学'],
    badge: '🌐 浏览器可用',
    badgeColor: '#00b894',
    highlight: '无需安装，浏览器直接运行，快速验证 2D 物理场景',
  },
  {
    id: 'three-js-physics',
    name: 'Rapier (Rust 物理引擎)',
    category: '在线交互仿真',
    logo: '⚡',
    tagline: 'Rust/WASM 高性能物理引擎',
    desc: 'Rust 编写的跨平台物理引擎，支持 2D/3D 刚体/软体/流体仿真，通过 WASM 在浏览器中运行，性能接近原生，被 Bevy 游戏引擎和多个机器人仿真项目采用。',
    url: 'https://rapier.rs',
    github: 'https://github.com/dimforge/rapier',
    stars: '4.5k+',
    license: 'Apache 2.0',
    tags: ['Rust', 'WASM', '2D/3D', '高性能'],
    badge: '🦀 Rust 性能',
    badgeColor: '#e17055',
    highlight: 'WASM 版本可在浏览器中运行，性能接近原生 C++',
  },
];

const SIM_CATEGORIES = ['全部', '自动驾驶仿真', '机器人仿真', '神经世界模型', '物理仿真', '在线交互仿真'];

function SimulatorsDirectory() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const filtered = activeCategory === '全部'
    ? SIMULATOR_TOOLS
    : SIMULATOR_TOOLS.filter(s => s.category === activeCategory);

  const categoryCount = (cat) => cat === '全部'
    ? SIMULATOR_TOOLS.length
    : SIMULATOR_TOOLS.filter(s => s.category === cat).length;

  return (
    <div>
      {/* 说明 */}
      <div className="mb-5 p-4 rounded-2xl border border-[#00b894]/20 bg-[#00b894]/[0.03] flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🌐</span>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">仿真工具导航</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            覆盖自动驾驶仿真、机器人仿真、神经世界模型、物理仿真引擎五大方向，收录学术界和工业界主流仿真平台。
            重点关注与 VLA / 具身智能 / RL 训练相关的工具链。
          </p>
        </div>
      </div>

      {/* Category 筛选 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {SIM_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${activeCategory === cat
              ? 'bg-[#00b894]/10 text-[#00b894] border-[#00b894]/30'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {cat}
            <span className={`text-[9px] px-1 py-0.5 rounded-full font-mono ${activeCategory === cat ? 'bg-[#00b894]/20 text-[#00b894]' : 'bg-gray-100 text-gray-400'}`}>
              {categoryCount(cat)}
            </span>
          </button>
        ))}
      </div>

      {/* 工具卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(tool => (
          <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer"
            className="group block rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm hover:border-gray-200 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0">{tool.logo}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#00b894] transition-colors">{tool.name}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white flex-shrink-0"
                      style={{ background: tool.badgeColor }}>{tool.badge}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{tool.tagline}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{tool.category}</span>
                {tool.stars !== '—' && (
                  <span className="text-[9px] text-gray-400">⭐ {tool.stars}</span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{tool.desc}</p>

            {/* 亮点 */}
            <div className="flex items-start gap-1.5 mb-2.5 p-2 rounded-xl bg-gray-50">
              <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">💡</span>
              <p className="text-[10px] text-gray-600 leading-relaxed">{tool.highlight}</p>
            </div>

            {/* 标签 + 链接 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {tool.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {tool.github && (
                  <span onClick={e => { e.preventDefault(); window.open(tool.github, '_blank'); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer">GitHub →</span>
                )}
                <span className="text-[9px] text-gray-300">{tool.license}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-5 text-center text-[11px] text-gray-400">
        共收录 {SIMULATOR_TOOLS.length} 个仿真工具 · 持续更新 · 重点关注 VLA / 具身智能 / 自动驾驶方向
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tokenizer
// ═══════════════════════════════════════════════════════════════

const TOKEN_COLORS = [
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' },
  { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  { bg: '#f0fdf4', text: '#14532d', border: '#bbf7d0' },
  { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
];

const MODEL_GROUPS = [
  {
    group: 'OpenAI GPT-4o / o 系列',
    color: '#10a37f',
    models: [
      { id: 'gpt-4o',       label: 'GPT-4o',        enc: 'o200k_base', badge: '最新' },
      { id: 'gpt-4o-mini',  label: 'GPT-4o mini',   enc: 'o200k_base' },
      { id: 'o1',           label: 'o1',             enc: 'o200k_base', badge: '推理' },
      { id: 'o3',           label: 'o3',             enc: 'o200k_base', badge: '推理' },
      { id: 'o3-mini',      label: 'o3-mini',        enc: 'o200k_base' },
    ],
  },
  {
    group: 'Claude（Anthropic）',
    color: '#d4863a',
    models: [
      { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', enc: 'cl100k_base', badge: '近似' },
      { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'Gemini（Google）',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', enc: 'o200k_base', badge: '近似' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'DeepSeek',
    color: '#1e40af',
    models: [
      { id: 'deepseek-v3',  label: 'DeepSeek-V3',   enc: 'cl100k_base', badge: '近似' },
      { id: 'deepseek-r1',  label: 'DeepSeek-R1',   enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'Meta Llama',
    color: '#0064e0',
    models: [
      { id: 'llama-3',      label: 'Llama 3 系列',  enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'Qwen（阿里）',
    color: '#ff6a00',
    models: [
      { id: 'qwen2.5',      label: 'Qwen 2.5 系列', enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: '原始编码方案',
    color: '#64748b',
    models: [
      { id: 'enc:cl100k_base', label: 'cl100k_base', enc: 'cl100k_base', badge: '编码' },
      { id: 'enc:o200k_base',  label: 'o200k_base',  enc: 'o200k_base',  badge: '编码' },
      { id: 'enc:p50k_base',   label: 'p50k_base',   enc: 'p50k_base',   badge: '编码' },
    ],
  },
];

const ALL_MODELS = MODEL_GROUPS.flatMap(g => g.models.map(m => ({ ...m, groupColor: g.color, groupName: g.group })));

const TOKENIZER_EXAMPLES = [
  { label: '中文句子', text: '大语言模型是人工智能领域的重要突破，今天的AI已经可以写代码、做推理。' },
  { label: '英文句子', text: 'The quick brown fox jumps over the lazy dog. Large language models have revolutionized NLP.' },
  { label: '代码片段', text: 'def hello_world():\n    print("Hello, World!")\n    return {"status": 200}' },
  { label: '中英混合', text: 'ChatGPT在推理能力方面有了显著提升（benchmark: MMLU 89.8%，GPQA Diamond 78.3%）' },
  { label: '特殊字符', text: '🚀 emoji & symbols: <|endoftext|> [INST] <<SYS>>\n\t spaces and\ttabs' },
  { label: 'JSON 结构', text: '{"model": "gpt-4o", "temperature": 0.7, "messages": [{"role": "user", "content": "你好"}]}' },
];

function TokenizerTool() {
  const [text, setText] = useState('大语言模型是人工智能领域的重要突破，ChatGPT开创了新的交互范式。');
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIds, setShowIds] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const encCacheRef = useRef({});

  const selectedModel = ALL_MODELS.find(m => m.id === selectedModelId) || ALL_MODELS[0];
  const encoding = selectedModel.enc;

  const tokenize = useCallback(async (inputText, enc) => {
    if (!inputText.trim()) { setTokens([]); return; }
    setLoading(true);
    setError('');
    try {
      let encoder = encCacheRef.current[enc];
      if (!encoder) {
        const { getEncoding } = await import('js-tiktoken');
        encoder = getEncoding(enc);
        encCacheRef.current[enc] = encoder;
      }
      const encoded = encoder.encode(inputText);
      const result = [];
      let colorIdx = 0;
      let pendingBytes = [];
      let pendingIds = [];
      const flushPending = () => {
        if (!pendingIds.length) return;
        const buf = new Uint8Array(pendingBytes);
        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buf);
        result.push({ id: pendingIds[0], text: decoded, colorIdx: colorIdx % TOKEN_COLORS.length });
        colorIdx++;
        pendingBytes = [];
        pendingIds = [];
      };
      for (let i = 0; i < encoded.length; i++) {
        const tokenId = encoded[i];
        const bytes = encoder.decode(new Uint32Array([tokenId]));
        const firstByte = bytes[0];
        const isStart = firstByte < 0x80 || firstByte >= 0xC0;
        if (isStart && pendingIds.length > 0) flushPending();
        pendingBytes.push(...bytes);
        pendingIds.push(tokenId);
        const testDecode = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(pendingBytes));
        if (!testDecode.includes('\uFFFD')) flushPending();
      }
      flushPending();
      setTokens(result);
    } catch (e) {
      setError('Tokenize 出错: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => tokenize(text, encoding), 150);
    return () => clearTimeout(timer);
  }, [text, encoding, tokenize]);

  const uniqueTokenCount = tokens.length;
  const charCount = text.length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-600">选择模型</label>
          <button onClick={() => setShowModelPicker(!showModelPicker)}
            className="text-[10px] text-[#6c5ce7] hover:underline">
            {showModelPicker ? '收起' : '展开全部模型'}
          </button>
        </div>
        {!showModelPicker && (
          <div className="flex flex-wrap gap-2">
            {['gpt-4o', 'o3', 'claude-3-7-sonnet', 'gemini-2.0-flash', 'deepseek-r1', 'llama-3', 'qwen2.5'].map(mid => {
              const m = ALL_MODELS.find(x => x.id === mid);
              if (!m) return null;
              const isSelected = selectedModelId === mid;
              return (
                <button key={mid} onClick={() => setSelectedModelId(mid)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${isSelected
                    ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30 text-[#6c5ce7]'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  {m.label}
                  {m.badge && <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded-full ${
                    m.badge === '近似' ? 'bg-amber-50 text-amber-600' :
                    m.badge === '推理' ? 'bg-blue-50 text-blue-600' :
                    m.badge === '最新' ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{m.badge}</span>}
                </button>
              );
            })}
            <button onClick={() => setShowModelPicker(true)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 hover:border-gray-300">
              更多…
            </button>
          </div>
        )}
        {showModelPicker && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {MODEL_GROUPS.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: group.color }}>{group.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.models.map(m => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <button key={m.id} onClick={() => { setSelectedModelId(m.id); setShowModelPicker(false); }}
                        className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${isSelected
                          ? 'border-[#6c5ce7]/30 text-[#6c5ce7] font-medium'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                        style={isSelected ? { background: group.color + '18' } : {}}>
                        {m.label}
                        {m.badge && <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full ${
                          m.badge === '近似' ? 'bg-amber-50 text-amber-500' :
                          m.badge === '推理' ? 'bg-blue-50 text-blue-500' :
                          m.badge === '最新' ? 'bg-green-50 text-green-500' :
                          'bg-gray-100 text-gray-400'
                        }`}>{m.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 pt-1">⚠️ 标注「近似」的模型使用对应 OpenAI 编码估算</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">输入文本</label>
            <div className="flex gap-1 flex-wrap">
              {TOKENIZER_EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => setText(ex.text)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:border-[#6c5ce7]/30 hover:text-[#6c5ce7] transition-all">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="输入任意文本，实时看到 BPE 分词结果……"
            className="w-full h-28 px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#6c5ce7]/50 focus:ring-2 focus:ring-[#6c5ce7]/10 text-gray-700 placeholder-gray-300 font-mono"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 content-start">
          {[
            { label: 'Token 数', value: loading ? '…' : uniqueTokenCount.toLocaleString(), color: '#6c5ce7', sub: selectedModel.label },
            { label: '字符数', value: charCount.toLocaleString(), color: '#0984e3', sub: `约 ${(charCount / Math.max(uniqueTokenCount, 1)).toFixed(2)} chars/token` },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-3.5">
              <p className="text-[10px] text-gray-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-gray-300 mt-0.5 truncate">{card.sub}</p>
            </div>
          ))}
          <button onClick={() => setShowIds(!showIds)}
            className={`w-full py-2 text-xs font-medium rounded-xl border transition-all ${showIds ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30 text-[#6c5ce7]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {showIds ? '▲ 隐藏 Token ID' : '▼ 显示 Token ID'}
          </button>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>}

      {tokens.length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">Token 可视化 · <span className="text-gray-400">共 {uniqueTokenCount} 个 token</span></p>
            <p className="text-[10px] text-gray-300">编码：<span className="font-mono">{encoding}</span></p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 leading-8 min-h-20">
            <div className="flex flex-wrap gap-0.5 items-baseline">
              {tokens.map((tok, i) => {
                const c = TOKEN_COLORS[tok.colorIdx];
                const parts = tok.text.split('\n');
                return parts.map((part, pi) => (
                  <span key={`${i}-${pi}`}>
                    {pi > 0 && <br />}
                    {part !== '' && (
                      <span title={`Token ID: ${tok.id}  |  "${tok.text.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`}
                        className="inline-block px-0.5 rounded text-xs font-mono border cursor-default hover:opacity-80 transition-opacity"
                        style={{ background: c.bg, color: c.text, borderColor: c.border }}>
                        {part.replace(/ /g, '\u00B7')}
                      </span>
                    )}
                    {part === '' && pi > 0 && <span className="inline-block text-[10px] text-gray-300 font-mono">↵</span>}
                  </span>
                ));
              })}
            </div>
          </div>
          {showIds && (
            <div className="mt-3 p-3 bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
              <p className="text-[10px] text-gray-500 mb-2 font-mono">Token IDs · {selectedModel.label} ({encoding})</p>
              <div className="flex flex-wrap gap-1">
                {tokens.map((tok, i) => {
                  const c = TOKEN_COLORS[tok.colorIdx];
                  return (
                    <span key={i} title={`"${tok.text.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-default"
                      style={{ background: c.bg + '22', color: c.text, borderColor: c.border + '44' }}>
                      {tok.id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {tokens.some(t => t.text.includes(' ')) && (
            <p className="mt-2 text-[11px] text-gray-400">💡 英文单词前通常带空格（显示为 ·），这是 BPE 的特性</p>
          )}
        </div>
      )}

      {!tokens.length && !loading && !error && text.trim() === '' && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <span className="text-4xl mb-3">🔬</span>
          <p className="text-sm">在上方输入文本，实时看到 BPE 分词可视化</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'simulators', label: '仿真工具', icon: '🌐', desc: '自动驾驶 / 机器人 / 物理仿真 / 神经世界模型' },
  { id: 'tokenizer',  label: 'Tokenizer', icon: '🔬', desc: 'BPE 分词可视化 · 查看真实 token 切分' },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useHashState('tab', 'simulators');
  const active = TABS.find(t => t.id === activeTab);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">🧰 工具箱</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 rounded-full">实用工具</span>
          </div>
          <p className="text-sm text-gray-500">仿真工具导航 · Tokenizer 可视化</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-center transition-all ${activeTab === tab.id ? 'bg-white border-[#6c5ce7]/20 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-100'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${activeTab === tab.id ? 'text-[#6c5ce7]' : 'text-gray-500'}`}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="text-base">{active?.icon}</span>
          <h2 className="text-sm font-semibold text-gray-700">{active?.label}</h2>
          <span className="text-xs text-gray-400">· {active?.desc}</span>
        </div>

        {activeTab === 'simulators' && <SimulatorsDirectory />}
        {activeTab === 'tokenizer' && <TokenizerTool />}
      </div>
      <Footer />
    </>
  );
}
