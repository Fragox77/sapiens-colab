/**
 * Resuelve el tenantId desde el header x-tenant-id, el subdominio, o lo toma
 * del usuario autenticado que ya fue verificado por el middleware JWT global.
 */
function resolveTenantId(req) {
  const fromHeader = req.headers['x-tenant-id'];
  if (typeof fromHeader === 'string' && fromHeader.trim()) {
    return fromHeader.trim();
  }

  if (req.user && req.user.tenantId) {
    return String(req.user.tenantId);
  }

  const fromSubdomain = req.hostname.split('.')[0];
  if (fromSubdomain && fromSubdomain !== 'localhost') {
    return fromSubdomain;
  }

  return null;
}

function tenantContext(req, res, next) {
  const tenantId = resolveTenantId(req);
  if (tenantId) {
    req.headers['x-tenant-id'] = tenantId;
    req.tenantId = tenantId;
  }
  next();
}

module.exports = { tenantContext };
