const supabase = require('../../config/supabase');

const VALID_STATUSES = [
  'open',
  'closed',
  'temporarily_unavailable'
];

const MANAGEMENT_ROLES = [
  'super_admin',
  'building_manager',
  'content_manager'
];

const VIEW_ROLES = [
  'super_admin',
  'building_manager',
  'content_manager',
  'floor_manager'
];

function isManagementRole(role) {
  return MANAGEMENT_ROLES.includes(role);
}

function isViewRole(role) {
  return VIEW_ROLES.includes(role);
}

async function verifyBuilding(buildingId) {
  const {
    data,
    error
  } = await supabase
    .from('buildings')
    .select('id')
    .eq('id', buildingId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

async function verifyFloor(floorId) {
  const {
    data,
    error
  } = await supabase
    .from('floors')
    .select('id, building_id')
    .eq('id', floorId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function verifyDepartment(departmentId) {
  const {
    data,
    error
  } = await supabase
    .from('departments')
    .select('id, building_id')
    .eq('id', departmentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getAssignedFloorIds(adminId, buildingId) {
  const {
    data: assignments,
    error
  } = await supabase
    .from('admin_floor_assignments')
    .select('floor_id, floors(building_id)')
    .eq('admin_id', adminId);

  if (error) {
    throw error;
  }

  return (assignments || [])
    .filter(
      (assignment) =>
        assignment.floors &&
        assignment.floors.building_id === buildingId
    )
    .map(
      (assignment) => assignment.floor_id
    );
}

// GET /api/admin/offices
const getAllOffices = async (req, res) => {
  try {
    if (!isViewRole(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    let query = supabase
      .from('offices')
      .select(`
        *,
        buildings(id, name_en),
        floors(id, floor_number, name_en),
        departments(id, name_en)
      `)
      .order('floor_number', {
        foreignTable: 'floors',
        ascending: true
      });

    // Super Admin: all offices
    if (req.admin.role === 'super_admin') {
      // No additional scope
    }

    // Building Manager / Content Manager:
    // only their assigned building
    else if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (!req.admin.building_id) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      query = query.eq(
        'building_id',
        req.admin.building_id
      );
    }

    // Floor Manager:
    // only offices on assigned floors
    else if (
      req.admin.role === 'floor_manager'
    ) {
      if (!req.admin.building_id) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id,
          req.admin.building_id
        );

      if (
        assignedFloorIds.length === 0
      ) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      query = query
        .eq(
          'building_id',
          req.admin.building_id
        )
        .in(
          'floor_id',
          assignedFloorIds
        );
    }

    const {
      data,
      error
    } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error(
      'Error fetching admin offices:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/admin/offices/:id
const getOfficeById = async (req, res) => {
  try {
    if (!isViewRole(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const { id } = req.params;

    const {
      data: office,
      error
    } = await supabase
      .from('offices')
      .select(`
        *,
        buildings(id, name_en),
        floors(id, floor_number, name_en),
        departments(id, name_en)
      `)
      .eq('id', id)
      .single();

    if (error || !office) {
      return res.status(404).json({
        success: false,
        message: 'Office not found'
      });
    }

    // Building Manager / Content Manager
    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        office.building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied to this office'
        });
      }
    }

    // Floor Manager
    if (
      req.admin.role === 'floor_manager'
    ) {
      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id,
          req.admin.building_id
        );

      if (
        office.building_id !==
          req.admin.building_id ||
        !assignedFloorIds.includes(
          office.floor_id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied to unassigned office'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: office
    });
  } catch (err) {
    console.error(
      'Error fetching admin office:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /api/admin/offices
const createOffice = async (req, res) => {
  try {
    if (!isManagementRole(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Super Admin, Building Manager, and Content Manager can create offices'
      });
    }

    const {
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
    } = req.body;

    if (
      !building_id ||
      !floor_id ||
      !office_number ||
      !name_en
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: building_id, floor_id, office_number, name_en'
      });
    }

    if (
      typeof office_number !== 'string' ||
      office_number.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message:
          'office_number must be a non-empty string'
      });
    }

    if (
      typeof name_en !== 'string' ||
      name_en.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message:
          'name_en must be a non-empty string'
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable'
      });
    }

    if (
      is_public !== undefined &&
      typeof is_public !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'is_public must be a boolean'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'is_active must be a boolean'
      });
    }

    // Verify building
    const buildingExists =
      await verifyBuilding(
        building_id
      );

    if (!buildingExists) {
      return res.status(404).json({
        success: false,
        message:
          'Referenced building does not exist'
      });
    }

    // Verify floor and building relationship
    const floor =
      await verifyFloor(floor_id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message:
          'Referenced floor does not exist'
      });
    }

    if (
      floor.building_id !==
      building_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Floor does not belong to the selected building'
      });
    }

    // Verify department relationship
    if (department_id) {
      const department =
        await verifyDepartment(
          department_id
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          message:
            'Referenced department does not exist'
        });
      }

      if (
        department.building_id !==
        building_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Department does not belong to the selected building'
        });
      }
    }

    // Building Manager / Content Manager
    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        req.admin.building_id !==
          building_id
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Cannot create an office for another building'
        });
      }
    }

    const newOffice = {
      building_id,
      floor_id,
      department_id:
        department_id || null,
      office_number:
        office_number.trim(),
      name_en:
        name_en.trim(),
      name_am:
        name_am || null,
      name_om:
        name_om || null,
      description_en:
        description_en || null,
      description_am:
        description_am || null,
      description_om:
        description_om || null,
      phone:
        phone || null,
      email:
        email || null,
      status:
        status || 'open',
      is_public:
        is_public !== undefined
          ? is_public
          : true,
      is_active:
        is_active !== undefined
          ? is_active
          : true
    };

    const {
      data,
      error
    } = await supabase
      .from('offices')
      .insert([newOffice])
      .select(`
        *,
        buildings(id, name_en),
        floors(id, floor_number, name_en),
        departments(id, name_en)
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    console.error(
      'Error creating admin office:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PUT /api/admin/offices/:id
const updateOffice = async (req, res) => {
  try {
    if (!isManagementRole(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Super Admin, Building Manager, and Content Manager can update offices'
      });
    }

    const { id } = req.params;

    const {
      data: existing,
      error: existingError
    } = await supabase
      .from('offices')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Office not found'
      });
    }

    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        existing.building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Cannot update an office in another building'
        });
      }
    }

    const {
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
    } = req.body;

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable'
      });
    }

    if (
      is_public !== undefined &&
      typeof is_public !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'is_public must be a boolean'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'is_active must be a boolean'
      });
    }

    // Determine final building
    const finalBuildingId =
      building_id !== undefined
        ? building_id
        : existing.building_id;

    // Only Super Admin can move an office
    // between buildings.
    if (
      building_id !== undefined &&
      req.admin.role !== 'super_admin'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only Super Admin can change building reference'
      });
    }

    if (
      office_number !== undefined &&
      (
        typeof office_number !== 'string' ||
        office_number.trim() === ''
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'office_number must be a non-empty string'
      });
    }

    if (
      name_en !== undefined &&
      (
        typeof name_en !== 'string' ||
        name_en.trim() === ''
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'name_en must be a non-empty string'
      });
    }

    // Verify final building
    const buildingExists =
      await verifyBuilding(
        finalBuildingId
      );

    if (!buildingExists) {
      return res.status(404).json({
        success: false,
        message:
          'Referenced building does not exist'
      });
    }

    const finalFloorId =
      floor_id !== undefined
        ? floor_id
        : existing.floor_id;

    const floor =
      await verifyFloor(
        finalFloorId
      );

    if (!floor) {
      return res.status(404).json({
        success: false,
        message:
          'Referenced floor does not exist'
      });
    }

    if (
      floor.building_id !==
      finalBuildingId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Floor does not belong to the selected building'
      });
    }

    const finalDepartmentId =
      department_id !== undefined
        ? department_id
        : existing.department_id;

    if (finalDepartmentId) {
      const department =
        await verifyDepartment(
          finalDepartmentId
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          message:
            'Referenced department does not exist'
        });
      }

      if (
        department.building_id !==
        finalBuildingId
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Department does not belong to the selected building'
        });
      }
    }

    const updates = {};

    if (
      building_id !== undefined
    ) {
      updates.building_id =
        building_id;
    }

    if (
      floor_id !== undefined
    ) {
      updates.floor_id =
        floor_id;
    }

    if (
      department_id !== undefined
    ) {
      updates.department_id =
        department_id || null;
    }

    if (
      office_number !== undefined
    ) {
      updates.office_number =
        office_number.trim();
    }

    if (
      name_en !== undefined
    ) {
      updates.name_en =
        name_en.trim();
    }

    if (
      name_am !== undefined
    ) {
      updates.name_am =
        name_am;
    }

    if (
      name_om !== undefined
    ) {
      updates.name_om =
        name_om;
    }

    if (
      description_en !== undefined
    ) {
      updates.description_en =
        description_en;
    }

    if (
      description_am !== undefined
    ) {
      updates.description_am =
        description_am;
    }

    if (
      description_om !== undefined
    ) {
      updates.description_om =
        description_om;
    }

    if (
      phone !== undefined
    ) {
      updates.phone =
        phone;
    }

    if (
      email !== undefined
    ) {
      updates.email =
        email;
    }

    if (
      status !== undefined
    ) {
      updates.status =
        status;
    }

    if (
      is_public !== undefined
    ) {
      updates.is_public =
        is_public;
    }

    if (
      is_active !== undefined
    ) {
      updates.is_active =
        is_active;
    }

    updates.updated_at =
      new Date().toISOString();

    const {
      data,
      error
    } = await supabase
      .from('offices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        buildings(id, name_en),
        floors(id, floor_number, name_en),
        departments(id, name_en)
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error(
      'Error updating admin office:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PATCH /api/admin/offices/:id/status
const patchOfficeStatus = async (
  req,
  res
) => {
  try {
    if (!isManagementRole(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Super Admin, Building Manager, and Content Manager can change office status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable'
      });
    }

    const {
      data: existing,
      error: existingError
    } = await supabase
      .from('offices')
      .select(
        'id, building_id'
      )
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Office not found'
      });
    }

    if (
      req.admin.role !== 'super_admin' &&
      existing.building_id !==
        req.admin.building_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Cannot change status for another building'
      });
    }

    const {
      data,
      error
    } = await supabase
      .from('offices')
      .update({
        status,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        buildings(id, name_en),
        floors(id, floor_number, name_en),
        departments(id, name_en)
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error(
      'Error changing office status:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllOffices,
  getOfficeById,
  createOffice,
  updateOffice,
  patchOfficeStatus
};