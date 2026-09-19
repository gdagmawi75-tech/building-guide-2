const express = require('express');

const {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement
} = require('./announcementAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const {
  requireRole
} = require('../../middleware/requireRole');

const router = express.Router();

// --------------------------------------------------
// ALL ANNOUNCEMENT ADMIN ROUTES REQUIRE AUTHENTICATION
// --------------------------------------------------

router.use(authMiddleware);

// --------------------------------------------------
// GET ALL ANNOUNCEMENTS
// GET /api/admin/announcements
// --------------------------------------------------

router.get(
  '/',
  getAllAnnouncements
);

// --------------------------------------------------
// GET ONE ANNOUNCEMENT
// GET /api/admin/announcements/:id
// --------------------------------------------------

router.get(
  '/:id',
  getAnnouncementById
);

// --------------------------------------------------
// CREATE ANNOUNCEMENT
// POST /api/admin/announcements
// --------------------------------------------------

router.post(
  '/',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  createAnnouncement
);

// --------------------------------------------------
// UPDATE ANNOUNCEMENT
// PUT /api/admin/announcements/:id
// --------------------------------------------------

router.put(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateAnnouncement
);

// --------------------------------------------------
// UPDATE ANNOUNCEMENT STATUS
// PATCH /api/admin/announcements/:id/status
// --------------------------------------------------

router.patch(
  '/:id/status',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  updateAnnouncementStatus
);

// --------------------------------------------------
// DELETE ANNOUNCEMENT
// DELETE /api/admin/announcements/:id
// --------------------------------------------------

router.delete(
  '/:id',
  requireRole([
    'super_admin',
    'building_manager',
    'content_manager'
  ]),
  deleteAnnouncement
);

module.exports = router;