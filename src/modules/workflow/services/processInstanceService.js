const axios = require('axios')
const { Op } = require('sequelize')
const { CAMUNDA_URL } = require('../../../core/config/camunda')

const {
  Transaction,
  ProcessDefinition,
  ProcessInstance,
  Stage,
  StageConfig
} = require('../../../entities')

async function startProcessInstance(transactionId, processId, data) {

  console.log('[SUBMIT TRANSACTION]', transactionId)

  // =========================================
  // 1. GET TRANSACTION (DRAFT ONLY)
  // =========================================
  const transaction = await Transaction.findByPk(transactionId)

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.status !== 'draft') {
    throw new Error('Only draft can be submitted')
  }

  // =========================================
  // 2. GET PROCESS
  // =========================================
  const process = await ProcessDefinition.findByPk(processId)

  if (!process) {
    throw new Error('Process not found')
  }

  if (!process.is_active) {
    throw new Error('Process is inactive')
  }

  if (!process.camunda_process_key) {
    throw new Error('Missing Camunda process key')
  }

  console.log('CAMUNDA KEY:', process.camunda_process_key)

  // =========================================
  // 3. START CAMUNDA PROCESS
  // =========================================
  const res = await axios.post(
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

  const processInstanceId = res.data.id

  // =========================================
  // 4. UPDATE TRANSACTION
  // =========================================
  await transaction.update({
    data: {
      ...transaction.data,
      ...data   // 👈 آخر بيانات من المواطن
    },
    status: 'in_progress'
  })

  // =========================================
  // 5. CREATE PROCESS INSTANCE
  // =========================================
  const processInstance = await ProcessInstance.create({
    process_definition_id: process.id,
    camunda_process_instance_id: processInstanceId,
    transaction_id: transaction.id,
    status: 'running'
  })

  // =========================================
  // 6. GET FIRST TASK
  // =========================================
  const tasksRes = await axios.get(
    `${CAMUNDA_URL}/task`,
    {
      params: { processInstanceId }
    }
  )

  const tasks = tasksRes.data
  const firstTask = tasks.length ? tasks[0] : null

  if (!firstTask) {
    return {
      message: 'Process started but no tasks found',
      processInstanceId,
      transactionId: transaction.id
    }
  }

  // =========================================
  // 7. FIND STAGE
  // =========================================
  const stage = await Stage.findOne({
    where: {
      process_definition_id: process.id,
      [Op.or]: [
        { camunda_task_key: firstTask.taskDefinitionKey },
        { code: firstTask.taskDefinitionKey }
      ]
    }
  })

  if (stage) {

     await StageConfig.findOne({
      where: { stage_id: stage.id }
    })

    await processInstance.update({
      current_stage_id: stage.id
    })

    return {
      message: 'Process submitted successfully',
      transactionId: transaction.id,
      transactionData: transaction.data,
      processInstance
    }
  }

  return {
    message: 'Process started but stage not mapped',
    processInstanceId,
    transactionId: transaction.id,
    currentTask: firstTask
  }
}

module.exports = {
  startProcessInstance
}