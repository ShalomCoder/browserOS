import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const user = await getServerSession()
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { field, value } = body as { field?: string; value?: string }

  if (field === 'theme' && typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) {
    await query(`UPDATE users SET theme = $1 WHERE userhash = $2`, [value, user.userhash])
    return NextResponse.json({ success: true, message: 'Theme saved' })
  }
  if (field === 'theme_scheme' && (value === 'light' || value === 'dark')) {
    await query(`UPDATE users SET theme_scheme = $1 WHERE userhash = $2`, [value, user.userhash])
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: false, message: 'Unknown update' }, { status: 400 })
}