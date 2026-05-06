'use strict'

const express = require('express')
const router = express.Router()
const {
  createCalculation,
  updateCalculation,
  getAllcalculations
} = require('../controllers/CalculationController')


router.get('/', getAllcalculations)


router.post('/', createCalculation)

router.put('/:id', updateCalculation)

module.exports = router
