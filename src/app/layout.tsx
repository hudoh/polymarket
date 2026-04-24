import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Polymarket — TheMcQ Edition',
  description: 'Prediction markets for the rest of us. Fake money, real stakes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900">P</div>
            <span className="font-bold text-lg tracking-tight">Polymarket</span>
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">TheMcQ</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-slate-400 hover:text-white transition">Markets</a>
            <a href="/portfolio" className="text-sm text-slate-400 hover:text-white transition">Portfolio</a>
            <a href="/login" className="text-sm bg-white text-slate-900 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 transition">Login</a>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
