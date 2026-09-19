const express = require('express');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/requireRole');
const { requireBuildingScope } = require('../../middleware/requireBuildingScope');
const { requireFloorScope } = require('../../middleware/requireFloorScope');

const router = express.Router();

// 1. Building scope test endpoint
router.get('/building/:building_id', authMiddleware, requireBuildingScope('building_id'), (req, res) => {
  return res.json({
    authorized: true,
    admin_role: req.admin.role,
    admin_building_id: req.admin.building_id,
    requested_building_id: req.params.building_id,
    scoped_building_id: req.scopedBuildingId
  });
});

// 2. Floor scope test endpoint
router.get('/floor/:floor_id', authMiddleware, requireFloorScope('floor_id'), (req, res) => {
  return res.json({
    authorized: true,
    admin_role: req.admin.role,
    admin_building_id: req.admin.building_id,
    requested_floor_id: req.params.floor_id,
    assigned_floor_ids: req.assignedFloorIds
  });
});

// 3. Role-specific test endpoint
router.get('/role/:role', authMiddleware, requireRole(['super_admin', 'building_manager', 'floor_manager', 'content_manager', 'feedback_manager']), (req, res) => {
  return res.json({
    authorized: true,
    admin_role: req.admin.role
  });
});

module.exports = router;