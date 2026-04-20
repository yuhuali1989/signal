import Footer from '@/components/Footer';
import { getEvolutionLogs } from '@/lib/content';

export const metadata = { title: '进化日志 — Signal' };

export default function EvolutionPage() {
  const logs = getEvolutionLogs();

  const typeIcons = {
    book: '📖',
    article: '📝',
    paper: '📄',
    news: '🌊',
    model: '🤖',
    system: '⚙️',
  };

  const typeColors = {
    book: 'bg-orange-50 text-orange-600 border-orange-200',
    article: 'bg-purple-50 text-purple-600 border-purple-200',
    paper: 'bg-blue-50 text-blue-600 border-blue-200',
    news: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    model: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    system: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const typeLabels = {
    book: '书籍',
    article: '专栏',
    paper: '论文',
    news: '声浪',
    model: '模型',
    system: '系统',
  };

  return (
    <>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🔄 进化日志</h1>
          <p className="text-sm text-gray-500">记录每一次 AI 智能体的自动更新，全部过程透明可追溯</p>
        </div>

        {logs.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-4">
              {logs.map((log, i) => {
                // 兼容两种格式：
                //  1. 新格式：{ id, type, title, description, date, agent }
                //  2. 旧格式：{ date, type, agent, message, slug }
                const title = log.title || log.message || '(无标题)';
                const description = log.description || (log.title ? null : null);
                return (
                  <div key={log.id || log.slug || i} className="relative flex items-start gap-4 pl-12">
                    {/* Timeline dot */}
                    <div className="absolute left-3.5 top-2 w-3 h-3 rounded-full bg-maxwell-500 ring-4 ring-white" />

                    <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-lg">{typeIcons[log.type] || '🔄'}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${typeColors[log.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {typeLabels[log.type] || log.type}
                        </span>
                        <span className="text-xs text-maxwell-500">{log.agent}</span>
                        <span className="text-xs text-gray-400 ml-auto">{log.date}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{title}</h3>
                      {description && (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">🔄</p>
            <p>暂无进化日志，AI 智能体即将开始工作...</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
