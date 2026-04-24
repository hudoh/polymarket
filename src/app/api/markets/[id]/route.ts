import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: market } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single()

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })

  // Get all positions for this market
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('market_id', id)

  // Calculate implied probabilities (AMM-style)
  const totalShares = (positions || []).reduce((acc, p) => {
    if (p.shares > 0) acc.push({ outcome: p.outcome_index, shares: Number(p.shares) })
    return acc
  }, [] as { outcome: number; shares: number }[])

  const outcomeVolumes = new Array(market.outcomes.length).fill(0)
  ;(positions || []).forEach((p) => {
    outcomeVolumes[p.outcome_index] += Number(p.shares) * Number(p.avg_price)
  })

  const totalVolume = outcomeVolumes.reduce((a, b) => a + b, 0) || 1
  const probabilities = outcomeVolumes.map((v) => v / totalVolume)

  return NextResponse.json({
    market,
    positions: positions || [],
    probabilities,
    totalVolume,
  })
}
