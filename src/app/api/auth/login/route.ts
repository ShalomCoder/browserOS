import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { verifyPassword, md5 } from '@/lib/password'
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export async function POST(request: Request) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Bad JSON' }, { status: 400 })
  }

  const username = String(body.username || '').toLowerCase().trim()
  const password = String(body.password || '')

  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 })
  }

  const userhash = md5(`user-${username}`)
  const res = await query(`SELECT username, password, userhash FROM users WHERE LOWER(username) = $1`, [username])
  if (res.rowCount === 0 || !verifyPassword(password, res.rows[0].password)) {
    return NextResponse.json({ success: false, message: 'Invalid credentials' })
  }

  const row = res.rows[0]
  const token = await createSession(row.userhash)
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions())

  return NextResponse.json({ success: true, username: row.username, uh: row.userhash })
}