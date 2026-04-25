import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomBytes } from 'crypto'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL = 'Polymarket <noreply@updates.mcquillen.net>'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Look up user by email
    const { data: user } = await supabase.from('users').select('id, username, email').eq('email', email).single()

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    }

    // Generate token (24hr expiry)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('password_resets').insert({ user_id: user.id, token, expires_at: expiresAt })

    const resetUrl = `https://polymarket.themcq.ai/reset-password?token=${token}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your Polymarket password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #f59e0b;">Polymarket Password Reset</h2>
            <p>Hi ${user.username},</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #f59e0b; color: #0f2942; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
            <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px;">Your knee caps are still on the table.</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      console.error('Resend error:', await res.text())
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
