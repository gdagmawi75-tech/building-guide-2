const express = require('express');
const router = express.Router();
const { getBuildings, getBuildingById } = require('../controllers/buildingController');
const { getFloors } = require('../controllers/locationController');

router.get('/', getBuildings);
router.get('/:id', getBuildingById);

router.get('/:id/floors', async (req, res, next) => {
  req.query.building_id = req.params.id;
  return getFloors(req, res, next);
});

module.exports = router;