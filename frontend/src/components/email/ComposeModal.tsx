import { useRef, useState, useMemo, type FormEvent, type KeyboardEvent, type ClipboardEvent, useEffect } from 'react'
import {
  X,
  Clock,
  AlertCircle,
  Send,
  Zap,
  ShieldCheck,
  Calendar,
  Loader2,
  Users,
  Timer,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { scheduleEmails } from '../../services/emailService'

interface Props {
  open: boolean
  onClose: () => void
  onScheduled: (createdEmails: unknown) => void
}

const toLocalInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

const DELAY_PRESETS = [
  { label: '5s', value: 5, tag: 'Fast' },
  { label: '15s', value: 15, tag: 'Recommended' },
  { label: '30s', value: 30, tag: 'Safe' },
  { label: '60s', value: 60, tag: 'Warmup' },
]

export default function ComposeModal({ open, onClose, onScheduled }: Props) {
  const { idToken } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState('')
  const [recipientError, setRecipientError] = useState('')

  // Settings
  const [startTime, setStartTime] = useState(() => toLocalInput(new Date()))
  const [delay, setDelay] = useState<number>(15)
  const [showSettings, setShowSettings] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const estimatedDuration = useMemo(() => {
    const total = recipients.length
    if (total <= 1) return 'Instant delivery'
    const totalSeconds = (total - 1) * delay
    if (totalSeconds < 60) return `~${totalSeconds} seconds total`
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    if (mins < 60) return secs > 0 ? `~${mins}m ${secs}s total` : `~${mins} mins total`
    const hours = (totalSeconds / 3600).toFixed(1)
    return `~${hours} hours total`
  }, [recipients.length, delay])

  const wordCount = useMemo(() => (body.trim() ? body.trim().split(/\s+/).length : 0), [body])


  const reset = () => {
    setSubject('')
    setBody('')
    setRecipients([])
    setRecipientInput('')
    setRecipientError('')
    setError('')
    setShowSettings(false)
    setDelay(15)

  }

  const addRecipients = (rawText: string): string[] => {
    if (!rawText.trim()) return recipients

    const tokens = rawText
      .split(/[\s,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails: string[] = []
    let hasInvalid = false

    tokens.forEach((token) => {
      if (emailRegex.test(token)) {
        validEmails.push(token)
      } else {
        hasInvalid = true
      }
    })

    let updatedRecipients = recipients
    if (validEmails.length > 0) {
      updatedRecipients = Array.from(new Set([...recipients, ...validEmails]))
      setRecipients(updatedRecipients)
      setRecipientInput('')
      setRecipientError(hasInvalid ? 'Some invalid email addresses were skipped' : '')
    } else if (hasInvalid) {
      setRecipientError('Please enter valid email address(es)')
    }

    return updatedRecipients
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' ', 'Tab', ';'].includes(e.key)) {
      if (recipientInput.trim()) {
        e.preventDefault()
        addRecipients(recipientInput)
      } else if (e.key === 'Enter') {
        e.preventDefault()
      }
    } else if (e.key === 'Backspace' && !recipientInput && recipients.length > 0) {
      e.preventDefault()
      setRecipients((prev) => prev.slice(0, -1))
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    addRecipients(text)
  }

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, idx) => idx !== index))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const finalRecipients = recipientInput.trim()
      ? addRecipients(recipientInput)
      : recipients

    if (finalRecipients.length === 0) {
      return setError('Please add at least one recipient email.')
    }
    if (!subject.trim() || !body.trim()) {
      return setError('Subject and email body are required.')
    }

    setSubmitting(true)
    try {
      const data = await scheduleEmails(
        {
          subject: subject.trim(),
          body,
          recipients: finalRecipients,
          startTime: new Date(startTime.replace('T', ' ')).toISOString(), delayBetweenSeconds: Number(delay),
        },
        idToken,
      )
      reset()
      onScheduled(data?.emails ?? data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const labelCls = 'text-[11px] font-bold uppercase tracking-tight text-neutral-500'

  // Refresh to the actual current time every time the modal opens
  useEffect(() => {
    if (open) setStartTime(toLocalInput(new Date()))
  }, [open])


  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6 "
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] min-h-[60vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]
        overflow-y-scroll"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2  bg-[#161616] px-6 py-4 text-white">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-white text-sm font-semibold text-neutral-950">
                R
              </span>
              <span className="text-base font-medium tracking-tight text-sm">Compose once, deliver with smart pacing
              </span>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-white">
          {/* Recipients */}
          <div
            className="flex flex-col gap-2 border-b border-neutral-300 px-4 py-2 transition-colors focus-within:bg-emerald-50/50"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center justify-between">
              <span className={labelCls}>Recipients</span>
              {recipients.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  <Users className="h-3 w-3" />
                  {recipients.length}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {recipients.map((email, idx) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-300 border-l-4 border-l-emerald-500 bg-neutral-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-neutral-900"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRecipient(idx)
                    }}
                    className="rounded p-0.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <input
                ref={inputRef}
                type="text"
                value={recipientInput}
                onChange={(e) => {
                  setRecipientInput(e.target.value)
                  setRecipientError('')
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => recipientInput.trim() && addRecipients(recipientInput)}
                placeholder={
                  recipients.length === 0
                    ? 'name@company.com — separate with comma, space or enter'
                    : 'Add more…'
                }
                className="min-w-[220px] flex-1 bg-transparent py-1 text-sm font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400 "
              />
            </div>
          </div>

          {recipientError && (
            <div className="flex items-center gap-2 border-b border-red-300 bg-red-50 px-6 py-2.5 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{recipientError}</span>
            </div>
          )}

          {/* Subject */}
          <div className="border-b border-neutral-300 px-4 py-2 transition-colors focus-within:bg-emerald-50/50">
            <span className={labelCls}>Subject</span>
            <input
              type="text"
              placeholder="Write a subject that gets opened"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full bg-transparent text-sm font-bold tracking-tight text-neutral-900 outline-none placeholder:font-medium placeholder:text-neutral-300"
            />
          </div>

          {/* Message */}
          <div className="flex flex-1 flex-col px-6 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Message</span>
              <span className="text-[11px] font-semibold text-neutral-500">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
            <textarea
              rows={10}
              placeholder="Write your outreach message here…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 h-full min-h-[300px] w-full resize-none bg-transparent text-sm leading-7 text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </div>

          {/* Pacing drawer */}
          {showSettings && (
            <div className="space-y-4 border-t border-neutral-300 bg-neutral-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-900">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  Pacing & Delivery
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Spam protection on
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-5">
                {/* Delay */}
                <div className="space-y-3 rounded-xl border border-neutral-300 bg-white p-4 sm:col-span-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                      <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
                      Delay between emails
                    </label>
                    <span className="rounded-md bg-[#161616] px-2.5 py-1 text-xs font-bold text-emerald-400">
                      {delay}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DELAY_PRESETS.map((preset) => {
                      const active = delay === preset.value
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setDelay(preset.value)}
                          className={`flex flex-col items-center rounded-lg border px-2 py-2 transition ${active
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-neutral-300 bg-white text-neutral-900 hover:border-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                          <span className="text-sm font-bold">{preset.label}</span>
                          <span
                            className={`text-[10px] font-medium ${active ? 'text-emerald-100' : 'text-neutral-500'
                              }`}
                          >
                            {preset.tag}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-700">Custom</span>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={delay}
                        onChange={(e) => setDelay(Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded-md border border-neutral-400 bg-white px-2 py-1 text-xs font-bold text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      />
                      <span className="font-semibold text-neutral-700">sec</span>
                    </div>
                    <span className="rounded-md bg-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-800">
                      {estimatedDuration}
                    </span>
                  </div>
                </div>

                {/* Start time */}
                <div className="rounded-xl border border-neutral-300 bg-white p-4 sm:col-span-2">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Start time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-neutral-400 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 border-t border-red-300 bg-red-50 px-6 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-300 bg-neutral-50 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-bold transition ${showSettings
              ? 'border-[#161616] bg-[#161616] text-white'
              : 'border-neutral-400 bg-white text-neutral-800 hover:border-neutral-900'
              }`}
          >
            <Clock className="h-4 w-4" />
            Pacing & Rules · {delay}s
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showSettings ? 'rotate-180' : ''}`}
            />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-transparent px-4 py-2.5 text-xs font-bold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Scheduling…' : 'Schedule Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}