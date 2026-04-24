import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { INITIAL_BALANCE } from '@/lib/constants'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 chars' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be 8+ chars' }, { status: 400 })
    }

    const password_hash = await hashPassword(password)

    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username or email taken' }, { status: 409 })
    }

    // Create user with initial balance
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash,
        fake_balance: INITIAL_BALANCE,
      })
      .select()
      .single()

    if (error) throw error

    // Log initial deposit transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'initial',
      amount: INITIAL_BALANCE,
    })

    return NextResponse.json({ user: { id: user.id, username, email, fake_balance: INITIAL_BALANCE } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
