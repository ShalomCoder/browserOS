import { NextResponse } from 'next/server'
import { readTheme, resolveWallpapers } from '@/lib/themes'

export async function GET(_request: Request, { params }: { params: { file: string } }) {
  const theme = resolveWallpapers(readTheme(params.file))
  if (!theme) return NextResponse.json({ success: false }, { status: 404 })
  return NextResponse.json({ success: true, theme })
}