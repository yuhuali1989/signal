import Link from 'next/link';

export default function ContentCard({ title, description, date, slug, href, tags = [], agent }) {
  return (
    <Link href={href} className="block group">
      <div className="card p-5 h-full flex flex-col">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-[#6c5ce7] rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#6c5ce7] transition-colors leading-snug">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed flex-1">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
          {date && (
            <span className="text-[11px] text-gray-300 font-mono">
              {new Date(date).toLocaleDateString('zh-CN')}
            </span>
          )}
          {agent && (
            <span className="flex items-center gap-1 text-[11px] text-[#a29bfe]">
              <span className="w-1 h-1 bg-[#a29bfe] rounded-full" />
              {agent}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
