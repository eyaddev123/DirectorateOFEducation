const {
  createDraftTransaction,
  updateDraft
} = require('../services/transaction')


// ======================================================
// CREATE OR RETURN EXISTING DRAFT
// ======================================================

async function createDraft(req, res, next) {
  try {

    const userId = req.user.id
    const typeTransId = req.params.typeTransId

    const result = await createDraftTransaction(
      userId,
      typeTransId
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
  updateDraftController
}