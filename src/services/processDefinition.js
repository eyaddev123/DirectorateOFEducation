const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios')
const xml2js = require('xml2js')
const {createProcessDefinitionSchema} = require('../validations/processDefValidation')
const { ProcessDefinition, Stage, TypeTrans, Organization,UserRoleAssignment  , StageAssignment  } = require('../entities')
const { Op } = require('sequelize')
async function deployBPMNToCamunda(filePath) {

  const form = new FormData()
  form.append(
    'deployment-name',
    'process_deployment'
  )

  // 🔥 مهم جداً
  // لازم يكون اسم الملف .bpmn
  form.append(
    'process.bpmn',
    fs.createReadStream(filePath)
  )

  form.append(
    'enable-duplicate-filtering',
    'true'
  )

  form.append(
    'deploy-changed-only',
    'true'
  )

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

    // منع تعدد process
    if (Object.keys(definitions).length > 1) {
      throw new Error('BPMN must contain only one process')
    }

    const processKey = Object.values(definitions)[0].key

    return {
      deploymentId: res.data.id,
      processKey
    }

  } catch (err) {

    console.log("CAMUNDA ERROR:")
    console.log(err.response?.data || err.message)

    throw err
  }
}

async function createProcessDefinitionService(data) {
  const { error } = createProcessDefinitionSchema.validate(data)
  if (error) throw new Error(error.details[0].message)
    const organization = await Organization.findByPk(data.organization_id)
  if(!organization){
      throw new Error(' المؤسسة المختارة غير موجودة')
  }
     const  typeProcess = await TypeTrans.findByPk(data.type_trans_id )
  if(!typeProcess){
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
   return  process
}
///////////////////////////////////////////////////////////////////////////////
//==========================  get task from camunda   ======================
//////////////////////////////////////////////////////////////////////////////

async function getTasksFromCamunda(processKey) {

  const res = await axios.get(
    `${process.env.CAMUNDA_URL}/process-definition/key/${processKey}/xml`
  )


  const xml = res.data.bpmn20Xml


  const parsed = await xml2js.parseStringPromise(xml)


  const bpmnProcess =
    parsed['bpmn:definitions']['bpmn:process'][0]


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


async function generateStagesFromCamunda(process) {

  const tasks = await getTasksFromCamunda(process.camunda_process_key)
  // 1️⃣ جلب كل الـ stages الموجودة مسبقًا مرة واحدة فقط
  const existingStages = await Stage.findAll({
    where: {
      process_definition_id: process.id
    },
    attributes: ['code']
  })

  // 2️⃣ تحويلها إلى Set لسرعة O(1)
  const existingCodes = new Set(
    existingStages.map(s => s.code)
  )

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


async function setupProcessAfterCreation(processId) {
  console.log(processId)
  const process = await ProcessDefinition.findByPk(processId)
  if (!process) throw new Error('Process not found')
 
  const tasks = await generateStagesFromCamunda(process)

if (tasks.length === 0) throw new Error('لم يتم انشاء اي مرحلة')
   return  tasks 
    
}


///// ============================== AUTH processes (bulk optimized) ====================================

async function getAuthProcesses(typeTransID, userId) {

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

  const roleIds = userRoles.map(
    r => r.organization_department_roles_id
  )

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
    type_trans_id: typeTrans.id
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
console.log(processes)
console.log('rawanjj')

const result = processes.map(process => {

  const authStage = process.stages[0]
console.log( process.id)
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




module.exports = {
  setupProcessAfterCreation,
  createProcessDefinitionService,
  getAuthProcesses
}
