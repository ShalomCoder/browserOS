import pg from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (err) => {
  console.error('[db] idle client error', err.message)
})

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params)
}

export default pool