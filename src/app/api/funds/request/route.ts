import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Grant $1M fake dollars
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('fake_balance')
    .eq('id', auth.userId)
    .single()

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const { error: updateErr } = await supabase
    .from('users')
    .update({ fake_balance: user!.fake_balance + 1_000_000 })
    .eq('id', auth.userId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Record the debt
  await supabase.from('debts').insert({
    user_id: auth.userId,
    amount: 1_000_000,
    creditor_name: 'Bruce McQuillen',
    rate_monthly_percent: 21.00,
  })

  return NextResponse.json({
    success: true,
    message: 'You now owe Bruce McQuillen $1,000,000 at 21% per month. Those knee caps are collateral.',
    new_balance: user!.fake_balance + 1_000_000,
  })
}
