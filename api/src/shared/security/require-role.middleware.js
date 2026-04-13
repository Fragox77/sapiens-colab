function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'No autorizado para este recurso' });
    }
    return next();
  };
}

module.exports = { requireRole };
