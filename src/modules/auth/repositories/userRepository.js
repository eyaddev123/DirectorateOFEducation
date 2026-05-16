const { Op } = require('sequelize')
const { User } = require('../../../entities')

async function findByEmail(email, options = {}) {
  return User.findOne({ where: { email }, ...options })
}

async function findByUserName(userName, options = {}) {
  return User.findOne({ where: { userName }, ...options })
}

async function findById(id) {
  return User.findByPk(id)
}

async function findConflictingByEmailOrUserName(email, userName, options = {}) {
  return User.findAll({
    where: {
      [Op.or]: [{ email }, { userName }]
    },
    ...options
  })
}

async function create(data, options = {}) {
  return User.create(data, options)
}

async function updateById(id, data) {
  const user = await User.findByPk(id)
  if (!user) return null
  await user.update(data)
  return user
}

async function destroyInstance(user, options = {}) {
  return user.destroy(options)
}

function getSequelize() {
  return User.sequelize
}

module.exports = {
  findByEmail,
  findByUserName,
  findById,
  findConflictingByEmailOrUserName,
  create,
  updateById,
  destroyInstance,
  getSequelize
}
