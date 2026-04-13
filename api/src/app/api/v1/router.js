const router = require('express').Router();
const { tenantContext } = require('../../../shared/security/tenant-context.middleware');

router.use(tenantContext);
router.use('/auth', require('../../../modules/auth/api/auth.routes'));
router.use('/billing', require('../../../modules/billing/api/billing.routes'));
router.use('/projects', require('../../../modules/projects/api/projects.routes'));
router.use('/quotes', require('../../../modules/quotes/api/quotes.routes'));
router.use('/users', require('../../../modules/users/api/users.routes'));
router.use('/tenants', require('../../../modules/tenants/api/tenants.routes'));
router.use('/leads', require('../../../modules/leads/api/leads.routes'));

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', apiVersion: 'v1' });
});

module.exports = router;
