import type { ReactNode } from 'react'

export default function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</div>
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  )
}
