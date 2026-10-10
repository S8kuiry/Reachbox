import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to="/dashboard" replace />

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error('Google did not return a credential. Please try again.')
      return
    }

    try {
      await login(response.credential)
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Could not verify your Google account. Please try again.')
    }
  }
  // console.log(user)

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-neutral-950 p-12 text-neutral-100 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-semibold text-neutral-950">
            R
          </span>
          <span className="text-base font-medium tracking-tight">ReachInbox</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Schedule email outreach and trust it to send.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Queue campaigns for any start time, set the pace between sends, and cap how many go
            out each hour. Scheduled emails survive restarts and are never sent twice.
          </p>
        </div>

        <p className="text-xs text-neutral-500">Outbox Labs</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-950 text-sm font-semibold text-white">
              R
            </span>
            <span className="text-base font-medium tracking-tight text-neutral-950">ReachInbox</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Sign in</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Use your Google account to open your dashboard.
          </p>

          <div className="mt-8">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="384"
            />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-neutral-400">
            We only read your name, email and profile picture.
          </p>
        </div>
      </section>
    </main>
  )
}