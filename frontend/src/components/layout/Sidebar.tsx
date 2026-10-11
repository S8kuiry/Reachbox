import { NavLink } from 'react-router-dom'
import { Clock, LogOut, Plus, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'

interface Props {
  scheduledCount: number
  sentCount: number
  onCompose: () => void
}

export default function Sidebar({ scheduledCount, sentCount, onCompose }: Props) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all my-1 ${
      isActive
        ? 'bg-white/10 text-emerald-400 font-semibold'
        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
    }`

  const { user, logout } = useAuth()

  return (
    <aside className="hidden h-screen w-66 shrink-0 flex-col bg-[#111315] p-5 text-white lg:flex border-r border-white/5">
      {/* Top Content (Brand + Action + Nav) */}
      <div className="flex-1">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-semibold text-neutral-950">
            R
          </span>
          <span className="text-base font-medium tracking-tight text-white">ReachInbox</span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onCompose}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#00AB6B] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#00925B] active:scale-[0.98]"
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
      </div>

      {/* Footer: User Profile & Logout (Anchored to Bottom) */}
      <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/10 pt-4 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-[11px] font-bold text-emerald-400 border border-emerald-800/60">
              {initials(user?.name ?? 'U')}
            </div>
          )}

          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-neutral-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}