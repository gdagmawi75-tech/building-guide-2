const express = require('express');

const router = express.Router();

const announcementController = require('../controllers/announcementController');

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);

module.exports = router;