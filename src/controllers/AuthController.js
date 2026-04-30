'use strict'

const {
  registerEmployee,
  registerCitizen,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
} = require('../services/Auth')

// ================= REGISTER EMPLOYEE — Step 1 =================
const registerEmployeeUser = async (req, res) => {
  try {
    const result = await registerEmployee(req.body)
    return res.status(200).json({ success: true, data: result })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

// ================= REGISTER CITIZEN — Step 1 =================
const registerCitizenUser = async (req, res) => {
  try {
    const result = await registerCitizen(req.body)
    return res.status(200).json({ success: true, data: result })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

// ================= VERIFY REGISTER OTP — Step 2 =================
const verifyRegisterOtpUser = async (req, res) => {
  try {
    const result = await verifyRegisterOtp(req.body)
    return res.status(201).json({ success: true, data: result })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

// ================= LOGIN — Step 1 =================
const loginUser = async (req, res) => {
  try {
    const result = await login(req.body)
    return res.status(200).json({ success: true, data: result })
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message })
  }
}

// ================= VERIFY LOGIN OTP — Step 2 =================
const verifyLoginOtpUser = async (req, res) => {
  try {
    const result = await verifyLoginOtp(req.body)
    return res.status(200).json({ success: true, data: result })
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message })
  }
}

module.exports = {
  registerEmployeeUser,
  registerCitizenUser,
  verifyRegisterOtpUser,
  loginUser,
  verifyLoginOtpUser,
}
