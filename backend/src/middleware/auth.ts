import type { NextFunction, Request, Response } from 'express'
import { authenticateGoogleUser } from '../services/user'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const user = await authenticateGoogleUser(idToken)

    req.user = user

    next()
  } catch (error) {
    console.error('Authentication error:', error)

    return res.status(401).json({
      error: 'Invalid or expired authentication token',
    })
  }
}