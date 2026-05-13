const axios = require('axios')

const transactionClient =
  require('../../../core/shared/clients/transaction/transactionClient')

const eventBus =
  require('../../../core/shared/events/eventBus')

const EVENTS =
  require('../../../core/shared/events/types')

const { CAMUNDA_URL } = require('../../../core/config/camunda')

// ======================================================
// START WORKFLOW
// ======================================================
 

const {
  ProcessDefinition,
  ProcessInstance,
  Stage,
  ProcessInstanceStage
} = require('../../../entities')


// ======================================================
// START WORKFLOW
// ======================================================

async function startWorkflow ({
  transactionId,
  processCode
}) {

  // =====================================
  // GET TRANSACTION
  // =====================================

  const transaction =
    await transactionClient.getTransactionById(
      transactionId
    )

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  // =====================================
  // VALIDATE TRANSACTION
  // =====================================

  if (transaction.status !== 'submitted') {
    throw new Error(
      'Transaction must be submitted first'
    )
  }

  // =====================================
  // GET PROCESS
  // =====================================

  const process =
    await ProcessDefinition.findOne({
      where : {code :processCode}
    })

  if (!process) {
    throw new Error('Process not found')
  }

  if (!process.is_active) {
    throw new Error('Process is inactive')
  }

  if (!process.camunda_process_key) {
    throw new Error(
      'Missing Camunda process key'
    )
  }

  console.log(
    'CAMUNDA KEY:',
    process.camunda_process_key
  )

  // =====================================
  // START CAMUNDA PROCESS
  // =====================================

  const response = await axios.post(

    `${CAMUNDA_URL}/process-definition/key/${process.camunda_process_key}/start`,

    {
      variables: {
        transactionId: {
          value: transaction.id,
          type: 'Integer'
        }
      }
    }
  )

  const camundaProcessInstanceId =
    response.data.id

  // =====================================
  // CREATE PROCESS INSTANCE
  // =====================================

  const processInstance =
    await ProcessInstance.create({

      process_definition_id: process.id,

      transaction_id: transaction.id,

      camunda_process_instance_id:
        camundaProcessInstanceId,

      status: 'running'
    })

  // =====================================
  // GET FIRST TASK
  // =====================================

  const tasksRes = await axios.get(
    `${CAMUNDA_URL}/task`,
    {
      params: {
        processInstanceId:
          camundaProcessInstanceId
      }
    }
  )

  const tasks = tasksRes.data

  const firstTask =
    tasks.length ? tasks[0] : null

  // =====================================
  // AUTO COMPLETE FIRST TASK
  // =====================================

  if (firstTask) {

    console.log(
      'AUTO COMPLETE TASK:',
      firstTask.name
    )

    await axios.post(

     `${CAMUNDA_URL}/task/${firstTask.id}/complete`,

      {
        variables: {
          transactionId: {
            value: transaction.id,
            type: 'Integer'
          }
        }
      }
    )
  }

  // =====================================
  // GET CURRENT ACTIVE TASK
  // =====================================

  const currentTasksRes = await axios.get(
    `${CAMUNDA_URL}/task`,
    {
      params: {
        processInstanceId:
          camundaProcessInstanceId
      }
    }
  )

  const currentTasks =
    currentTasksRes.data

  const currentTask =
    currentTasks.length
      ? currentTasks[0]
      : null

  // =====================================
  // MAP CURRENT STAGE
  // =====================================

  if (currentTask) {

    const stage = await Stage.findOne({

      where: {

        process_definition_id:
          process.id,

        code:
          currentTask.taskDefinitionKey
      }
    })

    if (stage) {

      // =================================
      // UPDATE CURRENT STAGE
      // =================================

      await processInstance.update({
        current_stage_id: stage.id
      })

      // =================================
      // CREATE STAGE HISTORY
      // =================================

      await ProcessInstanceStage.create({

        transaction_id:
          transaction.id,

        stage_code:
          stage.code,

        stage_name:
          stage.name,

        status: 'pending'
      })
    }
  }

  // =====================================
  // UPDATE TRANSACTION STATUS
  // =====================================

  await transactionClient.updateStatus(
    transactionId,
    'in_progress'
  )

  // =====================================
  // PUBLISH EVENT
  // =====================================

  await eventBus.publish(
    EVENTS.WORKFLOW_STARTED,
    {
      transactionId,
      processId: process.id,
      processInstanceId:
        processInstance.id,
      camundaProcessInstanceId
    }
  )

  // =====================================
  // RESPONSE
  // =====================================

  return {

    message:
      'Workflow started successfully',

    data: {

      transactionId,

      processInstanceId:
        processInstance.id,

      camundaProcessInstanceId,

      currentTask:
        currentTask?.name || null,

      status: 'running'
    }
  }
}

module.exports = {
  startWorkflow
}



