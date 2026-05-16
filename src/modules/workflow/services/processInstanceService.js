const transactionClient =
  require('../../../core/shared/clients/transaction/transactionClient')

const EVENTS =
  require('../../../core/shared/events/types')

const processRepository =
  require('../repositories/processRepository')

const camundaClient =
  require('../../../core/shared/clients/camunda/camundaClient')

const stageRepository =
  require('../repositories/stageRepository')

const processInstanceRepository =
  require('../repositories/processInstanceRepository')

const outboxRepository =
  require('../../../core/shared/outbox/repositories/OutboxRepository')

// ======================================================
// START WORKFLOW
// ======================================================

async function startWorkflow({

  transactionId,

  processCode

}) {

  // =====================================
  // transaction + process
  // =====================================

  const [transaction, process] =
    await Promise.all([

      transactionClient.getTransactionById(
        transactionId
      ),

      processRepository.findByCode(
        processCode
      )
    ])

  // =====================================
  // validations
  // =====================================

  if (!transaction) {
    throw new Error(
      'Transaction not found'
    )
  }

  if (transaction.status !== 'submitted') {
    throw new Error(
      'Transaction must be submitted first'
    )
  }

  if (!process) {
    throw new Error(
      'Process not found'
    )
  }

  if (!process.is_active) {
    throw new Error(
      'Process is inactive'
    )
  }

  if (!process.camunda_process_key) {
    throw new Error(
      'Missing Camunda process key'
    )
  }

  // =====================================
  // start camunda
  // =====================================

  const camundaProcess =
    await camundaClient.startProcess(

      process.camunda_process_key,

      transaction.id
    )

  // =====================================
  // create process instance
  // =====================================

  const processInstance =
    await processInstanceRepository.create({

      process_definition_id:
        process.id,

      transaction_id:
        transaction.id,

      camunda_process_instance_id:
        camundaProcess.id,

      status: 'running'
    })

  // =====================================
  // get first task
  // =====================================

  const tasks =
    await camundaClient.getActiveTasks(
      camundaProcess.id
    )

  const firstTask = tasks?.[0]

  // =====================================
  // auto complete
  // =====================================

  if (firstTask) {

    await camundaClient.completeTask(

      firstTask.id,

      transaction.id
    )
  }

  // =====================================
  // current task
  // =====================================

  const currentTasks =
    await camundaClient.getActiveTasks(
      camundaProcess.id
    )

  const currentTask =
    currentTasks?.[0]

  // =====================================
  // map current stage
  // =====================================

  if (currentTask) {

    const stage =
      await stageRepository.findByCodeAndProcess(

        process.id,

        currentTask.taskDefinitionKey
      )

    if (stage) {

      // =================================
      // update process instance
      // =================================

      await processInstanceRepository.update(

        processInstance.id,

        {
          current_stage_id:
            stage.id
        }
      )

      // =================================
      // OUTBOX EVENT
      // =================================

      await outboxRepository.create({

        event_type:
          EVENTS.PROCESSINSTANCESTAGE_CREATED,

        payload: {

          transactionId:
            transaction.id,

          stageCode:
            stage.code,

          stageName:
            stage.name,

          status: 'pending'
        }
      })
    }
  }

  // =====================================
  // update transaction
  // =====================================

  await transactionClient.updateStatus(

    transactionId,

    'in_progress'
  )

  // =====================================
  // OUTBOX EVENT
  // =====================================

  await outboxRepository.create({

    event_type:
      EVENTS.WORKFLOW_STARTED,

    payload: {

      transactionId:
        transaction.id,

      processId:
        process.id,

      processInstanceId:
        processInstance.id,

      camundaProcessInstanceId:
        camundaProcess.id
    }
  })

  // =====================================
  // response
  // =====================================

  return {

    message:
      'Workflow started successfully',

    data: {

      transactionId,

      processInstanceId:
        processInstance.id,

      camundaProcessInstanceId:
        camundaProcess.id,

      currentTask:
        currentTask?.name || null,

      status: 'running'
    }
  }
}

module.exports = {
  startWorkflow
}