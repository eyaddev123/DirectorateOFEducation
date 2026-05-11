  const{
  
  getById,

  updateStatus,

  updateData

} = require('../services/transactionClient')
// =====================================
// GET BY ID
// =====================================
async function getTransactionByIdController(
  req,
  res
) {

  try {

    const result =
      await getById(
        req.params.id
      )

    return res.status(200).json({

      success: true,

      data: result
    })

  } catch (err) {

    return res.status(400).json({

      success: false,

      message: err.message
    })
  }
}

// ======================================================
// INTERNAL - UPDATE STATUS
// ======================================================

async function updateTransactionStatusController(
  req,
  res
) {

  try {

    const result =
      await updateStatus(

        req.params.id,

        req.body.status
      )

    return res.status(200).json({

      success: true,

      message:
        'Status updated successfully',

      data: result
    })

  } catch (err) {

    return res.status(400).json({

      success: false,

      message: err.message
    })
  }
}

// ======================================================
// INTERNAL - UPDATE DATA
// ======================================================

async function updateTransactionDataController(
  req,
  res
) {

  try {

    const result =
      await updateData(

        req.params.id,

        req.body
      )

    return res.status(200).json({

      success: true,

      message:
        'Data updated successfully',

      data: result
    })

  } catch (err) {

    return res.status(400).json({

      success: false,

      message: err.message
    })
  }
}


module.exports = {
  updateTransactionDataController,

  updateTransactionStatusController,

  getTransactionByIdController
}