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

function canManageOpeningHours(role) {
  return MANAGEABLE_ROLES.includes(role);
}

function canViewOpeningHours(role) {
  return VIEWABLE_ROLES.includes(role);
}

function isValidDayOfWeek(value) {
  const day = Number(value);

  return (
    Number.isInteger(day) &&
    day >= 0 &&
    day <= 6
  );
}

function isValidTime(value) {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return /^\d{2}:\d{2}(:\d{2})?$/.test(
    value
  );
}

function normalizeTime(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value.length === 5
    ? `${value}:00`
    : value;
}

// --------------------------------------------------
// Verify building
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
// Verify office belongs to building
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
      floor_id
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

  return data;
}

// --------------------------------------------------
// Verify service belongs to building
// --------------------------------------------------

async function getService(
  serviceId,
  buildingId
) {
  if (!serviceId) {
    return null;
  }

  const { data, error } = await supabase
    .from('services')
    .select(`
      id,
      building_id
    `)
    .eq('id', serviceId)
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
// Verify office is on assigned floor
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
// Validate target relationship
//
// Exactly one of office_id/service_id may be set.
// When both are null, the record is building-level.
// --------------------------------------------------

async function validateTarget(
  buildingId,
  officeId,
  serviceId
) {
  const hasOffice =
    !!officeId;

  const hasService =
    !!serviceId;

  if (hasOffice && hasService) {
    return {
      error:
        'An opening-hours record cannot belong to both an office and a service.'
    };
  }

  if (hasOffice) {
    if (!isValidUUID(officeId)) {
      return {
        error:
          'Invalid office_id.'
      };
    }

    const office =
      await getOffice(
        officeId,
        buildingId
      );

    if (!office) {
      return {
        notFound:
          'Office not found.'
      };
    }

    if (office.crossBuilding) {
      return {
        forbidden:
          'Office belongs to another building.'
      };
    }

    return {
      office
    };
  }

  if (hasService) {
    if (!isValidUUID(serviceId)) {
      return {
        error:
          'Invalid service_id.'
      };
    }

    const service =
      await getService(
        serviceId,
        buildingId
      );

    if (!service) {
      return {
        notFound:
          'Service not found.'
      };
    }

    if (service.crossBuilding) {
      return {
        forbidden:
          'Service belongs to another building.'
      };
    }

    return {
      service
    };
  }

  return {};
}

// --------------------------------------------------
// Validate time logic
// --------------------------------------------------

function validateTimeLogic(
  openingTime,
  closingTime,
  breakStart,
  breakEnd,
  isClosed
) {
  if (isClosed) {
    return null;
  }

  if (
    !openingTime ||
    !closingTime
  ) {
    return (
      'Opening time and closing time are required when the day is open.'
    );
  }

  if (
    breakStart &&
    !breakEnd
  ) {
    return (
      'break_end is required when break_start is provided.'
    );
  }

  if (
    breakEnd &&
    !breakStart
  ) {
    return (
      'break_start is required when break_end is provided.'
    );
  }

  return null;
}

// --------------------------------------------------
// GET ALL OPENING HOURS
// GET /api/admin/opening-hours
// --------------------------------------------------

async function getAllOpeningHours(
  req,
  res
) {
  try {
    const role = req.admin.role;

    if (!canViewOpeningHours(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to view opening hours.'
      });
    }

    const {
      building_id,
      office_id,
      service_id,
      day_of_week,
      is_closed
    } = req.query;

    // ------------------------------------------------
    // SUPER ADMIN
    // ------------------------------------------------

    if (role === 'super_admin') {
      let query = supabase
        .from('opening_hours')
        .select('*')
        .order('day_of_week', {
          ascending: true
        })
        .order('opening_time', {
          ascending: true
        });

      if (building_id) {
        if (!isValidUUID(building_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid building_id.'
          });
        }

        query = query.eq(
          'building_id',
          building_id
        );
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid office_id.'
          });
        }

        query = query.eq(
          'office_id',
          office_id
        );
      }

      if (service_id) {
        if (!isValidUUID(service_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid service_id.'
          });
        }

        query = query.eq(
          'service_id',
          service_id
        );
      }

      if (day_of_week !== undefined) {
        if (
          !isValidDayOfWeek(
            day_of_week
          )
        ) {
          return res.status(400).json({
            success: false,
            error:
              'day_of_week must be an integer from 0 to 6.'
          });
        }

        query = query.eq(
          'day_of_week',
          Number(day_of_week)
        );
      }

      if (is_closed !== undefined) {
        if (
          is_closed !== 'true' &&
          is_closed !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_closed must be true or false.'
          });
        }

        query = query.eq(
          'is_closed',
          is_closed === 'true'
        );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching admin opening hours:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch opening hours.'
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
        .from('opening_hours')
        .select('*')
        .eq(
          'building_id',
          req.admin.building_id
        )
        .order('day_of_week', {
          ascending: true
        })
        .order('opening_time', {
          ascending: true
        });

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid office_id.'
          });
        }

        query = query.eq(
          'office_id',
          office_id
        );
      }

      if (service_id) {
        if (!isValidUUID(service_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid service_id.'
          });
        }

        query = query.eq(
          'service_id',
          service_id
        );
      }

      if (day_of_week !== undefined) {
        if (
          !isValidDayOfWeek(
            day_of_week
          )
        ) {
          return res.status(400).json({
            success: false,
            error:
              'day_of_week must be an integer from 0 to 6.'
          });
        }

        query = query.eq(
          'day_of_week',
          Number(day_of_week)
        );
      }

      if (is_closed !== undefined) {
        if (
          is_closed !== 'true' &&
          is_closed !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_closed must be true or false.'
          });
        }

        query = query.eq(
          'is_closed',
          is_closed === 'true'
        );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching scoped opening hours:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch opening hours.'
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

      // Floor Managers can manage/view hours
      // for offices on their assigned floors.
      //
      // Building-level and service-only opening
      // hours do not have a direct floor_id.
      // Office scope is therefore required.

      let candidateQuery = supabase
        .from('opening_hours')
        .select('*')
        .not('office_id', 'is', null)
        .order('day_of_week', {
          ascending: true
        })
        .order('opening_time', {
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
          'Error fetching Floor Manager opening hours:',
          candidateError
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch opening hours.'
        });
      }

      let visibleHours = [];

      for (const openingHour of candidates || []) {
        const allowed =
          await isOfficeOnAssignedFloor(
            openingHour.office_id,
            assignedFloorIds
          );

        if (allowed) {
          visibleHours.push(
            openingHour
          );
        }
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid office_id.'
          });
        }

        visibleHours =
          visibleHours.filter(
            (openingHour) =>
              openingHour.office_id ===
              office_id
          );
      }

      if (day_of_week !== undefined) {
        if (
          !isValidDayOfWeek(
            day_of_week
          )
        ) {
          return res.status(400).json({
            success: false,
            error:
              'day_of_week must be an integer from 0 to 6.'
          });
        }

        visibleHours =
          visibleHours.filter(
            (openingHour) =>
              openingHour.day_of_week ===
              Number(day_of_week)
          );
      }

      if (is_closed !== undefined) {
        if (
          is_closed !== 'true' &&
          is_closed !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_closed must be true or false.'
          });
        }

        visibleHours =
          visibleHours.filter(
            (openingHour) =>
              openingHour.is_closed ===
              (is_closed === 'true')
          );
      }

      return res.json({
        success: true,
        total: visibleHours.length,
        data: visibleHours
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden.'
    });

  } catch (err) {
    console.error(
      'Admin opening hours list error:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Internal server error.'
    });
  }
}

