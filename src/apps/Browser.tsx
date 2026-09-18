'use client'

import { useState } from 'react'

const HOME = 'about:blank'
const SUGGESTIONS = ['https://wikipedia.org', 'https://duckduckgo.com', 'https://example.com', 'https://html.duckduckgo.com/html/?q=browseros']

export default function BrowserApp() {
  const [url, setUrl] = useState(HOME)
  const [history, setHistory] = useState<string[]>([HOME])
  const [cursor, setCursor] = useState(0)

  const go = (value: string) => {
    let target = value.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target
    const next = [...history.slice(0, cursor + 1), target]
    setUrl(target)
    setHistory(next)
    setCursor(next.length - 1)
  }

  const back = () => {
    if (cursor > 0) {
      setCursor(cursor - 1)
      setUrl(history[cursor - 1])
    }
  }

  const forward = () => {
    if (cursor < history.length - 1) {
      setCursor(cursor + 1)
      setUrl(history[cursor + 1])
    }
  }

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      <div className="flex items-center gap-2 p-2 mb-2">
        <button
          onClick={back}
          disabled={cursor === 0}
          className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] disabled:opacity-40 flex items-center justify-center"
          title="Back"
        >
          <i className="bi-arrow-left" />
        </button>
        <button
          onClick={forward}
          disabled={cursor >= history.length - 1}
          className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] disabled:opacity-40 flex items-center justify-center"
          title="Forward"
        >
          <i className="bi-arrow-right" />
        </button>
        <button
          onClick={() => go(HOME)}
          className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] flex items-center justify-center"
          title="Home"
        >
          <i className="bi-house-door" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[var(--surface-bg)] rounded-full px-4 py-1.5">
          <i className="bi-shield-lock text-xs opacity-60" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(url)}
            className="flex-1 bg-transparent outline-none text-sm"
            spellCheck={false}
          />
        </div>
        <button
          onClick={() => go(url)}
          className="px-4 py-1.5 rounded-full bg-[#77f] text-white text-sm font-semibold hover:opacity-90 transition"
        >
          Go
        </button>
      </div>

      {url === 'about:blank' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <i className="bi-globe2 text-6xl opacity-30" />
          <p className="font-bold text-2xl opacity-60">browserOS Browser</p>
          <p className="text-sm opacity-40">Many sites block being embedded in frames. DuckDuckGo Lite works well.</p>
          <div className="flex gap-2 flex-wrap justify-center max-w-[80%]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => go(s)}
                className="px-4 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-xs transition-colors"
              >
                {s.replace(/^https?:\/\//, '')}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <iframe src={url} className="flex-1 w-full border-none rounded-xl bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation" />
      )}
    </div>
  )
}