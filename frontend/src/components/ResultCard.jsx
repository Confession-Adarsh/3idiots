const TYPE_STYLES = {
  person:    { emoji: '👤', bg: 'bg-blue-950/40',    border: 'border-blue-800/40',    label: 'text-blue-400' },
  event:     { emoji: '📅', bg: 'bg-amber-950/40',   border: 'border-amber-800/40',   label: 'text-amber-400' },
  community: { emoji: '👥', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', label: 'text-emerald-400' },
}

export default function ResultCard({ item, rank, animDelay = 0 }) {
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.person

  return (
    <div
      className={`card-animate ${style.bg} border ${style.border} rounded-2xl p-4 sm:p-5
                  transition-all duration-200 hover:border-gray-600`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <span className="flex-shrink-0 w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center
                         text-xs text-gray-400 font-mono border border-gray-700">
          {rank}
        </span>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{style.emoji}</span>
            <h3 className="font-semibold text-white text-base truncate">{item.name}</h3>
            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5
                             rounded-full ${style.bg} ${style.label} border ${style.border}`}>
              {item.type}
            </span>
          </div>

          {/* Location */}
          {item.location && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
              <span className="text-xs">📍</span> {item.location}
            </p>
          )}

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">{item.description}</p>
          )}

          {/* LLM Reason — indented with left border */}
          {item.reason && (
            <p className="text-sm text-indigo-300/90 mt-2.5 italic border-l-2 border-indigo-600 pl-3">
              &ldquo;{item.reason}&rdquo;
            </p>
          )}

          {/* Tags — up to 3 */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-750">
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-600">+{item.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Score — monospace */}
          {item.retrieval_score > 0 && (
            <span className="inline-block mt-2 text-[10px] text-gray-600 font-mono">
              similarity: {item.retrieval_score.toFixed(3)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
