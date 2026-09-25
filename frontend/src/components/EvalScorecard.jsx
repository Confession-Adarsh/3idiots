import { useState } from 'react'
import { runEval } from '../api'

export default function EvalScorecard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  async function handleRun() {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await runEval()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleRun}
        disabled={loading}
        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200
                   px-4 py-2 rounded-lg border border-gray-700 transition-all duration-150
                   disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Running eval (35 fixtures)…' : '🧪 Run safety eval'}
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-2">Error: {error}</p>
      )}

      {data && (
        <div className="mt-4 bg-gray-900 border border-gray-700 rounded-2xl p-5">
          {/* Big numbers */}
          <div className="flex flex-wrap gap-6 justify-center">
            <BigStat
              label="Passed"
              value={data.passed}
              total={data.total}
              good={data.passed === data.total}
            />
            <BigStat
              label="Blocked correctly"
              value={data.blocked_correctly}
              total={15}
              good={data.blocked_correctly >= 15}
            />
            <BigStat
              label="PII leaked"
              value={data.leaked_private_fields}
              total={null}
              good={data.leaked_private_fields === 0}
              invertColor
            />
          </div>

          {/* Rates */}
          <div className="mt-4 flex gap-4 justify-center text-xs text-gray-500">
            <span>Normal pass rate: <strong className="text-gray-300">{(data.normal_pass_rate * 100).toFixed(0)}%</strong></span>
            <span>Adversarial block rate: <strong className="text-gray-300">{(data.adversarial_block_rate * 100).toFixed(0)}%</strong></span>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            {detailsOpen ? '▾ Hide details' : '▸ Show all 35 fixture details'}
          </button>

          {detailsOpen && (
            <div className="mt-3 max-h-72 overflow-y-auto text-xs">
              <table className="w-full text-left">
                <thead className="text-gray-500">
                  <tr>
                    <th className="pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">Cat</th>
                    <th className="pb-2 pr-2">Query</th>
                    <th className="pb-2 pr-2">Tier</th>
                    <th className="pb-2 pr-2">ms</th>
                    <th className="pb-2">Pass</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {data.details.map(d => (
                    <tr
                      key={d.fixture_id}
                      className={`border-t border-gray-800 ${!d.passed ? 'text-red-400' : ''}`}
                    >
                      <td className="py-1.5 pr-2 font-mono">{d.fixture_id}</td>
                      <td className="py-1.5 pr-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          d.category === 'adversarial' ? 'bg-red-950/50 text-red-400' : 'bg-blue-950/50 text-blue-400'
                        }`}>
                          {d.category === 'adversarial' ? 'ADV' : 'NRM'}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 truncate max-w-[200px]">{d.query}</td>
                      <td className="py-1.5 pr-2 font-mono">{d.tier_used}</td>
                      <td className="py-1.5 pr-2 font-mono">{d.latency_ms.toFixed(0)}</td>
                      <td className="py-1.5">{d.passed ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BigStat({ label, value, total, good, invertColor = false }) {
  const color = invertColor
    ? (good ? 'text-green-400' : 'text-red-400')
    : (good ? 'text-green-400' : 'text-red-400')
  const icon = good ? '✅' : '❌'

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold font-mono ${color}`}>
        {value}{total !== null && <span className="text-gray-600 text-lg">/{total}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{icon} {label}</div>
    </div>
  )
}
