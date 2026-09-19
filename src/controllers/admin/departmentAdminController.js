const supabase = require('../../config/supabase');

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

function getErrorMessage(error, fallback = 'Something went wrong.') {
  return error?.message || fallback;
}

function isRoleAllowed(role, allowedRoles) {
  return allowedRoles.includes(role);
}

async function verifyBuilding(buildingId) {
  if (!buildingId) {
    return {
      ok: false,
      status: 400,
      message: 'building_id is required.'
    };
  }

  const { data, error } = await supabase
    .from('buildings')
    .select('id')
    .eq('id', buildingId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      message: getErrorMessage(
        error,
        'Failed to verify building.'
      )
    };
  }

  if (!data) {
    return {
      ok: false,
      status: 400,
      message: 'Building not found.'
    };
  }

  return {
    ok: true
  };
}

function hasBuildingScope(admin, buildingId) {
  if (admin.role === 'super_admin') {
    return true;
  }

  return admin.building_id === buildingId;
}

/*
  GET /api/admin/departments
*/
async function getAllDepartments(req, res) {
  try {
    const admin = req.admin;

    if (!isRoleAllowed(admin.role, VIEW_ROLES)) {
      return res.status(403).json({
        error: 'You do not have permission to view departments.'
      });
    }

    let query = supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name_en', { ascending: true });

    if (admin.role !== 'super_admin') {
      if (!admin.building_id) {
        return res.status(403).json({
          error: 'No building scope assigned to this admin.'
        });
      }

      query = query.eq('building_id', admin.building_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: getErrorMessage(
          error,
          'Failed to load departments.'
        )
      });
    }

    return res.json({
      departments: data || []
    });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(
        error,
        'Failed to load departments.'
      )
    });
  }
}

/*
  GET /api/admin/departments/:id
*/
async function getDepartmentById(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    if (!isRoleAllowed(admin.role, VIEW_ROLES)) {
      return res.status(403).json({
        error: 'You do not have permission to view departments.'
      });
    }

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: getErrorMessage(
          error,
          'Failed to load department.'
        )
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Department not found.'
      });
    }

    if (!hasBuildingScope(admin, data.building_id)) {
      return res.status(403).json({
        error: 'You do not have access to this department.'
      });
    }

    return res.json({
      department: data
    });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(
        error,
        'Failed to load department.'
      )
    });
  }
}

/*
  POST /api/admin/departments
*/
async function createDepartment(req, res) {
  try {
    const admin = req.admin;

    if (!isRoleAllowed(admin.role, MANAGEMENT_ROLES)) {
      return res.status(403).json({
        error: 'You do not have permission to create departments.'
      });
    }

    const {
      building_id,
      name_en,
      name_am,
      name_om,
      description_en,
      description_am,
      description_om,
      phone,
      email,
      is_public,
      is_active
    } = req.body;

    if (!building_id) {
      return res.status(400).json({
        error: 'building_id is required.'
      });
    }

    if (!name_en || !String(name_en).trim()) {
      return res.status(400).json({
        error: 'name_en is required.'
      });
    }

    if (!hasBuildingScope(admin, building_id)) {
      return res.status(403).json({
        error: 'You cannot create a department outside your building scope.'
      });
    }

    const buildingCheck = await verifyBuilding(building_id);

    if (!buildingCheck.ok) {
      return res.status(buildingCheck.status).json({
        error: buildingCheck.message
      });
    }

    const department = {
      building_id,
      name_en: String(name_en).trim(),
      name_am: name_am || null,
      name_om: name_om || null,
      description_en: description_en || null,
      description_am: description_am || null,
      description_om: description_om || null,
      phone: phone || null,
      email: email || null,
      is_public:
        typeof is_public === 'boolean'
          ? is_public
          : true,
      is_active:
        typeof is_active === 'boolean'
          ? is_active
          : true
    };

    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({
        error: getErrorMessage(
          error,
          'Failed to create department.'
        )
      });
    }

    return res.status(201).json({
      message: 'Department created successfully.',
      department: data
    });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(
        error,
        'Failed to create department.'
      )
    });
  }
}

