const router = require('express').Router();
const auth = require('../../../../middleware/auth');

// Módulo Billing — pendiente de implementación (Sprint 4)
router.get('/', auth, (_req, res) => {
  res.json({ data: [], message: 'Billing module coming soon' });
});

module.exports = router;
