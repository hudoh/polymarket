'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Market } from '@/lib/types'
import { OUTCOME_COLORS } from '@/lib/constants'

function formatDollars(n: number): string {
  return '$' + (n / 1_000_000).toFixed(2) + 'M'
}

function timeLeft(closeDate: string): string {
  const diff = new Date(closeDate).getTime() - Date.now()
  if (diff < 0) return 'Closed'
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d left`
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 0) return `${hrs}h left`
  const mins = Math.floor(diff / 60000)
  return `${mins}m left`
}

function ProbabilityBar({ probabilities }: { probabilities: number[] }) {
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      {probabilities.map((p, i) => (
        <div
          key={i}
          style={{ width: `${Math.max(p * 100, 1)}%`, backgroundColor: OUTCOME_COLORS[i % OUTCOME_COLORS.length] }}
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((d) => { setMarkets(d.markets || []); setLoading(false) })
  }, [])

  const open = markets.filter((m) => !m.resolved)
  const resolved = markets.filter((m) => m.resolved)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prediction Markets</h1>
          <p className="text-slate-400 text-sm mt-1">Ask questions. Take positions. Settle for truth.</p>
        </div>
        <Link href="/admin" className="text-sm bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition">
          + New Market
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-400 py-12 text-center">Loading markets...</div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Open Markets</h2>
            {open.length === 0 ? (
              <div className="text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">
                No open markets yet. Create one!
              </div>
            ) : (
              <div className="space-y-3">
                {open.map((m) => (
                  <Link key={m.id} href={`/markets/${m.id}`} className="block">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-base leading-snug">{m.question}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ml-3 shrink-0 ${m.resolved ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {m.resolved ? 'Resolved' : timeLeft(m.close_date)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <ProbabilityBar probabilities={(m as any).probabilities || new Array(m.outcomes.length).fill(1 / m.outcomes.length)} />
                      </div>
                      <div className="flex gap-4 text-sm font-semibold">
                        {m.outcomes.slice(0, 4).map((o, i) => (
                          <span key={i} style={{ color: OUTCOME_COLORS[i % OUTCOME_COLORS.length] }}>
                            {o} {( ((m as any).probabilities?.[i] || 0.5) * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {formatDollars((m as any).volume || 0)} traded · {(m as any).trader_count || 0} traders
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {resolved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Resolved</h2>
              <div className="space-y-2">
                {resolved.map((m) => (
                  <Link key={m.id} href={`/markets/${m.id}`}>
                    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition opacity-70">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{m.question}</span>
                        <span className="text-xs text-green-400">
                          ✓ {m.outcomes[m.winning_outcome || 0]}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
