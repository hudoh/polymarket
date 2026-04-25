import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

// Polymarket-style AMM pricing
function calculatePrice(shares: number, totalShares: number, liquidity: number): number {
  if (totalShares === 0) return 0.5
  // Simple AMM: price = shares / (shares + liquidity)
  return shares / (shares + liquidity)
}

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { market_id, outcome_index, amount, side } = await req.json()
    // side: 'buy' or 'sell'

    if (amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const MAX_BID = 1_000_000
    if (side === 'buy' && amount > MAX_BID) {
      return NextResponse.json({ error: `Max bid is $${MAX_BID.toLocaleString()}. Those knee caps are non-negotiable.` }, { status: 400 })
    }

    // Get market
    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    if (market.resolved) return NextResponse.json({ error: 'Market resolved' }, { status: 400 })
    if (outcome_index < 0 || outcome_index >= market.outcomes.length) {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.userId)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Calculate cost (AMM buy)
    // We use a simple model: shares = amount / price
    // For simplicity, treat amount as fake $ cost, price as probability 0-1
    // seed liquidity = 1M per outcome, price starts at 0.5
    const baseLiquidity = Number(market.liquidity) / market.outcomes.length
    const { data: existingPos } = await supabase
      .from('positions')
      .select('*')
      .eq('market_id', market_id)
      .eq('user_id', auth.userId)
      .eq('outcome_index', outcome_index)
      .single()

    const currentShares = existingPos ? Number(existingPos.shares) : 0
    const currentAvgPrice = existingPos ? Number(existingPos.avg_price) : 0.5

    let shares: number
    let avgPrice: number
    let cost: number

    if (side === 'buy') {
      // Calculate shares based on AMM curve
      // price = (current_shares + new_shares) / (2 * base_liquidity)
      // Solve for new_shares: new_shares = 2 * base_liquidity * price - current_shares
      // Simplified: use amount as number of shares to buy at current price
      shares = Math.floor(amount / Math.max(currentAvgPrice, 0.01))
      cost = shares * currentAvgPrice

      if (cost > user.fake_balance) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }

      // New average price
      const totalCost = currentShares * currentAvgPrice + cost
      avgPrice = totalCost / (currentShares + shares)

      // Update or insert position
      if (existingPos) {
        await supabase.from('positions').update({ shares: currentShares + shares, avg_price: avgPrice }).eq('id', existingPos.id)
      } else {
        await supabase.from('positions').insert({
          user_id: auth.userId,
          market_id,
          outcome_index,
          shares,
          avg_price: avgPrice,
        })
      }

      // Deduct balance
      await supabase.from('users').update({ fake_balance: user.fake_balance - cost }).eq('id', auth.userId)

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: auth.userId,
        type: 'bet',
        amount: -cost,
        market_id,
        shares,
        outcome_index,
      })

      // Update market volume
      await supabase.from('markets').update({ volume: Number(market.volume) + cost }).eq('id', market_id)
    } else {
      // Sell - reduce position
      shares = Math.min(Math.floor(amount), currentShares)
      const proceeds = shares * currentAvgPrice

      await supabase.from('positions').update({ shares: currentShares - shares }).eq('id', existingPos.id)
      await supabase.from('users').update({ fake_balance: user.fake_balance + proceeds }).eq('id', auth.userId)
      await supabase.from('transactions').insert({
        user_id: auth.userId,
        type: 'bet',
        amount: proceeds,
        market_id,
        shares: -shares,
        outcome_index,
      })
    }

    // Return updated position
    const { data: updatedPos } = await supabase
      .from('positions')
      .select('*')
      .eq('market_id', market_id)
      .eq('user_id', auth.userId)
      .eq('outcome_index', outcome_index)
      .single()

    const { data: updatedUser } = await supabase.from('users').select('fake_balance').eq('id', auth.userId).single()

    return NextResponse.json({
      position: updatedPos,
      balance: updatedUser?.fake_balance,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bet failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
