import { db } from '../db'
import { ScheduleEmailPayload } from '../types'
import type { EmailStatus } from '@prisma/client'
import { emailQueue } from '../queue/emailQueue'

/** Map the API-level kind to Prisma EmailStatus values. */
/* 'scheduled' intentionally includes PROCESSING so in-flight emails stay
 * visible in the scheduled feed and SSE transitions don't disappear. */
const STATUS_MAP: Record<'scheduled' | 'sent' | 'failed', EmailStatus[]> = {
  scheduled: ['SCHEDULED', 'PROCESSING'],
  sent: ['SENT', 'FAILED'],
  failed: ['FAILED'],
}

/**
 * Schedules a batch of emails.
 * Converts 1 batch payload into N distinct DB records (one per recipient).
 */

export async function scheduleEmails(
  userId: string,
  senderEmail: string,
  payload: ScheduleEmailPayload
) {
  const {
    subject,
    body,
    recipients,
    startTime,
    delayBetweenSeconds = 2,
  } = payload

  const baseTime = new Date(startTime).getTime()

  if (Number.isNaN(baseTime)) {
    throw new Error('Invalid startTime')
  }

  if (recipients.length === 0) {
    throw new Error('At least one recipient is required')
  }

  if (delayBetweenSeconds < 0) {
    throw new Error('Delay cannot be negative')
  }

  // 1. Create one database record per recipient.
  const createdEmails = await db.$transaction(
    recipients.map((recipient, index) => {
      const scheduledAt = new Date(
        baseTime + index * delayBetweenSeconds * 1000
      )

      return db.email.create({
        data: {
          ownerId: userId,
          sender: senderEmail,
          recipients: [recipient],
          subject,
          body,
          scheduledAt,
          delayBetweenSeconds,
          status: 'SCHEDULED',
        },
      })
    })
  )

  // 2. Add all emails to BullMQ in one bulk operation.
  await emailQueue.addBulk(
    createdEmails.map((email) => ({
      name: 'send-email',
      data: {
        emailId: email.id,
      },
      opts: {
        jobId: email.id,
        delay: Math.max(
          0,
          email.scheduledAt.getTime() - Date.now()
        ),
      },
    }))
  )

  // 3. Return the records so the frontend can display them immediately.
  return createdEmails
}



/**
 * Retrieves scheduled or sent emails for the dashboard with pagination.
 */
export async function listEmails(
  userId: string,
  status?: 'scheduled' | 'sent' | 'failed',
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit
  const where = {
    ownerId: userId,
    ...(status ? { status: { in: STATUS_MAP[status] } } : {}),
  }

  const [emails, total] = await Promise.all([
    db.email.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: limit,
    }),
    db.email.count({ where }),
  ])

  return {
    emails,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
} 