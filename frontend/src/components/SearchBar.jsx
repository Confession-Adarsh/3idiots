import { useState, useEffect, useRef } from 'react'

const PLACEHOLDERS = [
  'Flutter developers in Lucknow...',
  'AI/ML events this month...',
  'communities focused on Web3...',
]

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const inputRef = useRef(null)

  // Rotate placeholder every 3s
  useEffect(() => {
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(id)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed && !loading) onSearch(trimmed)
  }

  function handleExample(q) {
    setQuery(q)
    onSearch(q)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={PLACEHOLDERS[phIdx]}
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl pl-12 pr-28 py-4
                     text-white placeholder-gray-500 text-lg
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition-all duration-200"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500
                     text-white font-medium text-sm px-6 py-2.5 rounded-xl
                     transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Example chips */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-600">Try:</span>
        {['Flutter developers in Lucknow', 'AI/ML researchers Bangalore', 'Web3 hackathons India',
          'DevOps Kubernetes events', 'Lucknow mein Flutter events'].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleExample(q)}
            disabled={loading}
            className="text-xs bg-gray-800/70 hover:bg-gray-700 text-gray-400 hover:text-gray-200
                       px-3 py-1.5 rounded-full transition-all duration-150
                       disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed border border-gray-800"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
