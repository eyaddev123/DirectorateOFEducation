const express = require('express')
const router = express.Router()

const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById
} = require('../controllers/DepartmentController')

const { authMiddleware, authorize } = require('../middleware/authMiddleware')

/**
 * @swagger
 * /api/department:
 *   post:
 *     summary: إنشاء قسم جديد
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentCreate'
 *     responses:
 *       201:
 *         description: created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentEnvelope'
 */
router.post(
  '/',
  authMiddleware,
  authorize('DEPARTMENT_CREATE'),
  createDepartment
)

/**
 * @swagger
 * /api/department/{id}:
 *   put:
 *     summary: تعديل قسم
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentUpdate'
 *     responses:
 *       200:
 *         description: updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentEnvelope'
 */
router.put(
  '/:id',
  authMiddleware,
  authorize('DEPARTMENT_UPDATE'),
  updateDepartment
)

/**
 * @swagger
 * /api/department/{id}:
 *   delete:
 *     summary: حذف قسم
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentDeleteEnvelope'
 */
router.delete(
  '/:id',
  authMiddleware,
  authorize('DEPARTMENT_DELETE'),
  deleteDepartment
)

/**
 * @swagger
 * /api/department:
 *   get:
 *     summary: جلب كل الأقسام
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentListEnvelope'
 */
router.get(
  '/',
  authMiddleware,
  authorize('DEPARTMENT_VIEW'),
  getAllDepartments
)

/**
 * @swagger
 * /api/department/{id}:
 *   get:
 *     summary: جلب قسم حسب المعرف
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: department
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentEnvelope'
 */
router.get(
  '/:id',
  authMiddleware,
  authorize('DEPARTMENT_VIEW'),
  getDepartmentById
)

module.exports = router
