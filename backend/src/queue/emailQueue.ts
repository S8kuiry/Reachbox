import { Queue } from 'bullmq'
import { redisConnection } from './connection'

export const emailQueue = new Queue('emailQueue', {
  connection: redisConnection,
})