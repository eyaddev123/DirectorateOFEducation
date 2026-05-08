const express = require('express')
const router = express.Router()

const {
createDraft,
  updateDraftController
} = require('../controllers/transactionController')

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
 * /api/transaction/draft/{typeTransId}:
 *   post:
 *     summary: Create new draft or return existing one
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeTransId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction type ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Draft returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Existing draft returned
 *                 isNew:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     user_id:
 *                       type: integer
 *                       example: 2
 *                     type_trans_id:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: draft
 *                     data:
 *                       type: object
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/draft/:typeTransId',
  authMiddleware,
  createDraft
)

/**
 * =========================================
 * UPDATE DRAFT
 * =========================================
 */

/**
 * @swagger
 * /api/transaction/draft/{transactionId}:
 *   put:
 *     summary: Update draft transaction data
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Draft transaction ID
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               student_name: أحمد محمد
 *               phone: 0999999999
 *               note: شكوى تأخير معاملة
 *     responses:
 *       200:
 *         description: Draft updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Draft updated
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/draft/:transactionId',
  authMiddleware,
  updateDraftController
)

module.exports = router