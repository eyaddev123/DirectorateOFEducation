'use strict'

const { ProcessDefinition } = require('../../../entities')
const { Op } = require('sequelize')

async function updateProcessActivationStatus() {

  const now = new Date()

  console.log('NOW:', now)

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