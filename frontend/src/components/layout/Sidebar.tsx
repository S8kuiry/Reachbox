import { NavLink } from 'react-router-dom'
import { Clock, Mail, Plus, Send } from 'lucide-react'

interface Props {
  scheduledCount: number
  sentCount: number
  onCompose: () => void
}

export default function Sidebar({ scheduledCount, sentCount, onCompose }: Props) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all my-2 ${
      isActive
        ? 'bg-white/10 text-emerald-400 font-semibold'
        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
    }`

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[#111315] p-5 text-white lg:flex border-r border-white/5">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AB6B]">
          <Mail className="h-4 w-4 text-white" />
        </span>
        <span className="text-base font-bold tracking-tight text-white">
          ReachInbox<span className="text-[#00AB6B]">.</span>
        </span>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onCompose}
        className="mt-8 flex items-center justify-center gap-2 rounded-md bg-[#00AB6B] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#00925B] active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        <span>Compose New Email</span>
      </button>

      {/* Navigation Section */}
      <div className="mt-7">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Workspace
        </p>
        <nav className="space-y-1">
          <NavLink to="/dashboard/scheduled" className={link}>
            <Clock className="h-4 w-4 shrink-0" />
            <span className="flex-1">Scheduled Emails</span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300 group-hover:bg-white/15">
              {scheduledCount}
            </span>
          </NavLink>

          <NavLink to="/dashboard/sent" className={link}>
            <Send className="h-4 w-4 shrink-0" />
            <span className="flex-1">Sent Emails</span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300 group-hover:bg-white/15">
              {sentCount}
            </span>
          </NavLink>
        </nav>
      </div>
    </aside>
  )
}