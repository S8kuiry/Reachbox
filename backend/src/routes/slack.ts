import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { exchangeSlackCode } from '../services/slack.service'
import { db } from '../db'
import { env } from '../config/env'

export const slackRouter = Router()

// GET /api/slack/oauth/callback - Handle Slack OAuth redirect code
slackRouter.get('/oauth/callback', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.query
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Missing OAuth authorization code' })
      return
    }

    const { accessToken, channelId } = await exchangeSlackCode(code)

    // Save Slack credentials against the authenticated user
    await db.user.update({
      where: { id: req.user!.id },
      data: {
        slackAccessToken: accessToken,
        slackChannelId: channelId,
      },
    })

    // Redirect user back to frontend dashboard
    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`)
  } catch (err) {
    next(err)
  }
})