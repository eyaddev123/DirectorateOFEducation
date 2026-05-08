'use strict'

const { re } = require('mathjs')
const {
  StageConfig,
  Stage,
  StageAssignment,
  OrgDeptRole,
  ProcessDefinition
} = require('../../../entities')
const {
  createStageConfigSchema
} = require('../validations/stageConfigValidations')

async function createStageConfigService (data) {
  const { error } = createStageConfigSchema.validate(data)
  if (error) throw new Error(error.details[0].message)

  const results = []

  for (const item of data.stages) {
    const stage = await Stage.findByPk(item.stage_id)
    if (!stage) throw new Error(`Stage ${item.stage_id} غير موجود`)

    const config = await StageConfig.create({
      stage_id: item.stage_id,
      config_json: item.config_json
    })

    let assignments = []

if (stage.type === 'USER_TASK') {

  const assignmentsData =
    item.assignments || []

  if (assignmentsData.length > 0) {

    // =========================================
    // GET organization_department_roles
    // =========================================
    const orgDeptRoles = []

    for (const a of assignmentsData) {

      const orgDeptRole =
        await OrgDeptRole.findOne({
          where: {
            organization_id: a.organization_id,
            department_id: a.department_id,
            role_id: a.role_id,
            is_active: true
          }
        })

      if (!orgDeptRole) {
        throw new Error(
          `لم يتم العثور على role_id=${a.role_id}
           ضمن organization=${a.organization_id}
           department=${a.department_id}`
        )
      }

      orgDeptRoles.push(orgDeptRole)
    }

    // =========================================
    // EXISTING
    // =========================================
    const existing = await StageAssignment.findAll({
      where: {
        stage_id: stage.id
      }
    })

    const existingSet = new Set(
      existing.map(
        e => e.organization_department_roles_id
      )
    )

    // =========================================
    // FILTER NEW ONLY
    // =========================================
    const toInsert = orgDeptRoles

      .filter(
        r => !existingSet.has(r.id)
      )

      .map(r => ({
        stage_id: stage.id,
        organization_department_roles_id: r.id
      }))

    // =========================================
    // BULK CREATE
    // =========================================
    if (toInsert.length > 0) {

      assignments =
        await StageAssignment.bulkCreate(toInsert)
    }
  }
}

    results.push({
      stage_id: stage.id,
      config: config.config_json,
      assignments: assignments.map(a => a.organization_department_roles_id)
    })
  }

  return {
    message: 'Stages configured successfully',
    data: results
  }
}
// ========================== get config_json for process =========================
async function getConfig_json (processID) {
  const Process = await ProcessDefinition.findByPk(processID)
  if (!Process) {
    return {
      message: 'لم يتم ايجاد العملية',
      data: {
        success: false,
        config_json: []
      }
    }
  }
  // 1. جيب أول stage AUTH (الأقدم)
  const stage = await Stage.findOne({
    where: {
      process_definition_id: processID,
      auth_type: 'AUTH'
    },
    order: [['id', 'ASC']]
  })

  if (!stage) {
    return {
      message: 'لا توجد مرحلة  لهذه العملية',
      data: {
        success: false,
        config_json: []
      }
    }
  }

  // 2. جيب config
  const stageConfig = await StageConfig.findOne({
    where: {
      stage_id: stage.id
    }
  })

  if (!stageConfig) {
    return {
      message: 'لم نجد إعدادات للمرحلة',
      data: {
        success: false,
        config_json: []
      }
    }
  }

  return {
    message: 'تم جلب إعدادات العملية بنجاح !',
    data: {
      success: true,
      config_json: stageConfig.config_json
    }
  }
}

module.exports = {
  createStageConfigService,
  getConfig_json
}
