const asyncHandler = require('../middleware/asyncHandler')
const {
  getAuthProcessesCompaint
} = require('../services/processService')

// =========================================
// GET COMPLAINT PROCESSES
// =========================================
const getComplaintProcesses = asyncHandler(async (req, res) => {
try{
  const result = await getAuthProcessesCompaint()

  return res.status(200).json({
    success: true,
    ...result
  })
    } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
})

module.exports = {
  getComplaintProcesses
}