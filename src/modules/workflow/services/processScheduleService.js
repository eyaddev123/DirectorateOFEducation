'use strict'

const Sequelize = require('sequelize')

const Op = Sequelize.Op

const { ProcessDefinition } =
  require('../../../entities')

async function updateProcessActivationStatus() {

  const now = new Date()

  console.log('NOW:', now)

  const [activatedCount] =
    await ProcessDefinition.update(
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

  const [deactivatedCount] =
    await ProcessDefinition.update(
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

  console.log('Activated:', activatedCount)

  console.log('Deactivated:', deactivatedCount)
}

module.exports = {
  updateProcessActivationStatus
}