const supabase = require('../config/supabase');

// Get all buildings
const getBuildings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*');

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get a single building by ID
const getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get building
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();

    if (buildingError) throw buildingError;

    // Get building opening hours
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('building_id', id)
      .order('day_of_week', {
        ascending: true
      });

    if (openingHoursError) throw openingHoursError;

    res.json({
      success: true,
      data: {
        ...building,
        opening_hours: openingHours || []
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getBuildings,
  getBuildingById
};