const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const {
  CAMUNDA_URL
} = require('../../../config/camunda')
const xml2js = require('xml2js')
class CamundaClient {
//////////////////////////////////////////////////////////////////////////
//============================ deploy process ===========================
  async deployProcess(filePath) {

    const form = new FormData()

    form.append(
      'deployment-name',
      'process_deployment'
    )

    form.append(
      'process.bpmn',
      fs.createReadStream(filePath)
    )

    form.append(
      'enable-duplicate-filtering',
      'true'
    )

    form.append(
      'deploy-changed-only',
      'true'
    )

    try {

      const res = await axios.post(
        `${CAMUNDA_URL}/deployment/create`,
        form,
        {
          headers: form.getHeaders()
        }
      )

      const definitions =
        res.data.deployedProcessDefinitions

      if (
        !definitions ||
        Object.keys(definitions).length === 0
      ) {
        throw new Error('No process found in BPMN')
      }

      const def = Object.values(definitions)[0]

      return {
        deploymentId: res.data.id,
        processKey: def.key,
        definitionId: def.id
      }

    } catch (err) {

      console.log('CAMUNDA ERROR:')

      console.log(
        err.response?.data || err.message
      )

      throw err
    }
  }

////////////////////////////////////////////////////////////////////////////////
//============================= get tasks =====================================

  async  getProcessTasks (processKey) {
    const res = await axios.get(
      `${CAMUNDA_URL}/process-definition/key/${processKey}/xml`
    )
  
    const xml = res.data.bpmn20Xml
  
    const parsed = await xml2js.parseStringPromise(xml)
  
    const bpmnProcess = parsed['bpmn:definitions']['bpmn:process'][0]
  
    const userTasks = bpmnProcess['bpmn:userTask'] || []
  
    const serviceTasks = bpmnProcess['bpmn:serviceTask'] || []
  
    const tasks = []
  
    for (const t of userTasks) {
      tasks.push({
        taskDefinitionKey: t.$.id,
        name: t.$.name || '',
        type: 'USER_TASK'
      })
    }
  
    for (const t of serviceTasks) {
      tasks.push({
        taskDefinitionKey: t.$.id,
        name: t.$.name || '',
        type: 'SERVICE_TASK'
      })
    }
  
    console.log('12')
  
    return tasks
  }

  //////////////////////////////////////////////////////////////////////////
  //================================ start process ========================

  async startProcess(
    processKey,
    transactionId
  ) {

    const res = await axios.post(

      `${CAMUNDA_URL}/process-definition/key/${processKey}/start`,

      {
        variables: {
          transactionId: {
            value: transactionId,
            type: 'Integer'
          }
        }
      }
    )

    return res.data
  }
/////////////////////////////////////////////////////////////////////////////////////////////
//================================  process Instance Id =======================================
  async getActiveTasks(processInstanceId) {

    const res = await axios.get(
      `${CAMUNDA_URL}/task`,
      {
        params: {
          processInstanceId
        }
      }
    )

    return res.data
  }
///////////////////////////////////////////////////////////////////////////////////////////
// ========================================= complete task ===============================

  async completeTask(
    taskId,
    transactionId
  ) {

    return await axios.post(

      `${CAMUNDA_URL}/task/${taskId}/complete`,

      {
        variables: {
          transactionId: {
            value: transactionId,
            type: 'Integer'
          }
        }
      }
    )
  }
}


module.exports = new CamundaClient()