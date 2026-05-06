const router = require('express').Router();
const auth   = require('../middleware/auth');
const roles  = require('../middleware/roles');
const { getDashboardStats } = require('../services/analytics.service');

router.use(auth, roles('admin'));

router.get('/stats', async (req, res) => {
  try {
    const data = await getDashboardStats(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
