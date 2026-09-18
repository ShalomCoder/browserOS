import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { readTheme, resolveWallpapers } from '@/lib/themes'

export async function GET() {
  const user = await getServerSession()
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  const theme = resolveWallpapers(readTheme(user.theme))
  return NextResponse.json({ success: true, user })
}