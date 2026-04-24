import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const { data: markets, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all positions with market_id for probability computation
  const { data: allPositions } = await supabase
    .from('positions')
    .select('market_id, outcome_index, shares, avg_price')
    .gt('shares', 0)

  // Build a map of market_id -> positions
  const positionsByMarket: Record<string, any[]> = {}
  ;(allPositions || []).forEach((p) => {
    if (!positionsByMarket[p.market_id]) positionsByMarket[p.market_id] = []
    positionsByMarket[p.market_id].push(p)
  })

  const marketsWithMeta = await Promise.all(
    (markets || []).map(async (m) => {
      const { count } = await supabase
        .from('positions')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', m.id)

      // Compute probabilities AMM-style
      const positions = positionsByMarket[m.id] || []
      const outcomeVolumes = new Array(m.outcomes.length).fill(0)
      positions.forEach((p: any) => {
        outcomeVolumes[p.outcome_index] += Number(p.shares) * Number(p.avg_price)
      })
      const totalVolume = outcomeVolumes.reduce((a: number, b: number) => a + b, 0) || 1
      const probabilities = outcomeVolumes.map((v: number) => v / totalVolume)

      return {
        ...m,
        trader_count: count || 0,
        probabilities,
      }
    })
  )

  return NextResponse.json({ markets: marketsWithMeta })
}

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const { question, description, outcomes, close_date } = await req.json()

    if (!question || !outcomes || outcomes.length < 2) {
      return NextResponse.json({ error: 'Question and at least 2 outcomes required' }, { status: 400 })
    }

    const { data: market, error } = await supabase
      .from('markets')
      .insert({
        question,
        description,
        outcomes,
        close_date,
        created_by: auth.userId,
        liquidity: 1000000, // 1M fake liquidity seed
        volume: 0,
      })
      .select()
      .single()

    if (error) throw error

    // Find or create protocol user for AMM seeding
    let { data: protocolUser } = await supabase
      .from('users')
      .select('id')
      .eq('is_protocol', true)
      .single()

    if (!protocolUser) {
      const { data: newUser, error: userErr } = await supabase
        .from('users')
        .insert({ username: 'protocol', email: 'protocol@polymarket.app', password_hash: 'protocol', fake_balance: 0, is_protocol: true })
        .select('id')
        .single()
      if (userErr) throw userErr
      protocolUser = newUser
    }

    // Seed 1 share of each outcome at $1 (equal probability)
    const seedPositions = outcomes.map((_: string, i: number) => ({
      user_id: protocolUser!.id,
      market_id: market.id,
      outcome_index: i,
      shares: 1,
      avg_price: 1,
    }))

    const { error: seedErr } = await supabase.from('positions').insert(seedPositions)
    if (seedErr) throw seedErr

    return NextResponse.json({ market })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create market'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
