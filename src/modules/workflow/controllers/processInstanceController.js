const {
  submitTransaction
} = require('../services/processInstanceService')

// =========================================
// SUBMIT TRANSACTION
// =========================================
async function submitTransactionController(req, res) {

  try {

    const { transactionId, processId } = req.params

    const result = await submitTransaction(
      transactionId,
      processId,
      req.body
    )

    return res.status(200).json({
      success: true,
      data: result
    })

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

module.exports = {
  submitTransactionController
}