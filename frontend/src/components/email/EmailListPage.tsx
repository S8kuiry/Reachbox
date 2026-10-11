import { useMemo, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, ArrowUpRight, Send, RefreshCw, Trash2 } from 'lucide-react'
import type { DashboardOutletContext, EmailJob, EmailKind } from '../../types'
import { isScheduledStatus, isSentStatus } from '../../types'
import { formatDateTime, initials, nameFromEmail } from '../../utils/format'
import Spinner from '../ui/Spinner'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from '../ui/EmptyState'
import EmailDetailModal from './EmailDetailModal'
import { useAuth } from '../../context/AuthContext'
import { deleteEmailById, deleteEmailsByStatus } from '../../services/emailService'

const PAGE_SIZE = 10

export default function EmailListPage({ kind }: { kind: EmailKind }) {
  const { search, emails, loading, error, refresh, searchResults,
    searchLoading, searchStatus,
    searchError, } = useOutletContext<
      DashboardOutletContext & {
        emails: EmailJob[]
        loading: boolean
        error: string | null
        refresh: () => Promise<void>
      }
    >()

  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null)
  const [page, setPage] = useState(1)

  // Keep modal data updated if selected email status changes via SSE
  useEffect(() => {
    if (selectedEmail) {
      const updated = emails.find((e) => e.id === selectedEmail.id)
      if (updated) setSelectedEmail(updated)
    }
  }, [emails])

  // Reset to first page when tab / search / data size changes
  useEffect(() => {
    setPage(1)
  }, [kind, search])

  // Filter emails by page kind ('scheduled' vs 'sent') AND search query


  const rows = useMemo(() => {
    const hasQuery = search.trim().length > 0
    const hasStatusFilter = searchStatus !== 'all'

    const sourceEmails =
      hasQuery || hasStatusFilter
        ? (searchResults ?? [])
        : emails

    // An explicit status filter takes priority over the current tab.
    if (hasStatusFilter) {
      return sourceEmails
    }

    return sourceEmails.filter((email) =>
      kind === 'scheduled'
        ? isScheduledStatus(email.status)
        : isSentStatus(email.status)
    )
  }, [emails, search, searchResults, searchStatus, kind])



  const { idToken } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const isSearching = search.trim().length > 0
  const isLoading = isSearching ? searchLoading : loading
  const displayError = isSearching ? searchError : error

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedRows = useMemo(
    () => rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [rows, safePage]
  )

  const timeLabel = kind === 'scheduled' ? 'Scheduled for' : 'Sent at'


  const handleDeleteOne = async (ev: React.MouseEvent, id: string) => {
    ev.stopPropagation() // don't open the detail modal
    if (!window.confirm('Delete this email?')) return

    try {
      setDeleting(true)
      await deleteEmailById(idToken!,id)
      if (selectedEmail?.id === id) setSelectedEmail(null)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete email')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${kind} emails? This cannot be undone.`)) return
    try {
      setDeleting(true)
      await deleteEmailsByStatus(kind, idToken)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete emails')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-neutral-200/90 bg-neutral-50/50 shadow-sm">
        {/* High Contrast Header Bar */}
        <div className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr] gap-4 border-b border-neutral-200/90 bg-neutral-100/80 px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
          <span>Recipient</span>
          <span>Subject & Preview</span>
          <span>{timeLabel}</span>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteAll}
                disabled={deleting || rows.length === 0}
                title={`Delete all ${kind} emails`}
                className="text-neutral-400 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <button
                onClick={refresh}
                title="Refresh list"
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 py-20 bg-white text-[#00AB6B]">
            <Spinner />
            <span className="text-xs font-medium text-neutral-600">Loading emails…</span>
          </div>
        ) : displayError ? (
          <div className="bg-white py-16 text-center text-xs font-semibold text-red-600">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white py-12">
            {kind === 'scheduled' ? (
              <EmptyState
                icon={<Clock className="h-5 w-5" />}
                title="No scheduled emails"
                description={
                  search
                    ? 'No emails match your search filter.'
                    : 'Compose a new email to schedule your first campaign.'
                }
              />
            ) : (
              <EmptyState
                icon={<Send className="h-5 w-5" />}
                title="No sent emails yet"
                description={
                  search
                    ? 'No emails match your search filter.'
                    : 'Emails will appear here once they have been delivered.'
                }
              />
            )}
          </div>
        ) : (
          <>
            {/* Divided List */}
            <ul className="divide-y divide-neutral-200/70 bg-white">
              {pagedRows.map((e) => (
                <li
                  key={e.id}
                  onClick={() => setSelectedEmail(e)}
                  className="group grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr] items-center gap-6 px-6 py-3.5 transition-colors hover:bg-neutral-100/70 cursor-pointer"
                >
                  {/* Recipient Profile */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200/80 text-[11px] font-bold text-neutral-800 ring-1 ring-neutral-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600 transition-all">
                      {initials(nameFromEmail(e.to))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                        {nameFromEmail(e.to)}
                      </p>
                      <p className="truncate text-[11px] font-medium text-neutral-500">{e.to}</p>
                    </div>
                  </div>

                  {/* Subject & Preview */}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-neutral-900">{e.subject}</p>
                    <p className="truncate text-[11px] text-neutral-500">{e.body}</p>
                  </div>

                  {/* Date Column */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    <Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span>{formatDateTime(kind === 'scheduled' ? e.scheduledAt : e.sentAt)}</span>
                  </div>

                  {/* Status & Action Arrow */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={e.status} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(ev) => handleDeleteOne(ev, e.id)}
                        disabled={deleting}
                        title="Delete email"
                        className="text-neutral-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ArrowUpRight className="h-4 w-4 text-neutral-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-800" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-neutral-200/70 bg-white px-6 py-3">
              <p className="text-[11px] font-medium text-neutral-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - safePage) <= 1
                  )
                  .map((n, idx, arr) => (
                    <span key={n} className="flex items-center gap-1.5">
                      {idx > 0 && arr[idx - 1] !== n - 1 && (
                        <span className="px-0.5 text-[11px] text-neutral-400">…</span>
                      )}
                      <button
                        onClick={() => setPage(n)}
                        className={`h-7 min-w-7 rounded-lg px-2 text-[11px] font-semibold transition ${n === safePage
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          }`}
                      >
                        {n}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Render Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </>
  )
}