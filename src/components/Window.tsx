'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOS } from '@/os/store'
import { getAppManifest } from '@/os/apps'

type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

type DragState = {
  mode: DragMode
  startX: number
  startY: number
  origX: number
  origY: number
  origW: number
  origH: number
}

export default function Window({ winId, minWidth, minHeight }: { winId: number; minWidth: number; minHeight: number }) {
  const win = useOS((s) => s.windows.find((w) => w.id === winId))
  const focusWindow = useOS((s) => s.focusWindow)
  const closeWindow = useOS((s) => s.closeWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const setWindowPosition = useOS((s) => s.setWindowPosition)
  const setWindowSize = useOS((s) => s.setWindowSize)

  const [drag, setDrag] = useState<DragState | null>(null)

  if (!win) return null
  const active = useOS.getState().focusedId === win.id

  const begin = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.preventDefault()
      void e.stopPropagation()
      setDrag({
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.width,
        origH: win.height,
      })
    },
    [win]
  )

  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      let { origX: x, origY: y, origW: w, origH: h } = drag
      const minW = Math.max(160, minWidth)
      const minH = Math.max(120, minHeight)

      if (drag.mode === 'move') {
        x = drag.origX + dx
        y = Math.max(0, drag.origY + dy)
      } else {
        if (drag.mode.includes('n')) {
          const ny = Math.min(drag.origY + dy, drag.origY + h - minH)
          h = h + (drag.origY - ny)
          y = ny
        }
        if (drag.mode.includes('s')) h = Math.max(minH, drag.origH + dy)
        if (drag.mode.includes('w')) {
          const nx = Math.min(drag.origX + dx, drag.origX + w - minW)
          w = w + (drag.origX - nx)
          x = nx
        }
        if (drag.mode.includes('e')) w = Math.max(minW, drag.origW + dx)
      }

      if (drag.mode === 'move') {
        setWindowPosition(win.id, x, y)
      } else {
        setWindowPosition(win.id, x, y)
        setWindowSize(win.id, w, h)
      }
      if (drag.mode === 'move') document.body.style.userSelect = 'none'
    }
    const onUp = () => {
      setDrag(null)
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
    }
  }, [drag, win.id, minWidth, minHeight, setWindowPosition, setWindowSize])

  if (win.minimized) return null

  const app = getAppManifest(win.appKey)
  const Component = app?.Component

  const style = win.maximized
    ? { zIndex: win.z }
    : { zIndex: win.z, left: win.x, top: win.y, width: win.width, height: win.height }

  const sizeCursors: Record<string, string> = {
    nw: 'cursor-nwse-resize', n: 'cursor-ns-resize', ne: 'cursor-nesw-resize',
    e: 'cursor-ew-resize', se: 'cursor-nwse-resize', s: 'cursor-ns-resize',
    sw: 'cursor-nesw-resize', w: 'cursor-ew-resize',
  }

  return (
    <div
      className={`os-window os-window-open absolute flex flex-col overflow-hidden p-[10px] rounded-[1.3rem] ${win.maximized ? 'inset-0 rounded-none m-0' : ''} ${active ? '' : 'brightness-[0.98] saturate-[0.98]'} ${drag ? 'os-window-resizing' : ''}`}
      style={style}
      onPointerDown={() => focusWindow(win.id)}
    >
      <div
        className="os-window-titlebar relative h-[35px] shrink-0 flex items-center pr-1 pl-3 select-none cursor-move rounded-full"
        onPointerDown={(e) => {
          e.stopPropagation()
          begin('move')(e)
        }}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <p className="flex-1 text-sm font-semibold truncate">{win.title || win.name}</p>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => minimizeWindow(win.id)}
            className="w-7 h-7 rounded-full hover:bg-[var(--panel-bg)] active:bg-[var(--surface-active)] mr-2 transition-colors"
            title="Minimize this Window"
          >
            <i className="bi-dash text-sm" />
          </button>
          <button
            onClick={() => toggleMaximize(win.id)}
            className="w-7 h-7 rounded-full hover:bg-[var(--panel-bg)] active:bg-[var(--surface-active)] mr-2 transition-colors"
            title={win.maximized ? 'Restore down' : 'Maximize'}
          >
            <i className={win.maximized ? 'bi-arrows-angle-contract text-sm' : 'bi-fullscreen text-sm'} />
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            className="w-7 h-7 rounded-full hover:bg-red-500 hover:text-white transition-colors"
            title="Close this Window"
          >
            <i className="bi-x text-lg" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {Component && <Component winId={win.id} />}
      </div>

      {!win.maximized && !win.noResize && (
        <>
          {(['nw', 'ne', 'se', 'sw'] as DragMode[]).map((m) => (
            <div key={m} onPointerDown={begin(m)} className={`absolute w-4 h-4 z-20 ${sizeCursors[m]}`} style={{ [m.includes('w') ? 'left' : 'right']: -0, [m.includes('n') ? 'top' : 'bottom']: -0 }} />
          ))}
          {(['n', 's'] as DragMode[]).map((m) => (
            <div key={m} onPointerDown={begin(m)} className="absolute left-2 right-2 h-1.5 z-20 cursor-ns-resize" style={{ [m === 'n' ? 'top' : 'bottom']: -1 }} />
          ))}
          {(['w', 'e'] as DragMode[]).map((m) => (
            <div key={m} onPointerDown={begin(m)} className="absolute top-2 bottom-2 w-1.5 z-20 cursor-ew-resize" style={{ [m === 'w' ? 'left' : 'right']: -1 }} />
          ))}
        </>
      )}
    </div>
  )
}