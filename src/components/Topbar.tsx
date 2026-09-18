'use client'

import { useEffect, useState } from 'react'
import { useOS } from '@/os/store'

export default function Topbar() {
  const user = useOS((s) => s.user)
  const activeMenu = useOS((s) => s.activeMenu)
  const toggleMenu = useOS((s) => s.toggleMenu)
  const toggleScheme = useOS((s) => s.toggleScheme)
  const topbarFloating = useOS((s) => s.topbarFloating)

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div
        className={`os-taskbar fixed flex items-center shadow-md transition-all duration-200 ${
          topbarFloating ? 'top-2 left-2 right-2 px-3 rounded-full' : 'top-0 left-0 right-0 px-2 rounded-none'
        }`}
      >
        <p className="text-sm font-bold">{user?.username || 'user'}</p>
        <div className="ml-auto flex items-center space-x-1">
          <button
            onClick={() => toggleMenu('datetime')}
            className="text-sm font-light hover:bg-white/30 transition-colors duration-200 rounded-full px-2 py-px"
            title="Date & time"
          >
            {time}
          </button>
          <button
            onClick={() => toggleScheme()}
            className="w-6 h-6 hover:bg-white/30 transition-colors duration-200 rounded-full flex items-center justify-center"
            title="Toggle theme"
          >
            <i className="bi-brightness-high" />
          </button>
          <button
            onClick={() => toggleMenu('notifications')}
            className="w-6 h-6 hover:bg-white/30 transition-colors duration-200 rounded-full flex items-center justify-center relative"
            title="Notifications"
          >
            <i className="bi-bell" />
            <NotificationBadge />
          </button>
          <button
            onClick={() => toggleMenu('power')}
            className="w-6 h-6 hover:bg-white/30 transition-colors duration-200 rounded-full flex items-center justify-center"
            title="Power"
          >
            <i className="bi-power" />
          </button>
        </div>
      </div>

      {activeMenu === 'power' && <PowerMenu />}
      {activeMenu === 'notifications' && <NotificationPanel />}
      {activeMenu === 'datetime' && <DatetimePanel />}
    </>
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
    <div className="os-menu-panel fixed top-[45px] right-[10px] w-[400px] max-h-[460px] overflow-auto z-[9999] p-3 space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="font-semibold text-[var(--panel-fg)]">Notifications</p>
        {pile.length > 0 && (
          <button onClick={clearNotifications} className="text-xs opacity-70 hover:opacity-100 text-[var(--panel-fg)]">
            Clear all
          </button>
        )}
      </div>
      {pile.length === 0 && <p className="text-sm text-center opacity-50 py-8 text-[var(--panel-fg)]">No notifications</p>}
      {pile.map((n) => (
        <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--panel-bg)] shadow-[0px_0px_10px_#1113] hover:bg-[var(--surface-hover)] transition-colors duration-200 group text-[var(--panel-fg)]">
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
            className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-xs text-[var(--panel-fg)]"
          >
            <i className="bi-x-lg" />
          </button>
        </div>
      ))}
    </div>
  )
}

