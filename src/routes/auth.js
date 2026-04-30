'use strict'

const express = require('express')
const router = express.Router()

const {
  registerEmployeeUser,
  registerCitizenUser,
  verifyRegisterOtpUser,
  loginUser,
  verifyLoginOtpUser,
} = require('../controllers/AuthController')

/**
 * @swagger
 * /api/auth/register/employee:
 *   post:
 *     tags: [Auth]
 *     summary: تسجيل موظف (الخطوة 1 — يرسل OTP)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterEmployeeRequest'
 *     responses:
 *       200:
 *         description: تم إرسال OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OtpSendResponse'
 */
router.post('/register/employee', registerEmployeeUser)

/**
 * @swagger
 * /api/auth/register/citizen:
 *   post:
 *     tags: [Auth]
 *     summary: تسجيل مواطن (الخطوة 1 — يرسل OTP)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCitizenRequest'
 *     responses:
 *       200:
 *         description: تم إرسال OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OtpSendResponse'
 */
router.post('/register/citizen', registerCitizenUser)

/**
 * @swagger
 * /api/auth/verify-otp/register:
 *   post:
 *     tags: [Auth]
 *     summary: التحقق من OTP لإتمام التسجيل (الخطوة 2)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       201:
 *         description: تم تفعيل الحساب وإرجاع الـ token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyRegisterOtpResponse'
 */
router.post('/verify-otp/register', verifyRegisterOtpUser)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: تسجيل الدخول (الخطوة 1 — يرسل OTP)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: تم إرسال OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OtpSendResponse'
 */
router.post('/login', loginUser)

/**
 * @swagger
 * /api/auth/verify-otp/login:
 *   post:
 *     tags: [Auth]
 *     summary: التحقق من OTP لإتمام تسجيل الدخول (الخطوة 2)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول وإرجاع الـ token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyLoginOtpResponse'
 */
router.post('/verify-otp/login', verifyLoginOtpUser)

module.exports = router
