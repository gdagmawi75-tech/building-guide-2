const express = require('express');

const router = express.Router();

const analyticsController =
  require('../../controllers/admin/analyticsAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const {
  requireRole
} = require('../../middleware/requireRole');

router.use(authMiddleware);

router.get(
  '/',
  requireRole([
    'super_admin',
    'building_manager'
  ]),
  analyticsController.getAnalytics
);

module.exports = router;
