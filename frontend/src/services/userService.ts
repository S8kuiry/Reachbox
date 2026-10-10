import type { User } from '../types'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export interface UserResponse {
  user: User
}

export async function syncUser(idToken: string): Promise<User> {
  const response = await fetch(`${API}/auth/me`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to sync user profile')
  }

  const data: UserResponse = await response.json()
  return data.user
}