/*
  PUT /api/admin/departments/:id
*/
async function updateDepartment(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    if (!isRoleAllowed(admin.role, MANAGEMENT_ROLES)) {
      return res.status(403).json({
        error: 'You do not have permission to update departments.'
      });
    }

    const { data: existing, error: existingError } =
      await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        error: getErrorMessage(
          existingError,
          'Failed to load department.'
        )
      });
    }

    if (!existing) {
      return res.status(404).json({
        error: 'Department not found.'
      });
    }

    if (!hasBuildingScope(admin, existing.building_id)) {
      return res.status(403).json({
        error: 'You do not have access to this department.'
      });
    }

    const {
      building_id,
      name_en,
      name_am,
      name_om,
      description_en,
      description_am,
      description_om,
      phone,
      email,
      is_public,
      is_active
    } = req.body;

    let finalBuildingId =
      building_id !== undefined
        ? building_id
        : existing.building_id;

    /*
      Only super_admin can move a department
      between buildings.
    */
    if (
      building_id !== undefined &&
      building_id !== existing.building_id &&
      admin.role !== 'super_admin'
    ) {
      return res.status(403).json({
        error: 'Only super_admin can move a department between buildings.'
      });
    }

    if (!hasBuildingScope(admin, finalBuildingId)) {
      return res.status(403).json({
        error: 'You cannot assign this department outside your building scope.'
      });
    }

    const buildingCheck = await verifyBuilding(
      finalBuildingId
    );

    if (!buildingCheck.ok) {
      return res.status(buildingCheck.status).json({
        error: buildingCheck.message
      });
    }

    if (
      name_en !== undefined &&
      !String(name_en).trim()
    ) {
      return res.status(400).json({
        error: 'name_en cannot be empty.'
      });
    }

    const updates = {
      building_id: finalBuildingId
    };

    if (name_en !== undefined) {
      updates.name_en = String(name_en).trim();
    }

    if (name_am !== undefined) {
      updates.name_am = name_am || null;
    }

    if (name_om !== undefined) {
      updates.name_om = name_om || null;
    }

    if (description_en !== undefined) {
      updates.description_en =
        description_en || null;
    }

    if (description_am !== undefined) {
      updates.description_am =
        description_am || null;
    }

    if (description_om !== undefined) {
      updates.description_om =
        description_om || null;
    }

    if (phone !== undefined) {
      updates.phone = phone || null;
    }

    if (email !== undefined) {
      updates.email = email || null;
    }

    if (typeof is_public === 'boolean') {
      updates.is_public = is_public;
    }

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({
        error: getErrorMessage(
          error,
          'Failed to update department.'
        )
      });
    }

    return res.json({
      message: 'Department updated successfully.',
      department: data
    });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(
        error,
        'Failed to update department.'
      )
    });
  }
}

/*
  PATCH /api/admin/departments/:id/status
*/
async function patchDepartmentStatus(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    if (!isRoleAllowed(admin.role, MANAGEMENT_ROLES)) {
      return res.status(403).json({
        error: 'You do not have permission to change department status.'
      });
    }

    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'is_active must be a boolean.'
      });
    }

    const { data: existing, error: existingError } =
      await supabase
        .from('departments')
        .select('id, building_id')
        .eq('id', id)
        .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        error: getErrorMessage(
          existingError,
          'Failed to load department.'
        )
      });
    }

    if (!existing) {
      return res.status(404).json({
        error: 'Department not found.'
      });
    }

    if (!hasBuildingScope(admin, existing.building_id)) {
      return res.status(403).json({
        error: 'You do not have access to this department.'
      });
    }

    const { data, error } = await supabase
      .from('departments')
      .update({
        is_active
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({
        error: getErrorMessage(
          error,
          'Failed to change department status.'
        )
      });
    }

    return res.json({
      message: 'Department status updated successfully.',
      department: data
    });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(
        error,
        'Failed to change department status.'
      )
    });
  }
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  patchDepartmentStatus
};