import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

export interface AuthUser {
  userId: string
  is_admin: boolean
}

export async function authMiddleware(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get('poly_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const secret = process.env.TOKEN_SECRET || 'polymarket-dev-secret'
  const userId = verifyToken(token, secret)
  if (!userId) return null

  // Check admin status from header or fetch
  const is_admin = req.headers.get('x-admin') === 'true'
  return { userId, is_admin }
}
