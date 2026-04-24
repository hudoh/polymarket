'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Market, Position } from '@/lib/types'
import { OUTCOME_COLORS } from '@/lib/constants'

export default function MarketPage() {
  const { id } = useParams()
  const [market, setMarket] = useState<Market | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [probs, setProbs] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState<Record<number, number>>({})
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState(''  )

  useEffect(() => {
    const t = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    setToken(t || null)
    fetch(`/api/markets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMarket(d.market)
        setPositions(d.positions || [])
        setProbs(d.probabilities || [])
        setLoading(false)
      })
    if (t) {
      fetch('/api/portfolio', { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => r.json())
        .then((d) => { setUser(d.user); setBalance(d.user?.fake_balance || 0) })
    }
  }, [id])

  async function placeBet(outcomeIndex: number, side: 'buy' = 'buy') {
    if (!token) { setError('Login required'); return }
    const amt = amount[outcomeIndex] || 0
    if (amt <= 0) return

    setError('')
    const res = await fetch('/api/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ market_id: id, outcome_index: outcomeIndex, amount: amt, side }),
    })
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    setBalance(d.balance)
    // Refresh market data
    const updated = await fetch(`/api/markets/${id}`).then((r) => r.json())
    setMarket(updated.market)
    setPositions(updated.positions || [])
    setProbs(updated.probabilities || [])
  }

  if (loading) return <div className="text-slate-400 py-12">Loading...</div>
  if (!market) return <div className="text-slate-400 py-12">Market not found</div>

  // User's positions
  const myPositions: Record<number, number> = {}
  positions.filter((p) => p.user_id === user?.id).forEach((p) => { myPositions[p.outcome_index] = Number(p.shares) })

  return (
    <div>
      <a href="/" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">← Back to markets</a>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{market.question}</h1>
        {market.description && <p className="text-slate-400 text-sm">{market.description}</p>}
        <div className="mt-2 text-xs text-slate-500">Close: {new Date(market.close_date).toLocaleString()}</div>
      </div>

      {user && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400">Your balance</span>
            <div className="text-xl font-bold text-amber-400">${(balance / 1_000_000).toFixed(2)}M</div>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>
      )}

      <div className="space-y-3">
        {market.outcomes.map((outcome, i) => {
          const prob = probs[i] || 0.5
          const myPos = myPositions[i] || 0
          const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length]
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-base text-white">{outcome}</span>
                  {market.resolved && market.winning_outcome === i && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-medium">WINNER</span>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color }}>{(prob * 100).toFixed(0)}%</div>
                  {myPos > 0 && <div className="text-xs text-slate-400">{myPos.toLocaleString()} shares</div>}
                </div>
              </div>

              <div className="h-3 rounded-full overflow-hidden bg-slate-700 mb-4">
                <div className="h-full rounded-full transition-all" style={{ width: `${prob * 100}%`, backgroundColor: color }} />
              </div>

              {!market.resolved && user && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Shares"
                    value={amount[i] || ''}
                    onChange={(e) => setAmount({ ...amount, [i]: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-500">
                    Cost: ${((amount[i] || 0) * prob).toFixed(0)}
                  </span>
                  <button
                    onClick={() => placeBet(i, 'buy')}
                    className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-1.5 rounded-lg transition"
                  >
                    Buy
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
