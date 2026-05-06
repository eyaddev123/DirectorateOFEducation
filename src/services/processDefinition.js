const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios')
const xml2js = require('xml2js')
const {
  createProcessDefinitionSchema
} = require('../validations/processDefValidation')
const {
  ProcessDefinition,
  Stage,
  TypeTrans,
  Organization,
  UserRoleAssignment,
  StageAssignment,
  StageConfig,
  OrgDeptRole
} = require('../entities')
const { Op } = require('sequelize')
async function deployBPMNToCamunda(filePath) {

  const form = new FormData()
  form.append('deployment-name', 'process_deployment')

  form.append('process.bpmn', fs.createReadStream(filePath))
  form.append('enable-duplicate-filtering', 'true')
  form.append('deploy-changed-only', 'true')

  try {
    const res = await axios.post(
      `${process.env.CAMUNDA_URL}/deployment/create`,
      form,
      {
        headers: form.getHeaders()
      }
    )

    const definitions = res.data.deployedProcessDefinitions

    if (!definitions || Object.keys(definitions).length === 0) {
      throw new Error('No process found in BPMN')
    }

    // 🔴 مهم: نحولها بشكل آمن
    const def = Object.values(definitions)[0]

    const processKey = def.key
    const definitionId = def.id

    console.log('CAMUNDA DEPLOY SUCCESS:', {
      processKey,
      definitionId,
      deploymentId: res.data.id
    })

    return {
      deploymentId: res.data.id,
      processKey,
      definitionId
    }

  } catch (err) {

    console.log('CAMUNDA ERROR:')
    console.log(err.response?.data || err.message)

    throw err
  }
}

async function createProcessDefinitionService (data) {
  const { error } = createProcessDefinitionSchema.validate(data)
  if (error) throw new Error(error.details[0].message)
  const organization = await Organization.findByPk(data.organization_id)
  if (!organization) {
    throw new Error(' المؤسسة المختارة غير موجودة')
  }
  const typeProcess = await TypeTrans.findByPk(data.type_trans_id)
  if (!typeProcess) {
    throw new Error('نوع المختار غير موجود')
  }
  // رفع + جلب processKey مباشرة
  const deployRes = await deployBPMNToCamunda(data.filePath)
  const process = await ProcessDefinition.create({
    name: data.name,
    code: data.code || deployRes.processKey,
    camunda_process_key: deployRes.processKey,
    camunda_deployment_id: deployRes.deploymentId,
    type_trans_id: data.type_trans_id,
    organization_id: data.organization_id || null,
    status: 'deployed',
    version: 1,
    priority: data.priority,
    start_date: data.start_date,
    end_date: data.end_date
  })
  return process
}
///////////////////////////////////////////////////////////////////////////////
//==========================  get task from camunda   ======================
//////////////////////////////////////////////////////////////////////////////

async function getTasksFromCamunda (processKey) {
  const res = await axios.get(
    `${process.env.CAMUNDA_URL}/process-definition/key/${processKey}/xml`
  )

  const xml = res.data.bpmn20Xml

  const parsed = await xml2js.parseStringPromise(xml)

  const bpmnProcess = parsed['bpmn:definitions']['bpmn:process'][0]

  const userTasks = bpmnProcess['bpmn:userTask'] || []

  const serviceTasks = bpmnProcess['bpmn:serviceTask'] || []

  const tasks = []

  for (const t of userTasks) {
    tasks.push({
      taskDefinitionKey: t.$.id,
      name: t.$.name || '',
      type: 'USER_TASK'
    })
  }

  for (const t of serviceTasks) {
    tasks.push({
      taskDefinitionKey: t.$.id,
      name: t.$.name || '',
      type: 'SERVICE_TASK'
    })
  }

  console.log('12')

  return tasks
}

async function generateStagesFromCamunda (process) {
  const tasks = await getTasksFromCamunda(process.camunda_process_key)
  // 1️⃣ جلب كل الـ stages الموجودة مسبقًا مرة واحدة فقط
  const existingStages = await Stage.findAll({
    where: {
      process_definition_id: process.id
    },
    attributes: ['code']
  })

  // 2️⃣ تحويلها إلى Set لسرعة O(1)
  const existingCodes = new Set(existingStages.map(s => s.code))

  const createdStages = []

  let firstUserTaskFound = false

  // 3️⃣ loop واحد فقط على tasks
  for (const task of tasks) {
    // ⛔ skip إذا موجود مسبقًا
    if (existingCodes.has(task.taskDefinitionKey)) {
      continue
    }

    let authType = 'NOAUTH'

    if (task.type === 'USER_TASK' && !firstUserTaskFound) {
      authType = 'AUTH'
      firstUserTaskFound = true
    }

    const stage = await Stage.create({
      process_definition_id: process.id,
      name: task.name,
      code: task.taskDefinitionKey,
      type: task.type,
      camunda_task_key: task.taskDefinitionKey,
      auth_type: authType
    })

    createdStages.push(stage)

    // 🧠 تحديث الـ Set حتى ما يتكرر بنفس request
    existingCodes.add(task.taskDefinitionKey)
  }

  return createdStages
}

async function setupProcessAfterCreation (processId) {
  console.log(processId)
  const process = await ProcessDefinition.findByPk(processId)
  if (!process) throw new Error('Process not found')

  const tasks = await generateStagesFromCamunda(process)

  if (tasks.length === 0) throw new Error('لم يتم انشاء اي مرحلة')
  return tasks
}

///// ============================== AUTH processes (bulk optimized) ====================================

