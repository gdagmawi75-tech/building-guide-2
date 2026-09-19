const express = require('express');

const router = express.Router();

const feedbackController = require('../../controllers/admin/feedbackController');

const { authMiddleware } =
  require('../../middleware/authMiddleware');

const { requireRole } =
  require('../../middleware/requireRole');

// Every admin feedback endpoint requires authentication.
router.use(authMiddleware);

// View feedback
router.get(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'feedback_manager',
    'floor_manager'
  ]),
  feedbackController.getAllFeedback
);

// View one feedback item
router.get(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'feedback_manager',
    'floor_manager'
  ]),
  feedbackController.getFeedbackById
);

// Change feedback status
router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'feedback_manager'
  ]),
  feedbackController.updateFeedbackStatus
);

module.exports = router;