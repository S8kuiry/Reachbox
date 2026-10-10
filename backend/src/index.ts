import { app } from './app'
import { env } from './config/env'
import { startEmailWorker } from './queue/emailWorker'

async function bootstrap() {
  console.log('🚀 Starting backend email service...')

  // 1. Start BullMQ Worker
  const worker = startEmailWorker()
  console.log('👷 Email worker listening for jobs...')

  // 2. Start Express Server
  const server = app.listen(env.PORT, () => {
    console.log(`🌐 Server running on http://localhost:${env.PORT}`)
    console.log(`📊 Bull-Board available at http://localhost:${env.PORT}/admin/queues`)
  })

  // 3. Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down...`)
    await worker.close()
    server.close(() => {
      console.log('✅ Server and Worker closed cleanly.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  console.error('💥 Fatal initialization failure:', err)
  process.exit(1)
})