async function getAuthProcesses (typeTransID, userId) {
  const typeTrans = await TypeTrans.findByPk(typeTransID)

  if (!typeTrans) {
    throw new Error('لا يوجد هذا النوع')
  }

  // ✅ جلب أدوار المستخدم
  const userRoles = await UserRoleAssignment.findAll({
    where: {
      user_id: userId,
      is_active: true
    },
    attributes: ['organization_department_roles_id']
  })

  const roleIds = userRoles.map(r => r.organization_department_roles_id)

  // ⛔ المستخدم لا يملك أدوار
  if (roleIds.length === 0) {
    return {
      message: 'لا يوجد صلاحيات للمستخدم',
      data: []
    }
  }

  // ✅ جلب العمليات مع المراحل
  const processes = await ProcessDefinition.findAll({
    where: {
      is_active: true,
      type_trans_id: typeTrans.id,
      status: 'deployed',
      approval_status: 'APPROVED'
    },

    include: [
      {
        model: Stage,
        as: 'stages',

        where: {
          auth_type: 'AUTH'
        },

        required: true,

        include: [
          {
            model: StageAssignment,
            as: 'stage_assignments',

            where: {
              organization_department_roles_id: {
                [Op.in]: roleIds
              }
            },

            required: true
          }
        ]
      }
    ]
  })

  const result = processes.map(process => {
    const authStage = process.stages[0]
    console.log(process.id)
    console.log('rawan')
    return {
      process_id: process.id,
      name: process.name,
      code: process.code,
      priority: process.priority,

      auth_stage: {
        id: authStage.id,
        name: authStage.name,
        code: authStage.code,
        type: authStage.type,
        auth_type: authStage.auth_type
      }
    }
  })

  // ✅ ترتيب حسب الأولوية
  result.sort((a, b) => a.priority - b.priority)

  return {
    message: 'تم جلب عمليات AUTH بنجاح',
    data: result
  }
}
//==================================================================================
//==================================get details for process=========================
async function getProcessDetailsWithValidation (processId) {
  const process = await ProcessDefinition.findByPk(processId, {
    include: [
      {
        model: Stage,
        as: 'stages',
        include: [
          {
            model: StageConfig,
            as: 'stage_config'
          },
          {
            model: StageAssignment,
            as: 'stage_assignments',
            include: [
              {
                model: OrgDeptRole,
                as: 'organization_department_role'
              }
            ]
          }
        ]
      }
    ],
    order: [[{ model: Stage, as: 'stages' }, 'id', 'ASC']]
  })

  if (!process) {
    throw new Error('العملية غير موجودة')
  }

  // VALIDATION

  let is_valid = true
  const errors = []

  // 1. STATUS

  if (process.status !== 'deployed') {
    is_valid = false
    errors.push('يجب نشر العملية أولاً (deployed)')
  }

  // 2. STAGES

  if (!process.stages || process.stages.length === 0) {
    is_valid = false
    errors.push('لا يوجد مراحل للعملية')
  }

  // 3. AUTH STAGE

  const authStages = process.stages.filter(s => s.auth_type === 'AUTH')

  if (authStages.length === 0) {
    is_valid = false
    errors.push('يجب وجود مرحلة AUTH واحدة')
  }

  if (authStages.length > 1) {
    is_valid = false
    errors.push('يوجد أكثر من مرحلة AUTH')
  }

  // 4. LOOP STAGES

  for (const stage of process.stages) {
    if (!stage.type) {
      is_valid = false
      errors.push(`Stage ${stage.id} لا يحتوي على type`)
    }

    if (!stage.stage_config) {
      is_valid = false
      errors.push(`Stage ${stage.name} لا يحتوي على config`)
    }

    if (stage.type === 'USER_TASK') {
      if (!stage.stage_assignments || stage.stage_assignments.length === 0) {
        is_valid = false
        errors.push(`Stage ${stage.name} يجب أن يحتوي على assignments`)
      }

      for (const assignment of stage.stage_assignments) {
        const role = assignment.organization_department_role

        if (!role) {
          is_valid = false
          errors.push(`Stage ${stage.name} يحتوي role غير موجود`)
        }

        if (role && !role.is_active) {
          is_valid = false
          errors.push(`Stage ${stage.name} يحتوي role غير فعال`)
        }
      }
    }
  }

  // =========================================
  // RESPONSE
  // =========================================
  return {
    message: 'تم جلب تفاصيل العملية بنجاح',
    data: {
      process: {
        id: process.id,
        name: process.name,
        code: process.code,
        status: process.status,
        version: process.version,
        is_active: process.is_active,
        is_approved: process.is_approved,
        start_date: process.start_date,
        end_date: process.end_date
      },

      stages: process.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        type: stage.type,
        auth_type: stage.auth_type,

        config: stage.stage_config?.config_json || null,

        assignments: stage.stage_assignments.map(a => ({
          organization_department_roles_id: a.organization_department_roles_id
        }))
      })),

      validation: {
        is_valid,
        errors
      }
    }
  }
}
//=====================================================================================
//====================== review Process (APPROVE , REJECT) ============================

async function reviewProcess (processId, decision) {
  const process = await ProcessDefinition.findByPk(processId)

  if (!process) {
    throw new Error('العملية غير موجودة')
  }

  // تحقق من القرار

  const validDecisions = ['APPROVE', 'REJECT']

  if (!validDecisions.includes(decision)) {
    throw new Error('قرار غير صالح')
  }

  // APPROVE

  if (decision === 'APPROVE') {

    await process.update({
      approval_status: 'APPROVED'
    })

    return {
      message: 'تمت الموافقة على العملية'
    }
  }

  // REJECT

  if (decision === 'REJECT') {
    await process.update({
      approval_status: 'REJECTED'
    })

    return {
      message: 'تم رفض العملية'
    }
  }
}

module.exports = {
  setupProcessAfterCreation,
  createProcessDefinitionService,
  getAuthProcesses,
  getProcessDetailsWithValidation,
  reviewProcess
}
