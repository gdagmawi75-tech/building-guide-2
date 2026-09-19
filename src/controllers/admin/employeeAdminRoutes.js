const express = require('express');

const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus
} = require('./employeeAdminController');

const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/requireRole');

const router = express.Router();

// --------------------------------------------------
// All employee admin routes require authentication
// --------------------------------------------------

router.use(authMiddleware);

// --------------------------------------------------
// GET ALL EMPLOYEES
// GET /api/admin/employees
// --------------------------------------------------

router.get(
  '/',
  getAllEmployees
);

// --------------------------------------------------
// GET ONE EMPLOYEE
// GET /api/admin/employees/:id
// --------------------------------------------------

router.get(
  '/:id',
  getEmployeeById
);

// --------------------------------------------------
// CREATE EMPLOYEE
// POST /api/admin/employees
// --------------------------------------------------

router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createEmployee
);

// --------------------------------------------------
// UPDATE EMPLOYEE
// PUT /api/admin/employees/:id
// --------------------------------------------------

router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateEmployee
);

// --------------------------------------------------
// UPDATE EMPLOYEE ACTIVE STATUS
// PATCH /api/admin/employees/:id/status
// --------------------------------------------------

router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateEmployeeStatus
);

module.exports = router;