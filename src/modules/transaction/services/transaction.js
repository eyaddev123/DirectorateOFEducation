const {
Transaction
} = require('../../../entities')


// GET OR CREATE DRAFT

async function createDraftTransaction(userId, typeTransId) {

  // 1. CHECK EXISTING DRAFT

  let draft = await Transaction.findOne({
    where: {
      user_id: userId,
      type_trans_id: typeTransId,
      status: 'draft'
    },

    order: [['created_at', 'DESC']]
  })

  // 2. RETURN EXISTING

  if (draft) {

    return {
      message: 'Existing draft returned',
      isNew: false,
      data: draft
    }
  }

  // 3. CREATE NEW DRAFT

  draft = await Transaction.create({
    user_id: userId,
    type_trans_id: typeTransId,
    status: 'draft',
    data: {}
  })

  return {
    message: 'New draft created',
    isNew: true,
    data: draft
  }
}

//===================================================================================
//=============================  update  Draft transaction  =========================

async function updateDraft(transactionId, data) {

  const draft = await Transaction.findByPk(transactionId)

  if (!draft) throw new Error('Draft not found')

  if (draft.status !== 'draft') {
    throw new Error('Not a draft')
  }

  await draft.update({
    data: {
      ...draft.data,
      ...data
    }
  })

  return {
    message: 'Draft updated',
    data: draft
  }
}


module.exports = { createDraftTransaction , updateDraft}
