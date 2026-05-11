const { Transaction } = require('../../../entities')

async function findDraft(userId, typeTransId) {
  return Transaction.findOne({
    where: {
      user_id: userId,
      type_trans_id: typeTransId,
      status: 'draft'
    },
    order: [['created_at', 'DESC']]
  })
}


async function findDraftByCode(
  userId,
  code
) {

  return Transaction.findOne({

    where: {
      user_id: userId,
      code,
      status: 'draft'
    },

    order: [['created_at', 'DESC']]
  })
}

async function create(data) {
  return Transaction.create(data)
}

async function findById(id) {
  return Transaction.findByPk(id)
}

module.exports = {
  findDraft,
  create,
  findById,
  findDraftByCode
}