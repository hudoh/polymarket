'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      // Auto-login after register
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json()
      document.cookie = `poly_token=${loginData.token}; path=/; max-age=${7 * 24 * 60 * 60}`
      router.push('/portfolio')
    } catch { setError('Registration failed'); setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Join Polymarket</h1>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm text-amber-300">
        🎉 You start with <strong>$1,000,000</strong> in play money. No purchase required.
      </div>
      <form onSubmit={handleRegister} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 text-slate-900 font-semibold py-2 rounded-lg hover:bg-amber-400 transition disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account + Get $1M'}
        </button>
        <div className="text-center text-sm text-slate-400">
          Already have an account? <a href="/login" className="text-amber-400 hover:underline">Login</a>
        </div>
      </form>
    </div>
  )
}
