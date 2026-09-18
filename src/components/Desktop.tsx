'use client'

import { useEffect, useState } from 'react'
import { useOS } from '@/os/store'
import { APP_MANIFEST, getAppManifest } from '@/os/apps'
import { openContextAt } from '@/components/ShellOverlays'
import Window from '@/components/Window'
import Dock from '@/components/Dock'
import Topbar from '@/components/Topbar'
import { Toasts, Alerts, GlobalContextMenu, MinimizedPill } from '@/components/ShellOverlays'

export default function Desktop() {
  const user = useOS((s) => s.user)
  const windows = useOS((s) => s.windows)
  const closeMenus = useOS((s) => s.closeMenus)
  const openAppByKey = useOS((s) => s.openAppByKey)

  const [selected, setSelected] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [reel, setReel] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenus()
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMenus])

  const desktopIcons = [
    ...APP_MANIFEST.filter((a) => !a.system && (user?.installedApps || []).includes(a.key)),
    ...APP_MANIFEST.filter((a) => a.system && (a.key === 'settings' || a.key === 'store')),
  ]

  const onDesktopContext = (e: React.MouseEvent) => {
    e.preventDefault()
    closeMenus()
    openContextAt(e.clientX, e.clientY, [
      { label: 'Refresh', icon: 'bi-arrow-counterclockwise', shortcut: 'F5', run: () => {} },
      { label: 'Open Terminal', icon: 'bi-terminal', run: () => openAppByKey('terminal') },
      { label: 'Personalize', icon: 'bi-palette', run: () => openAppByKey('settings') },
    ])
  }

  return (
    <div
      className="os-desktop os-desktop-root"
      onContextMenu={onDesktopContext}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        closeMenus()
        setSelected(null)
        setReel({ x: e.clientX, y: e.clientY })
        setMarquee({ x: e.clientX, y: e.clientY, w: 0, h: 0 })
        if (!e.shiftKey) setSelected(null)
      }}
      onPointerMove={(e) => {
        if (reel && marquee) {
          setMarquee({
            x: Math.min(reel.x, e.clientX),
            y: Math.min(reel.y, e.clientY),
            w: Math.abs(e.clientX - reel.x),
            h: Math.abs(e.clientY - reel.y),
          })
        }
      }}
      onPointerUp={() => {
        setReel(null)
        setMarquee(null)
      }}
    >
      <Topbar />

      {/* Minimized windows pill */}
      <MinimizedPill />

      {/* Desktop icons */}
      <div className="absolute top-[calc(var(--taskbar-h,40px)+10px)] left-3 flex flex-col gap-1 z-[1]" onPointerDown={(e) => e.stopPropagation()}>
        {desktopIcons.map((app) => {
          const on = selected === app.key
          return (
            <button
              key={app.key}
              className={`os-desktop-icon w-[92px] ${on ? 'bg-[var(--surface-bg)]' : ''}`}
              style={{ position: 'static' }}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(app.key)
              }}
              onDoubleClick={() => {
                setSelected(null)
                openAppByKey(app.key)
              }}
              title={app.name}
            >
              <span className="icon-tile">
                <i className={app.icon} />
              </span>
              <span className="icon-label">{app.name}</span>
            </button>
          )
        })}
      </div>

      {/* Windows */}
      {windows.map((w) => {
        const app = getAppManifest(w.appKey)
        return <Window key={w.id} winId={w.id} minWidth={app?.minWidth || 300} minHeight={app?.minHeight || 200} />
      })}

      {/* Marquee selection */}
      {marquee && marquee.w + marquee.h > 6 && (
        <div className="os-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      )}

      {/* Dock */}
      <Dock />

      {/* Overlays */}
      <Toasts />
      <Alerts />
      <GlobalContextMenu />
    </div>
  )
}