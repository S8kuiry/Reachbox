import { RefreshCw } from 'lucide-react'
import type { EmailStatus } from '../../types'

const map: Record<string, { cls: string; dot: string; label: string }> = {
  scheduled: { cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Scheduled' },
  processing: { cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Processing' },
  sent: { cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Sent' },
  failed: { cls: 'bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Failed' },
}

export default function StatusBadge({ status }: { status: EmailStatus | string }) {
  const normalized = String(status).toLowerCase()
  const isScheduled = normalized === 'scheduled' || normalized === 'processing'

  const s = map[normalized] ?? {
    cls: 'bg-neutral-100 text-neutral-600',
    dot: 'bg-neutral-400',
    label: status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : 'Unknown',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {isScheduled ? (
        <RefreshCw className="h-3 w-3 animate-spin shrink-0 text-amber-600" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      )}
      {s.label}
    </span>
  )
}