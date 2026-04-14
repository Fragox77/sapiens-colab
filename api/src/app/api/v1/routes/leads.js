const router = require('express').Router();
const auth = require('../../../../middleware/auth');

// Módulo Leads — pendiente de implementación (Sprint 5)
router.get('/', auth, (_req, res) => {
  res.json({ data: [], message: 'Leads module coming soon' });
});

module.exports = router;
