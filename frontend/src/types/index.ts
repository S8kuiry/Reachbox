export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  hourlyLimit: number
  createdAt: string
  updatedAt: string
}

export type SessionUser = Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>

export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed'

export interface EmailJob {
  id: string
  to: string
  subject: string
  body: string
  status: EmailStatus
  scheduledAt: string // ISO date
  sentAt: string | null // ISO date
  createdAt?: string | null // ISO date
}

export interface ScheduleEmailPayload {
  subject: string
  body: string
  recipients: string[]
  startTime: string // ISO date
  delayBetweenSeconds: number
  hourlyLimit?: number
}

export interface GoogleIdTokenPayload {
  sub: string
  name: string
  email: string
  picture: string
  exp: number // seconds since epoch
}

export interface AuthSession {
  user: SessionUser
  idToken: string
  expiresAt: number // ms since epoch
}

export interface AuthContextValue {
  user: SessionUser | null
  idToken: string | null
  login: (idToken: string) => Promise<void>
  logout: () => void
}


export interface DashboardOutletContext {
  search: string
  refreshKey: number
}

export type EmailKind = 'scheduled' | 'sent'

// Single source of truth for which statuses belong to which tab/count.
// scheduled tab = not yet delivered (scheduled + in-flight processing)
// sent tab      = terminal (delivered + failed)
export const isScheduledStatus = (status: string) => {
  const s = status?.toLowerCase()
  return s === 'scheduled' || s === 'processing'
}

export const isSentStatus = (status: string) => {
  const s = status?.toLowerCase()
  return s === 'sent' || s === 'failed'
}