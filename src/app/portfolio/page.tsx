'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PortfolioPage() {
  const [user, setUser] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    if (!token) { setLoading(false); return }
    fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setPositions(d.positions || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-slate-400 py-12">Loading...</div>
  if (!user) return (
    <div className="text-center py-16">
      <p className="text-slate-400 mb-4">You must be logged in to view your portfolio.</p>
      <Link href="/login" className="text-amber-400 hover:underline">Login here</Link>
    </div>
  )

  const totalValue = positions.reduce((acc: number, p: any) => {
    if (!p.markets?.resolved) return acc
    const won = p.markets.winning_outcome === p.outcome_index
    return acc + (won ? Number(p.shares) : 0)
  }, 0)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Balance</div>
          <div className="text-2xl font-bold text-amber-400">${(user.fake_balance / 1_000_000).toFixed(2)}M</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Active Positions</div>
          <div className="text-2xl font-bold">{positions.filter((p: any) => !p.markets?.resolved).length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Resolved P&L</div>
          <div className="text-2xl font-bold text-green-400">{totalValue.toLocaleString()}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Your Positions</h2>
      {positions.length === 0 ? (
        <div className="text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">
          No positions yet. <Link href="/" className="text-amber-400 hover:underline">Browse markets</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((p: any) => (
            <Link key={p.id} href={`/markets/${p.market_id}`}>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition">
                <div className="font-medium mb-1">{p.markets?.question}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className={p.markets?.resolved && p.markets?.winning_outcome === p.outcome_index ? 'text-green-400' : 'text-slate-400'}>
                    {p.markets?.outcomes?.[p.outcome_index]}
                  </span>
                  <span className="text-slate-400">{Number(p.shares).toLocaleString()} shares @ ${Number(p.avg_price).toFixed(4)}</span>
                </div>
                {p.markets?.resolved && (
                  <div className="mt-1 text-xs">
                    {p.markets.winning_outcome === p.outcome_index
                      ? <span className="text-green-400">Won! +{Number(p.shares).toLocaleString()}</span>
                      : <span className="text-red-400">Lost</span>}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
