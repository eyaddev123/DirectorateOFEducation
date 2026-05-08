const express = require('express')
const router = express.Router()

const {
  createDraftController,
  updateDraftController,
  submitTransactionController
} = require('../controllers/ProcessInstanceController')

const {
  authMiddleware
} = require('../../../core/middleware/authMiddleware')

/**
 * =========================================
 * CREATE OR GET DRAFT
 * =========================================
 */

/**
 * @swagger
 * /process-instances/draft/{typeTransId}:
 *   post:
 *     summary: Create or get draft transaction
 *     tags: [Process Instance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/draft/:typeTransId',
  authMiddleware,
  createDraftController
)

/**
 * =========================================
 * UPDATE DRAFT
 * =========================================
 */

/**
 * @swagger
 * /process-instances/draft/{transactionId}:
 *   put:
 *     summary: Update draft transaction
 *     tags: [Process Instance]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/draft/:transactionId',
  authMiddleware,
  updateDraftController
)



module.exports = router