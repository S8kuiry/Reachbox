import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Clock, Send } from 'lucide-react'
import type { DashboardOutletContext, EmailJob, EmailSearchField, EmailSearchStatus } from '../types'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import ComposeModal from '../components/email/ComposeModal'
import { useEmailFeed } from '../hooks/useEmails'
import { toEmailJob, searchEmails as searchEmailsApi } from '../services/emailService'
import { isScheduledStatus, isSentStatus } from '../types'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { idToken } = useAuth()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<EmailJob[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [searchField, setSearchField] =
    useState<EmailSearchField>('all')

  const [searchStatus, setSearchStatus] =
    useState<EmailSearchStatus>('all')

  const {
    emails,
    setEmails,
    loading,
    error,
    refresh,
  } = useEmailFeed()

  // Statuses are lowercase (emailService normalizes backend UPPERCASE).
  // scheduled = scheduled + processing (in-flight), sent = sent + failed.
  const scheduledEmails = emails.filter((email) =>
    isScheduledStatus(email.status)
  )

  const sentEmails = emails.filter((email) => isSentStatus(email.status))

  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-5 py-3 text-xs font-medium transition ${isActive
      ? 'bg-emerald-100 text-emerald-700'
      : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 bg-neutral-100'
    }`

  const ctx: DashboardOutletContext = {
    search,
    refreshKey: 0, // or String(refreshKey) if bound to a state variable
    searchResults,
    searchLoading,
    searchError,
    searchField,
    searchStatus
  }

  // After POST /schedule: merge the created rows into the feed immediately
  // (so Scheduled count/list updates without a refresh), then stay on the
  // Scheduled tab. SSE will later flip each row scheduled -> sent.
  const handleScheduled = (created: unknown) => {
    const rows = Array.isArray(created)
      ? created
      : // backend returns { emails: [...] }
      (created as { emails?: unknown[] })?.emails ?? []
    const jobs: EmailJob[] = (rows as Parameters<typeof toEmailJob>[0][]).map(
      toEmailJob
    )
    if (jobs.length > 0) {
      setEmails((current) => {
        const ids = new Set(current.map((e) => e.id))
        const fresh = jobs.filter((j) => !ids.has(j.id))
        return [...fresh, ...current]
      })
    } else {
      void refresh()
    }
    if (!location.pathname.endsWith('/scheduled')) {
      navigate('/dashboard/scheduled', { replace: false })
    }
  }





  useEffect(() => {
    const query = search.trim()
    let cancelled = false

    if (!query && searchStatus === 'all') {
      setSearchResults(null)
      setSearchLoading(false)
      setSearchError(null)
      return
    }

    setSearchResults(null)
    setSearchLoading(true)
    setSearchError(null)

    const timer = setTimeout(async () => {
      try {
        const results = await searchEmailsApi(
          query,
          idToken,
          searchField,
          searchStatus,
        )
        if (!cancelled) {
          setSearchResults(results)
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(
            err instanceof Error ? err.message : 'Search failed'
          )
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false)
        }
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, idToken, searchField, searchStatus])


  return (
    <div className="flex h-screen bg-white/10 text-neutral-900">
      <Sidebar
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
        onCompose={() => setComposeOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar
          search={search}
          onSearch={setSearch}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          searchStatus={searchStatus}
          onSearchStatusChange={setSearchStatus}
        />

        <main className="flex-1 overflow-y-auto px-6 lg:px-12">
          <div className="mx-auto max-w-8xl">
            <div className="mt-4 mb-6 flex flex-col justify-between gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
                  Your email workspace
                </h1>
                <p className="mt-0.5 text-xs text-neutral-500">
                  A little planning. A lot more connection.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <NavLink
                  to="/dashboard/scheduled"
                  className={tab}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Scheduled Emails</span>
                  <span className="rounded-md bg-neutral-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                    {scheduledEmails.length}
                  </span>
                </NavLink>

                <NavLink
                  to="/dashboard/sent"
                  className={tab}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Sent Emails</span>
                  <span className="rounded-md bg-neutral-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                    {sentEmails.length}
                  </span>
                </NavLink>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {loading && (
              <p className="mb-4 text-sm text-neutral-500">
                Loading emails...
              </p>
            )}

            <div className="mt-5 pb-10">
              <Outlet
                context={{
                  ...ctx,
                  emails,
                  setEmails,
                  loading,
                  error,
                  refresh,
                  searchResults,
                  searchLoading,
                  searchError,
                  searchStatus,
                  searchField
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onScheduled={handleScheduled}
      />
    </div>
  )
}
