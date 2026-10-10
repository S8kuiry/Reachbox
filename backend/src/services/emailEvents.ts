
import type { Response } from 'express'

type EmailEvent = {
  id: string
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED'
  sentAt?: string | null
  error?: string | null
}

const clients = new Map<string, Set<Response>>()

export function addEmailClient(userId: string, res: Response) {
  let userClients = clients.get(userId)

  if (!userClients) {
    userClients = new Set<Response>()
    clients.set(userId, userClients)
  }

  userClients.add(res)

  return () => {
    userClients?.delete(res)

    if (userClients?.size === 0) {
      clients.delete(userId)
    }
  }
}

export function publishEmailStatus(
  userId: string,
  email: EmailEvent
) {
  const userClients = clients.get(userId)

  if (!userClients) return

  const message = `event: email.status.updated\ndata: ${JSON.stringify(email)}\n\n`

  for (const client of userClients) {
    try {
      client.write(message)
    } catch {
      userClients.delete(client)
    }
  }
}