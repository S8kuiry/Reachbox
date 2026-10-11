import type { EmailJob, EmailKind, EmailSearchField, EmailSearchStatus, ScheduleEmailPayload } from '../types'
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'


const headers = (idToken: string | null) => ({
  'Content-Type': 'application/json',
  ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
})

/** Shape of an Email row returned by the backend (Prisma model, serialized). */
interface ApiEmail {
  id: string
  recipients?: string[]
  subject: string
  body: string
  status: string // 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED'
  scheduledAt: string | null
  sentAt: string | null
  createdAt?: string | null
}

/** Map a backend Email row onto the frontend EmailJob view-model. */
export const toEmailJob = (e: ApiEmail): EmailJob => ({
  id: e.id,
  to: e.recipients?.[0] ?? '',
  subject: e.subject,
  body: e.body,
  status: (e.status ?? '').toLowerCase() as EmailJob['status'],
  scheduledAt: e.scheduledAt ?? '',
  sentAt: e.sentAt ?? null,
  createdAt: e.createdAt ?? null,
})

async function readError(res: Response, fallback: string): Promise<never> {
  const data = await res.json().catch(() => null)
  throw new Error(data?.error || fallback)
}


export async function fetchEmails(
  kind: EmailKind,
  idToken: string | null
): Promise<EmailJob[]> {
  // Fetch a large page so sidebar/header counts match the list.
  // (Backend still paginates; the dashboard feed keeps a client copy and
  // patches rows in place via SSE, so one big first page is enough here.)
  const params = new URLSearchParams({
    status: kind,
    page: '1',
    limit: '200',
  })

  const res = await fetch(`${API}/emails?${params.toString()}`, {
    headers: headers(idToken),
  })

  if (!res.ok) {
    await readError(res, 'Failed to load emails')
  }

  const data = await res.json()

  const rows: ApiEmail[] = data.emails ?? []

  return rows.map(toEmailJob)
}



export async function scheduleEmails(payload: ScheduleEmailPayload, idToken: string | null) {
  const res = await fetch(`${API}/emails/schedule`, {
    method: 'POST',
    headers: headers(idToken),
    body: JSON.stringify(payload),
  })
  if (!res.ok) await readError(res, 'Failed to schedule emails')
  return res.json()
}




export async function searchEmails(
  query: string,
  idToken: string | null,
  field: EmailSearchField = 'all',
  status: EmailSearchStatus = 'all',
): Promise<EmailJob[]> {
  const params = new URLSearchParams({
    q: query,
    field,
    status,
  })

  const res = await fetch(
    `${API}/emails/search?${params.toString()}`,
    { headers: headers(idToken) },
  )

  if (!res.ok) await readError(res, 'Failed to search emails')

  const data = await res.json()
  const rows: ApiEmail[] = data.emails ?? []

  return rows.map(toEmailJob)
}


export async  function deleteEmailById(
  idToken: string | null,
  emailId:string
):Promise<{ message: string }>{
  const res = await fetch(`${API}/emails/${encodeURIComponent(emailId)}`,{
    method:'DELETE',
    headers: headers(idToken),
  })
  if (!res.ok) await readError(res, 'Failed to delete email')

  return res.json()

}


export async function deleteEmailsByStatus(
  status: EmailKind | undefined,
  idToken: string | null,
): Promise<{ message: string; count: number }> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)

  const qs = params.toString()
  const res = await fetch(`${API}/emails${qs ? `?${qs}` : ''}`, {
    method: 'DELETE',
    headers: headers(idToken),
  })

  if (!res.ok) await readError(res, 'Failed to delete emails')

  return res.json()
}