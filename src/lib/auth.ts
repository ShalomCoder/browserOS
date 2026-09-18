import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { query } from './db'

export const SESSION_COOKIE = 'webos_session'
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export type SessionUser = {
  username: string
  userhash: string
  theme: string
  theme_scheme: string
  installed_apps: string[]
  email: string
}

export async function createSession(userhash: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS)
  await query(
    `INSERT INTO sessions (token, userhash, expires_at) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO NOTHING`,
    [token, userhash, expiresAt.toISOString()]
  )
  return token
}

export async function destroySession(token: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE token = $1`, [token])
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const res = await query(
    `SELECT u.username, u.userhash, u.theme, u.theme_scheme, u.installed_apps, u.email
     FROM sessions s
     JOIN users u ON u.userhash = s.userhash
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  )

  if (res.rowCount === 0) return null
  const row = res.rows[0]
  return {
    username: row.username,
    userhash: row.userhash,
    theme: row.theme,
    theme_scheme: row.theme_scheme,
    installed_apps: row.installed_apps as string[],
    email: row.email,
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_LIFETIME_MS / 1000,
  }
}