// --------------------------------------------------
// GET ONE OPENING HOURS RECORD
// GET /api/admin/opening-hours/:id
// --------------------------------------------------

async function getOpeningHoursById(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid opening hours ID.'
      });
    }

    const {
      data,
      error
    } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error:
          'Opening hours record not found.'
      });
    }

    // Building / content managers
    if (
      req.admin.role ===
        'building_manager' ||
      req.admin.role ===
        'content_manager'
    ) {
      if (
        !req.admin.building_id ||
        data.building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Building scope violation.'
        });
      }
    }

    // Floor manager
    if (
      req.admin.role ===
      'floor_manager'
    ) {
      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      const allowed =
        await isOfficeOnAssignedFloor(
          data.office_id,
          assignedFloorIds
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Opening hours are not on an assigned floor.'
        });
      }
    }

    return res.json({
      success: true,
      data
    });

  } catch (err) {
    console.error(
      'Admin opening hours detail error:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Internal server error.'
    });
  }
}

// --------------------------------------------------
// CREATE OPENING HOURS
// POST /api/admin/opening-hours
// --------------------------------------------------

async function createOpeningHours(
  req,
  res
) {
  try {
    const role =
      req.admin.role;

    if (!canManageOpeningHours(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to create opening hours.'
      });
    }

    const {
      building_id,
      office_id,
      service_id,
      day_of_week,
      opening_time,
      closing_time,
      break_start,
      break_end,
      is_closed
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

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        req.admin.building_id !==
          building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Cannot create opening hours for another building.'
      });
    }

    // ------------------------------------------------
    // DAY
    // ------------------------------------------------

    if (
      !isValidDayOfWeek(
        day_of_week
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'day_of_week must be an integer from 0 to 6.'
      });
    }

    // ------------------------------------------------
    // CLOSED
    // ------------------------------------------------

    const closed =
      is_closed === undefined
        ? false
        : is_closed;

    if (
      typeof closed !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_closed must be a boolean.'
      });
    }

    // ------------------------------------------------
    // TIME FORMAT
    // ------------------------------------------------

    if (
      !isValidTime(opening_time) ||
      !isValidTime(closing_time) ||
      !isValidTime(break_start) ||
      !isValidTime(break_end)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Times must use HH:MM or HH:MM:SS format.'
      });
    }

    const normalizedOpeningTime =
      normalizeTime(opening_time);

    const normalizedClosingTime =
      normalizeTime(closing_time);

    const normalizedBreakStart =
      normalizeTime(break_start);

    const normalizedBreakEnd =
      normalizeTime(break_end);

    const timeError =
      validateTimeLogic(
        normalizedOpeningTime,
        normalizedClosingTime,
        normalizedBreakStart,
        normalizedBreakEnd,
        closed
      );

    if (timeError) {
      return res.status(400).json({
        success: false,
        error: timeError
      });
    }

    // ------------------------------------------------
    // BUILDING EXISTS
    // ------------------------------------------------

    const building =
      await getBuilding(
        building_id
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error:
          'Building not found.'
      });
    }

    // ------------------------------------------------
    // TARGET VALIDATION
    // ------------------------------------------------

    const target =
      await validateTarget(
        building_id,
        office_id,
        service_id
      );

    if (target.error) {
      return res.status(400).json({
        success: false,
        error: target.error
      });
    }

    if (target.notFound) {
      return res.status(404).json({
        success: false,
        error:
          target.notFound
      });
    }

    if (target.forbidden) {
      return res.status(403).json({
        success: false,
        error:
          target.forbidden
      });
    }

    // ------------------------------------------------
    // FLOOR MANAGER CREATE SCOPE
    // ------------------------------------------------

    if (role === 'floor_manager') {
      if (!office_id) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor Managers can only manage office opening hours.'
        });
      }

      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      const allowed =
        await isOfficeOnAssignedFloor(
          office_id,
          assignedFloorIds
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Office is not on an assigned floor.'
        });
      }
    }

    // ------------------------------------------------
    // INSERT
    // ------------------------------------------------

    const newOpeningHours = {
      building_id,

      office_id:
        office_id || null,

      service_id:
        service_id || null,

      day_of_week:
        Number(day_of_week),

      opening_time:
        closed
          ? null
          : normalizedOpeningTime,

      closing_time:
        closed
          ? null
          : normalizedClosingTime,

      break_start:
        closed
          ? null
          : normalizedBreakStart,

      break_end:
        closed
          ? null
          : normalizedBreakEnd,

      is_closed:
        closed
    };

    const {
      data,
      error
    } = await supabase
      .from('opening_hours')
      .insert([
        newOpeningHours
      ])
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error creating opening hours:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to create opening hours.'
      });
    }

    return res.status(201).json({
      success: true,
      message:
        'Opening hours created successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin opening hours create error:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Internal server error.'
    });
  }
}

