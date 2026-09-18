'use client'

import { useOS } from '@/os/store'

export default function TaskManagerApp() {
  const windows = useOS((s) => s.windows)
  const closeWindow = useOS((s) => s.closeWindow)

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)] p-2">
      <div className="flex items-center mb-3">
        <p className="font-bold text-2xl">
          <i className="bi-cpu mr-2" />
          Task Manager
        </p>
        <p className="ml-auto text-xs opacity-60">{windows.length} process{windows.length === 1 ? '' : 'es'} running</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[var(--dock-icon-color)]/30">
            <th className="py-2 px-3 font-semibold">App</th>
            <th className="py-2 px-3 font-semibold">Window ID</th>
            <th className="py-2 px-3 font-semibold text-right">End Task</th>
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => (
            <tr key={w.id} className="border-b border-[var(--dock-icon-color)]/10 hover:bg-[var(--surface-bg)] transition-colors">
              <td className="py-2 px-3">
                <i className={`mr-2 ${w.icon || 'bi-window'}`} />
                {w.name}
              </td>
              <td className="py-2 px-3 opacity-60">#{w.id}</td>
              <td className="py-2 px-3 text-right">
                <button
                  onClick={() => closeWindow(w.id)}
                  className="px-3 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs font-semibold transition-colors"
                >
                  End Task
                </button>
              </td>
            </tr>
          ))}
          {windows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center opacity-50">
                No windows are open.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}