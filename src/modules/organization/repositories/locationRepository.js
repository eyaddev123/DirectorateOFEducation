const { Location } = require('../../../entities')

async function findById(id) {
  return Location.findByPk(id)
}

module.exports = {
  findById
}
