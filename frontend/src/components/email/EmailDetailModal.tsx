import { useEffect } from 'react'
import {
    X,
    Clock,
    CheckCircle2,
    Mail,
    Calendar,
    AlertCircle,
    XCircle,
} from 'lucide-react'
import { formatDateTime, initials, nameFromEmail } from '../../utils/format'
import StatusBadge from '../ui/StatusBadge'

// Fallback interface if Email is not exported in index.ts
export interface Email {
    id: string
    to: string
    subject: string
    body: string
    status: 'scheduled' | 'sent' | 'failed' | string
    scheduledAt?: string | null
    sentAt?: string | null
    createdAt?: string | null
}

interface Props {
    email: Email | null
    onClose: () => void
}

export default function EmailDetailModal({ email, onClose }: Props) {
    // ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    if (!email) return null

    const recipientName = nameFromEmail(email.to)
    const timestamp = email.scheduledAt ?? email.sentAt ?? email.createdAt

    // Footer status indicator
    const renderFooterStatus = () => {
        switch (email.status) {
            case 'scheduled':
                return (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                        <Clock size={13} className="text-amber-500 shrink-0" />
                        <span>Queued for automated dispatch</span>
                    </div>
                )
            case 'sent':
                return (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>Delivered via ReachInbox MTA</span>
                    </div>
                )
            case 'failed':
                return (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                        <AlertCircle size={13} className="text-rose-500 shrink-0" />
                        <span>Delivery failed to recipient host</span>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                        <XCircle size={13} className="text-neutral-400 shrink-0" />
                        <span>Status: {email.status}</span>
                    </div>
                )
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/80 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Mail size={16} />
                        </div>
                        <div>
                            <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Email Details
                            </h2>
                            <p className="text-sm font-bold text-neutral-900">
                                {email.status === 'scheduled' ? 'Scheduled Message' : 'Message Record'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-200/70 hover:text-neutral-700 active:scale-95"
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Metadata Block */}
                    <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/60 p-4 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white shadow-2xs">
                                    {initials(recipientName)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-neutral-900">{recipientName}</span>
                                        <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">
                                            Recipient
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-neutral-500">{email.to}</p>
                                </div>
                            </div>

                            <div>
                                <div>
                                    <StatusBadge status={email.status as any} />
                                </div>              </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-medium text-neutral-600 pt-1">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-neutral-400" />
                                <span>
                                    {email.status === 'scheduled' ? 'Scheduled Delivery:' : 'Timestamp:'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                                <Clock size={13} className="text-emerald-600" />
                                <span>{timestamp ? formatDateTime(timestamp) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                            Subject
                        </span>
                        <h3 className="mt-1 text-base font-bold text-neutral-900 leading-snug">
                            {email.subject || '(No Subject)'}
                        </h3>
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                            Message Content
                        </span>
                        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 text-xs leading-relaxed text-neutral-800 shadow-2xs whitespace-pre-wrap font-sans min-h-[120px]">
                            {email.body || <em className="text-neutral-400">No content provided.</em>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-neutral-200/80 bg-neutral-50/80 px-6 py-3.5">
                    {renderFooterStatus()}

                    <button
                        onClick={onClose}
                        className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-neutral-800 active:scale-[0.98]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}