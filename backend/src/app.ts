import express from 'express'
import cors from 'cors'
import {  ExpressAdapter } from '@bull-board/express'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { env } from './config/env'
import { emailQueue } from './queue/emailQueue'
import { emailRouter } from './routes/emails'
import { errorHandler } from './middleware/errorHandler'
import { createBullBoard } from '@bull-board/api'
import { userRouter } from './routes/user'

export const app = express()

// Middleware
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())

// BullMQ Real-Time Board Dashboard UI
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
})

app.use('/admin/queues', serverAdapter.getRouter())

// Healthcheck Route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', userRouter)
app.use('/api/emails', emailRouter)

// Global Error Handler
app.use(errorHandler)