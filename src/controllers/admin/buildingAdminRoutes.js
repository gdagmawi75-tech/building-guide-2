const express = require('express');

const router = express.Router();

const {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  patchBuildingStatus
} = require('./buildingAdminController');

const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/requireRole');

// All building admin routes require authentication
router.use(authMiddleware);

// GET /api/admin/buildings
router.get('/', getAllBuildings);

// GET /api/admin/buildings/:id
router.get('/:id', getBuildingById);

// POST /api/admin/buildings
router.post(
  '/',
  requireRole(['super_admin']),
  createBuilding
);

// PUT /api/admin/buildings/:id
router.put(
  '/:id',
  requireRole(['super_admin', 'building_manager']),
  updateBuilding
);

// PATCH /api/admin/buildings/:id/status
router.patch(
  '/:id/status',
  requireRole(['super_admin']),
  patchBuildingStatus
);

module.exports = router;