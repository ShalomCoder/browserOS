'use client'

import type { AppManifest, AppProps } from './types'
import CalculatorApp from '@/apps/Calculator'
import FilesApp from '@/apps/Files'
import NotesApp from '@/apps/Notes'
import TerminalApp from '@/apps/Terminal'
import BrowserApp from '@/apps/Browser'
import PhotosApp from '@/apps/Photos'
import EditorApp from '@/apps/Editor'
import SettingsApp from '@/apps/Settings'
import StoreApp from '@/apps/Store'
import TaskManagerApp from '@/apps/TaskManager'
import CalendarApp from '@/apps/Calendar'
import CameraApp from '@/apps/Camera'
import WeavercodeApp from '@/apps/Weavercode'

export const APP_MANIFEST: AppManifest[] = [
  {
    key: 'calculator',
    name: 'Calculator',
    icon: 'bi-calculator',
    description: 'Simple calculator app.',
    defaultWidth: 320,
    defaultHeight: 520,
    minWidth: 300,
    minHeight: 420,
    Component: CalculatorApp,
  },
  {
    key: 'files',
    name: 'Files',
    icon: 'bi-folder2-open',
    description: 'Browse your browserOS filesystem.',
    defaultWidth: 700,
    defaultHeight: 460,
    minWidth: 420,
    minHeight: 320,
    Component: FilesApp,
  },
  {
    key: 'notes',
    name: 'Notes',
    icon: 'bi-journal-text',
    description: 'Quick sticky notes in your browser.',
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 420,
    minHeight: 320,
    Component: NotesApp,
  },
  {
    key: 'terminal',
    name: 'Terminal',
    icon: 'bi-terminal',
    description: 'Command line for browserOS.',
    defaultWidth: 640,
    defaultHeight: 400,
    minWidth: 360,
    minHeight: 240,
    Component: TerminalApp,
  },
  {
    key: 'browser',
    name: 'Browser',
    icon: 'bi-globe2',
    description: 'Browse the internet inside a window.',
    defaultWidth: 800,
    defaultHeight: 500,
    minWidth: 420,
    minHeight: 300,
    Component: BrowserApp,
  },
  {
    key: 'photos',
    name: 'Photos',
    icon: 'bi-images',
    description: 'View images from your filesystem.',
    defaultWidth: 760,
    defaultHeight: 520,
    minWidth: 420,
    minHeight: 320,
    Component: PhotosApp,
  },
  {
    key: 'editor',
    name: 'Editor',
    icon: 'bi-file-earmark-code',
    description: 'Plain text & code editor.',
    defaultWidth: 640,
    defaultHeight: 480,
    minWidth: 400,
    minHeight: 300,
    Component: EditorApp,
  },
  {
    key: 'calendar',
    name: 'Calendar',
    icon: 'bi-calendar-month',
    description: 'A simple month-view calendar.',
    defaultWidth: 500,
    defaultHeight: 400,
    minWidth: 380,
    minHeight: 340,
    noResize: true,
    Component: CalendarApp,
  },
  {
    key: 'camera',
    name: 'Camera',
    icon: 'bi-camera',
    description: 'Capture photos with your webcam.',
    defaultWidth: 500,
    defaultHeight: 520,
    minWidth: 360,
    minHeight: 360,
    Component: CameraApp,
  },
  {
    key: 'weavercode',
    name: 'WeaverCode',
    icon: 'bi-code-square',
    description: 'VS Code-style file editor with terminal.',
    defaultWidth: 1000,
    defaultHeight: 660,
    minWidth: 640,
    minHeight: 420,
    Component: WeavercodeApp,
  },
  {
    key: 'settings',
    name: 'Settings',
    icon: 'bi-gear',
    description: 'Customize your browserOS experience.',
    system: true,
    defaultWidth: 640,
    defaultHeight: 470,
    minWidth: 480,
    minHeight: 380,
    Component: SettingsApp,
  },
  {
    key: 'store',
    name: 'Store',
    icon: 'bi-shop-window',
    description: 'Install new apps for your user.',
    system: true,
    defaultWidth: 600,
    defaultHeight: 460,
    minWidth: 460,
    minHeight: 360,
    Component: StoreApp,
  },
  {
    key: 'taskmanager',
    name: 'Task Manager',
    icon: 'bi-cpu',
    description: 'See open windows and end tasks.',
    system: true,
    defaultWidth: 560,
    defaultHeight: 400,
    minWidth: 420,
    minHeight: 300,
    Component: TaskManagerApp,
  },
]

export const SYSTEM_APPS = APP_MANIFEST.filter((a) => a.system)

export function getAppManifest(keyOrName: string): AppManifest | undefined {
  return (
    APP_MANIFEST.find((a) => a.key === keyOrName) ||
    APP_MANIFEST.find((a) => a.name.toLowerCase() === keyOrName.toLowerCase())
  )
}

export function installedAppKeys(installed: string[]): string[] {
  const set = new Set(installed)
  return APP_MANIFEST.filter((a) => !a.system && set.has(a.key)).map((a) => a.key)
}

export function installableAppKeys(installed: string[]): AppManifest[] {
  const set = new Set(installed)
  return APP_MANIFEST.filter((a) => !a.system && !set.has(a.key))
}

export type { AppProps }