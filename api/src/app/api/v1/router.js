const router = require('express').Router();
const { tenantContext } = require('./middleware/tenant-context');

router.use(tenantContext);
router.use('/auth',     require('../../../routes/auth'));
router.use('/projects', require('../../../routes/projects'));
router.use('/quotes',   require('../../../routes/quotes'));
router.use('/users',    require('../../../routes/users'));
router.use('/billing',  require('./routes/billing'));
router.use('/tenants',  require('./routes/tenants'));
router.use('/leads',    require('./routes/leads'));

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', apiVersion: 'v1' });
});

module.exports = router;
