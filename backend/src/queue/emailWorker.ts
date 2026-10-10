import { Worker, Queue } from 'bullmq'
import { redisConnection } from './connection'
import { db } from '../db'
import { sendEmail } from '../services/mailer'
import { publishEmailStatus } from '../services/emailEvents'
import { updateIndexedEmail } from '../services/search.service'

export function startEmailWorker() {
  // 1. Instantly clear stale waiting jobs on startup
  const queue = new Queue('emailQueue', { connection: redisConnection })
  queue.drain(true).catch((err) => console.error('⚠️ Failed to drain stale queue jobs:', err))

  const worker = new Worker(
    'emailQueue',
    async (job) => {
      const { emailId } = job.data

      console.log(`📥 Processing email: ${emailId}`)

      // 2. Fetch the email record from PostgreSQL
      const email = await db.email.findUnique({
        where: { id: emailId },
      })

      // Graceful guard: If the record was deleted, complete cleanly instead of throwing
      if (!email) {
        console.warn(`⚠️ Email ${emailId} no longer exists in database. Skipped job.`)
        return
      }

      // Avoid sending an email that's already marked as sent
      if (email.status === 'SENT') {
        return
      }

      // Safe update in case of deletion race conditions
      try {
        await db.email.update({
          where: { id: email.id },
          data: {
            status: 'PROCESSING',
            attempts: { increment: 1 },
            error: null,
          },
        })

        await updateIndexedEmail(email.id, {
          status: 'PROCESSING',
        }).catch((error) => {
          console.error(`Failed to update Elasticsearch for ${email.id}:`, error)
        })
      } catch {
        console.warn(`⚠️ Could not set status to PROCESSING for ${email.id}. Record was likely deleted.`)
        return
      }

      publishEmailStatus(email.ownerId, {
        id: email.id,
        status: 'PROCESSING',
        sentAt: null,
        error: null,
      })

      try {
        // Safe recipient extraction
        const recipientEmail = Array.isArray(email.recipients)
          ? email.recipients[0]
          : email.recipients

        if (!recipientEmail || typeof recipientEmail !== 'string') {
          throw new Error(`Invalid or missing recipient for email ID: ${email.id}`)
        }

        await sendEmail(
          recipientEmail,
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

        await updateIndexedEmail(updatedEmail.id, {
          status: 'SENT',
          sentAt: updatedEmail.sentAt,
        }).catch((error) => {
          console.error(`Failed to update Elasticsearch for ${updatedEmail.id}:`, error)
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
        }).catch(() => null) // Ignore update errors if DB row was removed mid-flight



        if (updatedEmail) {

          await updateIndexedEmail(updatedEmail.id, {
            status: 'FAILED',
          }).catch((error) => {
            console.error(`Failed to update Elasticsearch for ${updatedEmail.id}:`, error)
          })

          publishEmailStatus(email.ownerId, {
            id: updatedEmail.id,
            status: 'FAILED',
            error: updatedEmail.error,
          })
        }

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