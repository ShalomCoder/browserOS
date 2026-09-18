import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { query } from '@/lib/db'

const AVAILABLE_APPS = [
  'calculator',
  'files',
  'notes',
  'terminal',
  'browser',
  'photos',
  'editor',
  'calendar',
  'camera',
  'weavercode',
]

export async function POST(request: Request) {
  const user = await getServerSession()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const app = String(body.app || '')
  if (!AVAILABLE_APPS.includes(app)) {
    return NextResponse.json({ success: false, message: 'Unknown app.' })
  }

  const res = await query(`SELECT installed_apps FROM users WHERE userhash = $1`, [user.userhash])
  let list: string[] = res.rows[0].installed_apps || []

  if (action === 'install' && !list.includes(app)) list = [...list, app]
  if (action === 'uninstall') list = list.filter((a) => a !== app)

  await query(`UPDATE users SET installed_apps = $1 WHERE userhash = $2`, [list, user.userhash])
  return NextResponse.json({ success: true, installedApps: list })
}