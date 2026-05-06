const axios = require('axios')

const {
  ProcessDefinition,
  Stage,
  StageConfig
} = require('../entities')

const { Op } = require('sequelize')
const { CAMUNDA_URL } = require('../config/camunda')

async function startProcessInstance(processId) {

  console.log('[START PROCESS]', processId)

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
  console.log('CAMUNDA URL:', CAMUNDA_URL)

  // =========================================
  // CHECK PROCESS EXISTS IN CAMUNDA
  // =========================================
  try {
    await axios.get(
      `${CAMUNDA_URL}/process-definition/key/${process.camunda_process_key}`
    )
  } catch (e) {
    console.log('CAMUNDA CHECK ERROR:', e.response?.data || e.message)
    throw new Error('Process not deployed in Camunda')
  }

  // =========================================
  // START PROCESS
  // =========================================
  const res = await axios.post(
    `${CAMUNDA_URL}/process-definition/key/${process.camunda_process_key}/start`,
    {}
  )

  const processInstanceId = res.data.id

  // =========================================
  // GET TASKS
  // =========================================
  const tasksRes = await axios.get(
    `${CAMUNDA_URL}/task`,
    {
      params: { processInstanceId }
    }
  )

  const tasks = tasksRes.data

  if (!tasks.length) {
    return {
      processInstanceId,
      definitionId: res.data.definitionId,
      currentTask: null
    }
  }

  const currentTask = tasks[0]

  // =========================================
  // FIND STAGE
  // =========================================
  const stage = await Stage.findOne({
    where: {
      process_definition_id: process.id,
      [Op.or]: [
        { camunda_task_key: currentTask.taskDefinitionKey },
        { code: currentTask.taskDefinitionKey }
      ]
    }
  })

  if (!stage) {
    throw new Error(`No Stage found for: ${currentTask.taskDefinitionKey}`)
  }

  const stageConfig = await StageConfig.findOne({
    where: { stage_id: stage.id }
  })

  return {
    processInstanceId,
    definitionId: res.data.definitionId,
    stage,
    config: stageConfig?.config_json || null
  }
}

module.exports = {
  startProcessInstance
}