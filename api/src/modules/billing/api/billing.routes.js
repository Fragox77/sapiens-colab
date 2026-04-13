const router = require('express').Router();
const {
  listPlans,
  getBillingOverview,
  previewBilling,
  changeTenantPlan,
} = require('../service/billing.service');

router.get('/plans', (_req, res) => {
  res.json({ items: listPlans() });
});

router.get('/overview', async (req, res) => {
  const tenantId = req.tenantContext && req.tenantContext.tenantId;
  const overview = await getBillingOverview(tenantId);
  res.json(overview);
});

router.post('/preview', (req, res) => {
  try {
    const preview = previewBilling(req.body);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/plan', async (req, res) => {
  try {
    const tenantId = req.tenantContext && req.tenantContext.tenantId;
    const updated = await changeTenantPlan(tenantId, req.body && req.body.plan);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
