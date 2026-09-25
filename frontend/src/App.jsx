import { useState, useCallback } from 'react'
import { searchEntities } from './api'
import SearchBar from './components/SearchBar'
import ResultsPanel from './components/ResultsPanel'
import InjectionBanner from './components/InjectionBanner'
import SkeletonCard from './components/SkeletonCard'
import BlockedPanel from './components/BlockedPanel'
import EvalScorecard from './components/EvalScorecard'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)
  const [blockedAttempts, setBlockedAttempts] = useState([])

  const handleSearch = useCallback(async (query) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setLatencyMs(null)

    try {
      const data = await searchEntities(query, 10)
      setResults(data)
      setLatencyMs(data._latency_ms)

      // Track blocked attempts
      if (data.injection_detected) {
        setBlockedAttempts(prev => [
          { query, tier: data.tier_used, latency: data._latency_ms },
          ...prev,
        ])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const tierLabel = results?.tier_used
  const isLocalFallback = tierLabel === 'ollama' || tierLabel === 'rules'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ─── */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              kavach<span className="text-indigo-400">-search</span>
            </h1>
            <span className="text-[10px] text-gray-600 ml-1.5 hidden sm:inline">
              Guarded community search
            </span>
          </div>
          <BlockedPanel blockedAttempts={blockedAttempts} />
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Tier + latency badge */}
        {results && !results.injection_detected && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {/* Live latency badge — stretch WOW #1 */}
            <span className="inline-flex items-center gap-1.5 text-xs font-mono
                             bg-gray-800/80 text-gray-400 px-3 py-1.5 rounded-full border border-gray-700">
              {latencyMs}ms via <span className="text-indigo-400 font-semibold">{tierLabel}</span>
            </span>

            {/* Local-fallback resilience badge */}
            {isLocalFallback && (
              <span className="inline-flex items-center gap-1.5 text-xs
                               bg-amber-950/40 text-amber-300 px-3 py-1.5 rounded-full border border-amber-800/40">
                ⚡ Answered via local fallback
              </span>
            )}

            <span className="text-xs text-gray-600 font-mono">
              {results.results.length} result{results.results.length !== 1 ? 's' : ''}
              &nbsp;·&nbsp;
              confidence {(results.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Injection banner */}
        {results?.injection_detected && <InjectionBanner />}

        {/* Results — grouped by type */}
        {results && !results.injection_detected && results.results.length > 0 && (
          <ResultsPanel results={results.results} />
        )}

        {/* No results (non-injection) */}
        {results && !results.injection_detected && results.results.length === 0 && (
          <div className="mt-10 text-center text-gray-500">
            <p className="text-lg">No matching entities found.</p>
            <p className="text-sm mt-1">Try broadening your query or using different keywords.</p>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <EvalScorecard />
          <span className="text-xs text-gray-600">
            kavach-search &middot; 3-tier LLM routing &middot; injection-hardened
          </span>
        </div>
      </footer>
    </div>
  )
}
