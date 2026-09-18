'use client'

import { APP_MANIFEST, SYSTEM_APPS } from '@/os/apps'
import { useOS } from '@/os/store'

export default function Dock() {
  const user = useOS((s) => s.user)
  const openAppByKey = useOS((s) => s.openAppByKey)
  const windows = useOS((s) => s.windows)

  const installed = user?.installedApps || []
  const apps = [
    ...APP_MANIFEST.filter((a) => !a.system && installed.includes(a.key)),
    ...SYSTEM_APPS.filter((a) => a.key === 'settings' || a.key === 'store' || a.key === 'taskmanager'),
  ]

  const running = (key: string) => windows.some((w) => w.appKey === key)
  const minimized = (key: string) => windows.some((w) => w.appKey === key && w.minimized)

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="os-dock flex items-end gap-1 rounded-2xl px-2.5 py-2 shadow-2xl">
        {apps.map((app) => (
          <button key={app.key} onClick={() => openAppByKey(app.key)} className={`os-dock-icon relative flex flex-col items-center w-12 py-1 rounded-xl ${running(app.key) && !minimized(app.key) ? 'bg-[var(--surface-bg)]/70' : ''}`} title={app.name}>
            <span className="w-9 h-9 rounded-xl bg-[var(--surface-bg)] text-[var(--accent)] flex items-center justify-center text-xl shadow-sm">
              <i className={app.icon} />
            </span>
            <span className="os-dock-label absolute top-[-26px] left-1/2 w-max max-w-[140px] rounded-lg bg-[var(--panel-bg)] text-[var(--panel-fg)] backdrop-blur px-2 py-1 text-xs font-medium shadow-lg">
              {app.name}
            </span>
            {running(app.key) && <span className={`os-dock-running ${minimized(app.key) ? 'opacity-40' : ''}`} />}
          </button>
        ))}
      </div>
    </div>
  )
}