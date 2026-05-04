'use strict'

const { ValidateCreateField , ValidateUpdateField } = require('../validations/fieldValidations')
const { Field } = require('../entities')
const { FieldInputDTO} = require('../dto/FieldInputDTO')
const { FieldOutputDTO } = require('../dto/FieldOutputDTO')
const { where } = require('sequelize')

//// =========================================== create new field =========================== : 
async function createFieldService(fieldData) {

  try {

    const dataToValidate = { ...fieldData }

    const { error } = ValidateCreateField(dataToValidate)

    if (error) {
      throw new Error(error.details[0].message)
    }

    const inputFiledDTO = new FieldInputDTO({
      ...fieldData
    })

    // =========================================
    // LIST VALIDATION
    // =========================================
    if (inputFiledDTO.field_type === 'list') {

      // ✅ required
      if (
        !inputFiledDTO.list_json ||
        !Array.isArray(inputFiledDTO.list_json) ||
        inputFiledDTO.list_json.length === 0
      ) {
        throw new Error(
          'list_json is required and must be a non-empty array when field_type is list'
        )
      }

      // ✅ كل العناصر String
      const invalidItem = inputFiledDTO.list_json.find(
        item =>
          typeof item !== 'string' ||
          item.trim() === ''
      )

      if (invalidItem !== undefined) {
        throw new Error(
          'All list_json items must be non-empty strings'
        )
      }

      // ✅ إزالة الفراغات
      inputFiledDTO.list_json =
        inputFiledDTO.list_json.map(
          item => item.trim()
        )

      // ✅ منع التكرار
      const uniqueValues = new Set(
        inputFiledDTO.list_json
      )

      if (
        uniqueValues.size !==
        inputFiledDTO.list_json.length
      ) {
        throw new Error(
          'list_json contains duplicate values'
        )
      }
    }

    // =========================================
    // NON-LIST TYPES
    // =========================================
    if (inputFiledDTO.field_type !== 'list') {
      inputFiledDTO.list_json = null
    }

    // =========================================
    // CREATE FIELD
    // =========================================
    const field = await Field.create({
      ...inputFiledDTO
    })

    return {
      message: 'تم إنشاء الحقل بنجاح',
      data: {
        success: true,
        field: new FieldOutputDTO(field)
      }
    }

  } catch (err) {

    console.error('=== ERROR in createFieldService ===')
    console.error(err)

    throw err
  }
}


//////=============================================  update Field ============================== : 
async function updateFieldService(FieldData, FieldId) {

  const id = parseInt(FieldId, 10)

  if (!Number.isInteger(id) || id < 1) {
    throw new Error('معرّف الحقل غير صالح')
  }

  // =========================================
  // VALIDATION
  // =========================================
  const { error } = ValidateUpdateField({
    ...FieldData
  })

  if (error) {
    throw new Error(error.details[0].message)
  }

  // =========================================
  // GET CURRENT FIELD
  // =========================================
  const oldField = await Field.findByPk(id)

  if (!oldField) {
    const err = new Error('الحقل غير موجودة')
    err.statusCode = 404
    throw err
  }

  // =========================================
  // FINAL FIELD TYPE
  // =========================================
  const finalFieldType =
    FieldData.field_type || oldField.field_type

  // =========================================
  // VALIDATE list_json
  // =========================================
  if (
    FieldData.list_json !== undefined &&
    finalFieldType !== 'list'
  ) {
    throw new Error(
      'لا يمكن تعديل list_json إلا إذا كان field_type = list'
    )
  }

  // =========================================
  // إذا النوع صار list لازم list_json
  // =========================================
  if (
    finalFieldType === 'list' &&
    FieldData.field_type === 'list' &&
    FieldData.list_json === undefined
  ) {
    throw new Error(
      'يجب إرسال list_json عند تحويل النوع إلى list'
    )
  }

  // =========================================
  // DEACTIVATE OLD VERSION
  // =========================================
  await oldField.update({
    is_active: false
  })

  // =========================================
  // CREATE NEW VERSION
  // =========================================
  const newField = await Field.create({

    field_name:
      FieldData.field_name ?? oldField.field_name,

    field_type:
      finalFieldType,

    // إذا النوع list
    list_json:
      finalFieldType === 'list'
        ? (
            FieldData.list_json ??
            oldField.list_json
          )
        : null,

    // زيادة النسخة
    version: (oldField.version || 1) + 1,

    // النسخة الجديدة فعالة
    is_active:
      FieldData.is_active ?? true
  })

  // =========================================
  // RETURN DTO
  // =========================================
  return new FieldOutputDTO(newField)
}

/////============================== get all fields ==================================== : 
async function getAllFieldsService () {
  const rows = await Field.findAll({
    where : { is_active :true },
    order: [['id', 'ASC']]
  })
  return rows.map(row => new FieldOutputDTO(row))
}


// ======================================
// GET ONE ACTIVE
// =========================================
const getOneActiveFieldService = async id => {

  const field =
    await Field.findOne({
      where: {
        id,
        is_active: true
      }
    })

  if (!field) {
    throw new Error('هذا الحقل غير موجود')
  }

  return {
    message: 'تم جلب الحقل بنجاح',
    data: {
      success: true,
      field
    }
  }
}

module.exports = {
  createFieldService,
  updateFieldService,
  getAllFieldsService,
  getOneActiveFieldService
}
