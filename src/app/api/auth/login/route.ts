import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, password_hash, fake_balance')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createToken(user.id, process.env.TOKEN_SECRET || 'polymarket-dev-secret')
    const { password_hash: _, ...safeUser } = user

    return NextResponse.json({ token, user: safeUser })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
