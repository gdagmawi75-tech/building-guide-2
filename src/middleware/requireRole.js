function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !req.admin.is_active) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Super admin bypasses all role checks
    if (req.admin.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }

    next();
  };
}

module.exports = { requireRole };