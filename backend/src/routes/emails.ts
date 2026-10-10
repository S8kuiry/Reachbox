import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { scheduleEmails, listEmails } from '../services/email.service'
import { searchEmails } from '../services/search.service'
import { addEmailClient } from '../services/emailEvents'

export const emailRouter = Router()

// POST /api/emails/schedule - Schedule new email jobs
emailRouter.post('/schedule', requireAuth, async (req, res, next) => {
  try {
    const { subject, body, recipients, startTime, delayBetweenSeconds } = req.body

    if (!subject || !body || !recipients || !Array.isArray(recipients) || !startTime) {
      res.status(400).json({ error: 'Missing required fields: subject, body, recipients[], startTime' })
      return
    }

    const scheduledRecords = await scheduleEmails(req.user!.id, req.user!.email, {
      subject,
      body,
      recipients,
      startTime,
      delayBetweenSeconds,
    })

    res.status(201).json({
      message: `Successfully scheduled ${scheduledRecords.length} email(s)`,
      emails: scheduledRecords,
    })
  } catch (err) {
    next(err)
  }
})


// sse get router
emailRouter.get('/events', requireAuth, (req, res) => {
  const userId = req.user!.id

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Tell the browser the SSE connection is ready.
  res.write('event: connected\ndata: {}\n\n')

  const removeClient = addEmailClient(userId, res)

  // Keep the connection alive.
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  res.on('close', () => {
    clearInterval(heartbeat)
    removeClient()
  })
})

// GET /api/emails - List scheduled or sent emails
emailRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, page, limit } = req.query
    const result = await listEmails(
      req.user!.id,
      status as 'scheduled' | 'sent' | 'failed' | undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/emails/search - Elasticsearch full-text query

emailRouter.get('/search', requireAuth, async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '').trim()

    if (!query) {
      res.status(400).json({
        error: 'Search query is required',
      })
      return
    }

    const emails = await searchEmails(req.user!.id, query)

    res.json({ emails })
  } catch (error) {
    next(error)
  }
})