const router = require('express').Router();
const { getAuthInfo, validateLoginInput } = require('../service/auth.service');

router.get('/info', async (_req, res) => {
  const info = await getAuthInfo();
  res.json(info);
});

router.post('/validate-login', (req, res) => {
  try {
    validateLoginInput(req.body);
    res.json({ valid: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
