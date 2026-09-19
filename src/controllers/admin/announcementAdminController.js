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

const VALID_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent'
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    UUID_REGEX.test(value)
  );
}

function getRequiredText(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

function canManageAnnouncements(role) {
  return MANAGEABLE_ROLES.includes(role);
}

function canViewAnnouncements(role) {
  return VIEWABLE_ROLES.includes(role);
}

// --------------------------------------------------
// VERIFY BUILDING EXISTS
// --------------------------------------------------

async function getBuilding(buildingId) {
  const {
    data,
    error
  } = await supabase
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
// CALCULATE SCHEDULE STATUS
// --------------------------------------------------

function getScheduleStatus(announcement) {
  const now = new Date();

  const startsAt =
    announcement.starts_at
      ? new Date(
          announcement.starts_at
        )
      : null;

  const expiresAt =
    announcement.expires_at
      ? new Date(
          announcement.expires_at
        )
      : null;

  const validStart =
    startsAt &&
    !Number.isNaN(
      startsAt.getTime()
    );

  const validExpiry =
    expiresAt &&
    !Number.isNaN(
      expiresAt.getTime()
    );

  // Expiry takes priority.
  if (
    validExpiry &&
    now >= expiresAt
  ) {
    return 'expired';
  }

  // A future start means scheduled.
  if (
    validStart &&
    now < startsAt
  ) {
    return 'scheduled';
  }

  // Manual deactivation.
  if (
    announcement.is_active === false
  ) {
    return 'inactive';
  }

  return 'active';
}

// --------------------------------------------------
// ADD SCHEDULE STATUS
// --------------------------------------------------

function addScheduleStatus(announcement) {
  return {
    ...announcement,
    schedule_status:
      getScheduleStatus(
        announcement
      )
  };
}

// --------------------------------------------------
// GET ALL ANNOUNCEMENTS
// GET /api/admin/announcements
// --------------------------------------------------

async function getAllAnnouncements(
  req,
  res
) {
  try {
    const role =
      req.admin.role;

    if (
      !canViewAnnouncements(role)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden.'
      });
    }

    const {
      building_id,
      priority,
      is_active,
      schedule_status
    } = req.query;

    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    // ------------------------------------------------
    // SUPER ADMIN
    // ------------------------------------------------

    if (
      role === 'super_admin'
    ) {
      if (building_id) {
        if (
          !isValidUUID(
            building_id
          )
        ) {
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
    }

    // ------------------------------------------------
    // BUILDING / CONTENT MANAGER
    // ------------------------------------------------

    if (
      role === 'building_manager' ||
      role === 'content_manager'
    ) {
      if (
        !req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: No building scope assigned.'
        });
      }

      query = query.eq(
        'building_id',
        req.admin.building_id
      );

      if (
        building_id &&
        building_id !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Building scope violation.'
        });
      }
    }

    // ------------------------------------------------
    // PRIORITY FILTER
    // ------------------------------------------------

    if (
      priority !== undefined
    ) {
      if (
        !VALID_PRIORITIES.includes(
          priority
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid priority. Use low, normal, high, or urgent.'
        });
      }

      query = query.eq(
        'priority',
        priority
      );
    }

    // ------------------------------------------------
    // DATABASE ACTIVE FILTER
    // ------------------------------------------------

    if (
      is_active !== undefined
    ) {
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

    // ------------------------------------------------
    // FETCH
    // ------------------------------------------------

    const {
      data,
      error
    } = await query;

    if (error) {
      console.error(
        'Error fetching admin announcements:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to fetch announcements.'
      });
    }

    // ------------------------------------------------
    // ADD SCHEDULE STATUS
    // ------------------------------------------------

    let processedAnnouncements =
      (data || []).map(
        addScheduleStatus
      );

    // ------------------------------------------------
    // SCHEDULE STATUS FILTER
    // ------------------------------------------------

    if (
      schedule_status !==
        undefined
    ) {
      const validScheduleStatuses = [
        'active',
        'inactive',
        'scheduled',
        'expired'
      ];

      if (
        !validScheduleStatuses.includes(
          schedule_status
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid schedule_status. Use active, inactive, scheduled, or expired.'
        });
      }

      processedAnnouncements =
        processedAnnouncements.filter(
          (announcement) =>
            announcement.schedule_status ===
            schedule_status
        );
    }

    return res.json({
      success: true,
      total:
        processedAnnouncements.length,
      data:
        processedAnnouncements
    });

  } catch (err) {
    console.error(
      'Admin announcements list error:',
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
// GET ONE ANNOUNCEMENT
// GET /api/admin/announcements/:id
// --------------------------------------------------

async function getAnnouncementById(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    if (
      !isValidUUID(id)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid announcement ID.'
      });
    }

    if (
      !canViewAnnouncements(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden.'
      });
    }

    const {
      data: announcement,
      error
    } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (
      error ||
      !announcement
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Announcement not found.'
      });
    }

    // ------------------------------------------------
    // BUILDING SCOPE
    // ------------------------------------------------

    if (
      req.admin.role !==
        'super_admin' &&
      (
        !req.admin.building_id ||
        announcement.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Building scope violation.'
      });
    }

    return res.json({
      success: true,
      data:
        addScheduleStatus(
          announcement
        )
    });

  } catch (err) {
    console.error(
      'Admin announcement detail error:',
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
// CREATE ANNOUNCEMENT
// POST /api/admin/announcements
// --------------------------------------------------

async function createAnnouncement(
  req,
  res
) {
  try {
    const role =
      req.admin.role;

    if (
      !canManageAnnouncements(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to create announcements.'
      });
    }

    const {
      building_id,
      title_en,
      title_am,
      title_om,
      description_en,
      description_am,
      description_om,
      priority,
      starts_at,
      expires_at,
      is_active
    } = req.body;

    // ------------------------------------------------
    // BUILDING ID
    // ------------------------------------------------

    if (
      !isValidUUID(
        building_id
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Valid building_id is required.'
      });
    }

    // ------------------------------------------------
    // BUILDING SCOPE
    // ------------------------------------------------

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Cannot create an announcement for another building.'
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
        error:
          'Building not found.'
      });
    }

    // ------------------------------------------------
    // TITLE
    // ------------------------------------------------

    if (
      !getRequiredText(
        title_en
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Required field title_en is missing or invalid.'
      });
    }

    // ------------------------------------------------
    // PRIORITY
    // ------------------------------------------------

    const finalPriority =
      priority === undefined ||
      priority === null ||
      priority === ''
        ? 'normal'
        : priority;

    if (
      !VALID_PRIORITIES.includes(
        finalPriority
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid priority. Use low, normal, high, or urgent.'
      });
    }

    // ------------------------------------------------
    // ACTIVE
    // ------------------------------------------------

    if (
      is_active !==
        undefined &&
      typeof is_active !==
        'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    // ------------------------------------------------
    // START DATE
    // ------------------------------------------------

    if (
      starts_at !==
        undefined &&
      starts_at !== null &&
      starts_at !== ''
    ) {
      if (
        Number.isNaN(
          Date.parse(
            starts_at
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'starts_at must be a valid date/time.'
        });
      }
    }

    // ------------------------------------------------
    // EXPIRY DATE
    // ------------------------------------------------

    if (
      expires_at !==
        undefined &&
      expires_at !== null &&
      expires_at !== ''
    ) {
      if (
        Number.isNaN(
          Date.parse(
            expires_at
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'expires_at must be a valid date/time.'
        });
      }
    }

    // ------------------------------------------------
    // DATE ORDER
    // ------------------------------------------------

    if (
      starts_at &&
      expires_at &&
      new Date(expires_at) <=
        new Date(starts_at)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'expires_at must be later than starts_at.'
      });
    }

    // ------------------------------------------------
    // CREATE
    // ------------------------------------------------

    const newAnnouncement = {
      building_id,

      title_en:
        title_en.trim(),

      title_am:
        title_am !==
          undefined &&
        title_am !== ''
          ? title_am
          : null,

      title_om:
        title_om !==
          undefined &&
        title_om !== ''
          ? title_om
          : null,

      description_en:
        description_en !==
          undefined &&
        description_en !== ''
          ? description_en
          : null,

      description_am:
        description_am !==
          undefined &&
        description_am !== ''
          ? description_am
          : null,

      description_om:
        description_om !==
          undefined &&
        description_om !== ''
          ? description_om
          : null,

      priority:
        finalPriority,

      starts_at:
        starts_at || null,

      expires_at:
        expires_at || null,

      is_active:
        is_active !==
          undefined
          ? is_active
          : true
    };

    const {
      data,
      error
    } = await supabase
      .from('announcements')
      .insert([
        newAnnouncement
      ])
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error creating admin announcement:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to create announcement.'
      });
    }

    return res.status(201).json({
      success: true,
      message:
        'Announcement created successfully.',
      data:
        addScheduleStatus(
          data
        )
    });

  } catch (err) {
    console.error(
      'Admin announcement create error:',
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
// UPDATE ANNOUNCEMENT
// PUT /api/admin/announcements/:id
// --------------------------------------------------

async function updateAnnouncement(
  req,
  res
) {
  try {
    const {
      id
    } = req.params;

    const role =
      req.admin.role;

    if (
      !isValidUUID(id)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid announcement ID.'
      });
    }

    if (
      !canManageAnnouncements(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to update announcements.'
      });
    }

    const {
      building_id,
      title_en,
      title_am,
      title_om,
      description_en,
      description_am,
      description_om,
      priority,
      starts_at,
      expires_at,
      is_active
    } = req.body;

    // ------------------------------------------------
    // EXISTING
    // ------------------------------------------------

    const {
      data: existingAnnouncement,
      error: existingError
    } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingAnnouncement
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Announcement not found.'
      });
    }

    // ------------------------------------------------
    // EXISTING BUILDING SCOPE
    // ------------------------------------------------

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingAnnouncement.building_id !==
          req.admin.building_id
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: Announcement is outside your building.'
      });
    }

    // ------------------------------------------------
    // FINAL BUILDING
    // ------------------------------------------------

    const finalBuildingId =
      building_id !==
        undefined
        ? building_id
        : existingAnnouncement.building_id;

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
          'Forbidden: Cannot move announcement to another building.'
      });
    }

    // ------------------------------------------------
    // VERIFY FINAL BUILDING
    // ------------------------------------------------

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

    // ------------------------------------------------
    // TITLE
    // ------------------------------------------------

    if (
      title_en !==
        undefined &&
      !getRequiredText(
        title_en
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'title_en must be a non-empty string.'
      });
    }

    // ------------------------------------------------
    // PRIORITY
    // ------------------------------------------------

    if (
      priority !==
        undefined &&
      !VALID_PRIORITIES.includes(
        priority
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid priority. Use low, normal, high, or urgent.'
      });
    }

    // ------------------------------------------------
    // ACTIVE
    // ------------------------------------------------

    if (
      is_active !==
        undefined &&
      typeof is_active !==
        'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    // ------------------------------------------------
    // START DATE
    // ------------------------------------------------

    if (
      starts_at !==
        undefined &&
      starts_at !== null &&
      starts_at !== ''
    ) {
      if (
        Number.isNaN(
          Date.parse(
            starts_at
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'starts_at must be a valid date/time.'
        });
      }
    }

    // ------------------------------------------------
    // EXPIRY DATE
    // ------------------------------------------------

    if (
      expires_at !==
        undefined &&
      expires_at !== null &&
      expires_at !== ''
    ) {
      if (
        Number.isNaN(
          Date.parse(
            expires_at
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'expires_at must be a valid date/time.'
        });
      }
    }

    // ------------------------------------------------
    // FINAL DATES
    // ------------------------------------------------

    const finalStartsAt =
      starts_at !==
        undefined
        ? starts_at || null
        : existingAnnouncement.starts_at;

    const finalExpiresAt =
      expires_at !==
        undefined
        ? expires_at || null
        : existingAnnouncement.expires_at;

    if (
      finalStartsAt &&
      finalExpiresAt &&
      new Date(
        finalExpiresAt
      ) <=
        new Date(
          finalStartsAt
        )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'expires_at must be later than starts_at.'
      });
    }

    // ------------------------------------------------
    // UPDATE OBJECT
    // ------------------------------------------------

    const updates = {
      building_id:
        finalBuildingId,

      updated_at:
        new Date().toISOString()
    };

    if (
      title_en !==
        undefined
    ) {
      updates.title_en =
        title_en.trim();
    }

    if (
      title_am !==
        undefined
    ) {
      updates.title_am =
        title_am || null;
    }

    if (
      title_om !==
        undefined
    ) {
      updates.title_om =
        title_om || null;
    }

    if (
      description_en !==
        undefined
    ) {
      updates.description_en =
        description_en ||
        null;
    }

    if (
      description_am !==
        undefined
    ) {
      updates.description_am =
        description_am ||
        null;
    }

    if (
      description_om !==
        undefined
    ) {
      updates.description_om =
        description_om ||
        null;
    }

    if (
      priority !==
        undefined
    ) {
      updates.priority =
        priority;
    }

    if (
      starts_at !==
        undefined
    ) {
      updates.starts_at =
        starts_at || null;
    }

    if (
      expires_at !==
        undefined
    ) {
      updates.expires_at =
        expires_at || null;
    }

    if (
      is_active !==
        undefined
    ) {
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
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (
      error ||
      !data
    ) {
      console.error(
        'Error updating admin announcement:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update announcement.'
      });
    }

    return res.json({
      success: true,
      message:
        'Announcement updated successfully.',
      data:
        addScheduleStatus(
          data
        )
    });

  } catch (err) {
    console.error(
      'Admin announcement update error:',
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
// PATCH ANNOUNCEMENT STATUS
// PATCH /api/admin/announcements/:id/status
// Body: { is_active: true/false }
// --------------------------------------------------

async function updateAnnouncementStatus(
  req,
  res
) {
  try {
    const {
      id
    } = req.params;

    const {
      is_active
    } = req.body;

    if (
      !isValidUUID(id)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid announcement ID.'
      });
    }

    if (
      !canManageAnnouncements(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to change announcement status.'
      });
    }

    if (
      typeof is_active !==
        'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'is_active must be a boolean.'
      });
    }

    const {
      data: existingAnnouncement,
      error: existingError
    } = await supabase
      .from('announcements')
      .select(
        'id, building_id, is_active'
      )
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingAnnouncement
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Announcement not found.'
      });
    }

    // ------------------------------------------------
    // BUILDING SCOPE
    // ------------------------------------------------

    if (
      req.admin.role !==
        'super_admin' &&
      (
        !req.admin.building_id ||
        existingAnnouncement.building_id !==
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
      .from('announcements')
      .update({
        is_active,

        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (
      error ||
      !data
    ) {
      console.error(
        'Error updating announcement status:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update announcement status.'
      });
    }

    return res.json({
      success: true,
      message:
        'Announcement status updated successfully.',
      data:
        addScheduleStatus(
          data
        )
    });

  } catch (err) {
    console.error(
      'Admin announcement status error:',
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
// DELETE ANNOUNCEMENT
// DELETE /api/admin/announcements/:id
// --------------------------------------------------

async function deleteAnnouncement(
  req,
  res
) {
  try {
    const {
      id
    } = req.params;

    const role =
      req.admin.role;

    if (
      !isValidUUID(id)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid announcement ID.'
      });
    }

    if (
      !canManageAnnouncements(
        role
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Forbidden: You do not have permission to delete announcements.'
      });
    }

    const {
      data: existingAnnouncement,
      error: existingError
    } = await supabase
      .from('announcements')
      .select(
        'id, building_id'
      )
      .eq('id', id)
      .single();

    if (
      existingError ||
      !existingAnnouncement
    ) {
      return res.status(404).json({
        success: false,
        error:
          'Announcement not found.'
      });
    }

    // ------------------------------------------------
    // BUILDING SCOPE
    // ------------------------------------------------

    if (
      role !== 'super_admin' &&
      (
        !req.admin.building_id ||
        existingAnnouncement.building_id !==
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
      error
    } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Error deleting admin announcement:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to delete announcement.'
      });
    }

    return res.json({
      success: true,
      message:
        'Announcement deleted successfully.'
    });

  } catch (err) {
    console.error(
      'Admin announcement delete error:',
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
// EXPORTS
// --------------------------------------------------

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement
};
