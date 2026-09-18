'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import {
  listDir,
  readRemote,
  writeRemote,
  createFileRemote,
  createFolderRemote,
  deleteRemote,
  joinDir,
  fileNameFromPath,
} from '@/os/fs'

type Tree = { name: string; folders: Tree[]; files: { name: string; path: string }[] } & { rootDir: string }

type Tab = { path: string; name: string; content: string; dirty: boolean }

export default function WeavercodeApp() {
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)

  const [tree, setTree] = useState<Tree>({ name: 'browseros', folders: [], files: [], rootDir: '/' })
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)
  const [showTerminal, setShowTerminal] = useState(true)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [termCwd, setTermCwd] = useState('/')
  const [termInput, setTermInput] = useState('')
  const termSeq = useRef(0)

  const buildTree = useCallback(async (dir: string): Promise<Tree> => {
    try {
      const items = await listDir(dir)
      const folders = await Promise.all(
        items.filter((i) => i.type === 'folder' && i.name !== '..').map((i) => buildTree(joinDir(dir, i.name)))
      )
      const files = items
        .filter((i) => i.type === 'file' && !i.name.endsWith('ttf') && !i.name.endsWith('woff') && !i.name.endsWith('woff2') && !i.name.endsWith('eot'))
        .map((i) => ({ name: i.name, path: joinDir(dir, i.name) }))
      return { name: dir === '/' ? 'browseros' : fileNameFromPath(dir), folders, files, rootDir: dir }
    } catch {
      return { name: dir, folders: [], files: [], rootDir: dir }
    }
  }, [])

  const refresh = useCallback(async () => {
    const t = await buildTree('/')
    setTree(t)
  }, [buildTree])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const openFile = async (path: string) => {
    try {
      const existing = tabs.find((t) => t.path === path)
      if (existing) {
        setActivePath(path)
        return
      }
      const content = await readRemote(path)
      setTabs((t) => [...t, { path, name: fileNameFromPath(path), content, dirty: false }])
      setActivePath(path)
    } catch (e: any) {
      toast('WeaverCode', `Could not open ${path}: ${e.message}`, 'bi-x-circle', '#f00')
    }
  }

  const active = tabs.find((t) => t.path === activePath) || null

  const updateActiveContent = (content: string) => {
    if (!activePath) return
    setTabs((t) => t.map((tab) => (tab.path === activePath ? { ...tab, content, dirty: true } : tab)))
  }

  const saveTab = async (path: string) => {
    try {
      await writeRemote(path, tabs.find((t) => t.path === path)?.content ?? '')
      setTabs((t) => t.map((tab) => (tab.path === path ? { ...tab, dirty: false } : tab)))
      toast('WeaverCode', `Saved ${fileNameFromPath(path)}`, 'bi-check-circle', '#0f0')
    } catch (e: any) {
      alert('WeaverCode', e.message, 'bi-exclamation-circle')
    }
  }

  const saveActive = () => {
    if (activePath) void saveTab(activePath)
  }

  const closeTab = (path: string) => {
    setTabs((t) => {
      const next = t.filter((tab) => tab.path !== path)
      if (activePath === path) setActivePath(next[next.length - 1]?.path || null)
      return next
    })
  }

  const newFileFlow = async () => {
    const name = prompt('New file name?')
    if (!name) return
    try {
      const p = joinDir('/', name)
      await createFileRemote('/', name, '')
      void refresh()
      await openFile(p)
    } catch (e: any) {
      alert('WeaverCode', e.message, 'bi-exclamation-circle')
    }
  }

  const newFolderFlow = async () => {
    const name = prompt('New folder name?')
    if (!name) return
    try {
      await createFolderRemote('/', name)
      void refresh()
    } catch (e: any) {
      alert('WeaverCode', e.message, 'bi-exclamation-circle')
    }
  }

  const deleteFlow = async (path: string) => {
    const dir = path.slice(0, path.lastIndexOf('/')) || '/'
    const name = fileNameFromPath(path)
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteRemote(dir, name)
      setTabs((t) => t.filter((tab) => tab.path !== path))
      if (activePath === path) {
        setActivePath(null)
      }
      void refresh()
    } catch (e: any) {
      alert('WeaverCode', e.message, 'bi-exclamation-circle')
    }
  }

  const termPrint = (text: string) => {
    const id = termSeq.current++
    setTerminalLines((l) => [...l, `[${String(id).padStart(2, '0')}] ${text}`])
  }

  const termRun = async (raw: string) => {
    setTerminalLines((l) => [...l, `${termCwd} $ ${raw}`])
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const name = (cmd || '').toLowerCase()
    switch (name) {
      case 'help':
        termPrint('Commands: ls, cd, cat, echo, touch, mkdir, clear')
        break
      case 'clear':
        setTerminalLines([])
        break
      case 'ls':
        try {
          const items = await listDir(termCwd)
          termPrint(items.filter((i) => i.name !== '..').map((i) => (i.type === 'folder' ? `${i.name}/` : i.name)).join('  '))
        } catch (e: any) {
          termPrint(`ls: ${e.message}`)
        }
        break
      case 'cd': {
        const target = args[0]
        if (!target) {
          setTermCwd('/')
          break
        }
        const parts = (target.startsWith('/') ? target : joinDir(termCwd, target)).split('/').filter(Boolean)
        const out: string[] = []
        for (const p of parts) {
          if (p === '.') continue
          if (p === '..') out.pop()
          else out.push(p)
        }
        const resolved = '/' + out.join('/')
        const ok = await listDir(resolved).catch(() => null)
        if (ok == null) termPrint(`cd: no such directory: ${target}`)
        else setTermCwd(resolved)
        break
      }
      case 'cat': {
        if (!args[0]) break
        try {
          termPrint(await readRemote(joinDir(termCwd, args[0])))
        } catch (e: any) {
          termPrint(`cat: ${e.message}`)
        }
        break
      }
      case 'echo':
        termPrint(args.join(' '))
        break
      case 'touch':
        if (args[0]) {
          await createFileRemote(termCwd, args[0], '').catch((e: any) => termPrint(e.message))
          termPrint(`created ${args[0]}`)
          void refresh()
        }
        break
      case 'mkdir':
        if (args[0]) {
          await createFolderRemote(termCwd, args[0]).catch((e: any) => termPrint(e.message))
          termPrint(`created folder ${args[0]}`)
          void refresh()
        }
        break
      default:
        termPrint(`command not found: ${name}`)
    }
  }

  const renderTree = (node: Tree, depth: number): React.ReactNode[] => {
    const rows: React.ReactNode[] = []
    for (const f of node.folders) {
      rows.push(
        <div key={f.rootDir}>
          <div className="flex items-center gap-1 px-2 py-0.5 pr-1 rounded hover:bg-[var(--surface-bg)] text-sm" style={{ paddingLeft: 6 + depth * 12 }}>
            <i className="bi-folder2-fill text-[var(--accent)] text-xs mr-1" />
            <span className="truncate flex-1">{f.name}</span>
            <button onClick={() => deleteFlow(f.rootDir)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-xs" title="Delete folder">
              <i className="bi-trash3" />
            </button>
          </div>
          {renderTree(f, depth + 1)}
        </div>
      )
    }
    for (const file of node.files) {
      const isOpen = file.path === activePath
      rows.push(
        <div key={file.path} className="group flex items-center gap-1 pr-1 rounded hover:bg-[var(--surface-bg)] text-sm cursor-pointer" style={{ paddingLeft: 6 + (depth + 1) * 12 }} onClick={() => void openFile(file.path)}>
          <i className={`mr-1 text-xs ${isOpen ? 'bi-file-earmark-fill text-[var(--accent)]' : 'bi-file-earmark-code'}`} />
          <span className={`truncate flex-1 ${isOpen ? 'font-semibold' : 'opacity-80'}`}>{file.name}</span>
          <button onClick={(e) => { e.stopPropagation(); deleteFlow(file.path) }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-xs" title="Delete">
            <i className="bi-trash3" />
          </button>
        </div>
      )
    }
    if (rows.length === 0 && depth === 0) {
      rows.push(<p key="empty" className="px-3 py-2 text-xs opacity-50">No files yet.</p>)
    }
    return rows
  }

  const visibleFiles = tabs

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--dock-icon-color)]/15 text-sm flex-wrap">
        <button onClick={() => void newFileFlow()} className="w-8 h-8 rounded-md hover:bg-[var(--surface-bg)]" title="New file">
          <i className="bi-file-earmark-plus" />
        </button>
        <button onClick={() => void newFolderFlow()} className="w-8 h-8 rounded-md hover:bg-[var(--surface-bg)]" title="New folder">
          <i className="bi-folder-plus" />
        </button>
        <div className="w-px h-5 bg-[var(--dock-icon-color)]/20 mx-1" />
        <button onClick={saveActive} disabled={!active} className="px-2.5 h-8 rounded-md hover:bg-[var(--surface-bg)] disabled:opacity-30" title="Save active file">
          <i className="bi-save" /> Save
        </button>
        <button onClick={() => setShowTerminal((s) => !s)} className={`px-2.5 h-8 rounded-md hover:bg-[var(--surface-bg)] ${showTerminal ? 'bg-[var(--surface-bg)]' : ''}`} title="Toggle terminal">
          <i className="bi-terminal" /> Terminal
        </button>
        <p className="ml-auto text-xs opacity-50 hidden sm:block">
          {tabs.filter((t) => t.dirty).length} unsaved
        </p>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* File tree */}
        <div className="os-scroll w-52 shrink-0 overflow-auto border-r border-[var(--dock-icon-color)]/15 py-1">
          <p className="px-3 py-1 text-[10px] uppercase tracking-widest opacity-40">Explorer</p>
          <div className="flex items-center gap-1 px-2 py-0.5 text-sm font-semibold">
            <i className="bi-folder2-fill text-[var(--accent)]" />
            browseros
          </div>
          {renderTree(tree, 0)}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-1 pt-1 border-b border-[var(--dock-icon-color)]/15 overflow-x-auto os-hidden-scrollbar">
            {visibleFiles.map((tab) => (
              <div key={tab.path} onClick={() => setActivePath(tab.path)} className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-sm cursor-pointer whitespace-nowrap ${tab.path === activePath ? 'bg-[var(--surface-bg)] font-medium' : 'opacity-60 hover:opacity-90'}`}>
                <i className="bi-file-earmark-code text-xs" />
                {tab.name}
                {tab.dirty && <span className="text-[#f2cc60]">•</span>}
                <button onClick={(e) => { e.stopPropagation(); void saveTab(tab.path) }} title="Save" className="opacity-0 group-hover:opacity-100 text-xs">
                  <i className="bi-check2" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeTab(tab.path) }} className="opacity-60 hover:opacity-100 hover:text-red-500 text-xs" title="Close">
                  <i className="bi-x" />
                </button>
              </div>
            ))}
            {tabs.length === 0 && <p className="px-3 py-1.5 text-xs opacity-40">Open a file from the Explorer.</p>}
          </div>

          {/* Editors */}
          <div className="flex-1 relative overflow-hidden">
            {active ? (
              <textarea
                key={active.path}
                defaultValue={active.content}
                spellCheck={false}
                className="os-scroll absolute inset-0 w-full h-full resize-none bg-transparent outline-none p-3 font-mono text-[13px] leading-relaxed"
                onChange={(e) => updateActiveContent(e.target.value)}
                onBlur={() => {
                  if (active.dirty) void saveTab(active.path)
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3">
                <i className="bi-code-square text-6xl" />
                <p>Select a file to start editing</p>
              </div>
            )}
          </div>

          {/* Integrated terminal */}
          {showTerminal && (
            <div className="h-40 shrink-0 border-t border-[var(--dock-icon-color)]/15 flex flex-col text-xs" style={{ fontFamily: 'ui-monospace, monospace' }}>
              <div className="relative flex items-center gap-2 px-3 py-1.5 border-b border-[var(--dock-icon-color)]/10 bg-[var(--surface-bg)]/60">
                <i className="bi-terminal text-[var(--accent)]" />
                <span className="font-semibold">Terminal</span>
                <button onClick={() => void refresh()} className="ml-auto opacity-50 hover:opacity-100" title="Refresh tree">
                  <i className="bi-arrow-counterclockwise" />
                </button>
              </div>
              <div className="os-scroll flex-1 overflow-auto px-3 py-1.5 whitespace-pre-wrap min-h-0">
                {terminalLines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
              <div className="flex items-center gap-1.5 px-3 pb-2 pt-0.5">
                <span className="text-[#7ee787]">$</span>
                <input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void termRun(termInput)
                      setTermInput('')
                    }
                  }}
                  className="flex-1 bg-transparent outline-none"
                  placeholder={`type "help" — cwd: ${termCwd}`}
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}