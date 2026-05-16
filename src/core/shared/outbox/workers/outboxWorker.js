const Redis = require('ioredis')
const eventBus = require('../../events/eventBus')
const OutboxRepository = require('../repositories/OutboxRepository')

const redis = new Redis(process.env.REDIS_URL)

const POLL_INTERVAL = 1000 // 1 sec

let isRunning = false

async function processOutbox() {
  if (isRunning) return
  isRunning = true

  try {
    // 1. جلب events غير processed
    const events = await OutboxRepository.findPending(20)

    for (const event of events) {
      try {
        // 2. publish على eventBus (Redis)
        await eventBus.publish(event.event_type, event.payload)

        // 3. mark as processed (IMPORTANT)
        await OutboxRepository.markProcessed(event.id)

      } catch (err) {
        console.error('❌ Outbox event failed:', event.id, err.message)

        await OutboxRepository.markFailed(event.id, err.message)
      }
    }

  } catch (err) {
    console.error('❌ Outbox worker error:', err.message)
  }

  isRunning = false
}

function startOutboxWorker() {
  console.log('📦 Outbox Worker Started')

  setInterval(processOutbox, POLL_INTERVAL)
}

module.exports = {
  startOutboxWorker
}