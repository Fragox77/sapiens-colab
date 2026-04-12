const router = require('express').Router();
const { SERVICES, calcular } = require('../utils/cotizador');

// GET /api/services — Lista servicios con precios base
router.get('/', (_req, res) => res.json(SERVICES));

// POST /api/services/quote — Cotización rápida pública
router.post('/quote', (req, res) => {
  try {
    const result = calcular(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
