const eventBus =
  require('../../../core/shared/events/eventBus')

const EVENTS =
  require('../../../core/shared/events/types')

const {
  startWorkflow
} = require('../services/processInstanceService')

// =====================================
// LISTEN
// =====================================

eventBus.subscribe(

  EVENTS.TRANSACTION_SUBMITTED,

  async payload => {

    console.log(
      '🚀 START WORKFLOW',
      payload
    )

    await startWorkflow(payload)
  }
)