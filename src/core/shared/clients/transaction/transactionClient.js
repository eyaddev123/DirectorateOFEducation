const axios = require('axios')

const BASE_URL =
  process.env.TRANSACTION_SERVICE_URL

class TransactionClient {

  // =====================================
  // GET TRANSACTION
  // =====================================

  async getTransactionById (id) {

    const res = await axios.get(
      `${BASE_URL}/internal/transactions/${id}`
    )

    return res.data.data
  }

  // =====================================
  // UPDATE STATUS
  // =====================================

  async updateStatus (id, status) {

    const res = await axios.patch(
      `${BASE_URL}/internal/transactions/${id}/status`,
      { status }
    )

    return res.data
  }

  // =====================================
  // UPDATE DATA
  // =====================================

  async updateData (id, data) {

    const res = await axios.patch(
      `${BASE_URL}/internal/transactions/${id}/data`,
      data
    )

    return res.data
  }
}

module.exports = new TransactionClient()