import { NextResponse } from 'next/server'
import { listThemes } from '@/lib/themes'

export async function GET() {
  return NextResponse.json({ success: true, themes: listThemes() })
}