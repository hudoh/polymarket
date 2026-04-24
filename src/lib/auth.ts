import { createHash, randomBytes, createHmac } from 'crypto'

const ITERATIONS = 100_000
const KEYLEN = 32

function deriveKey(password: string, salt: string): Buffer {
  return createHmac('sha256', password)
    .update(salt)
    .digest()
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = deriveKey(password, salt)
  return `${salt}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  const key = deriveKey(password, salt)
  return key.toString('hex') === hash
}

export function createToken(userId: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64')
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyToken(token: string, secret: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    if (sig !== expected) return null
    const { userId, exp } = JSON.parse(Buffer.from(payload, 'base64').toString())
    if (Date.now() > exp) return null
    return userId
  } catch {
    return null
  }
}
