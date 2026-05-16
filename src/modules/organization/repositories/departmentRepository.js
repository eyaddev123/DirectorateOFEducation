const { Department, Organization } = require('../../../entities')

async function findById(id) {
  return Department.findByPk(id)
}

async function findByIdWithRelations(id) {
  return Department.findByPk(id, {
    include: [
      { model: Organization, as: 'organization' },
      { model: Department, as: 'parent' },
      { model: Department, as: 'children' }
    ]
  })
}

async function findAll() {
  return Department.findAll({
    order: [['id', 'ASC']],
    include: [
      { model: Organization, as: 'organization' },
      { model: Department, as: 'parent' }
    ]
  })
}

async function findAllByOrganizationId(organizationId) {
  return Department.findAll({
    where: { organization_id: organizationId },
    attributes: ['id', 'name', 'parent_id'],
    order: [['id', 'ASC']]
  })
}

async function create(data) {
  return Department.create(data)
}

async function updateInstance(department, payload) {
  await department.update(payload)
  await department.reload()
  return department
}

async function destroyInstance(department) {
  return department.destroy()
}

module.exports = {
  findById,
  findByIdWithRelations,
  findAll,
  findAllByOrganizationId,
  create,
  updateInstance,
  destroyInstance
}
