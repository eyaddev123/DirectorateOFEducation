const Joi = require('joi')

// ⚠️ اختياري: استخدام وقت السيرفر الحقيقي بدل 'now'
const today = new Date()
today.setHours(0, 0, 0, 0)

const createProcessDefinitionSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required(),

  code: Joi.string().required(),

  filePath: Joi.string().required(),

  type_trans_id: Joi.number()
    .integer()
    .required(),

  organization_id: Joi.number()
    .integer(),

  priority: Joi.number()
    .integer()
    .min(1)
    .required(),

  // =========================================
  // START DATE
  // =========================================


start_date: Joi.date()
  .min(today) // ✅ يقبل أي وقت ضمن اليوم
  .allow(null)
  .messages({
    'date.base': 'start_date يجب أن يكون تاريخ صحيح',
    'date.min': 'start_date يجب أن يكون من اليوم أو بعده'
  }),

  // =========================================
  // END DATE
  // =========================================
  end_date: Joi.date()
    .min(Joi.ref('start_date')) // 🔥 لازم بعد أو نفس start_date
    .greater(Joi.ref('start_date')) // 🔥 (اختياري) يمنع يساوي start_date
    .allow(null)
    .messages({
      'date.base': 'end_date يجب أن يكون تاريخ صحيح',
      'date.min': 'end_date يجب أن يكون بعد start_date',
      'date.greater': 'end_date يجب أن يكون أكبر من start_date'
    })
})

module.exports = { createProcessDefinitionSchema }