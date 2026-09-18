import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `$scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith('$scrypt$')) {
    return verifyLegacy(password, stored)
  }
  const parts = stored.split('$')
  if (parts.length !== 4) return false
  const salt = parts[2]
  const expected = Buffer.from(parts[3], 'hex')
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(actual, expected)
}

function verifyLegacy(password: string, stored: string): boolean {
  const hash = createHash('md5').update(password).digest('hex')
  return hash === stored
}

export function md5(input: string): string {
  return createHash('md5').update(input).digest('hex')
}