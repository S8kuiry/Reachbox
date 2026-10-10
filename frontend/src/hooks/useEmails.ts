
import { useCallback, useEffect, useState } from 'react'
import type { EmailJob } from '../types'
import { fetchEmails } from '../services/emailService'
import { useAuth } from '../context/AuthContext'

type EmailStatusEvent = {
  id: string
  status: string
  sentAt?: string | null
  error?: string | null
  subject?: string
  body?: string
  to?: string
  recipients?: string[]
  scheduledAt?: string | null
}

function normalizeStatus(raw: unknown): EmailJob['status'] {
  const s = String(raw ?? '').toLowerCase()
  if (s === 'scheduled' || s === 'processing') return s as EmailJob['status']
  if (s === 'sent') return 'sent'
  return 'failed'
}

function upsertEmail(current: EmailJob[], event: EmailStatusEvent): EmailJob[] {
  const status = normalizeStatus(event.status)
  const existing = current.find((email) => email.id === event.id)
  if (!existing) {
    // SSE arrived for an email we haven't fetched (e.g. new schedule or
    // paged-out row): insert it so counts move without a manual refresh.
    const now = new Date().toISOString()
    return [
      {
        id: event.id,
        to: event.to ?? event.recipients?.[0] ?? '',
        subject: event.subject ?? '',
        body: event.body ?? '',
        status,
        scheduledAt: event.scheduledAt ?? now,
        sentAt: event.sentAt ?? null,
        createdAt: now,
      } as EmailJob,
      ...current,
    ]
  }
  return current.map((email) =>
    email.id === event.id
      ? {
          ...email,
          status,
          ...(event.sentAt !== undefined && {
            sentAt: event.sentAt,
          }),
          ...(event.error !== undefined
            ? { error: event.error }
            : {}),
        }
      : email
  )
}

export function useEmailFeed() {
  const { idToken } = useAuth()

  const [emails, setEmails] = useState<EmailJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!idToken) {
      setEmails([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [scheduled, sent] = await Promise.all([
        fetchEmails('scheduled', idToken),
        fetchEmails('sent', idToken),
      ])

      setEmails([
        ...scheduled,
        ...sent.filter(
          (sentEmail) =>
            !scheduled.some((email) => email.id === sentEmail.id)
        ),
      ])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load emails'
      )
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (!idToken) {
      setEmails([])
      setLoading(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()

    async function loadEmails() {
      setLoading(true)
      setError(null)

      try {
        const [scheduled, sent] = await Promise.all([
          fetchEmails('scheduled', idToken),
          fetchEmails('sent', idToken),
        ])

        if (!cancelled) {
          setEmails([
            ...scheduled,
            ...sent.filter(
              (sentEmail) =>
                !scheduled.some((email) => email.id === sentEmail.id)
            ),
          ])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load emails'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function listenForEvents() {
  // Outer loop ensures continuous reconnection if the stream drops
  while (!cancelled) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/emails/events`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        }
      )

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!cancelled) {
        const { value, done } = await reader.read()
        if (done) break // Stream ended on server side -> break inner loop to trigger reconnect

        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''

        for (const message of messages) {
          const lines = message.split(/\r?\n/)
          const eventLine = lines.find((line) => line.startsWith('event:'))
          const dataLine = lines.find((line) => line.startsWith('data:'))

          const eventType = eventLine ? eventLine.slice('event:'.length).trim() : 'message'

          // Accept 'email.status.updated' or generic default SSE messages
          if (
            (eventType !== 'email.status.updated' && eventType !== 'message') ||
            !dataLine
          ) {
            continue
          }

          try {
            const event = JSON.parse(
              dataLine.slice('data:'.length).trim()
            ) as EmailStatusEvent

            setEmails((current) => upsertEmail(current, event))
          } catch {
            console.error('Could not parse email status event')
          }
        }
      }
    } catch (err) {
      if (cancelled || controller.signal.aborted) break
      console.warn('SSE connection disconnected. Retrying in 3 seconds...', err)
      // Pause 3s before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }
}

    void loadEmails()
    void listenForEvents()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [idToken])

  return { emails, setEmails, loading, error, refresh }
}

