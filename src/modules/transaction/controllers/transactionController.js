const {

  createOrUpdateDraft,

  getUserDraftByProcess,

  getTransactionById,

  submitTransaction

} = require('../services/transactionService')

// ======================================================
// CREATE OR UPDATE DRAFT
// ======================================================

async function createOrUpdateDraftController(
  req,
  res,
  next
) {

  try {

    const userId =
      req.user.id

    const {
      processId
    } = req.params

    const result =
      await createOrUpdateDraft({

        userId,

        processId,

        data: req.body
      })

    return res.status(200).json({

      success: true,
      message:'تم حفظ المسودة بنجاح',
      data: result
    
    })

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })}
}

// ======================================================
// GET USER DRAFT BY PROCESS
// ======================================================

async function getUserDraftByProcessController(
  req,
  res,
  next
) {

  try {

    const userId =
      req.user.id

    const {
      processId
    } = req.params

    const result =
      await getUserDraftByProcess(

        userId,

        processId
      )

    return res.status(200).json({

       success: true,
      message:'تم جلب المسودة بنجاح',
      data: result
    })

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })}
}

// ======================================================
// GET TRANSACTION BY ID
// ======================================================

async function getTransactionController(
  req,
  res,
  next
) {

  try {

    const userId =
      req.user.id

    const {
      transactionId
    } = req.params

    const result =
      await getTransactionById(

        transactionId,

        userId
      )

    return res.status(200).json({

      success: true,
      message:'تم العملية بنجاح',
      data: result
    })

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })}
}

// ======================================================
// SUBMIT TRANSACTION
// ======================================================

async function submitTransactionController(
  req,
  res,
  next
) {

  try {

    const {
      transactionId
    } = req.params

    const result =
      await submitTransaction(

        transactionId,

        req.body
      )

    return res.status(200).json({

      success: true,
      message:'تم العملية بنجاح',
      data: result
    })

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })}
}





    module.exports = {

  createOrUpdateDraftController,

  getUserDraftByProcessController,

  getTransactionController,

  submitTransactionController,


}