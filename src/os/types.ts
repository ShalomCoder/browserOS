import type { ComponentType, ReactNode } from 'react'

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

export type ThemeData = {
  name: string
  author: string
  file: string
  type?: string
  defaultScheme?: string
  schemes: Record<string, Scheme>
  assets?: { wallpapers?: string[] }
}

export type UserInfo = {
  username: string
  uh: string
  theme: string
  theme_scheme: string
  installedApps: string[]
}

export type AppProps = {
  winId: number
}

export type AppManifest = {
  key: string
  name: string
  icon: string
  description: string
  system?: boolean
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  noResize?: boolean
  Component: ComponentType<AppProps>
}

export type WindowState = {
  id: number
  appKey: string
  name: string
  title: string
  icon?: string
  x: number
  y: number
  width: number
  height: number
  z: number
  minimized: boolean
  maximized: boolean
  restore: { x: number; y: number; width: number; height: number } | null
  noResize?: boolean
  onClose?: () => void
}

export type Toast = {
  id: number
  title: string
  content: string
  icon: string
  iconColor: string
}

export type Notification = {
  id: number
  title: string
  content: string
  icon: string
  createdAt: number
}

export type AlertButton = {
  label: string
  role?: 'primary' | 'secondary'
  onClick?: () => void
}

export type AlertItem = {
  id: number
  title: string
  message: string
  icon: string
  color?: string
  buttons: AlertButton[]
}

export type ContextMenuState = {
  x: number
  y: number
  actions: { label: string; shortcut?: string; icon?: string; run: () => void }[]
  quick?: { copy?: boolean; cut?: boolean; paste?: boolean }
} | null

export type FsNode = {
  name: string
  type: 'folder' | 'file'
  size: string
  actual_size: number
}

export type OpenMenu = 'power' | 'datetime' | 'notifications' | null

export { type ReactNode }