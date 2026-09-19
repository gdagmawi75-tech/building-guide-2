function requireBuildingScope(paramKey = 'building_id') {
  return (req, res, next) => {
    if (!req.admin || !req.admin.is_active) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Super admin has global access across all buildings
    if (req.admin.role === 'super_admin') {
      return next();
    }

    const adminBuildingId = req.admin.building_id;
    if (!adminBuildingId) {
      return res.status(403).json({ error: 'Forbidden: No building assignment found' });
    }

    // Forcefully override client-supplied building identifiers with trusted server-derived scope
    if (req.params && req.params[paramKey]) {
      if (req.params[paramKey] !== adminBuildingId) {
        return res.status(403).json({ error: 'Forbidden: Building scope violation' });
      }
    }

    if (req.body && req.body[paramKey]) {
      req.body[paramKey] = adminBuildingId;
    }

    if (req.query && req.query[paramKey]) {
      req.query[paramKey] = adminBuildingId;
    }

    // Attach trusted scope to req for subsequent controllers
    req.scopedBuildingId = adminBuildingId;
    next();
  };
}

module.exports = { requireBuildingScope };