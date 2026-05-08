const {
  ProcessDefinition,
  TypeTrans,
  Stage,
  StageAssignment,
  UserRoleAssignment
} = require('../../../entities')

const { Op } = require('sequelize')

async function getAuthProcessesCompaint(userId) {

  // =========================================
  // FIXED TYPE = شكوى
  // =========================================
  const typeTrans = await TypeTrans.findOne({
    where: {
      id: 1,
      name: 'شكوى'
    }
  })

  if (!typeTrans) {
    throw new Error('نوع شكوى غير موجود')
  }

  // =========================================
  // USER ROLES
  // =========================================
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

  if (roleIds.length === 0) {
    return {
      message: 'لا يوجد صلاحيات للمستخدم',
      data: []
    }
  }

  // =========================================
  // GET PROCESSES
  // =========================================
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

  // =========================================
  // MAP RESULT
  // =========================================
  const result = processes.map(process => {

    const authStage = process.stages[0]

    return {
      process_id: process.id,
      name: process.name,
      code: process.code,
      priority: process.priority,

      type: 'شكوى',

      auth_stage: {
        id: authStage.id,
        name: authStage.name,
        code: authStage.code,
        type: authStage.type,
        auth_type: authStage.auth_type
      }
    }
  })

  result.sort((a, b) => a.priority - b.priority)

  return {
    message: 'تم جلب عمليات الشكوى بنجاح',
    data: result
  }
}

module.exports = {
  getAuthProcessesCompaint
}