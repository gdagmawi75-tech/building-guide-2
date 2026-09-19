const supabase = require('../config/supabase');

const departmentController = {
  // Get all departments
  async getDepartments(req, res) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name_en', { ascending: true });

      if (error) {
        console.error('Error fetching departments:', error);

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch departments.'
        });
      }

      return res.json({
        success: true,
        data: data || []
      });
    } catch (err) {
      console.error('Error fetching departments:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Get one department
  async getDepartmentById(req, res) {
    try {
      const { id } = req.params;

      console.log('DEPARTMENT ID RECEIVED BY EXPRESS:', id);

      // ==========================================
      // 1. GET DEPARTMENT
      // ==========================================
      const {
        data: department,
        error: deptError
      } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('is_public', true)
        .single();

      if (deptError || !department) {
        console.error('Department error:', deptError);

        return res.status(404).json({
          success: false,
          error: 'Department not found.'
        });
      }

      // ==========================================
      // 2. GET BUILDING
      // ==========================================
      let building = null;

      if (department.building_id) {
        const {
          data: buildingData,
          error: buildingError
        } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', department.building_id)
          .eq('is_active', true)
          .single();

        if (buildingError) {
          console.error('Building error:', buildingError);
        } else {
          building = buildingData;
        }
      }

      // ==========================================
      // 3. GET OFFICES
      // ==========================================
      const {
        data: offices,
        error: officesError
      } = await supabase
        .from('offices')
        .select(`
          id,
          building_id,
          floor_id,
          department_id,
          office_number,
          name_en,
          name_am,
          name_om,
          description_en,
          description_am,
          description_om,
          phone,
          email,
          status,
          is_public,
          is_active
        `)
        .eq('department_id', id)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('office_number', { ascending: true });

      console.log('OFFICES QUERY RESULT:', offices);
      console.log('OFFICES QUERY ERROR:', officesError);

      if (officesError) {
        return res.status(500).json({
          success: false,
          error: officesError.message,
          details: officesError.details,
          hint: officesError.hint,
          code: officesError.code
        });
      }

      // ==========================================
      // 4. GET SERVICES
      // ==========================================
      const {
        data: services,
        error: servicesError
      } = await supabase
        .from('services')
        .select(`
          id,
          building_id,
          department_id,
          office_id,
          name_en,
          name_am,
          name_om,
          description_en,
          description_am,
          description_om,
          requirements_en,
          requirements_am,
          requirements_om,
          fees_en,
          fees_am,
          fees_om,
          processing_info_en,
          processing_info_am,
          processing_info_om,
          phone,
          email,
          status,
          is_public,
          is_active
        `)
        .eq('department_id', id)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      console.log('SERVICES QUERY RESULT:', services);
      console.log('SERVICES QUERY ERROR:', servicesError);

      // ==========================================
      // 5. GET PUBLIC EMPLOYEES
      // ==========================================
      const {
        data: employees,
        error: employeesError
      } = await supabase
        .from('employees')
        .select(`
          id,
          building_id,
          department_id,
          office_id,
          first_name,
          middle_name,
          last_name,
          position_en,
          position_am,
          position_om,
          phone,
          email,
          is_public,
          is_active
        `)
        .eq('department_id', id)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      console.log('EMPLOYEES QUERY RESULT:', employees);
      console.log('EMPLOYEES QUERY ERROR:', employeesError);

      // ==========================================
      // 6. RETURN DEPARTMENT DATA
      // ==========================================
      return res.json({
        success: true,
        data: {
          ...department,
          building,
          offices: offices || [],
          services: services || [],
          employees: employees || []
        }
      });

    } catch (err) {
      console.error('Error fetching department:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = departmentController;