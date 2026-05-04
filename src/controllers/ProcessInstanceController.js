const { startProcessInstance } = require('../services/processInstance')

// =========================================
// START PROCESS CONTROLLER
// =========================================
async function startProcessController(req, res) {
  try {

    const { processId } = req.params

    const result = await startProcessInstance(processId)

    return res.status(200).json({
      success: true,
      message: 'Process started successfully',
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
  startProcessController
}