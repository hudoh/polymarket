import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase
    .from('users')
    .select('id, username, email, fake_balance, is_admin')
    .eq('id', auth.userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Get all positions with market data
  const { data: positions } = await supabase
    .from('positions')
    .select('*, markets(*)')
    .eq('user_id', auth.userId)
    .gt('shares', 0)

  return NextResponse.json({ user, positions: positions || [] })
}
