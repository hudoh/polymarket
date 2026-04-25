import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + process.env.TOKEN_SECRET).digest('hex')
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { data: reset } = await supabase
    .from('password_resets')
    .select('*, users(username)')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!reset) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

  return NextResponse.json({ valid: true, username: (reset.users as any)?.username })
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const { data: reset } = await supabase
      .from('password_resets')
      .select('user_id')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!reset) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    const passwordHash = hashPassword(password)

    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', reset.user_id)
    await supabase.from('password_resets').update({ used: true }).eq('token', token)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
