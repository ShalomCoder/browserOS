'use client'

import { useEffect, useState } from 'react'
import { useOS } from '@/os/store'
import { getAppManifest } from '@/os/apps'

export default function Topbar() {
  const user = useOS((s) => s.user)
  const windows = useOS((s) => s.windows)
  const focusedId = useOS((s) => s.focusedId)
  const activeMenu = useOS((s) => s.activeMenu)
  const toggleMenu = useOS((s) => s.toggleMenu)
  const closeMenus = useOS((s) => s.closeMenus)
  const dropWindow = useOS((s) => s.closeWindow)
  const restoreMinimized = useOS((s) => s.restoreMinimized)
  const focusWindow = useOS((s) => s.focusWindow)
  const transparentTopbar = useOS((s) => s.settings.transparentTopbar)

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className={`os-taskbar relative flex items-center gap-1 px-2 text-sm ${transparentTopbar ? 'bg-transparent backdrop-blur-0 border-transparent' : ''}`}>
      {/* Left: logo + user */}
      <button onClick={() => toggleMenu('power')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors">
        <i className="bi-windows text-base" />
        <span className="font-semibold tracking-wide hidden sm:inline">browserOS</span>
      </button>
      <div className="w-px h-5 bg-[var(--dock-icon-color)]/20 mx-1" />

      {/* Running window pills */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
        {windows.map((w) => {
          const app = getAppManifest(w.appKey)
          const isActive = focusedId === w.id && !w.minimized
          return (
            <button
              key={w.id}
              onClick={() => (w.minimized ? restoreMinimized(w.id) : isActive ? w.minimized ? restoreMinimized(w.id) : focusWindow(w.id) : focusWindow(w.id))}
              onAuxClick={(e) => {
                if (e.button === 1) dropWindow(w.id)
              }}
              className={`os-pill-expandable flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs ${
                isActive ? 'bg-[var(--surface-active)] font-semibold' : 'opacity-70 hover:bg-[var(--surface-bg)]'
              } ${w.minimized ? 'opacity-40' : ''}`}
              title={app?.name || w.name}
            >
              <i className={`${app?.icon || w.icon || 'bi-app-indicator'} text-sm`} />
              <span className="hidden md:inline truncate max-w-[120px]">{app?.name || w.name}</span>
            </button>
          )
        })}
      </div>

      {/* Right cluster */}
      <button onClick={() => toggleMenu('datetime')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-bg)] transition-colors" title="Date & time">
        <i className="bi-clock hidden sm:inline" />
        <span className="font-medium tabular-nums">{time}</span>
        <span className="hidden md:inline text-xs opacity-70">{dateStr}</span>
      </button>
      <button onClick={() => toggleMenu('notifications')} className="relative px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-bg)] transition-colors" title="Notifications">
        <i className="bi-bell" />
        <NotificationBadge />
      </button>
      <button onClick={() => toggleMenu('power')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-bg)] transition-colors" title="Power">
        <i className="bi-power text-[#ff4d4d]" />
        <span className="hidden lg:inline font-medium">{user?.username}</span>
      </button>

      {activeMenu && (
        <div className="absolute top-full right-0 mt-1 z-50" onClick={(e) => e.stopPropagation()}>
          {activeMenu === 'notifications' && <NotificationPanel />}
          {activeMenu === 'power' && <PowerMenu />}
          {activeMenu === 'datetime' && <DatetimePanel />}
        </div>
      )}
    </div>
  )
}

function NotificationBadge() {
  const count = useOS((s) => s.notificationPile.length)
  if (count === 0) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ff4d4d] text-white text-[10px] flex items-center justify-center font-bold">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function NotificationPanel() {
  const pile = useOS((s) => s.notificationPile)
  const removeNotification = useOS((s) => s.removeNotification)
  const clearNotifications = useOS((s) => s.clearNotifications)
  return (
    <div className="os-glass os-overlay w-[320px] max-h-[420px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="font-semibold">Notifications</p>
        {pile.length > 0 && (
          <button onClick={clearNotifications} className="text-xs opacity-70 hover:opacity-100">
            Clear all
          </button>
        )}
      </div>
      <div className="os-scroll overflow-auto p-2 space-y-1.5">
        {pile.length === 0 && <p className="text-sm text-center opacity-50 py-8">No notifications</p>}
        {pile.map((n) => (
          <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[var(--surface-bg)] group">
            <i className={`${n.icon || 'bi-bell'} text-lg mt-0.5 text-[var(--accent)]`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs opacity-70 break-words">{n.content}</p>
              <p className="text-[10px] opacity-40 mt-0.5">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-xs"
            >
              <i className="bi-x-lg" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PowerMenu() {
  const user = useOS((s) => s.user)
  const [busy, setBusy] = useState<'logout' | 'off' | 'restart' | null>(null)

  const go = async (action: 'logout' | 'off' | 'restart') => {
    setBusy(action)
    if (action === 'logout' || action === 'off') {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
    }
    if (action === 'restart') {
      location.reload()
    } else {
      sessionStorage.setItem('webos_wants_login', '1')
      location.reload()
    }
  }

  return (
    <div className="os-glass os-overlay w-[260px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden p-2">
      <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-bg)] flex items-center justify-center text-xl">
          <i className="bi-person-circle" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{user?.username}</p>
          <p className="text-[11px] opacity-50">{user?.uh ? `#${user.uh.slice(0, 8)}` : ''}</p>
        </div>
      </div>
      <MenuItem icon="bi-box-arrow-right" label="Log out" busy={busy === 'logout'} onClick={() => void go('logout')} />
      <MenuItem icon="bi-power" label="Shut down" danger busy={busy === 'off'} onClick={() => void go('off')} />
      <MenuItem icon="bi-arrow-repeat" label="Restart" busy={busy === 'restart'} onClick={() => void go('restart')} />
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger, busy }: { icon: string; label: string; onClick: () => void; danger?: boolean; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-bg)] disabled:opacity-50 transition-colors ${danger ? 'hover:text-[#ff4d4d]' : ''}`}
    >
      <i className={`${icon} text-base ${danger ? 'text-[#ff4d4d]' : ''}`} />
      {busy ? 'Working…' : label}
    </button>
  )
}

function DatetimePanel() {
  const [now, setNow] = useState(new Date())
  const openAppByKey = useOS((s) => s.openAppByKey)
  const closeMenus = useOS((s) => s.closeMenus)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="os-glass os-overlay w-[300px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden p-5 text-center">
      <p className="text-5xl font-semibold tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-sm opacity-70 mt-1.5">
        {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <p className="text-xs opacity-50 mt-1">{new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
      <button
        onClick={() => {
          closeMenus()
          openAppByKey('calendar')
        }}
        className="mt-4 w-full py-2 rounded-xl bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm"
      >
        <i className="bi-calendar3 mr-2" />
        Open Calendar
      </button>
    </div>
  )
}