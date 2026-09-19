const supabase = require('../../config/supabase');

async function countRows(table, buildingId, isActive) {
  let query = supabase
    .from(table)
    .select('id', {
      count: 'exact',
      head: true
    });

  if (buildingId) {
    query = query.eq('building_id', buildingId);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(
      `Failed to count ${table}: ${error.message}`
    );
  }

  return count || 0;
}

async function getQRCodeAnalytics(buildingId) {
  let query = supabase
    .from('qr_codes')
    .select(
      'id, building_id, floor_id, qr_code, location_type, label_en, label_am, label_om, scan_count, is_active, created_at'
    )
    .order('scan_count', {
      ascending: false
    });

  if (buildingId) {
    query = query.eq(
      'building_id',
      buildingId
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to load QR analytics: ${error.message}`
    );
  }

  const qrCodes = data || [];

  const totalScans = qrCodes.reduce(
    (sum, item) =>
      sum + (Number(item.scan_count) || 0),
    0
  );

  return {
    total: qrCodes.length,

    active: qrCodes.filter(
      (item) => item.is_active === true
    ).length,

    totalScans,

    topQRs: qrCodes
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        label:
          item.label_en ||
          item.label_am ||
          item.label_om ||
          'Unnamed QR Code',
        locationType:
          item.location_type,
        scanCount:
          Number(item.scan_count) || 0,
        isActive: item.is_active
      }))
  };
}

async function getFeedbackAnalytics(buildingId) {
  let query = supabase
    .from('feedback')
    .select(
      'id, rating, status, created_at'
    );

  if (buildingId) {
    query = query.eq(
      'building_id',
      buildingId
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to load feedback analytics: ${error.message}`
    );
  }

  const feedback = data || [];

  const ratings = feedback
    .map((item) => Number(item.rating))
    .filter(
      (rating) =>
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
    );

  const averageRating =
    ratings.length > 0
      ? Number(
          (
            ratings.reduce(
              (sum, rating) =>
                sum + rating,
              0
            ) /
            ratings.length
          ).toFixed(2)
        )
      : 0;

  const statusCounts = {
    new: 0,
    reviewed: 0,
    resolved: 0,
    archived: 0
  };

  const ratingCounts = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  };

  for (const item of feedback) {
    if (
      Object.prototype.hasOwnProperty.call(
        statusCounts,
        item.status
      )
    ) {
      statusCounts[item.status] += 1;
    }

    const rating = Number(item.rating);

    if (
      Number.isInteger(rating) &&
      rating >= 1 &&
      rating <= 5
    ) {
      ratingCounts[String(rating)] += 1;
    }
  }

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(
    0,
    0,
    0,
    0
  );

  const sevenDaysStart =
    new Date(todayStart);

  sevenDaysStart.setDate(
    sevenDaysStart.getDate() - 6
  );

  let today = 0;
  let lastSevenDays = 0;

  for (const item of feedback) {
    const createdAt = new Date(
      item.created_at
    );

    if (createdAt >= todayStart) {
      today += 1;
    }

    if (
      createdAt >= sevenDaysStart
    ) {
      lastSevenDays += 1;
    }
  }

  return {
    total: feedback.length,
    today,
    lastSevenDays,
    averageRating,
    statusCounts,
    ratingCounts
  };
}

const analyticsAdminController = {
  async getAnalytics(req, res) {
    try {
      const role = req.admin.role;

      let buildingId = null;

      if (
        role === 'building_manager'
      ) {
        buildingId =
          req.admin.building_id;
      }

      const [
        buildings,
        activeBuildings,
        floors,
        activeFloors,
        offices,
        activeOffices,
        departments,
        activeDepartments,
        services,
        activeServices,
        employees,
        activeEmployees,
        facilities,
        activeFacilities,
        qrCodes,
        feedback
      ] = await Promise.all([
        countRows(
          'buildings',
          buildingId
        ),
        countRows(
          'buildings',
          buildingId,
          true
        ),
        countRows(
          'floors',
          buildingId
        ),
        countRows(
          'floors',
          buildingId,
          true
        ),
        countRows(
          'offices',
          buildingId
        ),
        countRows(
          'offices',
          buildingId,
          true
        ),
        countRows(
          'departments',
          buildingId
        ),
        countRows(
          'departments',
          buildingId,
          true
        ),
        countRows(
          'services',
          buildingId
        ),
        countRows(
          'services',
          buildingId,
          true
        ),
        countRows(
          'employees',
          buildingId
        ),
        countRows(
          'employees',
          buildingId,
          true
        ),
        countRows(
          'facilities',
          buildingId
        ),
        countRows(
          'facilities',
          buildingId,
          true
        ),
        getQRCodeAnalytics(
          buildingId
        ),
        getFeedbackAnalytics(
          buildingId
        )
      ]);

      return res.json({
        success: true,

        scope: {
          role,
          buildingId
        },

        content: {
          buildings: {
            total: buildings,
            active: activeBuildings
          },

          floors: {
            total: floors,
            active: activeFloors
          },

          offices: {
            total: offices,
            active: activeOffices
          },

          departments: {
            total: departments,
            active: activeDepartments
          },

          services: {
            total: services,
            active: activeServices
          },

          employees: {
            total: employees,
            active: activeEmployees
          },

          facilities: {
            total: facilities,
            active: activeFacilities
          }
        },

        qrCodes: qrCodes,

        feedback: feedback
      });
    } catch (error) {
      console.error(
        'Admin analytics error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          'Failed to load analytics.'
      });
    }
  }
};

module.exports =
  analyticsAdminController;
