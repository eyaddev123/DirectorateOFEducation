const processInstanceStageRepository =
  require('../repositories/processInstanceStageRepository')

// =====================================
// CREATE PROCESS STAGE
// =====================================

async function createProcessStage({

  transactionId,

  stageCode,

  stageName,

  status

}) {

  return await processInstanceStageRepository.create({

    transaction_id: transactionId,

    stage_code: stageCode,

    stage_name: stageName,

    status
  })
}

module.exports = {
  createProcessStage
}