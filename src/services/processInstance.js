const axios = require('axios')

const {
  ProcessDefinition,
  Stage,
  StageAssignment,
  StageConfig,
  OrgDeptRole
} = require('../entities')

// =========================================
// START PROCESS INSTANCE
// =========================================
async function startProcessInstance(processId) {

  // =========================================
  // 1. GET PROCESS
  // =========================================
  const process = await ProcessDefinition.findByPk(processId)

  if (!process) {
    throw new Error('Process not found')
  }

  if (!process.is_active) {
    throw new Error('Process is inactive')
  }

  // =========================================
  // 2. START CAMUNDA PROCESS
  // بدون variables
  // =========================================
  const res = await axios.post(
    `${process.env.CAMUNDA_URL}/process-definition/key/${process.camunda_process_key}/start`,
    {}
  )

  const processInstanceId = res.data.id

  // =========================================
  // 3. GET CURRENT TASKS
  // =========================================
  const tasksRes = await axios.get(
    `${process.env.CAMUNDA_URL}/task`,
    {
      params: {
        processInstanceId
      }
    }
  )

  const tasks = tasksRes.data

  // =========================================
  // 4. NO TASKS
  // =========================================
  if (!tasks.length) {
    return {
      processInstanceId,
      definitionId: res.data.definitionId,
      currentTask: null
    }
  }

  // =========================================
  // 5. CURRENT TASK
  // =========================================
  const currentTask = tasks[0]

  // =========================================
  // 6. FIND STAGE
  // =========================================
  const stage = await Stage.findOne({
    where: {
      process_definition_id: process.id,
      camunda_task_key: currentTask.taskDefinitionKey,
      auth_type: 'AUTH'
    }
  })

  if (!stage) {
    throw new Error(
      `No Stage found for taskDefinitionKey: ${currentTask.taskDefinitionKey}`
    )
  }

  // =========================================
  // 7. GET STAGE CONFIG
  // =========================================
  const stageConfig = await StageConfig.findOne({
    where: {
      stage_id: stage.id
    }
  })

  // =========================================
  // 8. USER TASK
  // =========================================
  if (stage.type === 'USER_TASK') {

    const assignments = await StageAssignment.findAll({
      where: {
        stage_id: stage.id
      },

      include: [
        {
          model: OrgDeptRole,
          as: 'organization_department_role'
        }
      ]
    })

    return {
      processInstanceId,
      definitionId: res.data.definitionId,

      currentTask: {
        taskId: currentTask.id,
        taskName: currentTask.name,
        taskDefinitionKey: currentTask.taskDefinitionKey
      },

      stage: {
        id: stage.id,
        name: stage.name,
        type: stage.type,
        code: stage.code,
        auth_type: stage.auth_type
      },

      assignments: assignments.map(a => ({
        id: a.id,
        role_id: a.organization_department_roles_id,
        role_name:
          a.organization_department_role?.name || null
      })),

      config: stageConfig?.config_json || null
    }
  }

  // =========================================
  // 9. SERVICE TASK
  // =========================================
  if (stage.type === 'SERVICE_TASK') {

    return {
      processInstanceId,
      definitionId: res.data.definitionId,

      currentTask: {
        taskId: currentTask.id,
        taskName: currentTask.name,
        taskDefinitionKey: currentTask.taskDefinitionKey
      },

      stage: {
        id: stage.id,
        name: stage.name,
        type: stage.type,
        code: stage.code,
        auth_type: stage.auth_type
      },

      config: stageConfig?.config_json || null
    }
  }

  // =========================================
  // 10. DEFAULT
  // =========================================
  return {
    processInstanceId,
    definitionId: res.data.definitionId,

    currentTask: {
      taskId: currentTask.id,
      taskName: currentTask.name,
      taskDefinitionKey: currentTask.taskDefinitionKey
    }
  }
}

module.exports = {
  startProcessInstance
}