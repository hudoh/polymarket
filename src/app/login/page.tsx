'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="max-w-md mx-auto mt-16">
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
        </div>
      </form>
    </div>
  )
}
