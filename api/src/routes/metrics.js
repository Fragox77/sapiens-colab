const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  getDashboardMetrics,
  getPerformanceMetrics,
  getFinanceMetrics,
} = require('../services/analytics.service');

router.use(auth, roles('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const data = await getDashboardMetrics(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const data = await getPerformanceMetrics(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/finance', async (req, res) => {
  try {
    const data = await getFinanceMetrics(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;