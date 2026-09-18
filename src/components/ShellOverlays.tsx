'use client'

import { useEffect } from 'react'
import { useOS } from '@/os/store'

export function Toasts() {
  const toasts = useOS((s) => s.toasts)
  const dismissToast = useOS((s) => s.dismissToast)
  return (
    <div className="absolute right-3 top-[calc(var(--taskbar-h,40px)+10px)] z-[45] flex flex-col gap-2 w-[300px] max-w-[90vw]">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismissToast(t.id)} className="os-toast os-glass w-full text-left rounded-2xl p-3 shadow-xl border border-white/10 hover:brightness-105 flex items-start gap-3">
          <i className={`${t.icon} text-xl mt-0.5`} style={{ color: t.iconColor }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.content && <p className="text-xs opacity-70 break-words mt-0.5">{t.content}</p>}
          </div>
          <i className="bi-x text-xs opacity-40 mt-0.5" />
        </button>
      ))}
    </div>
  )
}

export function Alerts() {
  const alerts = useOS((s) => s.alerts)
  const alertOpenId = useOS((s) => s.alertOpenId)
  const closeAlert = useOS((s) => s.closeAlert)
  const current = alerts.find((a) => a.id === alertOpenId)

  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const primary = current.buttons.find((b) => b.role === 'primary')
        primary?.onClick?.()
        closeAlert(current.id)
      }
      if (e.key === 'Escape') closeAlert(current.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, closeAlert])

  if (!current) return null

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="os-overlay os-glass w-[min(92vw,380px)] rounded-3xl shadow-2xl border border-white/10 p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <i className={`${current.icon || 'bi-exclamation-circle'} text-4xl mb-2`} style={{ color: current.color }} />
          <p className="text-lg font-bold">{current.title}</p>
        </div>
        <p className="text-sm opacity-80 text-center whitespace-pre-wrap break-words mb-6">{current.message}</p>
        <div className="flex justify-center gap-2">
          {current.buttons.map((b) => (
            <button
              key={b.label}
              onClick={() => {
                b.onClick?.()
                closeAlert(current.id)
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                b.role === 'primary'
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function GlobalContextMenu() {
  const cm = useOS((s) => s.contextMenu)
  const closeMenus = useOS((s) => s.closeMenus)

  if (!cm) return null
  const count = cm.actions.length + (cm.quick?.copy ? 1 : 0) + (cm.quick?.cut ? 1 : 0) + (cm.quick?.paste ? 1 : 0)
  if (count === 0) return null

  return (
    <div
      className="os-context-menu os-glass fixed rounded-xl shadow-2xl border border-white/10 py-1.5 min-w-[180px] z-[70]"
      style={{ left: Math.min(cm.x, window.innerWidth - 200), top: Math.min(cm.y, window.innerHeight - count * 34 - 16) }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={closeMenus}
    >
      {cm.quick?.copy && <CMItem icon="bi-copy" label="Copy" onClick={() => { void navigator.clipboard.writeText(selectedText()); closeMenus() }} />}
      {cm.quick?.cut && <CMItem icon="bi-scissors" label="Cut" onClick={() => { closeMenus() }} />}
      {cm.quick?.paste && <CMItem icon="bi-clipboard" label="Paste" onClick={() => { closeMenus() }} />}
      {cm.actions.map((a) => (
        <CMItem
          key={a.label}
          icon={a.icon}
          label={a.label}
          onClick={() => {
            a.run()
            closeMenus()
          }}
          shortcut={a.shortcut}
        />
      ))}
    </div>
  )
}

type CMAction = { label: string; shortcut?: string; icon?: string; run: () => void }

export function openContextAt(x: number, y: number, actions: CMAction[], quick?: { copy?: boolean; cut?: boolean; paste?: boolean }) {
  useOS.getState().setContextMenu({ x, y, actions, quick })
}

function CMItem({ icon, label, shortcut, onClick }: { icon?: string; label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-[var(--surface-bg)] transition-colors">
      {icon && <i className={`${icon} text-sm opacity-70`} />}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[11px] opacity-40">{shortcut}</span>}
    </button>
  )
}

function selectedText(): string {
  return window.getSelection()?.toString() || ''
}