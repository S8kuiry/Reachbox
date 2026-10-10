import { LogOut, RefreshCw, Search, X } from 'lucide-react'
import { initials } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'

interface Props {
  search: string
  onSearch: (v: string) => void
  onRefresh: () => void
}

export default function Topbar({ search, onSearch, onRefresh }: Props) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-6 mt-4">
      {/* Left & Middle: Prominent Search Bar & Refresh */}
      <div className="flex flex-1 items-center gap-3 pr-6">
        <div className="relative w-full max-w-5xl transition-all duration-200 focus-within:max-w-xl">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-emerald-600"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by recipient, subject, or keywords..."
            className="h-9 w-full rounded-xl border border-neutral-200/90 bg-neutral-50/80 pl-10 pr-9 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 shadow-2xs outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50/50 text-neutral-400 transition hover:border-neutral-300 hover:bg-white hover:text-neutral-700 shadow-2xs active:scale-95"
          aria-label="Refresh workspace"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Right: Profile & Account Controls */}
      <div className="flex shrink-0 items-center gap-3 border-l border-neutral-200/70 pl-5">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full object-cover ring-1 ring-neutral-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 border border-emerald-200/80">
            {initials(user?.name ?? 'U')}
          </div>
        )}

        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-neutral-900">{user?.name}</p>
          <p className="text-[11px] font-normal text-neutral-400">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}