function PowerMenu() {
  const openAppByKey = useOS((s) => s.openAppByKey)
  const closeMenus = useOS((s) => s.closeMenus)
  const [busy, setBusy] = useState<'logout' | 'off' | null>(null)

  const go = async (action: 'logout' | 'off') => {
    setBusy(action)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    sessionStorage.setItem('webos_wants_login', '1')
    location.reload()
  }

  const tile = (cls: string) =>
    `w-full h-[75px] px-6 rounded-[1rem] flex flex-col items-center justify-center gap-1 hover:bg-[var(--surface-hover)] transition-colors duration-200 cursor-pointer shadow-[0px_0px_15px_#1113]`

  const row = (cls: string) =>
    `w-full py-2 px-3 rounded-[1rem] flex flex-row items-center col-span-2 hover:bg-[var(--surface-hover)] transition-colors duration-200 cursor-pointer shadow-[0px_0px_15px_#1113]`

  return (
    <div className="os-menu-panel fixed top-[45px] right-[10px] z-[9999] p-3">
      <div className="grid grid-cols-2 gap-2 text-[var(--dock-icon-color)]">
        <button className={tile('')} onClick={() => { closeMenus(); void go('logout') }} title="Logout">
          <i className="bi-arrow-bar-right text-2xl" />
          <p>{busy === 'logout' ? 'Working…' : 'Logout'}</p>
        </button>
        <button
          className={tile('')}
          onClick={() => {
            closeMenus()
            sessionStorage.setItem('webos_wants_login', '1')
            location.reload()
          }}
          title="Lock"
        >
          <i className="bi-lock text-2xl" />
          <p>Lock</p>
        </button>
        <button
          className={row('')}
          onClick={() => {
            closeMenus()
            if (document.fullscreenElement) document.exitFullscreen()
            else document.documentElement.requestFullscreen?.()
          }}
          title="Fullscreen"
        >
          <i className="bi-fullscreen text-lg" />
          <p className="ml-2">Fullscreen</p>
        </button>
        <button
          className={row('')}
          onClick={() => {
            closeMenus()
            location.reload()
          }}
          title="Refresh"
        >
          <i className="bi-arrow-counterclockwise text-lg" />
          <p className="ml-2">Refresh</p>
        </button>
        <button
          className={row('')}
          onClick={() => {
            closeMenus()
            openAppByKey('settings')
          }}
          title="Settings"
        >
          <i className="bi-gear text-lg" />
          <p className="ml-2">Settings</p>
        </button>
        <button
          className={`${row('')} h-[75px] flex-col items-center justify-center text-[#f00] hover:bg-[#f00]/80 hover:text-white font-bold`}
          onClick={() => { closeMenus(); void go('off') }}
          title="Shutdown"
        >
          <i className="bi-power text-2xl" />
          <p>{busy === 'off' ? 'Working…' : 'Shutdown'}</p>
        </button>
      </div>
    </div>
  )
}

function DatetimePanel() {
  const [now, setNow] = useState(new Date())
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const first = new Date(view.y, view.m, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const todayStr = new Date().toDateString()
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const cells: (number | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="fixed top-[45px] bottom-[90px] right-[10px] w-[440px] max-w-[calc(100vw-20px)] z-[9999] rounded-[1.6rem] overflow-x-clip overflow-y-auto p-3"
      style={{ backgroundColor: 'var(--panel-bg)', boxShadow: '0px 0px 15px #1113', backdropFilter: 'blur(18px)' }}
    >
      <div>
        <p className="text-[var(--dock-icon-color)] font-bold" style={{ fontSize: '2.6rem', fontWeight: 100, marginTop: 10 }}>
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-[var(--accent)]" style={{ fontSize: '1rem', fontWeight: 300, marginTop: -2, marginBottom: 35 }}>
          {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="rounded-[2rem] w-auto p-3">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))}
            className="w-10 h-10 rounded-full bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-[var(--panel-fg)]"
          >
            <i className="bi-chevron-left" />
          </button>
          <h2 className="text-xl font-semibold text-[var(--dock-icon-color)]">
            {new Date(view.y, view.m, 1).toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))}
            className="w-10 h-10 rounded-full bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-[var(--panel-fg)]"
          >
            <i className="bi-chevron-right" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold text-[var(--dock-icon-color)] mb-2">
          {weekday.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="text-[var(--dock-icon-color)]" />
            const isToday = new Date(view.y, view.m, day).toDateString() === todayStr
            return (
              <div
                key={i}
                className={`p-1 text-center rounded-full cursor-pointer w-10 h-10 md:w-14 md:h-14 flex items-center justify-center ${
                  isToday
                    ? 'bg-[var(--accent-bg)] text-[var(--panel-fg)] font-bold'
                    : 'hover:bg-[var(--accent-hover)] hover:text-[var(--accent-bg)] text-[var(--dock-icon-color)]'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}