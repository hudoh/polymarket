'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PortfolioPage() {
  const [user, setUser] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    if (!token) { setLoading(false); return }
    fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setPositions(d.positions || []); setLoading(false) })
  }, [])

  async function requestFunds() {
    const token = document.cookie.split('; ').find((r) => r.startsWith('poly_token='))?.split('=')[1]
    if (!token) return
    setRequesting(true)
    try {
      const res = await fetch('/api/funds/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setUser((u: any) => ({ ...u, fake_balance: data.new_balance }))
        alert(data.message)
        setShowModal(false)
      } else {
        alert(data.error || 'Something went wrong')
      }
    } finally {
      setRequesting(false)
    }
  }

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
      {/* Fund Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">💰 Request $1M More Funds</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-400 font-semibold mb-2">⚠️ Important Terms</p>
              <p className="text-slate-300 text-sm">
                You are about to borrow <span className="text-amber-400 font-bold">$1,000,000</span> from <span className="text-white font-bold">Bruce McQuillen</span>.
              </p>
              <p className="text-slate-300 text-sm mt-2">
                Interest rate: <span className="text-red-400 font-bold">21% per month</span>
              </p>
              <p className="text-slate-300 text-sm mt-2">
                Collateral: <span className="text-red-400 font-bold">Your knee caps</span>
              </p>
              <p className="text-slate-400 text-xs mt-3 italic">
                Max bid per market is $1,000,000. This is not financial advice. Bruce is not responsible for any financial ruin, emotional breakdowns, or spontaneous dancing.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={requestFunds}
                disabled={requesting}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold py-3 rounded-lg transition"
              >
                {requesting ? 'Processing...' : 'Sign Away My Knee Caps 🤝'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-3 text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Balance</div>
          <div className="text-2xl font-bold text-amber-400">${(user.fake_balance / 1_000_000).toFixed(2)}M</div>
          {user.fake_balance < 500_000 && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition w-full"
            >
              + Request $1M from Bruce
            </button>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-sm text-slate-400 mb-1">Active Positions</div>
          <div className="text-2xl font-bold text-white">{positions.filter((p: any) => !p.markets?.resolved).length}</div>
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
                <div className="font-medium mb-1 text-white">{p.markets?.question}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className={p.markets?.resolved && p.markets?.winning_outcome === p.outcome_index ? 'text-green-400' : 'text-white'}>
                    {p.markets?.outcomes?.[p.outcome_index]}
                  </span>
                  <span className="text-slate-200">{Number(p.shares).toLocaleString()} shares @ <span className="text-amber-400">${Number(p.avg_price).toFixed(4)}</span></span>
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
