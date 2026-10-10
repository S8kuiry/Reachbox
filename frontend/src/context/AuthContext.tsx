/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { googleLogout } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { syncUser } from '../services/userService'
import type { AuthContextValue, AuthSession, GoogleIdTokenPayload } from '../types'

const STORAGE_KEY = 'reachinbox.session'

const AuthContext = createContext<AuthContextValue | null>(null)

function sessionFromToken(idToken: string): AuthSession {
  const p = jwtDecode<GoogleIdTokenPayload>(idToken)
  return {
    idToken,
    expiresAt: p.exp * 1000,
    user: { id: p.sub, name: p.name, email: p.email, avatarUrl: p.picture },
  }
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (session.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readSession)

  const login = useCallback(async (idToken: string) => {
    const next = sessionFromToken(idToken)
    const user = await syncUser(idToken)

    const storedSession: AuthSession = {
      ...next,
      user,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSession))
    setSession(storedSession)
  }, [])

  const logout = useCallback(() => {
    googleLogout()
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      idToken: session?.idToken ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}