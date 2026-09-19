const supabase = require('../config/supabase');

const facilityController = {
  // Get all public and active facilities
  async getFacilities(req, res) {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      if (error) {
        console.error('Error fetching facilities:', error);

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch facilities.'
        });
      }

      return res.json({
        success: true,
        data: data || []
      });
    } catch (err) {
      console.error('Error fetching facilities:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Get a single facility by ID
  async getFacilityById(req, res) {
    try {
      const { id } = req.params;

      const { data: facility, error: fError } = await supabase
        .from('facilities')
        .select('*, floors(*)')
        .eq('id', id)
        .eq('is_public', true)
        .eq('is_active', true)
        .single();

      if (fError || !facility) {
        return res.status(404).json({
          success: false,
          error: 'Facility not found or unavailable.'
        });
      }

      let building = null;

      if (facility.building_id) {
        const { data: bData } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', facility.building_id)
          .single();

        building = bData || null;
      }

      // Fetch opening hours for the facility
      const { data: openingHours } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('facility_id', id);

      return res.json({
        success: true,
        data: {
          ...facility,
          building,
          floor: facility.floors || null,
          opening_hours: openingHours || []
        }
      });
    } catch (err) {
      console.error('Error fetching facility:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = facilityController;