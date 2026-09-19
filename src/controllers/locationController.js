const supabase = require('../config/supabase');

// Get all floors (can filter by building_id query param)
const getFloors = async (req, res) => {
  try {
    const { building_id } = req.query;

    let query = supabase
      .from('floors')
      .select('*');

    if (building_id) {
      query = query.eq('building_id', building_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('Error fetching floors:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get a single floor by ID
const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error fetching floor:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all offices
// Can filter by building_id, floor_id, and department_id
const getOffices = async (req, res) => {
  try {
    const {
      building_id,
      floor_id,
      department_id
    } = req.query;

    let query = supabase
      .from('offices')
      .select('*, departments(*)');

    // Filter by building
    if (building_id) {
      query = query.eq('building_id', building_id);
    }

    // Filter by floor
    if (floor_id) {
      query = query.eq('floor_id', floor_id);
    }

    // Filter by department
    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('Error fetching offices:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get a single office by ID
const getOfficeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get office and department
    const { data: office, error: officeError } = await supabase
      .from('offices')
      .select('*, departments(*)')
      .eq('id', id)
      .single();

    if (officeError) throw officeError;

    // Get office-specific opening hours
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('office_id', id)
      .order('day_of_week', {
        ascending: true
      });

    if (openingHoursError) throw openingHoursError;

    res.json({
      success: true,
      data: {
        ...office,
        opening_hours: openingHours || []
      }
    });

  } catch (err) {
    console.error('Error fetching office:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getFloors,
  getFloorById,
  getOffices,
  getOfficeById
};