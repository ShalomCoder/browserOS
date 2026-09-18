'use client'

import { useMemo, useState } from 'react'

function monthName(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function CalendarApp() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const first = new Date(view.y, view.m, 1)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const startDay = first.getDay()

  const cells = useMemo(() => {
    const arr: (number | null)[] = []
    for (let i = 0; i < startDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [startDay, daysInMonth])

  const isToday = (d: number) =>
    d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear()

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)] p-2">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))}
          className="w-10 h-10 rounded-full bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-white"
        >
          <i className="bi-chevron-left" />
        </button>
        <h2 className="text-xl font-semibold">{monthName(first)}</h2>
        <button
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))}
          className="w-10 h-10 rounded-full bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-white"
        >
          <i className="bi-chevron-right" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center font-semibold text-[var(--dock-icon-color)] mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`h-full min-h-[34px] text-center rounded-full text-sm flex items-center justify-center ${
              d === null
                ? ''
                : isToday(d)
                  ? 'bg-[var(--accent-bg)] text-white font-bold'
                  : 'hover:bg-[var(--accent-hover)] hover:text-white cursor-pointer'
            }`}
          >
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  )
}