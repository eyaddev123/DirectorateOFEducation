const express = require('express')
const router = express.Router()

const {
  submitProcessInstanceController
} = require('../controllers/processInstanceController')

const {
  authMiddleware
} = require('../../../core/middleware/authMiddleware')

/**
 * @swagger
 * /process-instances/submit/{transactionId}/{processId}:
 *   post:
 *     summary: Submit transaction and start workflow
 *     tags: [Process Instance]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Draft Transaction ID
 *         example: 5
 *
 *       - in: path
 *         name: processId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Process Definition ID
 *         example: 2
 *
 *     responses:
 *       200:
 *         description: Process started successfully
 *
 *       400:
 *         description: Invalid request
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 */
router.post(
  '/submit/:transactionId/:processId',
  authMiddleware,
  submitProcessInstanceController
)

module.exports = router