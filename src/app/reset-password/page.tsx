'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null)
  const [step, setStep] = useState<'verify' | 'reset' | 'done'>('verify')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setError('No token provided'); return }
    setToken(t)
    fetch(`/api/auth/reset-password?token=${t}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) { setUsername(d.username || ''); setStep('reset') }
        else { setError(d.error || 'Invalid token') }
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.success) setStep('done')
    else setError(data.error || 'Reset failed')
  }

  if (error && !token) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-white mb-4">Invalid Reset Link</h1>
        <p className="text-slate-400 mb-6">This reset link is invalid or has expired.</p>
        <Link href="/login" className="text-amber-400 hover:underline">Back to Login</Link>
      </div>
    </div>
  )

  if (step === 'done') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-white mb-2">Password Reset!</h1>
        <p className="text-slate-400 mb-6">Your knee caps are safe for now.</p>
        <Link href="/login" className="text-amber-400 hover:underline">Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
        {username && <p className="text-slate-400 text-sm mb-6">Resetting password for <span className="text-white">{username}</span></p>}

        {step === 'verify' && (
          <div className="text-slate-400 text-center py-8">Verifying token...</div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-sm text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold py-3 rounded-lg transition"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm">← Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
