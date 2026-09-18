'use client'

import { useState } from 'react'
import type { AppProps } from '@/os/types'

export default function CalculatorApp({ winId }: AppProps) {
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)

  const input = (label: string) => {
    const tokens = {
      'C': 'clear',
      '+/-': 'neg',
      '%': 'pct',
      '÷': '÷',
      '×': '×',
      '-': '-',
      '+': '+',
      '=': 'eq',
      '.': 'dot',
    } as Record<string, string>
    const action = tokens[label] ?? 'digit'
    handle(action, label)
  }

  const handle = (action: string, label?: string) => {
    if (action === 'clear') {
      setDisplay('0')
      setStored(null)
      setOperator(null)
      return
    }
    if (action === 'neg') {
      setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d))
      return
    }
    if (action === 'pct') {
      setDisplay((d) => String(parseFloat(d) / 100))
      return
    }
    if (action === 'digit') {
      setDisplay((d) => (d === '0' ? label! : d.length < 12 ? d + label : d))
      return
    }
    if (action === 'dot') {
      setDisplay((d) => (d.includes('.') ? d : d + '.'))
      return
    }
    if (action === '÷' || action === '×' || action === '-' || action === '+') {
      if (stored != null && operator && display !== '0') {
        compute(parseFloat(display), false)
        return
      }
      setStored(parseFloat(display))
      setOperator(action)
      setDisplay('0')
      return
    }
    if (action === 'eq') {
      if (stored == null || !operator) return
      compute(parseFloat(display), true)
    }
  }

  const compute = (right: number, resetAll = false) => {
    if (stored == null || !operator) return
    const left = stored
    let result = left
    switch (operator) {
      case '÷': result = right === 0 ? NaN : left / right; break
      case '×': result = left * right; break
      case '-': result = left - right; break
      case '+': result = left + right; break
    }
    if (Number.isNaN(result) || !isFinite(result)) {
      setDisplay('Error')
    } else {
      setDisplay(String(Math.round(result * 1e10) / 1e10))
    }
    if (resetAll) {
      setStored(null)
      setOperator(null)
    }
  }

  const grid = [
    ['C', '+/-', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ]

  const styleFor = (label: string) => {
    if (label === '÷' || label === '×' || label === '-' || label === '+')
      return 'bg-orange-400/80 text-white hover:bg-orange-500/90'
    if (label === 'C') return 'bg-red-500/80 text-white hover:bg-red-600/90'
    if (label === '=') return 'bg-green-500/80 text-white hover:bg-green-600/90 col-span-2'
    return 'bg-white/50 text-black hover:bg-white'
  }

  void winId
  return (
    <div className="flex flex-col h-full text-white font-sans">
      <div className="text-right text-5xl mb-4 p-3 rounded-xl bg-white/70 shadow-[0px_0px_10px_#1112] text-black select-none overflow-hidden text-nowrap">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-3 flex-grow">
        {grid.flat().map((label) => (
          <button
            key={label}
            onClick={() => input(label)}
            className={`h-full w-full text-2xl font-bold rounded-full flex items-center justify-center transition-all shadow-[0px_0px_15px_#1113] ${styleFor(label)} ${
              label === '=' ? 'col-span-2' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}