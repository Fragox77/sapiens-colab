function tenantContext(req, _res, next) {
  // MVP multi-tenant: resolve tenant from header, token claim or fallback.
  const fromHeader = req.headers['x-tenant-id'];
  const fromToken = req.user && req.user.tenantId;
  req.tenantContext = {
    tenantId: String(fromHeader || fromToken || 'public-demo'),
  };
  next();
}

module.exports = { tenantContext };
