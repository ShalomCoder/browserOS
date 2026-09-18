'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOS } from '@/os/store'
import { installableAppKeys, SYSTEM_APPS } from '@/os/apps'

export default function StoreApp() {
  const user = useOS((s) => s.user)
  const notify = useOS((s) => s.notify)
  const [installed, setInstalled] = useState<string[]>(user?.installedApps || [])
  const [busy, setBusy] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const available = useMemo(() => installableAppKeys(installed), [installed])

  useEffect(() => {
    setInstalled(user?.installedApps || [])
  }, [user])

  const install = async (key: string) => {
    setBusy(key)
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', app: key }),
      })
      const data = await res.json()
      if (data.success) {
        setInstalled(data.installedApps)
        useOS.getState().applyUser({ ...useOS.getState().user!, installedApps: data.installedApps })
        notify('Store', `Installed ${key}`, 'bi-check-circle')
      }
    } finally {
      setBusy(null)
    }
  }

  const list = available.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      <div className="px-4 pt-3">
        <p className="font-bold text-3xl">
          <i className="bi-shop-window mr-2" />
          Store
        </p>
        <p className="text-sm opacity-60 mt-1">Apps you can install. System apps are always available.</p>
        <div className="flex items-center gap-2 mt-3 bg-[var(--surface-bg)] rounded-full px-4 py-2">
          <i className="bi-search text-sm opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="os-scroll flex-1 overflow-auto p-4 space-y-2">
        {list.map((app) => (
          <div key={app.key} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-white/70 text-black flex items-center justify-center shrink-0 shadow-sm">
              <i className={`${app.icon} text-2xl`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{app.name}</p>
              <p className="text-xs opacity-60 truncate">{app.description}</p>
            </div>
            <button
              onClick={() => void install(app.key)}
              disabled={busy === app.key}
              className="px-5 py-2 rounded-full bg-[#77f] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy === app.key ? 'Installing...' : 'Install'}
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-center opacity-50 py-8">
            {installableAppKeys(installed||[]).length === 0 ? 'You have every app installed!' : 'No apps match your search.'}
          </p>
        )}

        <div className="pt-4">
          <p className="text-xs opacity-50 mb-2 uppercase tracking-wide">System apps (always on dock)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SYSTEM_APPS.map((app) => (
              <div key={app.key} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-bg)]/60 text-sm">
                <i className={`${app.icon} text-lg opacity-70`} />
                <span className="truncate">{app.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}