const express = require('express');

const router = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  patchDepartmentStatus
} = require('./departmentAdminController');

const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/requireRole');

router.use(authMiddleware);

router.get('/', getAllDepartments);

router.get('/:id', getDepartmentById);

router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createDepartment
);

router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateDepartment
);

router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  patchDepartmentStatus
);

module.exports = router;