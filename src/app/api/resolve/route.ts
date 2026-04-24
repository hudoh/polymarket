import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const { market_id, winning_outcome } = await req.json()

    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    if (market.resolved) return NextResponse.json({ error: 'Already resolved' }, { status: 400 })

    // Resolve market
    await supabase.from('markets').update({ resolved: true, winning_outcome }).eq('id', market_id)

    // Payout: winners receive $1 per share, losers get $0
    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('market_id', market_id)

    const winners = (positions || []).filter((p) => p.outcome_index === winning_outcome && Number(p.shares) > 0)
    const losers = (positions || []).filter((p) => p.outcome_index !== winning_outcome && Number(p.shares) > 0)

    // Pay winners: shares * $1 payout
    for (const pos of winners) {
      const payout = Number(pos.shares)
      await supabase.from('users').update({ fake_balance: supabase.rpc('increment_balance', { delta: payout }) }).eq('id', pos.user_id)
      await supabase.from('transactions').insert({
        user_id: pos.user_id,
        type: 'payout',
        amount: payout,
        market_id,
        shares: pos.shares,
        outcome_index: winning_outcome,
      })
    }

    // Update all positions to zero after payout
    await supabase.from('positions').update({ shares: 0 }).eq('market_id', market_id)

    return NextResponse.json({ success: true, winners: winners.length, losers: losers.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resolve failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
