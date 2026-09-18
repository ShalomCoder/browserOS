'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOS } from '@/os/store'
import { openAppByKeyWithProps } from '@/os/openers'
import {
  listDir,
  readRemote,
  createFileRemote,
  createFolderRemote,
  deleteRemote,
  renameRemote,
  joinDir,
  parentDir,
  IMAGE_EXTS,
  TEXT_EXTS,
} from '@/os/fs'

let winSeq = 1

export default function FilesApp() {
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)
  const [path, setPath] = useState('/')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (dir: string) => {
    setLoading(true)
    setError('')
    try {
      const list = await listDir(dir)
      setItems(list)
      setPath(dir)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load('/')
  }, [load])

  const open = async (name: string, type: string) => {
    const full = joinDir(path, name)
    if (type === 'folder') {
      if (name === '..') void load(parentDir(path))
      else void load(full)
      return
    }
    if (IMAGE_EXTS.test(name)) {
      openAppByKeyWithProps('photos', { dir: path, start: name })
      return
    }
    if (TEXT_EXTS.test(name)) {
      try {
        const content = await readRemote(full)
        openAppByKeyWithProps('editor', { filePath: full, initialContent: content, title: `Editor - ${name}` })
      } catch (e: any) {
        toast('Files', `Could not read ${name}`, 'bi-x-circle', '#f00')
      }
      return
    }
    toast('Files', 'No app assigned for this file type.', 'bi-info-circle', '#ffd84d')
  }

  const newFile = async () => {
    const name = prompt('New file name?')
    if (!name) return
    try {
      await createFileRemote(path, name, '')
      void load(path)
      toast('Files', `Created ${name}`, 'bi-check-circle', '#0f0')
    } catch (e: any) {
      alert('Files', e.message, 'bi-exclamation-circle', [{ label: 'OK', role: 'primary' }])
    }
  }

  const newFolder = async () => {
    const name = prompt('New folder name?')
    if (!name) return
    try {
      await createFolderRemote(path, name)
      void load(path)
      toast('Files', `Created folder ${name}`, 'bi-check-circle', '#0f0')
    } catch (e: any) {
      alert('Files', e.message, 'bi-exclamation-circle', [{ label: 'OK', role: 'primary' }])
    }
  }

  const remove = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteRemote(path, name)
      void load(path)
      toast('Files', `Deleted ${name}`, 'bi-check-circle', '#0f0')
    } catch (e: any) {
      alert('Files', e.message, 'bi-exclamation-circle', [{ label: 'OK', role: 'primary' }])
    }
  }

  const rename = async (oldName: string) => {
    const name = prompt('Rename to?', oldName)
    if (!name || name === oldName) return
    try {
      await renameRemote(path, oldName, name)
      void load(path)
    } catch (e: any) {
      alert('Files', e.message, 'bi-exclamation-circle', [{ label: 'OK', role: 'primary' }])
    }
  }

  const crumbs = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    return parts.map((p, i) => ({ name: p, dir: '/' + parts.slice(0, i + 1).join('/') }))
  }, [path])

  void winSeq
  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        <button onClick={() => void load(parentDir(path))} disabled={path === '/'} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] disabled:opacity-30 flex items-center justify-center" title="Up">
          <i className="bi-arrow-up" />
        </button>
        <button onClick={() => void load('/')} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] flex items-center justify-center" title="Home">
          <i className="bi-house-door" />
        </button>
        <div className="flex items-center gap-1 flex-1 min-w-0 bg-[var(--surface-bg)] rounded-full px-3 py-1.5 text-sm overflow-x-auto os-hidden-scrollbar">
          <button onClick={() => void load('/')} className={`whitespace-nowrap hover:underline ${path === '/' ? 'font-bold' : 'opacity-70'}`}>
            Home
          </button>
          {crumbs.map((c) => (
            <span key={c.dir} className="flex items-center whitespace-nowrap">
              <i className="bi-chevron-right text-[10px] opacity-50 mx-1" />
              <button onClick={() => void load(c.dir)} className="hover:underline opacity-80">
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <button onClick={newFile} className="px-3 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm" title="New File">
          <i className="bi-file-earmark-plus" />
        </button>
        <button onClick={newFolder} className="px-3 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm" title="New Folder">
          <i className="bi-folder-plus" />
        </button>
        <button onClick={() => void load(path)} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] flex items-center justify-center" title="Refresh">
          <i className="bi-arrow-counterclockwise" />
        </button>
      </div>

      {error && <p className="px-4 py-2 text-sm text-red-500">{error}</p>}

      <div className="os-scroll flex-1 overflow-auto mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--dock-icon-color)]/25">
              <th className="py-2 px-3 font-semibold">Name</th>
              <th className="py-2 px-3 font-semibold w-24">Size</th>
              <th className="py-2 px-3 font-semibold w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center opacity-50">
                  <i className="bi-arrow-repeat animate-spin mr-2" />
                  Loading...
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr
                  key={it.name}
                  onDoubleClick={() => void open(it.name, it.type)}
                  className="border-b border-transparent hover:border-[var(--dock-icon-color)]/15 hover:bg-[var(--surface-bg)] cursor-pointer group transition-colors"
                  title={it.type === 'folder' ? 'Double-click to open' : 'Double-click to open'}
                >
                  <td className="py-2 px-3">
                    <i
                      className={`mr-3 ${
                        it.name === '..'
                          ? 'bi-arrow-90deg-up'
                          : it.type === 'folder'
                            ? 'bi-folder2-fill text-[var(--accent)]'
                            : IMAGE_EXTS.test(it.name)
                              ? 'bi-file-earmark-image'
                              : TEXT_EXTS.test(it.name)
                                ? 'bi-file-earmark-code'
                                : 'bi-file-earmark'
                      }`}
                    />
                    <span className="font-medium">{it.name}</span>
                  </td>
                  <td className="py-2 px-3 opacity-60">{it.type === 'folder' ? '—' : (it.size || '')}</td>
                  <td className="py-2 px-3">
                    {it.name !== '..' && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => rename(it.name)} className="w-7 h-7 rounded-full hover:bg-[var(--surface-hover)]" title="Rename">
                          <i className="bi-pencil text-xs" />
                        </button>
                        <button onClick={() => remove(it.name)} className="w-7 h-7 rounded-full hover:bg-red-500 hover:text-white" title="Delete">
                          <i className="bi-trash3 text-xs" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center opacity-50">
                  This folder is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs opacity-50 border-t border-[var(--dock-icon-color)]/15">
        {items.length} item{items.length === 1 ? '' : 's'} — double-click a file to open it.
      </p>
    </div>
  )
}