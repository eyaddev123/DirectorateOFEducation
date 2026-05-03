'use strict'

const {
  ValidateCreateDepartment,
  ValidateUpdateDepartment
} = require('../validations/departmentValidation')

const { Department, Organization } = require('../entities')

// ================= CREATE =================
async function createDepartmentService(data) {
  const { error } = ValidateCreateDepartment(data)

  if (error) {
    const msg = error.details.map(d => d.message).join(' | ')
    const err = new Error(msg)
    err.statusCode = 400
    throw err
  }

  const organization = await Organization.findByPk(data.organization_id)
  if (!organization) {
    const err = new Error('المؤسسة غير موجودة')
    err.statusCode = 404
    throw err
  }

  if (data.parent_id) {
    const parent = await Department.findByPk(data.parent_id)
    if (!parent) {
      const err = new Error('القسم الأب غير موجود')
      err.statusCode = 404
      throw err
    }
  }

  const department = await Department.create({
    name: data.name,
    organization_id: data.organization_id,
    parent_id: data.parent_id ?? null,
    is_active: data.is_active ?? true
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

  const department = await Department.findByPk(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  if (data.organization_id !== undefined) {
    const organization = await Organization.findByPk(data.organization_id)
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

    const parent = await Department.findByPk(data.parent_id)
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
  if (data.is_active !== undefined) payload.is_active = data.is_active

  await department.update(payload)
  await department.reload()

  return department
}

// ================= DELETE =================
async function deleteDepartmentService(id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const department = await Department.findByPk(departmentId)

  if (!department) {
    const err = new Error('القسم غير موجود')
    err.statusCode = 404
    throw err
  }

  await department.destroy()

  return { id: departmentId }
}

// ================= GET ALL =================
async function getAllDepartmentsService() {
  const rows = await Department.findAll({
    order: [['id', 'ASC']],
    include: [
      { model: Organization, as: 'organization' },
      { model: Department, as: 'parent' }
    ]
  })

  return rows
}

// ================= GET BY ID =================
async function getDepartmentByIdService(id) {
  const departmentId = parseInt(id, 10)

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    const err = new Error('معرّف القسم غير صالح')
    err.statusCode = 400
    throw err
  }

  const department = await Department.findByPk(departmentId, {
    include: [
      { model: Organization, as: 'organization' },
      { model: Department, as: 'parent' },
      { model: Department, as: 'children' }
    ]
  })

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
  getDepartmentByIdService
}
