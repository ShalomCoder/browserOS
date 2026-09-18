import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { destroySession } from '@/lib/auth'

export async function POST() {
  const cookieStore = cookies()
  const token = cookieStore.get('webos_session')?.value
  if (token) await destroySession(token)
  cookieStore.delete('webos_session')
  return NextResponse.json({ success: true })
}