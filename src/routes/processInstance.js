const express = require('express')
const router = express.Router()

const {
  startProcessController,
} = require('../controllers/ProcessInstanceController')
const { authMiddleware ,authorize } = require('../middleware/authMiddleware')

// إنشاء معاملة
/**
 * @swagger
 * /process-instances/{id}/start:
 *   post:
 *     summary: Start a process instance
 *     tags: [Process Instance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Process Definition ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Process instance started successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:id/start',
  authMiddleware,
  authorize('PROCESS_START'),
  startProcessController
)


module.exports = router