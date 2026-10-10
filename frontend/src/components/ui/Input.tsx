import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export default function Input({ label, hint, className = '', id, ...rest }: Props) {
  return (
    <label className="block text-sm" htmlFor={id}>
      {label && <span className="mb-1.5 block font-medium text-neutral-700">{label}</span>}
      <input
        id={id}
        className={`w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...rest}
      />
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}
