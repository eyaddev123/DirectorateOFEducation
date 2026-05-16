const { UserRoleAssignment } = require('../../../entities')

async function create(data, options = {}) {
  return UserRoleAssignment.create(data, options)
}

async function findRoleIdsByUserId(userId) {
  return UserRoleAssignment.findAll({
    where: { user_id: userId },
    attributes: ['organization_department_roles_id']
  })
}

module.exports = {
  create,
  findRoleIdsByUserId
}
