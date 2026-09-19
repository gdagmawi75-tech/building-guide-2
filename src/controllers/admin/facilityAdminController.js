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

function canManageFacilities(role) {
  return MANAGEABLE_ROLES.includes(role);
}

function canViewFacilities(role) {
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
// Verify floor exists and belongs to building
// --------------------------------------------------

async function getFloor(
  floorId,
  buildingId
) {
  if (!floorId) {
    return null;
  }

  const { data, error } = await supabase
    .from('floors')
    .select('id, building_id')
    .eq('id', floorId)
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
// GET ALL FACILITIES
// GET /api/admin/facilities
// --------------------------------------------------

async function getAllFacilities(req, res) {
  try {
    const role = req.admin.role;

    if (!canViewFacilities(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to view facilities.'
      });
    }

    const {
      building_id,
      floor_id,
      is_public,
      is_active
    } = req.query;

    // ------------------------------------------------
    // SUPER ADMIN
    // ------------------------------------------------

    if (role === 'super_admin') {
      let query = supabase
        .from('facilities')
        .select('*')
        .order('name_en', {
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

      if (floor_id) {
        if (!isValidUUID(floor_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid floor_id.'
          });
        }

        query = query.eq(
          'floor_id',
          floor_id
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
          'Error fetching admin facilities:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch facilities.'
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
        .from('facilities')
        .select('*')
        .eq(
          'building_id',
          req.admin.building_id
        )
        .order('name_en', {
          ascending: true
        });

      if (floor_id) {
        if (!isValidUUID(floor_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid floor_id.'
          });
        }

        query = query.eq(
          'floor_id',
          floor_id
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
          'Error fetching scoped admin facilities:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch facilities.'
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

      let query = supabase
        .from('facilities')
        .select('*')
        .not('floor_id', 'is', null)
        .order('name_en', {
          ascending: true
        });

      if (req.admin.building_id) {
        query = query.eq(
          'building_id',
          req.admin.building_id
        );
      }

      const {
        data: candidates,
        error: candidateError
      } = await query;

      if (candidateError) {
        console.error(
          'Error fetching Floor Manager facilities:',
          candidateError
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch facilities.'
        });
      }

      let visibleFacilities =
        (candidates || []).filter(
          (facility) =>
            assignedFloorIds.includes(
              facility.floor_id
            )
        );

      if (floor_id) {
        if (!isValidUUID(floor_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid floor_id.'
          });
        }

        visibleFacilities =
          visibleFacilities.filter(
            (facility) =>
              facility.floor_id ===
              floor_id
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

        visibleFacilities =
          visibleFacilities.filter(
            (facility) =>
              facility.is_public ===
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

        visibleFacilities =
          visibleFacilities.filter(
            (facility) =>
              facility.is_active ===
              activeValue
          );
      }

      return res.json({
        success: true,
        total: visibleFacilities.length,
        data: visibleFacilities
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden.'
    });

  } catch (err) {
    console.error(
      'Admin facilities list error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// GET ONE FACILITY
// GET /api/admin/facilities/:id
// --------------------------------------------------

async function getFacilityById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid facility ID.'
      });
    }

    const {
      data: facility,
      error
    } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !facility) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found.'
      });
    }

    // Building/content manager scope
    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        facility.building_id !==
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

      if (
        !facility.floor_id ||
        !assignedFloorIds.includes(
          facility.floor_id
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Facility is not on an assigned floor.'
        });
      }
    }

    return res.json({
      success: true,
      data: facility
    });

  } catch (err) {
    console.error(
      'Admin facility detail error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// CREATE FACILITY
// POST /api/admin/facilities
// --------------------------------------------------

async function createFacility(req, res) {
  try {
    const role = req.admin.role;

    if (!canManageFacilities(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to create facilities.'
      });
    }

    const {
      building_id,
      floor_id,
      name_en,
      name_am,
      name_om,
      description_en,
      description_am,
      description_om,
      phone,
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
            'Forbidden: Cannot create a facility for another building.'
        });
      }
    }

    // ------------------------------------------------
    // NAME
    // ------------------------------------------------

    if (!getRequiredText(name_en)) {
      return res.status(400).json({
        success: false,
        error:
          'Required field name_en is missing or invalid.'
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
    // VERIFY FLOOR
    // ------------------------------------------------

    if (
      floor_id !== undefined &&
      floor_id !== null &&
      floor_id !== ''
    ) {
      if (!isValidUUID(floor_id)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid floor_id.'
        });
      }

      const floor =
        await getFloor(
          floor_id,
          building_id
        );

      if (!floor) {
        return res.status(404).json({
          success: false,
          error:
            'Floor not found.'
        });
      }

      if (floor.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor belongs to another building.'
        });
      }
    }

    // ------------------------------------------------
    // CREATE
    // ------------------------------------------------

    const newFacility = {
      building_id,

      floor_id:
        floor_id || null,

      name_en:
        name_en.trim(),

      name_am:
        name_am !== undefined
          ? name_am
          : null,

      name_om:
        name_om !== undefined
          ? name_om
          : null,

      description_en:
        description_en !== undefined
          ? description_en
          : null,

      description_am:
        description_am !== undefined
          ? description_am
          : null,

      description_om:
        description_om !== undefined
          ? description_om
          : null,

      phone:
        phone !== undefined
          ? phone
          : null,

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
      .from('facilities')
      .insert([newFacility])
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error creating admin facility:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to create facility.'
      });
    }

    return res.status(201).json({
      success: true,
      message:
        'Facility created successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin facility create error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// UPDATE FACILITY
// PUT /api/admin/facilities/:id
// --------------------------------------------------

async function updateFacility(req, res) {
  try {
    const { id } = req.params;
    const role = req.admin.role;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid facility ID.'
      });
    }

    if (!canManageFacilities(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to update facilities.'
      });
    }

    const {
      building_id,
      floor_id,
      name_en,
      name_am,
      name_om,
      description_en,
      description_am,
      description_om,
      phone,
      is_public,
      is_active
    } = req.body;

    // ------------------------------------------------
    // EXISTING FACILITY
    // ------------------------------------------------

    const {
      data: existingFacility,
      error: existingError
    } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingFacility
    ) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found.'
      });
    }

    // ------------------------------------------------
    // EXISTING BUILDING SCOPE
    // ------------------------------------------------

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingFacility.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Facility is outside your building.'
      });
    }

    // ------------------------------------------------
    // FINAL BUILDING
    // ------------------------------------------------

    const finalBuildingId =
      building_id !== undefined
        ? building_id
        : existingFacility.building_id;

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
            'Forbidden: Cannot move facility to another building.'
        });
      }
    }

    // ------------------------------------------------
    // NAME
    // ------------------------------------------------

    if (
      name_en !== undefined &&
      !getRequiredText(name_en)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'name_en must be a non-empty string.'
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
        finalBuildingId
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found.'
      });
    }

    // ------------------------------------------------
    // FINAL FLOOR
    // ------------------------------------------------

    const finalFloorId =
      floor_id !== undefined
        ? floor_id
        : existingFacility.floor_id;

    if (finalFloorId) {
      if (!isValidUUID(finalFloorId)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid floor_id.'
        });
      }

      const floor =
        await getFloor(
          finalFloorId,
          finalBuildingId
        );

      if (!floor) {
        return res.status(404).json({
          success: false,
          error:
            'Floor not found.'
        });
      }

      if (floor.crossBuilding) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor belongs to another building.'
        });
      }
    }

    // ------------------------------------------------
    // BUILD UPDATE OBJECT
    // ------------------------------------------------

    const updates = {
      building_id:
        finalBuildingId,

      floor_id:
        floor_id !== undefined
          ? floor_id || null
          : existingFacility.floor_id,

      updated_at:
        new Date().toISOString()
    };

    if (name_en !== undefined) {
      updates.name_en =
        name_en.trim();
    }

    if (name_am !== undefined) {
      updates.name_am =
        name_am;
    }

    if (name_om !== undefined) {
      updates.name_om =
        name_om;
    }

    if (description_en !== undefined) {
      updates.description_en =
        description_en;
    }

    if (description_am !== undefined) {
      updates.description_am =
        description_am;
    }

    if (description_om !== undefined) {
      updates.description_om =
        description_om;
    }

    if (phone !== undefined) {
      updates.phone =
        phone;
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
      .from('facilities')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating admin facility:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update facility.'
      });
    }

    return res.json({
      success: true,
      message:
        'Facility updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin facility update error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// PATCH FACILITY ACTIVE STATUS
// PATCH /api/admin/facilities/:id/status
// Body: { is_active: true/false }
// --------------------------------------------------

async function updateFacilityStatus(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid facility ID.'
      });
    }

    if (
      !canManageFacilities(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to change facility status.'
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
      data: existingFacility,
      error: existingError
    } = await supabase
      .from('facilities')
      .select(
        'id, building_id, is_active'
      )
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingFacility
    ) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found.'
      });
    }

    if (
      req.admin.role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingFacility.building_id !==
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
      .from('facilities')
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
        'Error updating facility status:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update facility status.'
      });
    }

    return res.json({
      success: true,
      message:
        'Facility status updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin facility status error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  updateFacilityStatus
};