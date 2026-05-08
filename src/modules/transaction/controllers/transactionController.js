const {
  createDraftTransaction,
  updateDraft
} = require('../services/draftTransactionService')

const {
  submitTransaction
} = require('../services/submitTransactionService')

// ======================================================
// CREATE OR RETURN EXISTING DRAFT
// ======================================================

async function createDraft(req, res, next) {

  try {

    const userId = req.user.id
    const { type_trans_id } = req.body

    const result = await createDraftTransaction(
      userId,
      type_trans_id
    )

    res.status(200).json(result)

  } catch (err) {
    next(err)
  }
}

// ======================================================
// UPDATE DRAFT
// ======================================================

async function updateDraftController(req, res, next) {

  try {

    const { transactionId } = req.params

    const result = await updateDraft(
      transactionId,
      req.body
    )

    res.status(200).json(result)

  } catch (err) {
    next(err)
  }
}



module.exports = {
  createDraft,
  updateDraftController,
  submitTransactionController
}