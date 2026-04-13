const router = require('express').Router();
const { getProjectsByTenant, validateProjectPayload } = require('../service/projects.service');

router.get('/', async (req, res) => {
  const tenantId = req.tenantContext && req.tenantContext.tenantId;
  const projects = await getProjectsByTenant(tenantId);
  res.json(projects);
});

router.post('/validate', (req, res) => {
  try {
    validateProjectPayload(req.body);
    res.json({ valid: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
