const express = require('express');

const router = express.Router();

const {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  patchFloorStatus
} = require('./floorAdminController');

const { authMiddleware } =
  require('../../middleware/authMiddleware');

const { requireRole } =
  require('../../middleware/requireRole');

// All floor admin routes require authentication
router.use(authMiddleware);

// GET /api/admin/floors
router.get(
  '/',
  getAllFloors
);

// GET /api/admin/floors/:id
router.get(
  '/:id',
  getFloorById
);

// POST /api/admin/floors
router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager'
  ]),
  createFloor
);

// PUT /api/admin/floors/:id
router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'floor_manager'
  ]),
  updateFloor
);

// PATCH /api/admin/floors/:id/status
router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'floor_manager'
  ]),
  patchFloorStatus
);

module.exports = router;