// --------------------------------------------------
// UPDATE OPENING HOURS
// PUT /api/admin/opening-hours/:id
// --------------------------------------------------

async function updateOpeningHours(
  req,
  res
) {
  try {
    const {
      id
    } = req.params;

    const role =
      req.admin.role;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid opening hours ID.'
      });
    }

    if (!canManageOpeningHours(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to update opening hours.'
      });
    }

    const {
      building_id,
      office_id,
      service_id,
      day_of_week,
      opening_time,
      closing_time,
      break_start,
      break_end,
      is_closed
    } = req.body;

    // ------------------------------------------------
    // EXISTING RECORD
    // ------------------------------------------------

    const {
      data: existing,
      error: existingError
    } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existing
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Opening hours record not found.'
      });
    }

    // ------------------------------------------------
    // BUILDING SCOPE
    // ------------------------------------------------

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existing.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Opening hours are outside your building.'
      });
    }

    // ------------------------------------------------
    // FINAL BUILDING
    // ------------------------------------------------

    const finalBuildingId =
      building_id !== undefined
        ? building_id
        : existing.building_id;

    if (
      !isValidUUID(
        finalBuildingId
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid building_id.'
      });
    }

    if (
      role !== 'super_admin' &&
      finalBuildingId !==
        req.admin.building_id
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Cannot move opening hours to another building.'
      });
    }

    // ------------------------------------------------
    // FINAL TARGETS
    // ------------------------------------------------

    const finalOfficeId =
      office_id !== undefined
        ? office_id
        : existing.office_id;

    const finalServiceId =
      service_id !== undefined
        ? service_id
        : existing.service_id;

    const target =
      await validateTarget(
        finalBuildingId,
        finalOfficeId,
        finalServiceId
      );

    if (target.error) {
      return res.status(400).json({
        success: false,
        error: target.error
      });
    }

    if (target.notFound) {
      return res.status(404).json({
        success: false,
        error:
          target.notFound
      });
    }

    if (target.forbidden) {
      return res.status(403).json({
        success: false,
        error:
          target.forbidden
      });
    }

    // ------------------------------------------------
    // FLOOR MANAGER SCOPE
    // ------------------------------------------------

    if (role === 'floor_manager') {
      if (!finalOfficeId) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor Managers can only manage office opening hours.'
        });
      }

      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      const allowed =
        await isOfficeOnAssignedFloor(
          finalOfficeId,
          assignedFloorIds
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Office is not on an assigned floor.'
        });
      }
    }

    // ------------------------------------------------
    // FINAL DAY
    // ------------------------------------------------

    const finalDay =
      day_of_week !== undefined
        ? day_of_week
        : existing.day_of_week;

    if (
      !isValidDayOfWeek(
        finalDay
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'day_of_week must be an integer from 0 to 6.'
      });
    }

    // ------------------------------------------------
    // FINAL CLOSED
    // ------------------------------------------------

    const finalClosed =
      is_closed !== undefined
        ? is_closed
        : existing.is_closed;

    if (
      typeof finalClosed !==
      'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_closed must be a boolean.'
      });
    }

    // ------------------------------------------------
    // FINAL TIMES
    // ------------------------------------------------

    const finalOpeningTime =
      opening_time !== undefined
        ? normalizeTime(
            opening_time
          )
        : existing.opening_time;

    const finalClosingTime =
      closing_time !== undefined
        ? normalizeTime(
            closing_time
          )
        : existing.closing_time;

    const finalBreakStart =
      break_start !== undefined
        ? normalizeTime(
            break_start
          )
        : existing.break_start;

    const finalBreakEnd =
      break_end !== undefined
        ? normalizeTime(
            break_end
          )
        : existing.break_end;

    if (
      !isValidTime(
        finalOpeningTime
      ) ||
      !isValidTime(
        finalClosingTime
      ) ||
      !isValidTime(
        finalBreakStart
      ) ||
      !isValidTime(
        finalBreakEnd
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Times must use HH:MM or HH:MM:SS format.'
      });
    }

    const timeError =
      validateTimeLogic(
        finalOpeningTime,
        finalClosingTime,
        finalBreakStart,
        finalBreakEnd,
        finalClosed
      );

    if (timeError) {
      return res.status(400).json({
        success: false,
        error: timeError
      });
    }

    // ------------------------------------------------
    // UPDATE
    // ------------------------------------------------

    const updates = {
      building_id:
        finalBuildingId,

      office_id:
        finalOfficeId || null,

      service_id:
        finalServiceId || null,

      day_of_week:
        Number(finalDay),

      opening_time:
        finalClosed
          ? null
          : finalOpeningTime,

      closing_time:
        finalClosed
          ? null
          : finalClosingTime,

      break_start:
        finalClosed
          ? null
          : finalBreakStart,

      break_end:
        finalClosed
          ? null
          : finalBreakEnd,

      is_closed:
        finalClosed,

      updated_at:
        new Date().toISOString()
    };

    const {
      data,
      error
    } = await supabase
      .from('opening_hours')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'Error updating opening hours:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update opening hours.'
      });
    }

    return res.json({
      success: true,
      message:
        'Opening hours updated successfully.',
      data
    });

  } catch (err) {
    console.error(
      'Admin opening hours update error:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Internal server error.'
    });
  }
}

