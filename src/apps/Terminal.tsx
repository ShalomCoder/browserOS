'use client'

import { useEffect, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import {
  listDir,
  readRemote,
  writeRemote,
  createFolderRemote,
  createFileRemote,
  deleteRemote,
  joinDir,
  parentDir,
} from '@/os/fs'

type Entry = { kind: 'cmd' | 'out'; text: string; id: number }

const ASCII =
  'browserOS\\n    (       \\n  ___  _ __   ___  __ _| |_ ___  \\n / __| | \\\\ \\\\ / _ \\\\/ _` | __/ _ \\\\ \\n| (__| | |\\\\ V /  __/ (_| | ||  __/ \\\\n \\\\___|_| _| \\\\_/ \\\\___|\\\\__,_|\\\\__\\\\___|'

export default function TerminalApp({ winId }: { winId: number }) {
  const user = useOS((s) => s.user)
  const openAppByKey = useOS((s) => s.openAppByKey)
  const [lines, setLines] = useState<Entry[]>([])
  const [cwd, setCwd] = useState('/')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIndex, setHIndex] = useState(-1)
  const seq = useRef(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    print('out', `browserOS Terminal v2.0 — type "help" to get started.`)
    print('out', `User: ${user?.username || 'guest'}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [lines])

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    window.addEventListener('keydown', focus)
    return () => window.removeEventListener('keydown', focus)
  }, [])

  const print = (kind: 'cmd' | 'out', text: string) => {
    const id = seq.current++
    setLines((l) => [...l, { kind, text, id }])
  }

  const resolve = (path: string): string => {
    if (!path) return cwd
    if (path === '~') return '/'
    if (path.startsWith('/')) {
      const parts = path.split('/').filter(Boolean)
      return '/' + parts.join('/')
    }
    const base = cwd === '/' ? '' : cwd
    const parts = `${base}/${path}`.split('/').filter(Boolean)
    const out: string[] = []
    for (const p of parts) {
      if (p === '.') continue
      if (p === '..') out.pop()
      else out.push(p)
    }
    return '/' + out.join('/')
  }

  const run = async (raw: string) => {
    const cmd = raw.trim()
    print('cmd', cmd)
    if (!cmd) return
    registerHistory(cmd)

    const [name, ...args] = cmd.split(/\s+/)
    switch (name.toLowerCase()) {
      case 'help':
        print('out', [
          'clear        Clear the screen',
          'pwd          Print working directory',
          'ls           List files',
          'cd <dir>     Change directory',
          'cat <file>   Print file contents',
          'echo <text>  Print text',
          'mkdir <dir>  Create folder',
          'touch <file> Create file',
          'rm <name>    Delete file or empty folder',
          'whoami       Print current user',
          'date         Print date and time',
          'tree         Show folder tree (brief)',
          'open <app>   Open an installed app',
          'neofetch     Fun system info',
          'exit         Close this window',
        ].join('\n'))
        break
      case 'clear':
        setLines([])
        break
      case 'pwd':
        print('out', cwd)
        break
      case 'ls':
        try {
          const items = await listDir(cwd)
          print('out', items.filter((i) => i.name !== '..').map((i) => (i.type === 'folder' ? `${i.name}/` : i.name)).join('  ') || '(empty)')
        } catch (e: any) {
          print('out', `ls: error: ${e.message}`)
        }
        break
      case 'cd': {
        const target = args[0]
        if (!target) {
          setCwd('/')
          break
        }
        const resolved = resolve(target)
        const items = await listDir(resolved).catch(() => null)
        if (items == null) print('out', `cd: no such directory: ${target}`)
        else setCwd(resolved)
        break
      }
      case 'cat': {
        if (!args[0]) {
          print('out', 'cat: missing file operand')
          break
        }
        try {
          const content = await readRemote(joinDir(cwd, args[0]))
          print('out', content || '(empty file)')
        } catch (e: any) {
          print('out', `cat: ${e.message}`)
        }
        break
      }
      case 'echo':
        print('out', args.join(' '))
        break
      case 'mkdir': {
        if (!args[0]) break
        try {
          await createFolderRemote(cwd, args[0])
          print('out', `created folder "${args[0]}"`)
        } catch (e: any) {
          print('out', `mkdir: ${e.message}`)
        }
        break
      }
      case 'touch': {
        if (!args[0]) break
        try {
          await createFileRemote(cwd, args[0], '')
          print('out', `created file "${args[0]}"`)
        } catch (e: any) {
          print('out', `touch: ${e.message}`)
        }
        break
      }
      case 'rm':
      case 'delete': {
        if (!args[0]) break
        try {
          await deleteRemote(cwd, args[0])
          print('out', `deleted "${args[0]}"`)
        } catch (e: any) {
          print('out', `rm: ${e.message}`)
        }
        break
      }
      case 'write': {
        if (args.length < 2) break
        try {
          await writeRemote(joinDir(cwd, args[0]), args.slice(1).join(' '))
          print('out', `wrote ${args.length - 1} tokens to "${args[0]}"`)
        } catch (e: any) {
          print('out', `write: ${e.message}`)
        }
        break
      }
      case 'whoami':
        print('out', user?.username || 'guest')
        break
      case 'date':
        print('out', new Date().toString())
        break
      case 'tree':
        print('out', `${cwd}\n└── ...  (use "ls" + "cd" to explore)`)
        break
      case 'open':
        if (args[0]) openAppByKey(args[0].toLowerCase())
        else print('out', 'open: specify an app key')
        break
      case 'neofetch':
        print('out', `${ASCII.replace(/\\n/g, '\n')}\n\nbrowserOS ${user?.username || ''}`)
        break
      case 'version':
      case '-v':
        print('out', 'browserOS v2.0.0 (React port)')
        break
      case 'exit':
        useOS.getState().closeWindow(winId)
        break
      case '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$':
        openAppByKey('settings')
        print('out', 'You found the Easter Egg! Opening Settings...')
        break
      default:
        print('out', `command not found: ${name}. Type "help".`)
    }
  }

  const registerHistory = (cmd: string) => {
    setHistory((h) => [cmd, ...h].slice(0, 100))
    setHIndex(-1)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void run(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const next = Math.min(hIndex + 1, history.length - 1)
      setHIndex(next)
      setInput(history[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = hIndex - 1
      setHIndex(next)
      setInput(next >= 0 ? history[next] : '')
    }
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden cursor-text"
      style={{ background: 'rgba(10,10,20,0.85)', color: '#d8ffe0', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="os-scroll flex-1 overflow-auto p-3 whitespace-pre-wrap break-words">
        {lines.map((l) =>
          l.kind === 'cmd' ? (
            <p key={l.id} className="text-[#9cc8ff]">
              <span className="text-[#7ee787]">{user?.username}@browseros</span>
              <span className="text-[#f2cc60]"> {cwd} </span>
              <span className="text-[#fff]">$ {l.text}</span>
            </p>
          ) : (
            <p key={l.id} className="mb-1">
              {l.text}
            </p>
          )
        )}
      </div>
      <div className="flex items-center px-3 pb-2 gap-2">
        <span className="text-[#7ee787]">{user?.username}@browseros</span>
        <span className="text-[#f2cc60]">{cwd}</span>
        <span className="text-white">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent outline-none text-white caret-[#7ee787]"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  )
}