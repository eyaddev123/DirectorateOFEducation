const {
  ProcessInstance
} = require('../../../entities')

class ProcessInstanceRepository {

  async create(data) {

    return await ProcessInstance.create(data)
  }

  async update(id, data) {

    return await ProcessInstance.update(
      data,
      {
        where: { id }
      }
    )
  }
}

module.exports =
  new ProcessInstanceRepository()