'use client'

import { create } from 'zustand'
import type {
  AlertItem,
  AppManifest,
  ContextMenuState,
  Notification,
  OpenMenu,
  Scheme,
  ThemeData,
  Toast,
  UserInfo,
  WindowState,
} from './types'
import { getAppManifest } from './apps'

export type OsState = {
  // user
  booted: boolean
  user: UserInfo | null
  isMobile: boolean

  // theme
  themeFile: string
  schemeName: string
  schemeNames: string[]
  theme: Scheme
  themeName: string

  // windows
  windows: WindowState[]
  topZ: number
  focusedId: number | null
  minimizedList: { id: number }[]

  // notifications / alerts
  toasts: Toast[]
  notificationPile: Notification[]
  alerts: AlertItem[]
  toastSeq: number
  notifySeq: number
  alertSeq: number
  alertOpenId: number | null

  // menus
  activeMenu: OpenMenu
  contextMenu: ContextMenuState
  dockOpen: boolean
  dockHidden: boolean
  topbarFloating: boolean

  // clipboard
  clipboardHistory: { type: 'text'; content: string; from: string }[]

  // settings
  settings: { transparentTopbar: boolean; alwaysShowMobileDock: boolean }

  // ---- boot ----
  boot: (user: UserInfo, themeData: ThemeData, isMobile: boolean) => void
  setMobile: (isMobile: boolean) => void
  applyUser: (user: UserInfo) => void

  // ---- theming ----
  setThemeData: (themeData: ThemeData, scheme?: string) => void
  toggleScheme: () => void

  // ---- windows ----
  openAppByKey: (appKey: string) => void
  closeWindow: (id: number) => void
  focusWindow: (id: number, pointer?: boolean) => void
  minimizeWindow: (id: number) => void
  restoreMinimized: (id: number) => void
  toggleMaximize: (id: number) => void
  updateWindow: (id: number, patch: Partial<WindowState>) => void
  setWindowPosition: (id: number, x: number, y: number) => void
  setWindowSize: (id: number, width: number, height: number) => void

  // ---- menus ----
  setMenu: (menu: OpenMenu) => void
  toggleMenu: (menu: OpenMenu) => void
  closeMenus: () => void
  setContextMenu: (cm: ContextMenuState) => void
  setDockOpen: (open: boolean) => void
  toggleDock: () => void
  setDockHidden: (hidden: boolean) => void

  // ---- notifications / alerts ----
  toast: (title: string, content?: string, icon?: string, iconColor?: string) => void
  dismissToast: (id: number) => void
  notify: (title: string, content: string, icon?: string) => void
  removeNotification: (id: number) => void
  clearNotifications: () => void
  alert: (
    title: string,
    message: string,
    icon?: string,
    buttons?: { label: string; role?: 'primary' | 'secondary'; onClick?: () => void }[],
    color?: string
  ) => void
  closeAlert: (id: number) => void

  // ---- clipboard ----
  pushClipboard: (item: { type: 'text'; content: string; from: string }) => void
  clearClipboard: () => void

  // ---- settings ----
  setSetting: (k: 'transparentTopbar' | 'alwaysShowMobileDock', v: boolean) => void
}

function defaultWindowPosition(app: AppManifest, isMobile: boolean) {
  if (isMobile) {
    return { x: 6, y: 42, width: Math.max(300, Math.min(app.defaultWidth, (typeof window !== 'undefined' ? window.innerWidth : 390) - 12)), height: Math.max(240, Math.min(app.defaultHeight, (typeof window !== 'undefined' ? window.innerHeight : 800) - 120)) }
  }
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const w = Math.min(app.defaultWidth, vw - 24)
  const h = Math.min(app.defaultHeight, vh - 100)
  const x = Math.max(8, Math.floor((vw - w) / 2 + (Math.random() - 0.5) * (vw / 8)))
  const y = Math.max(42, Math.floor((vh - h) / 2 + (Math.random() - 0.5) * (vh / 10)))
  return { x, y, width: w, height: h }
}

