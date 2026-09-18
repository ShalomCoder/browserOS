import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  listDir,
  readFile,
  writeFile,
  createFile,
  createFolder,
  deleteNode,
  renameNode,
  getNode,
} from '@/lib/fs-server'

const SAFE_NAME = /^[^/\\\0]{1,255}$/

export async function GET(request: Request) {
  const user = await getServerSession()
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  if (!file) return NextResponse.json({ success: false }, { status: 400 })

  const node = await getNode(user.userhash, file)
  if (!node) return NextResponse.json({ success: false }, { status: 404 })

  const content: string = node.content || ''

  // If stored as a data URL (e.g. image uploads), redirect to it directly.
  if (/^data:/i.test(content)) {
    return NextResponse.redirect(content.split(',')[0] ? content : content)
  }

  const ext = (file.split('.').pop() || '').toLowerCase()
  const mime =
    ext === 'png' ? 'image/png' :
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'gif' ? 'image/gif' :
    ext === 'svg' ? 'image/svg+xml' :
    ext === 'webp' ? 'image/webp' :
    ext === 'bmp' ? 'image/bmp' :
    ext === 'json' || ext === 'js' || ext === 'ts' ? 'application/json' :
    ext === 'md' ? 'text/markdown' :
    ext === 'css' ? 'text/css' :
    'text/plain; charset=utf-8'

  return new NextResponse(content, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  const user = await getServerSession()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  let data: Record<string, any>
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Bad JSON' }, { status: 400 })
  }

  const op = String(data.op || 'list')
  const dir = String(data.dir || '/')

  try {
    switch (op) {
      case 'list':
        return NextResponse.json({ success: true, dir, children: await listDir(user.userhash, dir) })

      case 'read': {
        const filename = String(data.filename || data.path || '')
        const content = await readFile(user.userhash, `${dir}/${filename}`)
        if (content === null) return NextResponse.json({ success: false, message: 'File not found' })
        return NextResponse.json({ success: true, content })
      }

      case 'write': {
        const filename = String(data.filename || data.path || '')
        const content = String(data.content ?? '')
        await writeFile(user.userhash, `${dir}/${filename}`, content)
        return NextResponse.json({ success: true, message: 'File saved.' })
      }

      case 'upload': {
        const filename = String(data.filename || '')
        if (!SAFE_NAME.test(filename)) return NextResponse.json({ success: false, message: 'Invalid filename.' })
        const content = String(data.content ?? '')
        await writeFile(user.userhash, `${dir}/${filename}`, content)
        return NextResponse.json({ success: true, message: 'Uploaded.' })
      }

      case 'create_file': {
        const filename = String(data.filename || '')
        if (!SAFE_NAME.test(filename)) return NextResponse.json({ success: false, message: 'Invalid filename.' })
        await createFile(user.userhash, dir, filename, String(data.content ?? ''))
        return NextResponse.json({ success: true })
      }

      case 'create_folder': {
        const foldername = String(data.foldername || '')
        if (!SAFE_NAME.test(foldername)) return NextResponse.json({ success: false, message: 'Invalid folder name.' })
        await createFolder(user.userhash, dir, foldername)
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        const name = String(data.name || '')
        const r = await deleteNode(user.userhash, dir, name)
        return NextResponse.json({ success: r.ok, message: r.ok ? 'Deleted.' : r.message })
      }

      case 'rename': {
        const old = String(data.old || '')
        const neu = String(data.new || '')
        if (!SAFE_NAME.test(neu)) return NextResponse.json({ success: false, message: 'Invalid name.' })
        const r = await renameNode(user.userhash, dir, old, neu)
        return NextResponse.json({ success: r.ok, message: r.ok ? 'Renamed.' : r.message })
      }

      default:
        return NextResponse.json({ success: false, message: 'Unknown operation.' })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 })
  }
}