const supabase = require('../../config/supabase');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_STATUSES = [
  'new',
  'reviewed',
  'resolved',
  'archived'
];

function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isBuildingScopedRole(role) {
  return (
    role === 'building_manager' ||
    role === 'feedback_manager'
  );
}

async function getAssignedFloorIds(adminId) {
  const { data, error } = await supabase
    .from('admin_floor_assignments')
    .select('floor_id')
    .eq('admin_id', adminId);

  if (error) {
    throw new Error('Failed to verify floor assignments.');
  }

  return (data || []).map((item) => item.floor_id);
}

async function getFeedbackById(id) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function canViewFeedback(req, feedback) {
  const role = req.admin.role;

  // Super Admin can see everything.
  if (role === 'super_admin') {
    return true;
  }

  // Building Manager and Feedback Manager
  // can only access their assigned building.
  if (isBuildingScopedRole(role)) {
    return feedback.building_id === req.admin.building_id;
  }

  // Floor Manager can only see feedback explicitly
  // attached to one of their assigned floors.
  if (role === 'floor_manager') {
    if (!feedback.floor_id) {
      return false;
    }

    const assignedFloorIds =
      await getAssignedFloorIds(req.admin.id);

    return assignedFloorIds.includes(feedback.floor_id);
  }

  return false;
}

const feedbackController = {

  // GET /api/admin/feedback
  async getAllFeedback(req, res) {
    try {
      const {
        status,
        rating,
        floor_id,
        office_id,
        service_id,
        from,
        to
      } = req.query;

      const role = req.admin.role;

      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      // -----------------------------------------
      // BUILDING SCOPE
      // -----------------------------------------

      if (isBuildingScopedRole(role)) {
        query = query.eq(
          'building_id',
          req.admin.building_id
        );
      }

      // -----------------------------------------
      // FLOOR MANAGER SCOPE
      // -----------------------------------------

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

        query = query.in(
          'floor_id',
          assignedFloorIds
        );
      }

      // -----------------------------------------
      // FILTERS
      // -----------------------------------------

      if (status) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({
            success: false,
            error:
              'Invalid status. Allowed values: new, reviewed, resolved, archived.'
          });
        }

        query = query.eq('status', status);
      }

      if (rating !== undefined) {
        const numericRating = Number(rating);

        if (
          !Number.isInteger(numericRating) ||
          numericRating < 1 ||
          numericRating > 5
        ) {
          return res.status(400).json({
            success: false,
            error:
              'Rating must be an integer between 1 and 5.'
          });
        }

        query = query.eq('rating', numericRating);
      }

      if (floor_id) {
        if (!isValidUUID(floor_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid floor_id.'
          });
        }

        query = query.eq('floor_id', floor_id);
      }

      if (office_id) {
        if (!isValidUUID(office_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid office_id.'
          });
        }

        query = query.eq('office_id', office_id);
      }

      if (service_id) {
        if (!isValidUUID(service_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid service_id.'
          });
        }

        query = query.eq(
          'service_id',
          service_id
        );
      }

      if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid from date.'
          });
        }

        query = query.gte(
          'created_at',
          fromDate.toISOString()
        );
      }

      if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid to date.'
          });
        }

        query = query.lte(
          'created_at',
          toDate.toISOString()
        );
      }

      // -----------------------------------------
      // EXECUTE QUERY
      // -----------------------------------------

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching admin feedback:',
          error
        );

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch feedback.'
        });
      }

      return res.json({
        success: true,
        total: data?.length || 0,
        data: data || []
      });

    } catch (err) {
      console.error(
        'Admin feedback list error:',
        err
      );

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // GET /api/admin/feedback/:id
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid feedback ID.'
        });
      }

      const feedback =
        await getFeedbackById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          error: 'Feedback not found.'
        });
      }

      const allowed =
        await canViewFeedback(
          req,
          feedback
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Feedback access denied.'
        });
      }

      return res.json({
        success: true,
        data: feedback
      });

    } catch (err) {
      console.error(
        'Admin feedback detail error:',
        err
      );

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // PATCH /api/admin/feedback/:id/status
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid feedback ID.'
        });
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid status. Allowed values: new, reviewed, resolved, archived.'
        });
      }

      const feedback =
        await getFeedbackById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          error: 'Feedback not found.'
        });
      }

      // Floor Managers are read-only for feedback.
      if (req.admin.role === 'floor_manager') {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Floor Managers cannot change feedback status.'
        });
      }

      const allowed =
        await canViewFeedback(
          req,
          feedback
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: Feedback scope violation.'
        });
      }

      const {
        data,
        error
      } = await supabase
        .from('feedback')
        .update({
          status
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error(
          'Error updating feedback status:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to update feedback status.'
        });
      }

      return res.json({
        success: true,
        message:
          'Feedback status updated successfully.',
        data
      });

    } catch (err) {
      console.error(
        'Admin feedback status error:',
        err
      );

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = feedbackController;