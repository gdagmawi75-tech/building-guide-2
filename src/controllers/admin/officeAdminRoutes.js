const express = require('express');

const router = express.Router();

const {
  getAllOffices,
  getOfficeById,
  createOffice,
  updateOffice,
  patchOfficeStatus
} = require('./officeAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const {
  requireRole
} = require('../../middleware/requireRole');

// All Office Admin routes require authentication
router.use(authMiddleware);

// GET /api/admin/offices
router.get(
  '/',
  getAllOffices
);

// GET /api/admin/offices/:id
router.get(
  '/:id',
  getOfficeById
);

// POST /api/admin/offices
router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createOffice
);

// PUT /api/admin/offices/:id
router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateOffice
);

// PATCH /api/admin/offices/:id/status
router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  patchOfficeStatus
);

module.exports = router;