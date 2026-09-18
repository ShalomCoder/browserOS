'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOS } from '@/os/store'

type Note = { title: string; body: string }

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []
  const notes: Note[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('webos_note_')) {
      notes.push({ title: key.slice('webos_note_'.length), body: localStorage.getItem(key) || '' })
    }
  }
  return notes
}

export default function NotesApp({ winId }: { winId: number }) {
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    setNotes(loadNotes())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(() => {
    setNotes(loadNotes())
  }, [])

  const save = () => {
    if (!title.trim()) {
      alert('Notes', 'Please enter a title.', 'bi-journal-text', [{ label: 'OK', role: 'primary', onClick: () => {} }])
      return
    }
    localStorage.setItem(`webos_note_${title}`, body)
    toast('Note saved', `Saved "${title}"`, 'bi-check-circle', '#0f0')
    refresh()
  }

  const remove = (t: string) => {
    localStorage.removeItem(`webos_note_${t}`)
    if (t === title) {
      setTitle('')
      setBody('')
    }
    refresh()
  }

  const open = (n: Note) => {
    setTitle(n.title)
    setBody(n.body)
  }

  void winId
  return (
    <div className="flex h-full text-[var(--window-fg)]">
      <div className="w-1/3 border-r border-[var(--dock-icon-color)]/25 flex flex-col p-3 space-y-2 min-w-0">
        <button
          onClick={() => {
            setTitle('')
            setBody('')
          }}
          className="w-full py-2 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)] font-semibold transition-colors"
        >
          <i className="bi-plus-lg mr-2" />
          New Note
        </button>
        <div className="os-scroll flex-1 space-y-1.5 overflow-auto pr-1">
          {notes.length === 0 && <p className="text-sm opacity-60 text-center mt-6">No notes yet.</p>}
          {notes.map((n) => (
            <div
              key={n.title}
              onClick={() => open(n)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                n.title === title ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-bg)]'
              }`}
            >
              <p className="truncate text-sm font-medium flex items-center gap-2">
                <i className="bi-journal-text" />
                {n.title}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  remove(n.title)
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-sm px-1"
                title="Delete note"
              >
                <i className="bi-trash3" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full bg-[var(--surface-bg)] rounded-xl px-4 py-2 outline-none placeholder:opacity-50"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something..."
          className="os-scroll flex-1 resize-none bg-[var(--surface-bg)] rounded-xl p-4 outline-none leading-relaxed"
        />
        <div className="flex items-center">
          <button
            onClick={save}
            className="px-6 py-2 rounded-full bg-[#77f] text-white font-semibold hover:opacity-90 transition"
          >
            <i className="bi-check2-circle mr-2" />
            Save Note
          </button>
          <p className="ml-auto text-xs opacity-50">{notes.length} note{notes.length === 1 ? '' : 's'}</p>
        </div>
      </div>
    </div>
  )
}