'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [outcomes, setOutcomes] = useState(['', ''])
  const [closeDate, setCloseDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [markets, setMarkets] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [resolveOutcome, setResolveOutcome] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    if (!token) { router.push('/login'); return }
    fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); if (!d.user?.is_admin) router.push('/') })
    fetch('/api/markets').then((r) => r.json()).then((d) => setMarkets(d.markets || []))
  }, [router])

  function updateOutcome(i: number, val: string) {
    const updated = [...outcomes]
    updated[i] = val
    setOutcomes(updated)
  }

  async function createMarket(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    const validOutcomes = outcomes.map((o) => o.trim()).filter(Boolean)
    if (validOutcomes.length < 2) { setError('At least 2 outcomes required'); return }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-admin': 'true' },
      body: JSON.stringify({ question, description, outcomes: validOutcomes, close_date: closeDate || undefined }),
    })
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    setSuccess(`Market created: ${d.market.id}`)
    setQuestion('')
    setDescription('')
    setOutcomes(['', ''])
    fetch('/api/markets').then((r) => r.json()).then((d) => setMarkets(d.markets || []))
  }

  async function resolveMarket(marketId: string) {
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    const winning = resolveOutcome[marketId]
    if (winning === undefined) return
    await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-admin': 'true' },
      body: JSON.stringify({ market_id: marketId, winning_outcome: winning }),
    })
    fetch('/api/markets').then((r) => r.json()).then((d) => setMarkets(d.markets || []))
  }

  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <form onSubmit={createMarket} className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 space-y-4">
        <h2 className="font-semibold text-lg">Create New Market</h2>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            placeholder="e.g. Will Cade finish his presentation in under 3 minutes?" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Outcomes</label>
          {outcomes.map((o, i) => (
            <input key={i} value={o} onChange={(e) => updateOutcome(i, e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mb-2 focus:outline-none focus:border-amber-500"
              placeholder={`Outcome ${i + 1}`} />
          ))}
          <button type="button" onClick={() => setOutcomes([...outcomes, ''])}
            className="text-xs text-amber-400 hover:underline">+ Add outcome</button>
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Close date (optional)</label>
          <input type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}
        <button type="submit" className="bg-amber-500 text-slate-900 font-semibold px-6 py-2 rounded-lg hover:bg-amber-400 transition">
          Create Market
        </button>
      </form>

      <h2 className="font-semibold text-lg mb-4">All Markets</h2>
      <div className="space-y-3">
        {markets.map((m) => (
          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{m.question}</div>
                <div className="text-xs text-slate-500 mt-1">{m.resolved ? `Resolved: ${m.outcomes[m.winning_outcome || 0]}` : 'Open'}</div>
              </div>
            </div>
            {!m.resolved && (
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={resolveOutcome[m.id] ?? ''}
                  onChange={(e) => setResolveOutcome({ ...resolveOutcome, [m.id]: Number(e.target.value) })}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
                >
                  <option value="">Select winner</option>
                  {m.outcomes.map((o: string, i: number) => (
                    <option key={i} value={i}>{o}</option>
                  ))}
                </select>
                <button onClick={() => resolveMarket(m.id)}
                  className="text-sm bg-green-600 hover:bg-green-500 px-3 py-1 rounded transition">
                  Resolve Market
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
