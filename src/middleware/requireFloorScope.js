const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function requireFloorScope(floorParamKey = 'floor_id') {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.is_active) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Super admin bypasses floor restrictions
      if (req.admin.role === 'super_admin') {
        return next();
      }

      const targetFloorId = req.params[floorParamKey] || req.body[floorParamKey] || req.query[floorParamKey];

      // Fetch assigned floors for this admin from database
      const { data: assignments, error } = await supabase
        .from('admin_floor_assignments')
        .select('floor_id, floors(building_id)')
        .eq('admin_id', req.admin.id);

      if (error || !assignments) {
        return res.status(403).json({ error: 'Forbidden: Floor assignment verification failed' });
      }

      const assignedFloorIds = assignments.map(a => a.floor_id);

      // If a specific floor is being accessed, verify permission
      if (targetFloorId) {
        if (!assignedFloorIds.includes(targetFloorId)) {
          return res.status(403).json({ error: 'Forbidden: Unassigned floor access' });
        }

        // Additional safeguard: verify floor belongs to the admin's building scope if applicable
        const targetAssignment = assignments.find(a => a.floor_id === targetFloorId);
        if (targetAssignment && targetAssignment.floors && req.admin.building_id) {
          if (targetAssignment.floors.building_id !== req.admin.building_id) {
            return res.status(403).json({ error: 'Forbidden: Building scope violation for floor' });
          }
        }
      }

      req.assignedFloorIds = assignedFloorIds;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Forbidden: Floor authorization error' });
    }
  };
}

module.exports = { requireFloorScope };