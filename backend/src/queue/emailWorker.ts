
import { Worker } from 'bullmq'
import { redisConnection } from './connection'
import { db } from '../db'
import { sendEmail } from '../services/mailer'
import { publishEmailStatus } from '../services/emailEvents'

export function startEmailWorker() {
  const worker = new Worker(
    'emailQueue',
    async (job) => {
      const { emailId } = job.data

      console.log(`📥 Processing email: ${emailId}`)

      // 1. Fetch the email record from PostgreSQL.
      const email = await db.email.findUnique({
        where: { id: job.data.emailId },
      })

      if (!email) {
        throw new Error(`Email ${job.data.emailId} not found`)
      }

      // Avoid sending an email that's already marked as sent.
      if (email.status === 'SENT') {
        return
      }

      await db.email.update({
        where: { id: email.id },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          error: null,
        },
      })

      publishEmailStatus(email.ownerId, {
        id: email.id,
        status: 'PROCESSING',
        sentAt: null,
        error: null,
      })

      try {
        await sendEmail(
          email.recipients[0],
          email.subject,
          email.body
        )

        const updatedEmail = await db.email.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            error: null,
          },
        })

        publishEmailStatus(email.ownerId, {
          id: updatedEmail.id,
          status: 'SENT',
          sentAt: updatedEmail.sentAt?.toISOString() ?? null,
          error: null,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown email sending error'

        const updatedEmail = await db.email.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            error: message,
          },
        })

        publishEmailStatus(email.ownerId, {
          id: updatedEmail.id,
          status: 'FAILED',
          error: updatedEmail.error,
        })

        throw err
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  )

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error.message)
  })

  return worker
}
