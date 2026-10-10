import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

export const userRouter = Router()

// GET /api/auth/me - Verify the Google token and return the current user profile.
userRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})
