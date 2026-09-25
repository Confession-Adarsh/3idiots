import ResultCard from './ResultCard'

const TYPE_ORDER = ['person', 'event', 'community']
const TYPE_LABELS = { person: 'People', event: 'Events', community: 'Communities' }
const TYPE_ICONS = { person: '👤', event: '📅', community: '👥' }

export default function ResultsPanel({ results }) {
  // Group by type
  const groups = {}
  for (const type of TYPE_ORDER) {
    const items = results.filter(r => r.type === type)
    if (items.length > 0) groups[type] = items
  }

  let globalRank = 0

  return (
    <div className="mt-6 space-y-6">
      {TYPE_ORDER.map(type => {
        const items = groups[type]
        if (!items) return null
        return (
          <div key={type}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>{TYPE_ICONS[type]}</span>
              {TYPE_LABELS[type]}
              <span className="text-gray-700">({items.length})</span>
            </h2>
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                globalRank++
                return (
                  <ResultCard
                    key={item.id}
                    item={item}
                    rank={globalRank}
                    animDelay={globalRank * 50}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
