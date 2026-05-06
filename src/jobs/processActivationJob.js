const cron = require('node-cron')
const { updateProcessActivationStatus } = require('../services/processSchedule')

// كل دقيقة (تقدر تغيرها)
cron.schedule('* * * * *', async () => {
  console.log('⏳ Checking process activation...')

  try {
    await updateProcessActivationStatus()
    console.log('✅ Process activation updated')
  } catch (err) {
    console.error('❌ Error updating process activation:', err.message)
  }
})