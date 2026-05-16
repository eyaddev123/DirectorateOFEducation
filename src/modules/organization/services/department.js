'use strict'

const {
  ValidateCreateDepartment,
  ValidateUpdateDepartment
} = require('../validations/departmentValidation')

const departmentRepository = require('../repositories/departmentRepository')
const organizationRepository = require('../repositories/organizationRepository')

// ================= CREATE =================
async function createDepartmentService(data) {
  const { error } = ValidateCreateDepartment(data)

  if (error) {
    const msg = error.details.map(d => d.message).join(' | ')
    const err = new Error(msg)
    err.statusCode = 400
    throw err
  }

  const organization = await organizationRepository.findById(data.organization_id)
  if (!organization) {
    const err = new Error('المؤسسة غير موجودة')
    err.statusCode = 404
    throw err
  }

  if (data.parent_id) {
    const parent = await departmentRepository.findById(data.parent_id)
    if (!parent) {
      const err = new Error('القسم الأب غير موجود')
      err.statusCode = 404
      throw err
    }
  }

  const department = await departmentRepository.create({
    name: data.name,
    organization_id: data.organization_id,
    parent_id: data.parent_id ?? null,
    is_active: true
  })

  return department
}

// ================= UPDATE =================
async function updateDepartmentService(data, id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const { error } = ValidateUpdateDepartment(data)

  if (error) {
    const msg = error.details.map(d => d.message).join(' | ')
    const err = new Error(msg)
    err.statusCode = 400
    throw err
  }

  const department = await departmentRepository.findById(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  if (data.organization_id !== undefined) {
    const organization = await organizationRepository.findById(data.organization_id)
    if (!organization) {
      const err = new Error('المؤسسة غير موجودة')
      err.statusCode = 404
      throw err
    }
  }

  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (data.parent_id === departmentId) {
      const err = new Error('لا يمكن أن يكون القسم أب لنفسه')
      err.statusCode = 400
      throw err
    }

    const parent = await departmentRepository.findById(data.parent_id)
    if (!parent) {
      const err = new Error('القسم الأب غير موجود')
      err.statusCode = 404
      throw err
    }
  }

  const payload = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.organization_id !== undefined) payload.organization_id = data.organization_id
  if (data.parent_id !== undefined) payload.parent_id = data.parent_id

  return departmentRepository.updateInstance(department, payload)
}

// ================= TOGGLE STATUS =================
async function toggleDepartmentStatusService(id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const department = await departmentRepository.findById(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  return departmentRepository.updateInstance(department, { is_active: !department.is_active })
}

// ================= DELETE =================
async function deleteDepartmentService(id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const department = await departmentRepository.findById(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  await departmentRepository.destroyInstance(department)

  return { id: departmentId }
}

// ================= GET ALL =================
async function getAllDepartmentsService() {
  return departmentRepository.findAll()
}

// ================= GET LEAVES BY ORGANIZATION =================
// يعيد فقط الأقسام التي لا يوجد لها أبناء (آخر هرمية)
// مع اسم كامل يمثّل المسار من الجذر: "قسم المحاسبة\شعبة التدقيق"
async function getLeafDepartmentsByOrganizationService(organizationId) {
  const orgId = parseInt(organizationId, 10)

  if (!Number.isInteger(orgId) || orgId < 1) {
    const err = new Error('معرّف المؤسسة غير صالح')
    err.statusCode = 400
    throw err
  }

  const organization = await organizationRepository.findById(orgId)
  if (!organization) {
    const err = new Error('المؤسسة غير موجودة')
    err.statusCode = 404
    throw err
  }

  const departments = await departmentRepository.findAllByOrganizationId(orgId)

  if (departments.length === 0) return []

  const byId = new Map(departments.map(d => [d.id, d]))
  const parentIds = new Set(
    departments
      .map(d => d.parent_id)
      .filter(pid => pid !== null && pid !== undefined)
  )

  const leaves = departments.filter(d => !parentIds.has(d.id))

  return leaves.map(leaf => {
    const path = []
    let current = leaf
    const visited = new Set()

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      path.unshift(current.name)
      current = current.parent_id ? byId.get(current.parent_id) : null
    }

    return {
      id: leaf.id,
      name: path.join('\\')
    }
  })
}

// ================= GET BY ID =================
async function getDepartmentByIdService(id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const department = await departmentRepository.findByIdWithRelations(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  return department
}

module.exports = {
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
  getAllDepartmentsService,
  getDepartmentByIdService,
  getLeafDepartmentsByOrganizationService,
  toggleDepartmentStatusService
}
