const supabase = require('../../config/supabase');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_STATUSES = [
  'open',
  'closed',
  'temporarily_unavailable'
];

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
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function canManageServices(role) {
  return MANAGEABLE_ROLES.includes(role);
}

function canViewServices(role) {
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
// through office -> floor -> building
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
    .select(
      `
        id,
        building_id,
        floor_id,
        department_id,
        floors (
          id,
          building_id
        )
      `
    )
    .eq('id', officeId)
    .single();

  if (error || !data) {
    return null;
  }

  // Direct office building check
  if (data.building_id !== buildingId) {
    return {
      crossBuilding: true
    };
  }

  // Floor building check
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
// Verify a service's office belongs to one assigned
// floor for Floor Managers
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
// Verify Floor Manager can view one service
// --------------------------------------------------

async function canFloorManagerViewService(
  req,
  service
) {
  if (!service.office_id) {
    return false;
  }

  const assignedFloorIds =
    await getAssignedFloorIds(req.admin.id);

  return isOfficeOnAssignedFloor(
    service.office_id,
    assignedFloorIds
  );
}

// --------------------------------------------------
// GET ALL SERVICES
// GET /api/admin/services
// --------------------------------------------------

async function getAllServices(req, res) {
  try {
    const role = req.admin.role;

    if (!canViewServices(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to view services.'
      });
    }

    const {
      building_id,
      department_id,
      office_id,
      status,
      is_public,
      is_active
    } = req.query;

    let query = supabase
      .from('services')
      .select('*')
      .order('name_en', {
        ascending: true
      });

    // --------------------------------------------
    // SUPER ADMIN
    // --------------------------------------------

    if (role === 'super_admin') {
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
    }

    // --------------------------------------------
    // BUILDING / CONTENT MANAGER
    // --------------------------------------------

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

      query = query.eq(
        'building_id',
        req.admin.building_id
      );
    }

    // --------------------------------------------
    // FLOOR MANAGER
    // --------------------------------------------

    if (role === 'floor_manager') {
      const assignedFloorIds =
        await getAssignedFloorIds(req.admin.id);

      if (assignedFloorIds.length === 0) {
        return res.json({
          success: true,
          total: 0,
          data: []
        });
      }

      // Services do not have a floor_id column.
      // Floor scope is derived through:
      // service.office_id -> office.floor_id

      let candidateQuery = supabase
        .from('services')
        .select('*')
        .not('office_id', 'is', null)
        .order('name_en', {
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
          'Error fetching Floor Manager services:',
          candidateError
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch services.'
        });
      }

      const visibleServices = [];

      for (const service of candidates || []) {
        const allowed =
          await isOfficeOnAssignedFloor(
            service.office_id,
            assignedFloorIds
          );

        if (allowed) {
          visibleServices.push(service);
        }
      }

      let filteredServices =
        visibleServices;

      if (department_id) {
        if (!isValidUUID(department_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department_id.'
          });
        }

        filteredServices =
          filteredServices.filter(
            (service) =>
              service.department_id ===
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

        filteredServices =
          filteredServices.filter(
            (service) =>
              service.office_id === office_id
          );
      }

      if (status) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid status. Allowed values: open, closed, temporarily_unavailable.'
          });
        }

        filteredServices =
          filteredServices.filter(
            (service) =>
              service.status === status
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

        filteredServices =
          filteredServices.filter(
            (service) =>
              service.is_public ===
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

        filteredServices =
          filteredServices.filter(
            (service) =>
              service.is_active ===
              activeValue
          );
      }

      return res.json({
        success: true,
        total: filteredServices.length,
        data: filteredServices
      });
    }

    // --------------------------------------------
    // COMMON FILTERS FOR SUPER / BUILDING /
    // CONTENT MANAGERS
    // --------------------------------------------

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

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid status. Allowed values: open, closed, temporarily_unavailable.'
        });
      }

      query = query.eq(
        'status',
        status
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
        'Error fetching admin services:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to fetch services.'
      });
    }

    return res.json({
      success: true,
      total: data?.length || 0,
      data: data || []
    });

  } catch (err) {
    console.error(
      'Admin services list error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// GET ONE SERVICE
// GET /api/admin/services/:id
// --------------------------------------------------

async function getServiceById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service ID.'
      });
    }

    const {
      data: service,
      error
    } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found.'
      });
    }

    // --------------------------------------------
    // BUILDING / CONTENT MANAGER
    // --------------------------------------------

    if (
      req.admin.role === 'building_manager' ||
      req.admin.role === 'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        service.building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Building scope violation.'
        });
      }
    }

    // --------------------------------------------
    // FLOOR MANAGER
    // --------------------------------------------

    if (
      req.admin.role === 'floor_manager'
    ) {
      const allowed =
        await canFloorManagerViewService(
          req,
          service
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Service is not on an assigned floor.'
        });
      }
    }

    return res.json({
      success: true,
      data: service
    });

  } catch (err) {
    console.error(
      'Admin service detail error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// CREATE SERVICE
// POST /api/admin/services
// --------------------------------------------------

async function createService(req, res) {
  try {
    const role = req.admin.role;

    if (!canManageServices(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to create services.'
      });
    }

    const {
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
    } = req.body;

    // --------------------------------------------
    // REQUIRED BUILDING
    // --------------------------------------------

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
            'Forbidden: Cannot create a service for another building.'
        });
      }
    }

    // --------------------------------------------
    // REQUIRED SERVICE NAME
    // --------------------------------------------

    if (!getRequiredText(name_en)) {
      return res.status(400).json({
        success: false,
        error:
          'Required field name_en is missing or invalid.'
      });
    }

    // --------------------------------------------
    // VALIDATE STATUS
    // --------------------------------------------

    const serviceStatus =
      status === undefined ||
      status === null ||
      status === ''
        ? 'open'
        : status;

    if (
      !VALID_STATUSES.includes(
        serviceStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable.'
      });
    }

    // --------------------------------------------
    // VALIDATE BOOLEAN FIELDS
    // --------------------------------------------

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

    // --------------------------------------------
    // VERIFY BUILDING
    // --------------------------------------------

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

    // --------------------------------------------
    // VERIFY DEPARTMENT
    // --------------------------------------------

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

    // --------------------------------------------
    // VERIFY OFFICE
    // --------------------------------------------

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

      if (office.department_id) {
        const officeDepartment =
          await getDepartment(
            office.department_id,
            building_id
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

    // --------------------------------------------
    // CREATE SERVICE
    // --------------------------------------------

    const newService = {
      building_id,

      department_id:
        department_id || null,

      office_id:
        office_id || null,

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

      requirements_en:
        requirements_en !== undefined
          ? requirements_en
          : null,

      requirements_am:
        requirements_am !== undefined
          ? requirements_am
          : null,

      requirements_om:
        requirements_om !== undefined
          ? requirements_om
          : null,

      fees_en:
        fees_en !== undefined
          ? fees_en
          : null,

      fees_am:
        fees_am !== undefined
          ? fees_am
          : null,

      fees_om:
        fees_om !== undefined
          ? fees_om
          : null,

      processing_info_en:
        processing_info_en !== undefined
          ? processing_info_en
          : null,

      processing_info_am:
        processing_info_am !== undefined
          ? processing_info_am
          : null,

      processing_info_om:
        processing_info_om !== undefined
          ? processing_info_om
          : null,

      phone:
        phone !== undefined
          ? phone
          : null,

      email:
        email !== undefined
          ? email
          : null,

      status:
        serviceStatus,

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
      .from('services')
      .insert([newService])
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error creating admin service:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to create service.'
      });
    }

    return res.status(201).json({
      success: true,
      message:
        'Service created successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin service create error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// UPDATE SERVICE
// PUT /api/admin/services/:id
// --------------------------------------------------

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const role = req.admin.role;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service ID.'
      });
    }

    if (!canManageServices(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to update services.'
      });
    }

    const {
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
    } = req.body;

    // --------------------------------------------
    // GET EXISTING SERVICE
    // --------------------------------------------

    const {
      data: existingService,
      error: existingError
    } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingService
    ) {
      return res.status(404).json({
        success: false,
        error: 'Service not found.'
      });
    }

    // --------------------------------------------
    // DETERMINE FINAL BUILDING
    // --------------------------------------------

    const finalBuildingId =
      building_id !== undefined
        ? building_id
        : existingService.building_id;

    if (!isValidUUID(finalBuildingId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid building_id.'
      });
    }

    if (role !== 'super_admin') {
      if (
        !req.admin.building_id ||
        finalBuildingId !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Cannot update a service outside your building.'
        });
      }
    }

    // --------------------------------------------
    // VALIDATE NAME
    // --------------------------------------------

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

    // --------------------------------------------
    // VALIDATE STATUS
    // --------------------------------------------

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable.'
      });
    }

    // --------------------------------------------
    // VALIDATE BOOLEAN FIELDS
    // --------------------------------------------

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

    // --------------------------------------------
    // VERIFY BUILDING
    // --------------------------------------------

    const building =
      await getBuilding(
        finalBuildingId
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error:
          'Building not found.'
      });
    }

    // --------------------------------------------
    // FINAL DEPARTMENT
    // --------------------------------------------

    const finalDepartmentId =
      department_id !== undefined
        ? department_id
        : existingService.department_id;

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

    // --------------------------------------------
    // FINAL OFFICE
    // --------------------------------------------

    const finalOfficeId =
      office_id !== undefined
        ? office_id
        : existingService.office_id;

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

    // --------------------------------------------
    // BUILD UPDATE OBJECT
    // --------------------------------------------

    const updates = {
      building_id:
        finalBuildingId,

      department_id:
        department_id !== undefined
          ? department_id || null
          : existingService.department_id,

      office_id:
        office_id !== undefined
          ? office_id || null
          : existingService.office_id,

      updated_at:
        new Date().toISOString()
    };

    if (name_en !== undefined) {
      updates.name_en =
        name_en.trim();
    }

    if (name_am !== undefined) {
      updates.name_am = name_am;
    }

    if (name_om !== undefined) {
      updates.name_om = name_om;
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

    if (requirements_en !== undefined) {
      updates.requirements_en =
        requirements_en;
    }

    if (requirements_am !== undefined) {
      updates.requirements_am =
        requirements_am;
    }

    if (requirements_om !== undefined) {
      updates.requirements_om =
        requirements_om;
    }

    if (fees_en !== undefined) {
      updates.fees_en = fees_en;
    }

    if (fees_am !== undefined) {
      updates.fees_am = fees_am;
    }

    if (fees_om !== undefined) {
      updates.fees_om = fees_om;
    }

    if (
      processing_info_en !== undefined
    ) {
      updates.processing_info_en =
        processing_info_en;
    }

    if (
      processing_info_am !== undefined
    ) {
      updates.processing_info_am =
        processing_info_am;
    }

    if (
      processing_info_om !== undefined
    ) {
      updates.processing_info_om =
        processing_info_om;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (email !== undefined) {
      updates.email = email;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (is_public !== undefined) {
      updates.is_public =
        is_public;
    }

    if (is_active !== undefined) {
      updates.is_active =
        is_active;
    }

    // --------------------------------------------
    // UPDATE
    // --------------------------------------------

    const {
      data,
      error
    } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating admin service:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update service.'
      });
    }

    return res.json({
      success: true,
      message:
        'Service updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin service update error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

// --------------------------------------------------
// PATCH SERVICE STATUS
// PATCH /api/admin/services/:id/status
// --------------------------------------------------

async function updateServiceStatus(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service ID.'
      });
    }

    if (
      !canManageServices(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to change service status.'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status. Allowed values: open, closed, temporarily_unavailable.'
      });
    }

    const {
      data: existingService,
      error: existingError
    } = await supabase
      .from('services')
      .select(
        'id, building_id, status'
      )
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingService
    ) {
      return res.status(404).json({
        success: false,
        error: 'Service not found.'
      });
    }

    if (
      req.admin.role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingService.building_id !==
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
      .from('services')
      .update({
        status,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating service status:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update service status.'
      });
    }

    return res.json({
      success: true,
      message:
        'Service status updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin service status error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  updateServiceStatus
};