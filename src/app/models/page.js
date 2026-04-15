import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ModelHub from '@/components/ModelHub';
import { getBenchmarks, getBenchmarkDatasets } from '@/lib/content';

export const metadata = {
  title: '模型 — Signal',
  description: '一站式 LLM 模型：架构图库、Fact Sheet、技术对比、性能排行榜与数据集评测全景',
};

export default function ModelsPage() {
  const modelsPath = path.join(process.cwd(), 'content', 'gallery', 'models.json');
  const models = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
  const benchmarks = getBenchmarks();
  const datasets = getBenchmarkDatasets();

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🤖 模型
          </h1>
          <p className="text-sm text-gray-500">
            LLM 全景——架构图库 · 技术对比 · 性能排行榜 · 评测数据集，一站式查阅
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
            <span>{models.length} 个模型</span>
            <span>·</span>
            <span>{datasets.length} 个数据集</span>
            <span>·</span>
            <span>覆盖 LLM / 编码 / 推理 / Agent / 自动驾驶</span>
          </div>
        </div>

        <ModelHub models={models} benchmarks={benchmarks} datasets={datasets} />
      </main>
      <Footer />
    </>
  );
}
