'use strict'

const express = require('express')
const router = express.Router()

const {
  createProcessDefinition,
  getAuthProcessesController
} = require('../controllers/ProcessDefController')

const {uploadBPMN,
  uploadDocumentTemplate} = require('../middleware/upload')
const { authMiddleware ,authorize } = require('../middleware/authMiddleware')


/**
 * @swagger
 * /api/process_definitions/create:
 *   post:
 *     summary: Create new process definition (upload BPMN)
 *     tags: [Process Definition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - name
 *               - type_trans_id
 *               - priority
 *               - start_date
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: BPMN file
 *               name:
 *                 type: string
 *                 example: Leave Process
 *               code:
 *                 type: string
 *                 example: LEAVE_001
 *               type_trans_id:
 *                 type: integer
 *                 example: 1
 *               organization_id:
 *                 type: integer
 *                 example: 10
 *               priority:
 *                 type: integer
 *                 example: 1
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-01-01
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-31
 *     responses:
 *       200:
 *         description: تم إنشاء العملية بنجاح.
 *       400:
 *         description: ملف BPMN مطلوب أو خطأ بالبيانات.
 */
router.post(
  '/create',
  authMiddleware,
  authorize('PROCESS_CREATE'),
  uploadBPMN.single('file'),
  createProcessDefinition
)

/**
 * @swagger
 * /api/process_definitions/auth/{id}:
 *   get:
 *     summary: Get processes where first stage is AUTH
 *     tags: [Process Definition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: type Process ID
 *     responses:
 *       200:
 *         description: تم جلب عمليات AUTH بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: تم جلب عمليات AUTH بنجاح
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       process_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       priority:
 *                         type: integer
 *                       auth_stage:
 *                         type: object
 */
router.get(
  '/auth/:id',
  authMiddleware,
  authorize('PROCESS_READ_AUTH'),
  getAuthProcessesController
)

module.exports = router