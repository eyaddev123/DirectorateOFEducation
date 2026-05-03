'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const {
  User,
  OtpCode,
  OrgDeptRole,
  UserRoleAssignment,
  Role,
} = require('../entities')

const {
  validateRegisterEmp,
  validateRegisterCitizen,
  validateLogin,
  validateVerifyOtp,
} = require('../validations/authValidations')

const { RegisterCitizenInputDTO } = require('../dto/RegisterCitizenInputDTO')
const { RegisterCitizenOutputDTO } = require('../dto/RegisterCitizenOutputDTO')
const { LoginInputDTO } = require('../dto/LoginInputDTO')
const { LoginOutputDTO } = require('../dto/LoginOutputDTO')
const { RegisterEmpInputDTO } = require('../dto/RegisterEmpInputDTO')
const { RegisterEmpOutputDTO } = require('../dto/RegisterEmpOutputDTO')

const { sendSms } = require('./smsService')

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secret_key'
const OTP_TTL_MINUTES = 2

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function saveAndSendOtp(userId, phone) {
  // حذف أي OTP قديم لنفس المستخدم
  await OtpCode.destroy({ where: { user_id: userId } })

  const otp = generateOtp()
  const session_id = uuidv4()
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await OtpCode.create({
    session_id,
    otp,
    phone_number: phone,
    user_id: userId,
    expires_at,
  })

await sendSms(phone, `رمز التحقق : ${otp}\nصالح لمدة ${OTP_TTL_MINUTES} دقائق فقط.`);  
return session_id
}

// ================== REGISTER EMPLOYEE (Tech team only) ===================
async function registerEmployee(userData) {
  const { error } = validateRegisterEmp(userData)
  if (error) throw new Error(error.details.map(d => d.message).join(' | '))

  const existingUser = await User.findOne({ where: { email: userData.email } })
  if (existingUser) throw new Error('Email already exists')

  if (
    !Array.isArray(userData.organization_department_role_ids) ||
    userData.organization_department_role_ids.length === 0
  ) throw new Error('organization_department_role_ids is required')

  const roles = await OrgDeptRole.findAll({
    where: { id: userData.organization_department_role_ids }
  })
  if (roles.length !== userData.organization_department_role_ids.length)
    throw new Error('One or more roles are invalid')

  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const user = await User.create({
    userName: userData.userName,
    email: userData.email,
    phone_number: userData.phone_number,
    password: hashedPassword,
    is_active: true,
  })

  const assignments = userData.organization_department_role_ids.map(roleId => ({
    user_id: user.id,
    organization_department_roles_id: roleId,
  }))
  await UserRoleAssignment.bulkCreate(assignments)

  return {
    userName: userData.userName,
    password: userData.password,
    message: 'تم إنشاء حساب الموظف بنجاح. سلّم بيانات الدخول للموظف.',
  }
}

// ================== REGISTER CITIZEN — Step 1 ===================
async function registerCitizen(userData) {
  const { error } = validateRegisterCitizen(userData)
  if (error) throw new Error(error.details.map(d => d.message).join(', '))

  const existingUser = await User.findOne({ where: { email: userData.email } })
  if (existingUser) throw new Error('Email already exists')

  const orgDeptRole = await OrgDeptRole.findOne({
    include: [{ model: Role, as: 'role', where: { code: 'CITIZEN' } }]
  })
  if (!orgDeptRole) throw new Error('CITIZEN role not found')

  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const inputUserDTO = new RegisterCitizenInputDTO({ ...userData, password: hashedPassword })

  const user = await User.create({ ...inputUserDTO, is_active: false })

  await UserRoleAssignment.create({
    user_id: user.id,
    organization_department_roles_id: orgDeptRole.id,
  })

  const session_id = await saveAndSendOtp(user.id, userData.phone_number)

  return {
    session_id,
    message: 'تم إرسال رمز التحقق على رقم الموبايل. أدخله خلال دقيقتين.',
  }
}

// ================== VERIFY REGISTER OTP — Step 2 ===================
async function verifyRegisterOtp({ session_id, otp }) {
  const { error } = validateVerifyOtp({ session_id, otp })
  if (error) throw new Error(error.details.map(d => d.message).join(', '))

  const record = await OtpCode.findOne({ where: { session_id } })
  if (!record) throw new Error('session_id غير صحيح')
  if (record.otp !== otp) throw new Error('رمز OTP غير صحيح')
  if (new Date() > record.expires_at) {
    await record.destroy()
    throw new Error('رمز OTP منتهي الصلاحية')
  }

  const user = await User.findByPk(record.user_id)
  if (!user) throw new Error('المستخدم غير موجود')

  await user.update({ is_active: true })
  await record.destroy()

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' })

  return {
    token,
    user: new RegisterEmpOutputDTO(user),
    message: 'تم تفعيل الحساب بنجاح',
  }
}

// ================== LOGIN — Step 1 ===================
async function login(userData) {
  const { error } = validateLogin(userData)
  if (error) throw new Error(error.details.map(d => d.message).join(', '))

  const inputDTO = new LoginInputDTO(userData)

  const user = await User.findOne({ where: { userName: inputDTO.userName } })
  if (!user) throw new Error('Invalid userName or password')

  const isValid = await bcrypt.compare(inputDTO.password, user.password)
  if (!isValid) throw new Error('Invalid userName or password')

  if (!user.is_active) throw new Error('الحساب غير مفعّل. سجّل من جديد أو تواصل مع الدعم')
  if (!user.phone_number) throw new Error('لا يوجد رقم هاتف مرتبط بهذا الحساب')

  const session_id = await saveAndSendOtp(user.id, user.phone_number)

  return {
    session_id,
    message: 'تم إرسال رمز التحقق على رقم الموبايل. أدخله خلال دقيقتين.',
  }
}

// ================== VERIFY LOGIN OTP — Step 2 ===================
async function verifyLoginOtp({ session_id, otp }) {
  const { error } = validateVerifyOtp({ session_id, otp })
  if (error) throw new Error(error.details.map(d => d.message).join(', '))

  const record = await OtpCode.findOne({ where: { session_id } })
  if (!record) throw new Error('session_id غير صحيح')
  if (record.otp !== otp) throw new Error('رمز OTP غير صحيح')
  if (new Date() > record.expires_at) {
    await record.destroy()
    throw new Error('رمز OTP منتهي الصلاحية')
  }

  const user = await User.findByPk(record.user_id)
  if (!user) throw new Error('المستخدم غير موجود')

  await record.destroy()

  const roleAssign = await UserRoleAssignment.findAll({
    where: { user_id: user.id },
    attributes: ['organization_department_roles_id'],
  })

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' })

  return {
    user: new LoginOutputDTO(user),
    roles: roleAssign.map(r => r.organization_department_roles_id),
    token,
  }
}

module.exports = {
  registerEmployee,
  registerCitizen,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
}
