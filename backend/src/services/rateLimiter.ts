import { redisConnection } from '../queue/connection'
import { env } from '../config/env'

export async function checkAndIncrementSenderLimit(senderEmail: string) {
  const maxLimit = env.MAX_EMAILS_PER_HOUR
  
  // Format key based on current hour: ratelimit:<senderEmail>:2026-10-06-22
  const currentHour = new Date().toISOString().substring(0, 13) // e.g. "2026-10-06T22"
  const redisKey = `ratelimit:${senderEmail}:${currentHour}`

  // Atomic increment in Redis
  const currentCount = await redisConnection.incr(redisKey)

  // Set TTL of 1 hour (3600s) on the first hit in this hour window
  if (currentCount === 1) {
    await redisConnection.expire(redisKey, 3600)
  }

  const allowed = currentCount <= maxLimit

  return {
    allowed,
    currentCount,
    maxLimit,
  }
}