const router = require('express').Router();
const { calcular } = require('../utils/cotizador');

// POST /api/quotes
router.post('/', (req, res) => {
  try {
    const result = calcular(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
