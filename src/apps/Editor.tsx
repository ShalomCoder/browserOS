'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import { useLaunchProps } from '@/os/openers'
import { writeRemote, fileNameFromPath } from '@/os/fs'

export default function EditorApp() {
  const launch = useLaunchProps<{ filePath?: string; initialContent?: string; title?: string }>('editor')
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)

  const initialFile = launch?.filePath || null
  const initialContent = launch?.initialContent || ''

  const [filePath, setFilePath] = useState<string | null>(initialFile)
  const [content, setContent] = useState(initialContent)
  const [filename, setFilename] = useState(initialFile ? fileNameFromPath(initialFile) : 'untitled.txt')
  const fileInput = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length
    return { words, chars: content.length }
  }, [content])

  const save = useCallback(async () => {
    if (filePath) {
      try {
        await writeRemote(filePath, content)
        toast('Editor', `Saved "${filename}"`, 'bi-check-circle', '#0f0')
      } catch (e: any) {
        alert('Editor', e.message, 'bi-exclamation-circle')
      }
    } else {
      const blob = new Blob([content], { type: 'text/plain' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
      toast('Editor', 'Downloaded as a file.', 'bi-download', '#7db7ff')
    }
  }, [content, filePath, filename, toast, alert])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--dock-icon-color)]/15">
        <p className="text-sm opacity-70 flex items-center gap-2 flex-1 min-w-0 truncate">
          <i className="bi-file-earmark-code" />
          {filePath || filename}
        </p>
        <button
          onClick={() => fileInput.current?.click()}
          className="px-3 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm"
          title="Open from this device"
        >
          <i className="bi-folder2-open mr-1" />
          Open
        </button>
        <button
          onClick={() => void save()}
          className="px-3 py-1.5 rounded-full bg-[#77f] text-white text-sm font-semibold hover:opacity-90 transition"
          title="Ctrl+S"
        >
          <i className="bi-save mr-1" />
          Save
        </button>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const reader = new FileReader()
            reader.onload = () => {
              setFilename(f.name)
              setContent(String(reader.result || ''))
              setFilePath(null)
            }
            reader.readAsText(f)
            e.target.value = ''
          }}
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        className="os-scroll flex-1 resize-none bg-transparent outline-none p-4 font-mono text-sm leading-relaxed"
        placeholder="Start typing..."
      />
      <p className="px-3 py-1.5 text-xs opacity-50 border-t border-[var(--dock-icon-color)]/15 font-mono">
        {stats.words} words, {stats.chars} characters — {filename}
      </p>
    </div>
  )
}