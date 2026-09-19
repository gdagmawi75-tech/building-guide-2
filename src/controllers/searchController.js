const supabase = require('../config/supabase');

const searchController = {
  async search(req, res) {
    try {
      const { q, building_id } = req.query;

      // Validate search query
      if (!q || !q.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required.'
        });
      }

      const searchTerm = q.trim();
      const pattern = `%${searchTerm}%`;

      // Search offices
      let officesQuery = supabase
        .from('offices')
        .select(
          'id, building_id, floor_id, department_id, office_number, name_en, name_am, name_om, status'
        )
        .eq('is_public', true)
        .eq('is_active', true)
        .or(
          `name_en.ilike.${pattern},name_am.ilike.${pattern},name_om.ilike.${pattern},office_number.ilike.${pattern},description_en.ilike.${pattern},description_am.ilike.${pattern},description_om.ilike.${pattern}`
        );

      if (building_id) {
        officesQuery = officesQuery.eq('building_id', building_id);
      }

      // Search services
      let servicesQuery = supabase
        .from('services')
        .select(
          'id, building_id, department_id, office_id, name_en, name_am, name_om, status'
        )
        .eq('is_public', true)
        .eq('is_active', true)
        .or(
          `name_en.ilike.${pattern},name_am.ilike.${pattern},name_om.ilike.${pattern},description_en.ilike.${pattern},description_am.ilike.${pattern},description_om.ilike.${pattern}`
        );

      if (building_id) {
        servicesQuery = servicesQuery.eq('building_id', building_id);
      }

      // Search employees
      let employeesQuery = supabase
        .from('employees')
        .select(
          'id, building_id, department_id, office_id, first_name, middle_name, last_name, position_en, position_am, position_om'
        )
        .eq('is_public', true)
        .eq('is_active', true)
        .or(
          `first_name.ilike.${pattern},middle_name.ilike.${pattern},last_name.ilike.${pattern},position_en.ilike.${pattern},position_am.ilike.${pattern},position_om.ilike.${pattern}`
        );

      if (building_id) {
        employeesQuery = employeesQuery.eq('building_id', building_id);
      }

      // Search departments
      let departmentsQuery = supabase
        .from('departments')
        .select(
          'id, building_id, name_en, name_am, name_om'
        )
        .eq('is_public', true)
        .eq('is_active', true)
        .or(
          `name_en.ilike.${pattern},name_am.ilike.${pattern},name_om.ilike.${pattern},description_en.ilike.${pattern},description_am.ilike.${pattern},description_om.ilike.${pattern}`
        );

      if (building_id) {
        departmentsQuery = departmentsQuery.eq('building_id', building_id);
      }

      // Search facilities
      let facilitiesQuery = supabase
        .from('facilities')
        .select(
          'id, building_id, floor_id, name_en, name_am, name_om'
        )
        .eq('is_public', true)
        .eq('is_active', true)
        .or(
          `name_en.ilike.${pattern},name_am.ilike.${pattern},name_om.ilike.${pattern},description_en.ilike.${pattern},description_am.ilike.${pattern},description_om.ilike.${pattern}`
        );

      if (building_id) {
        facilitiesQuery = facilitiesQuery.eq('building_id', building_id);
      }

      // Run all searches in parallel
      const [
        officesResult,
        servicesResult,
        employeesResult,
        departmentsResult,
        facilitiesResult
      ] = await Promise.all([
        officesQuery,
        servicesQuery,
        employeesQuery,
        departmentsQuery,
        facilitiesQuery
      ]);

      // Check for database errors
      const results = [
        officesResult,
        servicesResult,
        employeesResult,
        departmentsResult,
        facilitiesResult
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        console.error('Search error:', failedResult.error);

        return res.status(500).json({
          success: false,
          error: 'Failed to perform search.'
        });
      }

      // Convert offices into clean search results
      const offices = (officesResult.data || []).map((office) => ({
        type: 'office',
        id: office.id,
        title: office.name_en,
        title_am: office.name_am,
        title_om: office.name_om,
        subtitle: `Office ${office.office_number}`,
        floor_id: office.floor_id,
        department_id: office.department_id,
        status: office.status
      }));

      // Convert services into clean search results
      const services = (servicesResult.data || []).map((service) => ({
        type: 'service',
        id: service.id,
        title: service.name_en,
        title_am: service.name_am,
        title_om: service.name_om,
        subtitle: 'Service',
        department_id: service.department_id,
        office_id: service.office_id,
        status: service.status
      }));

      // Convert employees into clean search results
      const employees = (employeesResult.data || []).map((employee) => ({
        type: 'employee',
        id: employee.id,
        title: [
          employee.first_name,
          employee.middle_name,
          employee.last_name
        ]
          .filter(Boolean)
          .join(' '),
        subtitle: employee.position_en || 'Employee',
        subtitle_am: employee.position_am,
        subtitle_om: employee.position_om,
        department_id: employee.department_id,
        office_id: employee.office_id
      }));

      // Convert departments into clean search results
      const departments = (departmentsResult.data || []).map((department) => ({
        type: 'department',
        id: department.id,
        title: department.name_en,
        title_am: department.name_am,
        title_om: department.name_om,
        subtitle: 'Department'
      }));

      // Convert facilities into clean search results
      const facilities = (facilitiesResult.data || []).map((facility) => ({
        type: 'facility',
        id: facility.id,
        title: facility.name_en,
        title_am: facility.name_am,
        title_om: facility.name_om,
        subtitle: 'Facility',
        floor_id: facility.floor_id
      }));

      const data = {
        offices,
        services,
        employees,
        departments,
        facilities
      };

      const totalResults =
        offices.length +
        services.length +
        employees.length +
        departments.length +
        facilities.length;

      return res.json({
        success: true,
        query: searchTerm,
        total_results: totalResults,
        data
      });
    } catch (err) {
      console.error('Error performing search:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = searchController;