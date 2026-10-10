// backend/src/types/index.ts

export type EmailStatus = 'scheduled' | 'sent' | 'failed'

// Database User Model
export interface DbUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  hourlyLimit: number
  createdAt: Date
  updatedAt: Date
}

// Database Email Model (mirrors prisma/schema.prisma → model Email)
export interface DbEmail {
  id: string
  ownerId: string
  sender: string
  recipients: string[]
  subject: string
  body: string
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED'
  scheduledAt: Date
  sentAt?: Date | null
  error?: string | null
  createdAt: Date
}

// Payload received from React Dashboard (POST /api/emails/schedule)
export interface ScheduleEmailPayload {
  subject: string
  body: string
  recipients: string[]
  startTime: string // ISO date string from frontend
  delayBetweenSeconds?: number
  hourlyLimit?: number
}

// BullMQ Queue Job Data Payload
export interface SendEmailJobData {
  emailId: string
  userId: string
  senderEmail: string
  recipient: string
  subject: string
  body: string
  attemptCount?: number
}

// Google Auth Token Payload (from Google OAuth verification)
export interface GoogleIdTokenPayload {
  sub: string
  name: string
  email: string
  picture: string
  exp: number
}

// Express Authenticated Request Extension
declare global {
  namespace Express {
    interface Request {
      user?: DbUser
    }
  }
}