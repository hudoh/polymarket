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

  // Get positions count per market
  const marketsWithMeta = await Promise.all(
    (markets || []).map(async (m) => {
      const { count } = await supabase
        .from('positions')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', m.id)

      return {
        ...m,
        trader_count: count || 0,
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

    return NextResponse.json({ market })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create market'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
