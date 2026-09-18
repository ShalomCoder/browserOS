'use client'

import type { Scheme, ThemeData } from './types'

function hexToRgb(hex: string) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const num = parseInt(hex, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const srgb = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function adjust(rgb: { r: number; g: number; b: number }, amount: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  return { r: clamp(rgb.r + amount), g: clamp(rgb.g + amount), b: clamp(rgb.b + amount) }
}

function rgbToCss(rgb: { r: number; g: number; b: number }, a = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
}

function surfaceStates(rgb: { r: number; g: number; b: number }, lum: number) {
  const isLight = lum > 0.55
  const hover = adjust(rgb, isLight ? -18 : +22)
  const active = adjust(rgb, isLight ? -32 : +38)
  return {
    base: rgbToCss(rgb, 1),
    hover: rgbToCss(hover, 0.9),
    active: rgbToCss(active, 0.95),
    disabled: rgbToCss(rgb, 0.35),
  }
}

export function applyScheme(theme: Scheme) {
  const root = document.documentElement

  const isUrl = /^(https?:)?\//.test(theme.bg) || /^data:/.test(theme.bg)
  const isDark = lookDark(theme)

  if (isUrl) {
    const darkOverlay = isDark ? "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), " : ''
    root.style.setProperty('--main-bg', `${darkOverlay}url('${theme.bg}') center/cover`)
  } else {
    root.style.setProperty('--main-bg', theme.bg)
  }

  root.style.setProperty('--panel-bg', theme.panel_bg)
  root.style.setProperty('--panel-fg', theme.panel_fg)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--window-bg', theme.window_bg)
  root.style.setProperty('--window-fg', theme.window_fg)
  root.style.setProperty('--panel-backdrop', theme.panel_backdrop || 'blur(10px)')

  let rgb = parseColor(theme.panel_bg)
  if (!rgb) rgb = { r: 255, g: 255, b: 255 }
  const lum = luminance(rgb)
  const dockIcon = lum > 0.55 ? 'rgba(20,20,20,0.85)' : 'rgba(245,245,245,0.9)'
  root.style.setProperty('--dock-icon-color', dockIcon)

  const surfaces = surfaceStates(rgb, lum)
  root.style.setProperty('--surface-bg', surfaces.base)
  root.style.setProperty('--surface-hover', surfaces.hover)
  root.style.setProperty('--surface-active', surfaces.active)
  root.style.setProperty('--surface-disabled', surfaces.disabled)

  const accentRgb = parseColor(theme.accent) || { r: 0, g: 0, b: 255 }
  const accentLum = luminance(accentRgb)
  const accentStates = surfaceStates(accentRgb, accentLum)
  root.style.setProperty('--accent-bg', accentStates.base)
  root.style.setProperty('--accent-hover', accentStates.hover)
  root.style.setProperty('--accent-active', accentStates.active)

  root.style.color = isDark ? '#fff' : '#000'
}

function lookDark(theme: Scheme) {
  const rgb = parseColor(theme.panel_bg)
  if (!rgb) return false
  return luminance(rgb) < 0.55
}

function parseColor(value: string): { r: number; g: number; b: number } | null {
  if (value.startsWith('#')) return hexToRgb(value)
  const m = value.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i)
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
  return null
}

export async function loadThemeData(file: string): Promise<ThemeData | null> {
  try {
    const res = await fetch(`/api/themes/${encodeURIComponent(file)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.theme ?? null
  } catch {
    return null
  }
}

export async function applyThemeScheme(file: string, scheme?: string) {
  const data = await loadThemeData(file)
  if (!data) return
  const name = scheme && data.schemes[scheme] ? scheme : data.defaultScheme || Object.keys(data.schemes)[0]
  const s = data.schemes[name]
  if (s) applyScheme(s)
}

export async function setUserTheme(file: string) {
  fetch('/api/theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field: 'theme', value: file }),
  }).catch(() => {})
}