const router = require('express').Router();
const { getTenantContext } = require('../service/tenants.service');

router.get('/context', async (req, res) => {
  const tenantId = req.tenantContext && req.tenantContext.tenantId;
  const tenant = await getTenantContext(tenantId);
  res.json(tenant);
});

module.exports = router;
