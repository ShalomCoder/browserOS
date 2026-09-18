import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const THEMES_DIR = path.join(process.cwd(), 'data', 'themes')
const WALLPAPER_BASE = '/sample-wallpapers'

export type Scheme = {
  bg: string
  default_fg: string
  panel_bg: string
  panel_fg: string
  accent: string
  window_bg: string
  window_fg: string
  panel_backdrop?: string
}

export type ThemeJSON = {
  name: string
  author: string
  file: string
  type?: string
  defaultScheme: string
  schemes: Record<string, Scheme>
  assets?: { wallpapers?: string[] }
}

export function listThemes(): { name: string; author: string; file: string }[] {
  return readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const t = JSON.parse(readFileSync(path.join(THEMES_DIR, f), 'utf8')) as ThemeJSON
        return { name: t.name || f, author: t.author || 'browserOS', file: t.file || f.replace('.json', '') }
      } catch {
        return { name: f, author: 'browserOS', file: f.replace('.json', '') }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function readTheme(file: string): ThemeJSON | null {
  const name = /^[a-zA-Z0-9_-]+$/.test(file) ? file : 'webosDefault'
  try {
    const raw = JSON.parse(readFileSync(path.join(THEMES_DIR, `${name}.json`), 'utf8'))
    return raw as ThemeJSON
  } catch {
    return null
  }
}

/** Rewrites background references so wallpapers resolve against /public. */
export function resolveWallpapers(theme: ThemeJSON | null): ThemeJSON | null {
  if (!theme) return theme
  const copy: ThemeJSON = JSON.parse(JSON.stringify(theme))
  for (const scheme of Object.values(copy.schemes)) {
    scheme.bg = scheme.bg.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '')
    if (/^(\/)?sample-wallpapers\//.test(scheme.bg)) {
      const file = scheme.bg.replace(/^\//, '').replace(/^sample-wallpapers\//, '')
      scheme.bg = `${WALLPAPER_BASE}/${encodeURI(file)}`
    }
  }
  return copy
}