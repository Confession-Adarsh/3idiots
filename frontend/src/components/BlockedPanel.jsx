import { useState } from 'react'

export default function BlockedPanel({ blockedAttempts }) {
  const [open, setOpen] = useState(false)

  if (blockedAttempts.length === 0) return null

  return (
    <div className="relative">
      {/* Badge button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs bg-red-950/50 hover:bg-red-900/50
                   text-red-400 px-3 py-1.5 rounded-full border border-red-800/50
                   transition-all duration-150 cursor-pointer"
      >
        <span className="shield-animate">🛡️</span>
        <span className="font-semibold">{blockedAttempts.length}</span>
        <span className="hidden sm:inline">blocked</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-64 overflow-y-auto
                        bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-3 space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Blocked queries
          </h4>
          {blockedAttempts.map((a, i) => (
            <div
              key={i}
              className="text-sm text-red-300/80 bg-red-950/30 border-l-3 border-red-600
                         rounded-r-lg px-3 py-2"
            >
              <p className="truncate">{a.query}</p>
              <p className="text-[10px] text-gray-600 mt-1 font-mono">
                via {a.tier} &middot; {a.latency}ms
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
