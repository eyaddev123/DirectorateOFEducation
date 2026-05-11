const Redis = require('ioredis')

class EventBus {

  constructor () {

    this.publisher = new Redis(process.env.REDIS_URL)

    this.subscriber = new Redis(process.env.REDIS_URL)

    this.handlers = {}
  }

  // =====================================
  // PUBLISH
  // =====================================

  async publish (event, payload) {

    console.log(`📢 EVENT: ${event}`)

    await this.publisher.publish(
      event,
      JSON.stringify(payload)
    )
  }

  // =====================================
  // SUBSCRIBE
  // =====================================

  subscribe (event, handler) {

    if (!this.handlers[event]) {
      this.handlers[event] = []
    }

    this.handlers[event].push(handler)

    this.subscriber.subscribe(event)

    this.subscriber.on(
      'message',
      async (channel, message) => {

        if (channel !== event) return

        const payload = JSON.parse(message)

        console.log(`📥 RECEIVED: ${event}`)

        for (const h of this.handlers[event]) {
          await h(payload)
        }
      }
    )
  }
}

module.exports = new EventBus()