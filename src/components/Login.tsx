'use client'

import { useState } from 'react'
import { useOS } from '@/os/store'

export default function Login({ onAuthed }: { onAuthed: (data: { username: string; uh: string }) => void }) {
  const toast = useOS((s) => s.toast)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message || 'Login failed')
        setBusy(false)
        return
      }
      toast('Welcome back', `Signed in as ${data.username}`, 'bi-person-check', '#0f0')
      onAuthed({ username: data.username, uh: data.uh })
    } catch {
      setError('Network error — is the server running?')
      setBusy(false)
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(circle at 30% 20%, #1d2b53 0%, #05050c 60%, #000 100%)' }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("/sample-wallpapers/ventura.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <form onSubmit={submit} className="os-glass relative w-[min(92vw,400px)] rounded-3xl p-8 shadow-2xl border border-white/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-4xl text-[var(--accent,#00f)] shadow-lg mb-3">
            <i className="bi-windows" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">browserOS</h1>
          <p className="text-sm opacity-60 mt-1">Sign in to continue</p>
        </div>

        <label className="block mb-1 text-xs opacity-70 font-medium">Username</label>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 mb-3 border border-white/10 focus-within:border-[var(--accent,#00f)] transition-colors">
          <i className="bi-person text-sm opacity-60" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 bg-transparent py-2.5 outline-none text-sm placeholder:opacity-40"
            placeholder="ask_vd"
            autoFocus
          />
        </div>

        <label className="block mb-1 text-xs opacity-70 font-medium">Password</label>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 mb-1 border border-white/10 focus-within:border-[var(--accent,#00f)] transition-colors">
          <i className="bi-lock text-sm opacity-60" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent py-2.5 outline-none text-sm placeholder:opacity-40"
            placeholder="••••••"
          />
        </div>

        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full mt-6 py-3 rounded-xl bg-[var(--accent,#00f)] text-white font-semibold hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all"
        >
          {busy ? <><i className="bi-arrow-repeat animate-spin mr-2" />Signing in…</> : <>Sign in</>}
        </button>

        <p className="text-[11px] opacity-50 text-center mt-5">
          Demo accounts — <b>ask_vd / webos</b> or <b>user / user</b>
        </p>
      </form>
    </div>
  )
}