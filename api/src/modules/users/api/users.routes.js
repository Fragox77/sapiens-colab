const router = require('express').Router();
const { getUsers } = require('../service/users.service');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantContext && req.tenantContext.tenantId;
    const users = await getUsers(tenantId, req.query.filter);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