export const useOS = create<OsState>((set, get) => ({
  booted: false,
  user: null,
  isMobile: false,

  themeFile: 'webosDefault',
  schemeName: 'light',
  schemeNames: ['light'],
  theme: {
    bg: '#000',
    default_fg: '#fff',
    panel_bg: 'rgba(30,30,30,.45)',
    panel_fg: '#eee',
    accent: '#00f',
    window_bg: 'rgba(30,30,30,.5)',
    window_fg: '#fff',
  },
  themeName: 'browserOS Default',

  windows: [],
  topZ: 20,
  focusedId: null,
  minimizedList: [],

  toasts: [],
  notificationPile: [],
  alerts: [],
  toastSeq: 1,
  notifySeq: 1,
  alertSeq: 1,
  alertOpenId: null,

  activeMenu: null,
  contextMenu: null,
  dockOpen: true,
  dockHidden: false,
  topbarFloating: true,

  clipboardHistory: [],
  settings: { transparentTopbar: true, alwaysShowMobileDock: false },

  boot: (user, themeData, isMobile) => {
    set({ user, isMobile, booted: true })
    get().setThemeData(themeData, user.theme_scheme)
  },

  setMobile: (isMobile) => set({ isMobile }),

  applyUser: (user) => set({ user }),

  setThemeData: (themeData, scheme) => {
    const schemeNames = Object.keys(themeData.schemes)
    const schemeName =
      scheme && themeData.schemes[scheme]
        ? scheme
        : themeData.defaultScheme && themeData.schemes[themeData.defaultScheme]
          ? themeData.defaultScheme
          : schemeNames[0] || 'light'
    set({
      themeFile: themeData.file,
      themeName: themeData.name || themeData.file,
      schemeNames,
      schemeName,
      theme: themeData.schemes[schemeName] || get().theme,
    })
  },

  toggleScheme: () => {
    const { schemeNames, schemeName, themeFile } = get()
    if (schemeNames.length < 2) return
    const idx = schemeNames.indexOf(schemeName)
    const next = schemeNames[(idx + 1) % schemeNames.length]
    set({ schemeName: next })
    fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'theme_scheme', value: next }),
    }).catch(() => {})
    import('./theming').then((m) => m.applyThemeScheme(get().themeFile, next))
  },

  openAppByKey: (appKey) => {
    const app = getAppManifest(appKey)
    if (!app) return
    if (!app.system) {
      const existing = get().windows.find((w) => w.appKey === appKey)
      if (existing) {
        if (existing.minimized) get().restoreMinimized(existing.id)
        get().focusWindow(existing.id)
        return
      }
    }
    const alreadyOpen = get().windows.find((w) => w.name === app.name)
    if (alreadyOpen) {
      get().focusWindow(alreadyOpen.id)
      return
    }
    const id = nextId(get())
    const pos = defaultWindowPosition(app, get().isMobile)
    const topZ = get().topZ + 1
    const win: WindowState = {
      id,
      appKey: app.key,
      name: app.name,
      title: app.name,
      icon: app.icon,
      ...pos,
      z: topZ,
      minimized: false,
      maximized: get().isMobile,
      restore: null,
    }
    set((s) => ({ windows: [...s.windows, win], topZ, focusedId: id, dockHidden: false }))
  },

  closeWindow: (id) => {
    const w = get().windows.find((x) => x.id === id)
    w?.onClose?.()
    set((s) => ({
      windows: s.windows.filter((x) => x.id !== id),
      minimizedList: s.minimizedList.filter((x) => x.id !== id),
      focusedId: s.focusedId === id ? null : s.focusedId,
    }))
  },

  focusWindow: (id, pointer) => {
    const w = get().windows.find((x) => x.id === id)
    if (!w || w.minimized) return
    const topZ = get().topZ + 1
    set((s) => ({
      topZ,
      focusedId: id,
      windows: s.windows.map((x) => (x.id === id ? { ...x, z: topZ } : x)),
    }))
    void pointer
  },

  minimizeWindow: (id) => {
    const w = get().windows.find((x) => x.id === id)
    if (!w) return
    set((s) => ({
      windows: s.windows.map((x) => (x.id === id ? { ...x, minimized: true } : x)),
      minimizedList: s.minimizedList.some((m) => m.id === id) ? s.minimizedList : [...s.minimizedList, { id }],
    }))
  },

  restoreMinimized: (id) => {
    set((s) => ({
      windows: s.windows.map((x) => (x.id === id ? { ...x, minimized: false } : x)),
      minimizedList: s.minimizedList.filter((m) => m.id !== id),
    }))
    get().focusWindow(id)
  },

  toggleMaximize: (id) => {
    const w = get().windows.find((x) => x.id === id)
    if (!w) return
    if (w.maximized) {
      const r = w.restore
      set((s) => ({
        dockHidden: false,
        topbarFloating: true,
        windows: s.windows.map((x) =>
          x.id === id ? { ...x, maximized: false, restore: null, x: r?.x ?? x.x, y: r?.y ?? x.y, width: r?.width ?? x.width, height: r?.height ?? x.height } : x
        ),
      }))
    } else {
      set((s) => ({
        dockHidden: true,
        topbarFloating: false,
        windows: s.windows.map((x) => (x.id === id ? { ...x, maximized: true, restore: { x: x.x, y: x.y, width: x.width, height: x.height } } : x)),
      }))
    }
    get().focusWindow(id)
  },

  updateWindow: (id, patch) => {
    set((s) => ({ windows: s.windows.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  },

  setWindowPosition: (id, x, y) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) }))
  },

  setWindowSize: (id, width, height) => {
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, width, height } : w)) }))
  },

  setMenu: (menu) => set({ activeMenu: menu }),
  toggleMenu: (menu) => set((s) => ({ activeMenu: s.activeMenu === menu ? null : menu })),
  closeMenus: () => set({ activeMenu: null, contextMenu: null, dockOpen: false }),
  setContextMenu: (cm) => set({ contextMenu: cm }),
  setDockOpen: (open) => set({ dockOpen: open }),
  toggleDock: () => set((s) => ({ dockOpen: !s.dockOpen })),
  setDockHidden: (hidden) => set({ dockHidden: hidden }),

  toast: (title, content = '', icon = 'bi-app-indicator', iconColor = '#000') => {
    const id = get().toastSeq
    set((s) => ({ toastSeq: s.toastSeq + 1, toasts: [...s.toasts, { id, title, content, icon, iconColor }] }))
    const ttl = content ? 4200 : 2600
    setTimeout(() => get().dismissToast(id), ttl)
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  notify: (title, content, icon = 'bi-bell') => {
    const id = get().notifySeq
    set((s) => ({ notifySeq: s.notifySeq + 1, notificationPile: [...s.notificationPile, { id, title, content, icon, createdAt: Date.now() }] }))
  },

  removeNotification: (id) => set((s) => ({ notificationPile: s.notificationPile.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notificationPile: [] }),

  alert: (title, message, icon = 'bi-exclamation-triangle', buttons, color = '#ffd84d') => {
    const id = get().alertSeq
    const btns: AlertItem['buttons'] =
      buttons && buttons.length > 0
        ? buttons
        : [
            { label: 'Cancel', role: 'secondary' },
            { label: 'OK', role: 'primary' },
          ]
    set((s) => ({
      alertSeq: s.alertSeq + 1,
      alerts:
        s.alertOpenId == null
          ? [...s.alerts, { id, title, message, icon, color, buttons: btns }]
          : s.alerts,
      alertOpenId: s.alertOpenId ?? id,
    }))
  },

  closeAlert: (id) => {
    const remaining = get().alerts.filter((a) => a.id !== id)
    set({
      alerts: remaining,
      alertOpenId: remaining.length ? remaining[0].id : null,
    })
    if (remaining.length) {
      // queue up next
      setTimeout(() => {}, 0)
    }
  },

  pushClipboard: (item) => set((s) => ({ clipboardHistory: [item, ...s.clipboardHistory].slice(0, 20) })),
  clearClipboard: () => set({ clipboardHistory: [] }),

  setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
}))

function nextId(s: OsState) {
  return s.windows.reduce((m, w) => Math.max(m, w.id), 0) + 1
}