import { query } from './db'

export type FsNode = {
  name: string
  type: 'folder' | 'file'
  size: string
  actual_size: number
}

export function normalizePath(input: string): string {
  let p = input || '/'
  p = p.replace(/\\/g, '/')
  if (!p.startsWith('/')) p = '/' + p
  const parts = p.split('/').filter((s) => s && s !== '.')
  return '/' + parts.join('/')
}

function dirName(p: string): string {
  const n = normalizePath(p)
  const idx = n.lastIndexOf('/')
  if (idx <= 0) return '/'
  return n.slice(0, idx)
}

function baseName(p: string): string {
  const n = normalizePath(p)
  if (n === '/') return ''
  return n.slice(n.lastIndexOf('/') + 1)
}

export function joinPath(dir: string, name: string): string {
  return normalizePath(`${dir}/${name}`)
}

function displaySize(bytes: number): string {
  if (bytes < 1024) return bytes === 0 ? '' : '1 KB'
  return `${Math.round(bytes / 1024 * 10) / 10} KB`
}

async function ensureRoot(userhash: string) {
  await query(
    `INSERT INTO files (userhash, path, is_folder, content, size) VALUES ($1, '/', true, '', 0)
     ON CONFLICT DO NOTHING`,
    [userhash]
  )
}

export async function listDir(userhash: string, dir: string) {
  await ensureRoot(userhash)
  const base = normalizePath(dir || '/')

  const res = await query(
    `SELECT path, is_folder, content, size FROM files
     WHERE userhash = $1 AND path <> '/'`,
    [userhash]
  )

  const children: FsNode[] = []
  for (const row of res.rows) {
    const parent = dirName(row.path)
    if (parent !== base) continue
    children.push({
      name: baseName(row.path),
      type: row.is_folder ? 'folder' : 'file',
      size: row.is_folder ? '' : displaySize(row.size),
      actual_size: row.size,
    })
  }

  // ".." parent entry when not at root
  const items: FsNode[] = base !== '/' ? [{ name: '..', type: 'folder', size: '', actual_size: 0 }, ...children] : children
  items.sort((a, b) => {
    if (a.name === '..') return -1
    if (b.name === '..') return 1
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return items
}

export async function readFile(userhash: string, path: string) {
  const p = normalizePath(path)
  const res = await query(`SELECT content FROM files WHERE userhash = $1 AND path = $2 AND is_folder = false`, [userhash, p])
  if (res.rowCount === 0) return null
  return res.rows[0].content
}

export async function writeFile(userhash: string, path: string, content: string) {
  const p = normalizePath(path)
  const size = Buffer.byteLength(content || '')
  await query(
    `INSERT INTO files (userhash, path, is_folder, content, size) VALUES ($1, $2, false, $3, $4)
     ON CONFLICT (userhash, path) DO UPDATE SET content = EXCLUDED.content, size = EXCLUDED.size, updated_at = now()`,
    [userhash, p, content || '', size]
  )
  return true
}

export async function createFile(userhash: string, dir: string, filename: string, content = '') {
  const p = joinPath(dir, filename)
  await writeFile(userhash, p, content)
  return p
}

export async function createFolder(userhash: string, dir: string, foldername: string) {
  const p = joinPath(dir, foldername)
  await query(
    `INSERT INTO files (userhash, path, is_folder, content, size) VALUES ($1, $2, true, '', 0)
     ON CONFLICT DO NOTHING`,
    [userhash, p]
  )
  return p
}

export async function deleteNode(userhash: string, dir: string, name: string) {
  const p = normalizePath(`${dir}/${name}`)
  const res = await query(`SELECT is_folder FROM files WHERE userhash = $1 AND path = $2`, [userhash, p])
  if (res.rowCount === 0) return { ok: false, message: 'Not found.' }
  const isFolder = res.rows[0].is_folder
  if (isFolder) {
    // recursive delete of subtree
    const sub = await query(`DELETE FROM files WHERE userhash = $1 AND (path = $2 OR path LIKE $3)`, [userhash, p, `${p}/%`])
    return { ok: true, removed: sub.rowCount }
  }
  await query(`DELETE FROM files WHERE userhash = $1 AND path = $2`, [userhash, p])
  return { ok: true, removed: 1 }
}

export async function renameNode(userhash: string, dir: string, old: string, newName: string) {
  const oldP = normalizePath(`${dir}/${old}`)
  const newP = normalizePath(`${dir}/${newName}`)
  const res = await query(`SELECT is_folder FROM files WHERE userhash = $1 AND path = $2`, [userhash, oldP])
  if (res.rowCount === 0) return { ok: false, message: 'Not found.' }
  const isFolder = res.rows[0].is_folder
  if (isFolder) {
    // rename subtree paths
    const rowsR = await query(`SELECT path FROM files WHERE userhash = $1 AND (path = $2 OR path LIKE $3)`, [userhash, oldP, `${oldP}/%`])
    for (const row of rowsR.rows) {
      const rel = row.path.slice(oldP.length)
      await query(`UPDATE files SET path = $1 WHERE userhash = $2 AND path = $3`, [newP + rel, userhash, row.path])
    }
    return { ok: true }
  }
  await query(`UPDATE files SET path = $1 WHERE userhash = $2 AND path = $3`, [newP, userhash, oldP])
  return { ok: true }
}

export async function exists(userhash: string, path: string) {
  const res = await query(`SELECT 1 FROM files WHERE userhash = $1 AND path = $2`, [userhash, normalizePath(path)])
  return res.rowCount ? res.rowCount > 0 : false
}

export async function getNode(userhash: string, path: string) {
  const res = await query(
    `SELECT path, is_folder, content, size FROM files WHERE userhash = $1 AND path = $2`,
    [userhash, normalizePath(path)]
  )
  if (res.rowCount === 0) return null
  return res.rows[0]
}