const {
  UserRoleAssignment
} = require('../../../../entities')

class UserRoleRepository {

  async findActiveRolesByUserId(userId) {

    return await UserRoleAssignment.findAll({

      where: {
        user_id: userId,
        is_active: true
      },

      attributes: [
        'organization_department_roles_id'
      ]
    })
  }
}

module.exports =
  new UserRoleRepository()