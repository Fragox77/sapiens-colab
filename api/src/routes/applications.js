const router = require('express').Router();
const Application = require('../models/Application');

// POST /api/applications — Formulario público de postulación
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, city, role, experience, availability, portfolio, motivation } = req.body;
    if (!name || !email || !phone || !role || !experience || !motivation)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });

    // Evitar duplicados
    if (await Application.findOne({ email }))
      return res.status(409).json({ error: 'Ya existe una postulación con ese email' });

    const app = await Application.create({ name, email, phone, city, role, experience, availability, portfolio, motivation });
    res.status(201).json({ message: 'Postulación recibida. Te contactaremos en máximo 3 días hábiles.', id: app._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
