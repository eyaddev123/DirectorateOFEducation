const asyncHandler = require('../middleware/asyncHandler')

const {
  createRoleService,
  updateRoleService,
  deleteRoleService,
  getAllRolesService,
  getRoleByIdService
} = require('../services/role')

// ================= CREATE =================
const createRole = asyncHandler(async (req, res) => {
  const result = await createRoleService(req.body)

  return res.status(201).json({
    success: true,
    message: 'تم إنشاء الدور بنجاح',
    data: result
  })
})

// ================= UPDATE =================
const updateRole = asyncHandler(async (req, res) => {
  const result = await updateRoleService(req.body, req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم تعديل الدور بنجاح',
    data: result
  })
})

// ================= DELETE =================
const deleteRole = asyncHandler(async (req, res) => {
  const result = await deleteRoleService(req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم حذف الدور بنجاح',
    data: result
  })
})

// ================= GET ALL =================
const getAllRoles = asyncHandler(async (req, res) => {
  const result = await getAllRolesService()

  return res.status(200).json({
    success: true,
    message: 'تم جلب البيانات بنجاح',
    data: result
  })
})

// ================= GET BY ID =================
const getRoleById = asyncHandler(async (req, res) => {
  const result = await getRoleByIdService(req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم جلب البيانات بنجاح',
    data: result
  })
})

module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getAllRoles,
  getRoleById
}
