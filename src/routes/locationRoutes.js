const express = require('express');
const router = express.Router();
const { 
  getFloors, 
  getFloorById, 
  getOffices, 
  getOfficeById 
} = require('../controllers/locationController');

router.get('/floors', getFloors);
router.get('/floors/:id', getFloorById);
router.get('/offices', getOffices);
router.get('/offices/:id', getOfficeById);

module.exports = router;