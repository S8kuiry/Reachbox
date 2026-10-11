import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { scheduleEmails, listEmails, deleteAllEmails, deleteEmail } from '../services/email.service'
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
    const field = String(req.query.field ?? 'all') as
      'all' | 'recipient' | 'sender' | 'subject' | 'body'
    const status = String(req.query.status ?? 'all') as
      'all' | 'scheduled' | 'processing' | 'sent' | 'failed'

    // Query may be empty when only a status filter is chosen
    const emails = await searchEmails(req.user!.id, query, field, status)
    res.json({ emails })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/emails/:id - Delete a single email by ID
emailRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    if (!id) {
      res.status(400).json({ error: 'Email id is required' })
      return
    }
    const result = await deleteEmail(req.user!.id, id)
    res.json({ message: 'Email deleted successfully', ...result })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/emails - Delete all emails (or filter by status query param)
emailRouter.delete('/', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query
    const result = await deleteAllEmails(
      req.user!.id,
      status as 'scheduled' | 'sent' | 'failed' | undefined
    )
    res.json({ message: `Successfully deleted ${result.count} email(s)`, ...result })
  } catch (err) {
    next(err)
  }
})