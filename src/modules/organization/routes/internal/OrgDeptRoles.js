const express = require('express')
const router = express.Router()

const {
  getOrgDeptRoleById,
  getActiveRoles,
  getOrgDeptRolesByIds,
  findOneOrgDeptRole,
  getCitizenRole
} = require('../../controllers/internal/OrgDeptRoleController')

// =====================================
// GET BY ID
// =====================================
router.get(
  '/:id',
  getOrgDeptRoleById
)

// =====================================
// GET ACTIVE
// =====================================
router.get(
  '/active',
  getActiveRoles
)

// =====================================
// FIND ONE (by composite keys)
// =====================================
router.post(
  '/find',
  findOneOrgDeptRole
)

// =====================================
// BULK FIND
// =====================================
router.post(
  '/bulk',
  getOrgDeptRolesByIds
)

// =====================================
// CITIZEN ROLE (NEW)
// =====================================
router.get(
  '/citizen',
  getCitizenRole
)

module.exports = router