const express = require('express');

const {
  getAllOpeningHours,
  getOpeningHoursById,
  createOpeningHours,
  updateOpeningHours,
  deleteOpeningHours
} = require('./openingHoursAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const {
  requireRole
} = require('../../middleware/requireRole');

const router = express.Router();

// --------------------------------------------------
// All opening-hours admin routes require authentication
// --------------------------------------------------

router.use(authMiddleware);

// --------------------------------------------------
// GET ALL OPENING HOURS
// GET /api/admin/opening-hours
// --------------------------------------------------

router.get(
  '/',
  getAllOpeningHours
);

// --------------------------------------------------
// GET ONE OPENING HOURS RECORD
// GET /api/admin/opening-hours/:id
// --------------------------------------------------

router.get(
  '/:id',
  getOpeningHoursById
);

// --------------------------------------------------
// CREATE OPENING HOURS
// POST /api/admin/opening-hours
// --------------------------------------------------

router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createOpeningHours
);

// --------------------------------------------------
// UPDATE OPENING HOURS
// PUT /api/admin/opening-hours/:id
// --------------------------------------------------

router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateOpeningHours
);

// --------------------------------------------------
// DELETE OPENING HOURS
// DELETE /api/admin/opening-hours/:id
// --------------------------------------------------

router.delete(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  deleteOpeningHours
);

module.exports = router;