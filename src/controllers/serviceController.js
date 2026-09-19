const supabase = require('../config/supabase');
const { getOpeningHoursStatus } = require('../utils/openingHoursStatus');

const serviceController = {
  // Get all public and active services
  async getServices(req, res) {
    try {
      console.log('SERVICE QUERY:', req.query);

      const {
        building_id,
        department_id,
        office_id
      } = req.query;

      let query = supabase
        .from('services')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true);

      // Filter by building
      if (building_id) {
        query = query.eq('building_id', building_id);
      }

      // Filter by department
      if (department_id) {
        query = query.eq('department_id', department_id);
      }

      // Filter by office
      if (office_id) {
        query = query.eq('office_id', office_id);
      }

      const { data, error } = await query.order('name_en', {
        ascending: true
      });

      if (error) {
        console.error('Error fetching services:', error);

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch services.'
        });
      }

      return res.json({
        success: true,
        data: data || []
      });

    } catch (err) {
      console.error('Error fetching services:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Get a single service by ID
  async getServiceById(req, res) {
    try {
      const { id } = req.params;

      // --------------------------------------------------
      // 1. Get service + department + office + floor
      // --------------------------------------------------

      const { data: service, error: serviceError } =
        await supabase
          .from('services')
          .select('*, departments(*), offices(*, floors(*))')
          .eq('id', id)
          .eq('is_public', true)
          .eq('is_active', true)
          .single();

      if (serviceError || !service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found or unavailable.'
        });
      }

      // --------------------------------------------------
      // 2. Get building
      // --------------------------------------------------

      let building = null;

      if (service.building_id) {
        const {
          data: buildingData,
          error: buildingError
        } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', service.building_id)
          .single();

        if (buildingError) {
          console.error(
            'Error fetching service building:',
            buildingError
          );
        }

        building = buildingData || null;
      }

      // --------------------------------------------------
      // 3. Get service-specific opening hours
      // --------------------------------------------------

      const {
        data: openingHours,
        error: openingHoursError
      } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('service_id', id)
        .order('day_of_week', {
          ascending: true
        });

      if (openingHoursError) {
        console.error(
          'Error fetching service opening hours:',
          openingHoursError
        );

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch service opening hours.'
        });
      }

      const hours = openingHours || [];

      // --------------------------------------------------
      // 4. Calculate schedule-based status
      // --------------------------------------------------

      const scheduleStatus = getOpeningHoursStatus(hours);

      // --------------------------------------------------
      // 5. Determine the visitor-facing current status
      //
      // Manual CLOSED or TEMPORARILY_UNAVAILABLE status
      // takes priority over the opening-hours schedule.
      //
      // Manual OPEN does NOT force the service to appear
      // open if the schedule says it is currently closed.
      // --------------------------------------------------

      let currentStatus;

      if (service.status === 'temporarily_unavailable') {
        currentStatus = {
          status: 'temporarily_unavailable',
          label: 'Temporarily Unavailable',
          source: 'manual'
        };
      } else if (service.status === 'closed') {
        currentStatus = {
          status: 'closed',
          label: 'Closed',
          source: 'manual'
        };
      } else {
        currentStatus = {
          ...scheduleStatus,
          source: 'schedule'
        };
      }

      // --------------------------------------------------
      // 6. Return complete service information
      // --------------------------------------------------

      return res.json({
        success: true,

        data: {
          ...service,

          // Related information
          building,

          department: service.departments || null,

          office: service.offices || null,

          floor:
            service.offices && service.offices.floors
              ? service.offices.floors
              : null,

          // Opening hours
          opening_hours: hours,

          // Keep the database/manual status available
          manual_status: service.status || null,

          // Single effective status for visitors
          current_status: currentStatus
        }
      });

    } catch (err) {
      console.error('Error fetching service:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = serviceController;