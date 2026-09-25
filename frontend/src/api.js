// Configurable API base — change for demo laptop IP without a rebuild
const BASE_URL = ''   // empty = same origin (Vite proxy handles dev)

export async function searchEntities(query, k = 10) {
  const t0 = performance.now()
  const resp = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, k }),
  })
  const latencyMs = Math.round(performance.now() - t0)

  if (!resp.ok) {
    const detail = await resp.text()
    throw new Error(`${resp.status}: ${detail}`)
  }

  const data = await resp.json()
  data._latency_ms = latencyMs
  return data
}

export async function runEval() {
  const resp = await fetch(`${BASE_URL}/eval/run`, { method: 'POST' })
  if (!resp.ok) {
    const detail = await resp.text()
    throw new Error(`${resp.status}: ${detail}`)
  }
  return resp.json()
}
