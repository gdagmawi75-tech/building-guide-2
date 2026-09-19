const supabase = require('../../config/supabase');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MANAGEABLE_ROLES = [
  'super_admin',
  'building_manager',
  'content_manager'
];

const VIEWABLE_ROLES = [
  'super_admin',
  'building_manager',
  'content_manager',
  'floor_manager'
];

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    UUID_REGEX.test(value)
  );
}

function canManageEmployees(role) {
  return MANAGEABLE_ROLES.includes(role);
}

function canViewEmployees(role) {
  return VIEWABLE_ROLES.includes(role);
}

function getRequiredText(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

// --------------------------------------------------
// Verify building exists
// --------------------------------------------------

async function getBuilding(buildingId) {
  const { data, error } = await supabase
    .from('buildings')
    .select('id')
    .eq('id', buildingId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// --------------------------------------------------
// Verify department exists and belongs to building
// --------------------------------------------------

async function getDepartment(
  departmentId,
  buildingId
) {
  if (!departmentId) {
    return null;
  }

  const { data, error } = await supabase
    .from('departments')
    .select('id, building_id')
    .eq('id', departmentId)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.building_id !== buildingId) {
    return {
      crossBuilding: true
    };
  }

  return data;
}

// --------------------------------------------------
// Verify office exists and belongs to building
// --------------------------------------------------

async function getOffice(
  officeId,
  buildingId
) {
  if (!officeId) {
    return null;
  }

  const { data, error } = await supabase
    .from('offices')
    .select(`
      id,
      building_id,
      floor_id,
      department_id,
      floors (
        id,
        building_id
      )
    `)
    .eq('id', officeId)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.building_id !== buildingId) {
    return {
      crossBuilding: true
    };
  }

  if (
    !data.floors ||
    data.floors.building_id !== buildingId
  ) {
    return {
      crossBuilding: true
    };
  }

  return data;
}

// --------------------------------------------------
// Get assigned floor IDs
// --------------------------------------------------

async function getAssignedFloorIds(adminId) {
  const { data, error } = await supabase
    .from('admin_floor_assignments')
    .select('floor_id')
    .eq('admin_id', adminId);

  if (error) {
    throw new Error(
      'Failed to verify floor assignments.'
    );
  }

  return (data || []).map(
    (assignment) => assignment.floor_id
  );
}

// --------------------------------------------------
// Check whether office is on an assigned floor
// --------------------------------------------------

async function isOfficeOnAssignedFloor(
  officeId,
  assignedFloorIds
) {
  if (!officeId) {
    return false;
  }

  if (
    !Array.isArray(assignedFloorIds) ||
    assignedFloorIds.length === 0
  ) {
    return false;
  }

  const { data, error } = await supabase
    .from('offices')
    .select('id, floor_id')
    .eq('id', officeId)
    .single();

  if (error || !data) {
    return false;
  }

  return assignedFloorIds.includes(
    data.floor_id
  );
}

// --------------------------------------------------
// GET ALL EMPLOYEES
// GET /api/admin/employees
// --------------------------------------------------

async function getAllEmployees(req, res) {
  try {
    const role = req.admin.role;

    if (!canViewEmployees(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to view employees.'
      });
    }

    const {
      building_id,
      department_id,
      office_id,
      is_public,
      is_active
    } = req.query;

    // ------------------------------------------------
    // SUPER ADMIN
    // ------------------------------------------------

    if (role === 'super_admin') {
      let query = supabase
        .from('employees')
        .select('*')
        .order('last_name', {
          ascending: true
        })
        .order('first_name', {
          ascending: true
        });

      if (building_id) {
        if (!isValidUUID(building_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid building_id.'
          });
        }

        query = query.eq(
          'building_id',
          building_id
        );
      }

      if (department_id) {
        if (!isValidUUID(department_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department_id.'
          });
        }

        query = query.eq(
          'department_id',
          department_id
        );
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid office_id.'
          });
        }

        query = query.eq(
          'office_id',
          office_id
        );
      }

      if (is_public !== undefined) {
        if (
          is_public !== 'true' &&
          is_public !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_public must be true or false.'
          });
        }

        query = query.eq(
          'is_public',
          is_public === 'true'
        );
      }

      if (is_active !== undefined) {
        if (
          is_active !== 'true' &&
          is_active !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_active must be true or false.'
          });
        }

        query = query.eq(
          'is_active',
          is_active === 'true'
        );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching admin employees:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch employees.'
        });
      }

      return res.json({
        success: true,
        total: data?.length || 0,
        data: data || []
      });
    }

    // ------------------------------------------------
    // BUILDING / CONTENT MANAGER
    // ------------------------------------------------

    if (
      role === 'building_manager' ||
      role === 'content_manager'
    ) {
      if (!req.admin.building_id) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: No building assignment found.'
        });
      }

      let query = supabase
        .from('employees')
        .select('*')
        .eq(
          'building_id',
          req.admin.building_id
        )
        .order('last_name', {
          ascending: true
        })
        .order('first_name', {
          ascending: true
        });

      if (department_id) {
        if (!isValidUUID(department_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department_id.'
          });
        }

        query = query.eq(
          'department_id',
          department_id
        );
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid office_id.'
          });
        }

        query = query.eq(
          'office_id',
          office_id
        );
      }

      if (is_public !== undefined) {
        if (
          is_public !== 'true' &&
          is_public !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_public must be true or false.'
          });
        }

        query = query.eq(
          'is_public',
          is_public === 'true'
        );
      }

      if (is_active !== undefined) {
        if (
          is_active !== 'true' &&
          is_active !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_active must be true or false.'
          });
        }

        query = query.eq(
          'is_active',
          is_active === 'true'
        );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching scoped admin employees:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch employees.'
        });
      }

      return res.json({
        success: true,
        total: data?.length || 0,
        data: data || []
      });
    }

    // ------------------------------------------------
    // FLOOR MANAGER
    // ------------------------------------------------

    if (role === 'floor_manager') {
      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      if (assignedFloorIds.length === 0) {
        return res.json({
          success: true,
          total: 0,
          data: []
        });
      }

      let candidateQuery = supabase
        .from('employees')
        .select('*')
        .not('office_id', 'is', null)
        .order('last_name', {
          ascending: true
        })
        .order('first_name', {
          ascending: true
        });

      if (req.admin.building_id) {
        candidateQuery =
          candidateQuery.eq(
            'building_id',
            req.admin.building_id
          );
      }

      const {
        data: candidates,
        error: candidateError
      } = await candidateQuery;

      if (candidateError) {
        console.error(
          'Error fetching Floor Manager employees:',
          candidateError
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch employees.'
        });
      }

      let visibleEmployees = [];

      for (const employee of candidates || []) {
        const allowed =
          await isOfficeOnAssignedFloor(
            employee.office_id,
            assignedFloorIds
          );

        if (allowed) {
          visibleEmployees.push(employee);
        }
      }

      if (department_id) {
        if (!isValidUUID(department_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department_id.'
          });
        }

        visibleEmployees =
          visibleEmployees.filter(
            (employee) =>
              employee.department_id ===
              department_id
          );
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid office_id.'
          });
        }

        visibleEmployees =
          visibleEmployees.filter(
            (employee) =>
              employee.office_id === office_id
          );
      }

      if (is_public !== undefined) {
        if (
          is_public !== 'true' &&
          is_public !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_public must be true or false.'
          });
        }

        const publicValue =
          is_public === 'true';

        visibleEmployees =
          visibleEmployees.filter(
            (employee) =>
              employee.is_public ===
              publicValue
          );
      }

      if (is_active !== undefined) {
        if (
          is_active !== 'true' &&
          is_active !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_active must be true or false.'
          });
        }

        const activeValue =
          is_active === 'true';

        visibleEmployees =
          visibleEmployees.filter(
            (employee) =>
              employee.is_active ===
              activeValue
          );
      }

      return res.json({
        success: true,
        total: visibleEmployees.length,
        data: visibleEmployees
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden.'
    });

  } catch (err) {
    console.error(
      'Admin employees list error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// GET ONE EMPLOYEE
// GET /api/admin/employees/:id
// --------------------------------------------------

async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID.'
      });
    }

    const {
      data: employee,
      error
    } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found.'
      });
    }

    // Building/content scope
    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        employee.building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Building scope violation.'
        });
      }
    }

    // Floor manager scope
    if (
      req.admin.role === 'floor_manager'
    ) {
      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      const allowed =
        await isOfficeOnAssignedFloor(
          employee.office_id,
          assignedFloorIds
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Employee is not on an assigned floor.'
        });
      }
    }

    return res.json({
      success: true,
      data: employee
    });

  } catch (err) {
    console.error(
      'Admin employee detail error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// CREATE EMPLOYEE
// POST /api/admin/employees
// --------------------------------------------------

async function createEmployee(req, res) {
  try {
    const role = req.admin.role;

    if (!canManageEmployees(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to create employees.'
      });
    }

    const {
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
    } = req.body;

    // ------------------------------------------------
    // BUILDING
    // ------------------------------------------------

    if (!isValidUUID(building_id)) {
      return res.status(400).json({
        success: false,
        error:
          'Valid building_id is required.'
      });
    }

    if (role !== 'super_admin') {
      if (
        !req.admin.building_id ||
        req.admin.building_id !==
          building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Cannot create an employee for another building.'
        });
      }
    }

    // ------------------------------------------------
    // REQUIRED NAME
    // ------------------------------------------------

    if (!getRequiredText(first_name)) {
      return res.status(400).json({
        success: false,
        error:
          'Required field first_name is missing or invalid.'
      });
    }

    // ------------------------------------------------
    // BOOLEAN VALIDATION
    // ------------------------------------------------

    if (
      is_public !== undefined &&
      typeof is_public !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_public must be a boolean.'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    // ------------------------------------------------
    // VERIFY BUILDING
    // ------------------------------------------------

    const building =
      await getBuilding(
        building_id
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found.'
      });
    }

    // ------------------------------------------------
    // VERIFY DEPARTMENT
    // ------------------------------------------------

    if (
      department_id !== undefined &&
      department_id !== null &&
      department_id !== ''
    ) {
      if (!isValidUUID(department_id)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid department_id.'
        });
      }

      const department =
        await getDepartment(
          department_id,
          building_id
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          error:
            'Department not found.'
        });
      }

      if (department.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Department belongs to another building.'
        });
      }
    }

    // ------------------------------------------------
    // VERIFY OFFICE
    // ------------------------------------------------

    if (
      office_id !== undefined &&
      office_id !== null &&
      office_id !== ''
    ) {
      if (!isValidUUID(office_id)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid office_id.'
        });
      }

      const office =
        await getOffice(
          office_id,
          building_id
        );

      if (!office) {
        return res.status(404).json({
          success: false,
          error:
            'Office not found.'
        });
      }

      if (office.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Office belongs to another building.'
        });
      }
    }

    // ------------------------------------------------
    // CREATE
    // ------------------------------------------------

    const newEmployee = {
      building_id,

      department_id:
        department_id || null,

      office_id:
        office_id || null,

      first_name:
        first_name.trim(),

      middle_name:
        middle_name !== undefined &&
        middle_name !== null
          ? middle_name
          : null,

      last_name:
        last_name !== undefined &&
        last_name !== null
          ? last_name
          : null,

      position_en:
        position_en !== undefined
          ? position_en
          : null,

      position_am:
        position_am !== undefined
          ? position_am
          : null,

      position_om:
        position_om !== undefined
          ? position_om
          : null,

      phone:
        phone !== undefined
          ? phone
          : null,

      email:
        email !== undefined
          ? email
          : null,

      is_public:
        is_public !== undefined
          ? is_public
          : false,

      is_active:
        is_active !== undefined
          ? is_active
          : true
    };

    const {
      data,
      error
    } = await supabase
      .from('employees')
      .insert([newEmployee])
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error creating admin employee:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to create employee.'
      });
    }

    return res.status(201).json({
      success: true,
      message:
        'Employee created successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin employee create error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// UPDATE EMPLOYEE
// PUT /api/admin/employees/:id
// --------------------------------------------------

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const role = req.admin.role;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID.'
      });
    }

    if (!canManageEmployees(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to update employees.'
      });
    }

    const {
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
    } = req.body;

    // ------------------------------------------------
    // EXISTING EMPLOYEE
    // ------------------------------------------------

    const {
      data: existingEmployee,
      error: existingError
    } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingEmployee
    ) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found.'
      });
    }

    // Building scope check
    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingEmployee.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Employee is outside your building.'
      });
    }

    // ------------------------------------------------
    // FINAL BUILDING
    // ------------------------------------------------

    const finalBuildingId =
      building_id !== undefined
        ? building_id
        : existingEmployee.building_id;

    if (!isValidUUID(finalBuildingId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid building_id.'
      });
    }

    if (role !== 'super_admin') {
      if (
        finalBuildingId !==
        req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Cannot move employee to another building.'
        });
      }
    }

    // ------------------------------------------------
    // REQUIRED NAME
    // ------------------------------------------------

    if (
      first_name !== undefined &&
      !getRequiredText(first_name)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'first_name must be a non-empty string.'
      });
    }

    // ------------------------------------------------
    // BOOLEANS
    // ------------------------------------------------

    if (
      is_public !== undefined &&
      typeof is_public !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_public must be a boolean.'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    // ------------------------------------------------
    // VERIFY BUILDING
    // ------------------------------------------------

    const building =
      await getBuilding(
        finalBuildingId
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found.'
      });
    }

    // ------------------------------------------------
    // FINAL DEPARTMENT
    // ------------------------------------------------

    const finalDepartmentId =
      department_id !== undefined
        ? department_id
        : existingEmployee.department_id;

    if (finalDepartmentId) {
      if (!isValidUUID(finalDepartmentId)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid department_id.'
        });
      }

      const department =
        await getDepartment(
          finalDepartmentId,
          finalBuildingId
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          error:
            'Department not found.'
        });
      }

      if (department.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Department belongs to another building.'
        });
      }
    }

    // ------------------------------------------------
    // FINAL OFFICE
    // ------------------------------------------------

    const finalOfficeId =
      office_id !== undefined
        ? office_id
        : existingEmployee.office_id;

    if (finalOfficeId) {
      if (!isValidUUID(finalOfficeId)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid office_id.'
        });
      }

      const office =
        await getOffice(
          finalOfficeId,
          finalBuildingId
        );

      if (!office) {
        return res.status(404).json({
          success: false,
          error:
            'Office not found.'
        });
      }

      if (office.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Office belongs to another building.'
        });
      }

      if (office.department_id) {
        const officeDepartment =
          await getDepartment(
            office.department_id,
            finalBuildingId
          );

        if (
          !officeDepartment ||
          officeDepartment.crossBuilding
        ) {
          return res.status(403).json({
            success: false,
            error:
              'Forbidden: Office department has a building scope violation.'
          });
        }
      }
    }

    // ------------------------------------------------
    // BUILD UPDATE OBJECT
    // ------------------------------------------------

    const updates = {
      building_id:
        finalBuildingId,

      department_id:
        department_id !== undefined
          ? department_id || null
          : existingEmployee.department_id,

      office_id:
        office_id !== undefined
          ? office_id || null
          : existingEmployee.office_id,

      updated_at:
        new Date().toISOString()
    };

    if (first_name !== undefined) {
      updates.first_name =
        first_name.trim();
    }

    if (middle_name !== undefined) {
      updates.middle_name =
        middle_name || null;
    }

    if (last_name !== undefined) {
      updates.last_name =
        last_name || null;
    }

    if (position_en !== undefined) {
      updates.position_en =
        position_en;
    }

    if (position_am !== undefined) {
      updates.position_am =
        position_am;
    }

    if (position_om !== undefined) {
      updates.position_om =
        position_om;
    }

    if (phone !== undefined) {
      updates.phone =
        phone;
    }

    if (email !== undefined) {
      updates.email =
        email;
    }

    if (is_public !== undefined) {
      updates.is_public =
        is_public;
    }

    if (is_active !== undefined) {
      updates.is_active =
        is_active;
    }

    // ------------------------------------------------
    // UPDATE
    // ------------------------------------------------

    const {
      data,
      error
    } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating admin employee:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update employee.'
      });
    }

    return res.json({
      success: true,
      message:
        'Employee updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin employee update error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// PATCH EMPLOYEE ACTIVE STATUS
// PATCH /api/admin/employees/:id/status
// Body: { is_active: true/false }
// --------------------------------------------------

async function updateEmployeeStatus(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID.'
      });
    }

    if (
      !canManageEmployees(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to change employee status.'
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    const {
      data: existingEmployee,
      error: existingError
    } = await supabase
      .from('employees')
      .select(
        'id, building_id, is_active'
      )
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingEmployee
    ) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found.'
      });
    }

    if (
      req.admin.role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingEmployee.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Building scope violation.'
      });
    }

    const {
      data,
      error
    } = await supabase
      .from('employees')
      .update({
        is_active,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating employee active status:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update employee status.'
      });
    }

    return res.json({
      success: true,
      message:
        'Employee status updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin employee status error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus
};