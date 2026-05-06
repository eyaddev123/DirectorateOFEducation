'use strict'

const { ProcessDefinition } = require('../entities')
const { Op } = require('sequelize')

async function updateProcessActivationStatus() {
  const now = new Date()

  // 🔥 نوحّد الوقت (حتى المقارنة تكون صح)
  now.setHours(0, 0, 0, 0)

  console.log('Checking process activation...')

  // =====================================
  // ACTIVATE (تشغيل)
  // =====================================
  const activated = await ProcessDefinition.update(
    { is_active: true },
    {
      where: {
        start_date: {
          [Op.lte]: now
        },
        approval_status: 'APPROVED',
        is_active: false
      }
    }
  )

  // =====================================
  // DEACTIVATE (إيقاف)
  // =====================================
  const deactivated = await ProcessDefinition.update(
    { is_active: false },
    {
      where: {
        end_date: {
          [Op.lt]: now
        },
        is_active: true
      }
    }
  )

  console.log('Activated:', activated[0])
  console.log('Deactivated:', deactivated[0])
}

module.exports = {
  updateProcessActivationStatus
}