import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // Elasticsearch
  ELASTICSEARCH_URL: z.string(),

  // Google Authentication
  GOOGLE_CLIENT_ID: z.string(),

  // Worker configuration
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  MIN_DELAY_SECONDS: z.coerce.number().nonnegative().default(2),
  MAX_EMAILS_PER_HOUR: z.coerce.number().int().positive().default(200),

  // SMTP / Nodemailer
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),

  // Slack
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid env:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data