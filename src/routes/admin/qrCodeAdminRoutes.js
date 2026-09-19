const express = require('express');
const router = express.Router();

const qrCodeController =
  require('../../controllers/admin/qrCodeAdminController');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

router.use(authMiddleware);

// Get all QR codes
router.get(
  '/',
  qrCodeController.getAllQRCodes
);

// Get one QR code
router.get(
  '/:id',
  qrCodeController.getQRCodeById
);

// Create QR code
router.post(
  '/',
  qrCodeController.createQRCode
);

// Update QR code
router.put(
  '/:id',
  qrCodeController.updateQRCode
);

// Activate / deactivate QR code
router.patch(
  '/:id/status',
  qrCodeController.updateQRCodeStatus
);

// Delete QR code
router.delete(
  '/:id',
  qrCodeController.deleteQRCode
);

module.exports = router;