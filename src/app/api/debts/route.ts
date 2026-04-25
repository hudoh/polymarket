import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', auth.userId)

  return NextResponse.json({ debts: debts || [] })
}
