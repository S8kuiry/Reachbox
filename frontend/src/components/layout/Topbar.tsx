import { Search, SlidersHorizontal, X } from 'lucide-react'

import { type EmailSearchField, type EmailSearchStatus } from '../../types/index'

interface Props {
  search: string
  onSearch: (v: string) => void
  searchField: EmailSearchField
  onSearchFieldChange: (v: EmailSearchField) => void
  searchStatus: EmailSearchStatus
  onSearchStatusChange: (v: EmailSearchStatus) => void
}

export default function Topbar({
  search,
  onSearch,
  searchField,
  onSearchFieldChange,
  searchStatus,
  onSearchStatusChange,
}: Props) {

  return (
    <header className="flex h-16 shrink-0 items-center justify-between  bg-white px-6 mt-2">
      {/* Left & Middle: Prominent Search Bar & Filters */}
      <div className="flex flex-1 items-center gap-3 pr-6 min-w-0">
        {/* Main Search Input Box */}
        <div className="group relative flex-1 max-w-8xl min-w-[240px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-emerald-600"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by recipient, subject, or keywords..."
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-9 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 shadow-md shadow-emerald-100/60 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Field & Status Filters */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-400 pl-1">
            <SlidersHorizontal size={14} />
          </div>

          <select
            value={searchField}
            onChange={(e) =>
              onSearchFieldChange(e.target.value as EmailSearchField)
            }
            aria-label="Search field"
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 shadow-md shadow-emerald-100/60 outline-none transition cursor-pointer hover:border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          >
            <option value="all">All fields</option>
            <option value="recipient">Recipient</option>
            <option value="sender">Sender</option>
            <option value="subject">Subject</option>
            <option value="body">Body</option>
          </select>

          <select
            value={searchStatus}
            onChange={(e) =>
              onSearchStatusChange(e.target.value as EmailSearchStatus)
            }
            aria-label="Filter by email status"
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 shadow-md shadow-emerald-100/60 outline-none transition cursor-pointer hover:border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          >
            <option value="all">Any status</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

     
    </header>
  )
}