// --------------------------------------------------
// DELETE OPENING HOURS
// DELETE /api/admin/opening-hours/:id
// --------------------------------------------------

async function deleteOpeningHours(
  req,
  res
) {
  try {
    const {
      id
    } = req.params;

    const role =
      req.admin.role;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid opening hours ID.'
      });
    }

    if (!canManageOpeningHours(role)) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to delete opening hours.'
      });
    }

    const {
      data: existing,
      error: existingError
    } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existing
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Opening hours record not found.'
      });
    }

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existing.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Opening hours are outside your building.'
      });
    }

    if (role === 'floor_manager') {
      if (!existing.office_id) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor Managers can only delete office opening hours.'
        });
      }

      const assignedFloorIds =
        await getAssignedFloorIds(
          req.admin.id
        );

      const allowed =
        await isOfficeOnAssignedFloor(
          existing.office_id,
          assignedFloorIds
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Office is not on an assigned floor.'
        });
      }
    }

    const {
      error
    } = await supabase
      .from('opening_hours')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Error deleting opening hours:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to delete opening hours.'
      });
    }

    return res.json({
      success: true,
      message:
        'Opening hours deleted successfully.'
    });

  } catch (err) {
    console.error(
      'Admin opening hours delete error:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Internal server error.'
    });
  }
}

module.exports = {
  getAllOpeningHours,
  getOpeningHoursById,
  createOpeningHours,
  updateOpeningHours,
  deleteOpeningHours
};