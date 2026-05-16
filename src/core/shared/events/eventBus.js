const Redis = require('ioredis')

class EventBus {
  constructor() {
    this.publisher = new Redis(process.env.REDIS_URL)
    this.subscriber = new Redis(process.env.REDIS_URL)

    this.handlers = {}

    this.subscriber.on('message', async (channel, message) => {
      const handlers = this.handlers[channel]
      if (!handlers) return

      let payload

      try {
        payload = JSON.parse(message)
      } catch (err) {
        console.error('❌ Invalid JSON message:', message)
        return
      }

      for (const h of handlers) {
        try {
          await h(payload)
        } catch (err) {
          console.error('❌ Handler error:', err)
        }
      }
    })
  }

  async publish(event, payload) {
    console.log(`📢 EVENT: ${event}`)

    try {
      await this.publisher.publish(
        event,
        JSON.stringify(payload)
      )
    } catch (err) {
      console.error('❌ Publish error:', err)
    }
  }

  async subscribe(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = []

      await this.subscriber.subscribe(event)
    }

    this.handlers[event].push(handler)
  }
}

module.exports = new EventBus()