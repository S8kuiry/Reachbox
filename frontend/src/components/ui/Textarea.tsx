import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export default function Textarea({ label, className = '', ...rest }: Props) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-medium text-neutral-700">{label}</span>}
      <textarea
        className={`w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...rest}
      />
    </label>
  )
}
