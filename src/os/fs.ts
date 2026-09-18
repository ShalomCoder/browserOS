'use client'

import type { FsNode } from './types'

export type FsResult<T = Record<string, unknown>> =
  | ({ success: true; message?: string } & T)
  | { success: false; message: string }

export async function fsCall<T = Record<string, any>>(body: Record<string, any>): Promise<FsResult<T>> {
  const res = await fetch('/api/fs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    return { success: false, message: `Server error ${res.status}` }
  }
  return res.json()
}

export function joinDir(dir: string, name: string): string {
  if (dir === '/') return `/${name}`
  return `${dir.replace(/\/$/, '')}/${name}`
}

export function parentDir(dir: string): string {
  if (!dir || dir === '/') return '/'
  const parts = dir.replace(/\/$/, '').split('/')
  parts.pop()
  return parts.join('/') || '/'
}

export function fileNameFromPath(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

export async function listDir(dir = '/'): Promise<FsNode[]> {
  const res = await fsCall<{ children?: FsNode[] }>({ op: 'list', dir })
  if (!res.success) throw new Error(res.message || 'Failed to list')
  return res.children || []
}

export async function readRemote(path: string): Promise<string> {
  const dir = path.slice(0, path.lastIndexOf('/')) || '/'
  const filename = path.slice(path.lastIndexOf('/') + 1) || path
  const res = await fsCall<{ content?: string }>({ op: 'read', dir, filename })
  if (!res.success) throw new Error(res.message || 'Failed to read')
  return res.content ?? ''
}

export async function writeRemote(path: string, content: string): Promise<void> {
  const dir = path.slice(0, path.lastIndexOf('/')) || '/'
  const filename = path.slice(path.lastIndexOf('/') + 1) || path
  const res = await fsCall({ op: 'write', dir, filename, content })
  if (!res.success) throw new Error(res.message || 'Failed to write')
}

export async function createFileRemote(dir: string, filename: string, content = ''): Promise<void> {
  const res = await fsCall({ op: 'create_file', dir, filename, content })
  if (!res.success) throw new Error(res.message || 'Failed to create file')
}

export async function createFolderRemote(dir: string, foldername: string): Promise<void> {
  const res = await fsCall({ op: 'create_folder', dir, foldername })
  if (!res.success) throw new Error(res.message || 'Failed to create folder')
}

export async function deleteRemote(dir: string, name: string): Promise<void> {
  const res = await fsCall({ op: 'delete', dir, name })
  if (!res.success) throw new Error(res.message || 'Failed to delete')
}

export async function renameRemote(dir: string, old: string, neu: string): Promise<void> {
  const res = await fsCall({ op: 'rename', dir, old, new: neu })
  if (!res.success) throw new Error(res.message || 'Failed to rename')
}

export const IMAGE_EXTS = /\.(jpe?g|png|gif|svg|webp|bmp)$/i
export const TEXT_EXTS = /\.(txt|md|json|js|jsx|ts|tsx|css|html|htm|xml|yml|yaml|sql|sh|py|php|ini|log|csv)$/i