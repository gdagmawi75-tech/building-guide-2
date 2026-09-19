const express = require('express');

const {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  updateFacilityStatus
} = require('./facilityAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const {
  requireRole
} = require('../../middleware/requireRole');

const router = express.Router();

// --------------------------------------------------
// All facility admin routes require authentication
// --------------------------------------------------

router.use(authMiddleware);

// --------------------------------------------------
// GET ALL FACILITIES
// GET /api/admin/facilities
// --------------------------------------------------

router.get(
  '/',
  getAllFacilities
);

// --------------------------------------------------
// GET ONE FACILITY
// GET /api/admin/facilities/:id
// --------------------------------------------------

router.get(
  '/:id',
  getFacilityById
);

// --------------------------------------------------
// CREATE FACILITY
// POST /api/admin/facilities
// --------------------------------------------------

router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createFacility
);

// --------------------------------------------------
// UPDATE FACILITY
// PUT /api/admin/facilities/:id
// --------------------------------------------------

router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateFacility
);

// --------------------------------------------------
// UPDATE FACILITY ACTIVE STATUS
// PATCH /api/admin/facilities/:id/status
// --------------------------------------------------

router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateFacilityStatus
);

module.exports = router;