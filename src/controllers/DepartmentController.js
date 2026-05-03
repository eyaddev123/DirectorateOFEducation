const asyncHandler = require('../middleware/asyncHandler')

const {
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
  getAllDepartmentsService,
  getDepartmentByIdService
} = require('../services/department')

// ================= CREATE =================
const createDepartment = asyncHandler(async (req, res) => {
  const result = await createDepartmentService(req.body)

  return res.status(201).json({
    success: true,
    message: 'تم إنشاء القسم بنجاح',
    data: result
  })
})

// ================= UPDATE =================
const updateDepartment = asyncHandler(async (req, res) => {
  const result = await updateDepartmentService(req.body, req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم تعديل القسم بنجاح',
    data: result
  })
})

// ================= DELETE =================
const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await deleteDepartmentService(req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم حذف القسم بنجاح',
    data: result
  })
})

// ================= GET ALL =================
const getAllDepartments = asyncHandler(async (req, res) => {
  const result = await getAllDepartmentsService()

  return res.status(200).json({
    success: true,
    message: 'تم جلب البيانات بنجاح',
    data: result
  })
})

// ================= GET BY ID =================
const getDepartmentById = asyncHandler(async (req, res) => {
  const result = await getDepartmentByIdService(req.params.id)

  return res.status(200).json({
    success: true,
    message: 'تم جلب البيانات بنجاح',
    data: result
  })
})

module.exports = {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById
}
