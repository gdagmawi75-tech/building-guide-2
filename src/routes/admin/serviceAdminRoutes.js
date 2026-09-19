const express = require('express');

const router = express.Router();

const serviceAdminController =
  require('../../controllers/admin/serviceAdminController');

const { authMiddleware } =
  require('../../middleware/authMiddleware');

const { requireRole } =
  require('../../middleware/requireRole');

// All admin service endpoints require authentication.
router.use(authMiddleware);

// -----------------------------------------
// GET /api/admin/services
// -----------------------------------------
router.get(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager',
    'floor_manager'
  ]),
  serviceAdminController.getAllServices
);

// -----------------------------------------
// GET /api/admin/services/:id
// -----------------------------------------
router.get(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager',
    'floor_manager'
  ]),
  serviceAdminController.getServiceById
);

// -----------------------------------------
// POST /api/admin/services
// -----------------------------------------
router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  serviceAdminController.createService
);

// -----------------------------------------
// PUT /api/admin/services/:id
// -----------------------------------------
router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  serviceAdminController.updateService
);

// -----------------------------------------
// PATCH /api/admin/services/:id/status
// -----------------------------------------
router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  serviceAdminController.updateServiceStatus
);

module.exports = router;