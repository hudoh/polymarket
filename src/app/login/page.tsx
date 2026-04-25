'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      document.cookie = `poly_token=${d.token}; path=/; max-age=${7 * 24 * 60 * 60}`
      router.push('/portfolio')
    } catch { setError('Login failed'); setLoading(false) }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
    const d = await res.json()
    setForgotLoading(false)
    setForgotMsg(d.message || d.error)
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Reset Password</h2>
            <p className="text-slate-400 text-sm mb-4">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleForgot} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="your@email.com"
                required
              />
              {forgotMsg && <div className="text-slate-300 text-sm bg-slate-800 px-4 py-3 rounded-lg">{forgotMsg}</div>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold py-3 rounded-lg transition"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotMsg('') }}
                  className="px-4 py-3 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-center">Login to Polymarket</h1>
      <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 text-slate-900 font-semibold py-2 rounded-lg hover:bg-amber-400 transition disabled:opacity-50">
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-center text-sm text-slate-400">
          No account? <a href="/register" className="text-amber-400 hover:underline">Register</a>
          <span className="mx-2">·</span>
          <button type="button" onClick={() => setShowForgot(true)} className="text-slate-400 hover:text-amber-400 transition">Forgot password?</button>
        </div>
      </form>
    </div>
  )
}
