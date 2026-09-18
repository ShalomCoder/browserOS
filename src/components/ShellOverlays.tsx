'use client'

import { useEffect, useState } from 'react'
import { useOS } from '@/os/store'
import { getAppManifest } from '@/os/apps'

export function MinimizedPill() {
  const minimizedList = useOS((s) => s.minimizedList)
  const windows = useOS((s) => s.windows)
  const restoreMinimized = useOS((s) => s.restoreMinimized)
  const [expanded, setExpanded] = useState(false)

  const minimized = minimizedList
    .map((m) => windows.find((w) => w.id === m.id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w))

  if (minimized.length === 0) return null

  return (
    <div
      id="minimizedWindowsPill"
      className={`fixed top-[42px] left-[7px] z-[9999] cursor-pointer transition-all duration-300 bg-[var(--panel-bg)] shadow-[0px_0px_15px_#1113] ${
        expanded ? 'w-[40%] h-fit max-w-[400px]' : 'w-[60px] h-[23px] flex items-center justify-center'
      }`}
      style={{ borderRadius: '1.3rem', mixBlendMode: 'hard-light', backdropFilter: expanded ? 'blur(12px)' : 'none' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {!expanded && (
        <div className="flex items-center justify-center text-[var(--panel-fg)] gap-0.5 select-none">
          <p>&bullet;</p>
          <p>&bullet;</p>
          <p>&bullet;</p>
        </div>
      )}
      {expanded && (
        <div className="w-full h-full p-3 overflow-auto flex-col space-y-2">
          <p className="text-sm font-semibold text-[var(--panel-fg)] select-none">Minimized Windows</p>
          <div className="w-full flex flex-col gap-1.5">
            {minimized.map((w) => {
              const app = getAppManifest(w.appKey)
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    restoreMinimized(w.id)
                    setExpanded(false)
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--surface-bg)] transition-colors text-[var(--panel-fg)]"
                >
                  <i className={`${app?.icon || w.icon || 'bi-app-indicator'} text-lg`} />
                  <span className="text-sm font-medium truncate">{app?.name || w.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

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
      className="os-context-menu fixed w-[260px] overflow-clip h-fit bg-[var(--window-bg)] text-[var(--window-fg)] backdrop-blur-md rounded-[.7rem] z-[99999] divide-[#aaa] divide-y-[1px] shadow-[0px_0px_15px_#1113] *:cursor-default *:select-none"
      style={{ left: Math.min(cm.x, window.innerWidth - 260), top: Math.min(cm.y, window.innerHeight - count * 34 - 60) }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={closeMenus}
    >
      {cm.quick && (cm.quick.copy || cm.quick.cut || cm.quick.paste) && (
        <div className="flex items-center space-x-2 px-2 py-2">
          {cm.quick.copy && (
            <button
              className="context-menu-quick-action hover:bg-[var(--surface-hover)] w-8 h-8 rounded-[.5rem] text-lg transition-colors duration-200"
              title="Copy"
              onClick={() => {
                void navigator.clipboard.writeText(selectedText())
                closeMenus()
              }}
            >
              <i className="bi-copy" />
            </button>
          )}
          {cm.quick.cut && (
            <button
              className="context-menu-quick-action hover:bg-[var(--surface-hover)] w-8 h-8 rounded-[.5rem] text-lg transition-colors duration-200"
              title="Cut"
              onClick={() => closeMenus()}
            >
              <i className="bi-scissors" />
            </button>
          )}
          {cm.quick.paste && (
            <button
              className="context-menu-quick-action hover:bg-[var(--surface-hover)] w-8 h-8 rounded-[.5rem] text-lg transition-colors duration-200"
              title="Paste"
              onClick={() => closeMenus()}
            >
              <i className="bi-clipboard" />
            </button>
          )}
        </div>
      )}
      <div className="py-1">
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
    </div>
  )
}

type CMAction = { label: string; shortcut?: string; icon?: string; run: () => void }

export function openContextAt(x: number, y: number, actions: CMAction[], quick?: { copy?: boolean; cut?: boolean; paste?: boolean }) {
  useOS.getState().setContextMenu({ x, y, actions, quick })
}

function CMItem({ icon, label, shortcut, onClick }: { icon?: string; label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors duration-200 text-[var(--window-fg)]">
      {icon && <i className={`${icon} mr-2 text-sm opacity-70`} />}
      <p className="text-[14px] font-semibold">{label}</p>
      {shortcut && <p className="text-sm ml-auto text-neutral-400">{shortcut}</p>}
    </button>
  )
}

function selectedText(): string {
  return window.getSelection()?.toString() || ''
}