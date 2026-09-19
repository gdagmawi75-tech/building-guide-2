const supabase = require('../config/supabase');

const employeeController = {
  // Get all public active employees
  async getEmployees(req, res) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch employees.'
        });
      }

      return res.json({
        success: true,
        data: data || []
      });
    } catch (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Get one employee
  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;

      const { data: employee, error: eError } = await supabase
        .from('employees')
        .select('*, departments(*), offices(*, floors(*))')
        .eq('id', id)
        .eq('is_public', true)
        .eq('is_active', true)
        .single();

      if (eError || !employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee record not found or private.'
        });
      }

      let building = null;
      const bId =
        employee.building_id ||
        (employee.offices ? employee.offices.building_id : null);

      if (bId) {
        const { data: bData } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', bId)
          .single();

        building = bData || null;
      }

      return res.json({
        success: true,
        data: {
          ...employee,
          building,
          department: employee.departments || null,
          office: employee.offices || null,
          floor:
            employee.offices && employee.offices.floors
              ? employee.offices.floors
              : null
        }
      });
    } catch (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = employeeController;