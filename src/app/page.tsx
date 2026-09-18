'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import { applyScheme } from '@/os/theming'
import Login from '@/components/Login'
import Boot from '@/components/Boot'
import Desktop from '@/components/Desktop'

type Phase = 'checking' | 'login' | 'boot' | 'desktop'

export default function Home() {
  const [phase, setPhase] = useState<Phase>('checking')
  const bootedRef = useRef(false)

  const isMobile = () =>
    typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)

  const startBoot = useCallback(async () => {
    if (bootedRef.current) return
    bootedRef.current = true
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const data = await res.json()
      if (!data.success || !data.user) {
        bootedRef.current = false
        setPhase('login')
        return
      }
      const user = data.user
      useOS.getState().setMobile(isMobile())

      const themeRes = await fetch(`/api/themes/${encodeURIComponent(user.theme)}`, { cache: 'no-store' })
      const themeData = themeRes.ok ? (await themeRes.json()).theme : null
      if (!themeData) {
        setPhase('login')
        return
      }

      useOS.getState().boot(user, themeData, isMobile())
      const scheme = useOS.getState().schemeName
      const s = themeData.schemes[scheme]
      if (s) applyScheme(s)

      setPhase('boot')
      window.setTimeout(() => setPhase('desktop'), 2800)
    } catch {
      bootedRef.current = false
      setPhase('login')
    }
  }, [])

  useEffect(() => {
    void startBoot()
  }, [startBoot])

  useEffect(() => {
    const onResize = () => useOS.getState().setMobile(isMobile())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (phase === 'checking') {
    return (
      <main className="os-shell flex items-center justify-center" style={{ background: '#05050c' }}>
        <div className="flex items-center gap-3 text-white/70 text-sm">
          <i className="bi-arrow-repeat animate-spin" />
          Checking session…
        </div>
      </main>
    )
  }

  if (phase === 'login') {
    return (
      <main className="os-shell">
        <Login onAuthed={() => void startBoot()} />
      </main>
    )
  }

  if (phase === 'boot') {
    return (
      <main className="os-shell">
        <Boot />
      </main>
    )
  }

  return (
    <main className="os-shell">
      <Desktop />
    </main>
  )
}