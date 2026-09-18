import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { randomBytes, scryptSync, createHash } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function getEnv() {
  const envPath = path.join(root, '.env.local')
  const env = {}
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `$scrypt$${salt}$${hash}`
}

const env = getEnv()
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found. Set it in .env.local')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL })

async function setup() {
  const client = await pool.connect()
  try {
    console.log('Connected to Neon Postgres.')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT DEFAULT '',
        password TEXT NOT NULL,
        userhash TEXT UNIQUE NOT NULL,
        installed_apps TEXT[] NOT NULL DEFAULT '{}',
        theme TEXT NOT NULL DEFAULT 'webosDefault',
        theme_scheme TEXT NOT NULL DEFAULT 'light',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userhash TEXT NOT NULL REFERENCES users(userhash) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        userhash TEXT NOT NULL REFERENCES users(userhash) ON DELETE CASCADE,
        path TEXT NOT NULL,
        is_folder BOOLEAN NOT NULL DEFAULT false,
        content TEXT DEFAULT '',
        size BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (userhash, path)
      );
    `)
    console.log('Tables ready (users, sessions, files).')

    const seeds = [
      {
        username: 'ask_vd',
        email: 'shalomaskvd@gmail.com',
        password: 'webos',
        installed_apps: ['calculator', 'files', 'notes', 'terminal', 'browser', 'photos', 'editor', 'settings', 'store', 'taskmanager', 'calendar', 'camera', 'weavercode'],
        theme: 'ventura105',
      },
      {
        username: 'user',
        email: '',
        password: 'user',
        installed_apps: ['calculator', 'editor', 'browser', 'calendar', 'notes', 'settings', 'store', 'taskmanager', 'files', 'terminal'],
        theme: 'webosDefault',
      },
    ]

    for (const s of seeds) {
      const userhash = await client.query('SELECT userhash FROM users WHERE username = $1', [s.username])
      if (userhash.rowCount > 0) {
        console.log(`Seed user "${s.username}" already exists — skipping.`)
        continue
      }
      const hash = hashPassword(s.password)
      const uh = md5(`user-${s.username}`)
      await client.query(
        `INSERT INTO users (username, email, password, userhash, installed_apps, theme)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.username, s.email, hash, md5(`user-${s.username}`), s.installed_apps, s.theme]
      )
      console.log(`Seeded user "${s.username}" (password: ${s.password})`)
    }

    // Root fs rows for the ask_vd home so the file manager isn't empty.
    const askHome = await client.query(`SELECT userhash FROM users WHERE username = 'ask_vd'`)
    if (askHome.rowCount > 0) {
      const uh = askHome.rows[0].userhash
      const root = await client.query('SELECT 1 FROM files WHERE userhash = $1 AND path = $2', [uh, '/'])
      if (root.rowCount === 0) {
        const entries = [
          ['/', true],
          ['/Hello, WebOS.txt', false],
          ['/Projects', true],
          ['/Server', true],
          ['/hello.html', false],
        ]
        for (const [p, isFolder] of entries) {
          await client.query(
            `INSERT INTO files (userhash, path, is_folder, content, size)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [uh, p, isFolder, isFolder ? '' : defaultContent(p), p === '/' ? 0 : Buffer.byteLength(defaultContent(p))]
          )
        }
        console.log(`Seeded starter files for ${uh}.`)
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

function md5(str) {
  return createHash('md5').update(str).digest('hex')
}

function defaultContent(p) {
  if (p.endsWith('.txt')) return 'Welcome to WebOS Next!\n\nThis is a fresh file in your filesystem.'
  if (p.endsWith('.html'))
    return '<!DOCTYPE html>\n<html><body><h1>Hello from WebOS Next</h1></body></html>'
  return ''
}

setup().catch((e) => {
  console.error('Setup failed:', e)
  process.exit(1)
})