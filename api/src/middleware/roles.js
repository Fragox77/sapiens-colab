// Uso: require('roles')('admin') o require('roles')('admin','disenador')
const roles = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Acceso denegado para este rol' });
  }
  next();
};

module.exports = roles;
