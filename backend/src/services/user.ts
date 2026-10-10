import { OAuth2Client } from 'google-auth-library'
import { env } from 'node:process'
import { db } from '../db'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export async function authenticateGoogleUser(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()

  if (!payload?.sub || !payload.email || !payload.name) {
    throw new Error('Invalid Google token payload')
  }

  return db.user.upsert({
    where: {
      id: payload.sub,
    },
    update: {
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture ?? null,
    },
    create: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture ?? null,
    },
  })
}