const router = require('express').Router();
const Application = require('../models/Application');
const { auth, roles } = require('../middleware/auth');

const PAY_RANGES = {
  1: '$40.000 - $60.000 / hora',
  2: '$40.000 - $60.000 / hora',
  3: '$60.000 - $90.000 / hora',
  4: '$60.000 - $90.000 / hora',
  5: '$90.000 - $130.000 / hora',
  6: '$90.000 - $130.000 / hora',
  7: '$130.000 - $180.000 / hora',
  8: '$130.000 - $180.000 / hora',
  9: '$180.000 - $250.000 / hora',
  10: '$180.000 - $250.000 / hora',
};

// POST /api/applications — Formulario público
router.post('/', async (req, res) => {
  try {
    const {
      name, email, phone, city, role,
      experience, experienceYears,
      availability,
      portfolio, motivation,
      tools, source, workDescription,
    } = req.body;

    if (!name || !email || !phone || !role || !motivation)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });

    if (await Application.findOne({ email }))
      return res.status(409).json({ error: 'Ya existe una postulación con ese email' });

    const app = await Application.create({
      name,
      email,
      phone,
      city:         city || '',
      role,
      experience:   experience || String(experienceYears ?? 0),
      availability: availability || 'disponible',
      portfolio:    portfolio || null,
      motivation,
      tools:           tools || [],
      source:          source || null,
      experienceYears: experienceYears ?? null,
      workDescription: workDescription || null,
    });

    res.status(201).json({
      message: 'Postulación recibida. Te contactaremos en máximo 3 días hábiles.',
      id: app._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/applications/:id/estado — admin
router.patch('/:id/estado', auth, roles('admin'), async (req, res) => {
  try {
    const { estado, briefPrueba, fechaLimitePrueba } = req.body;
    const valid = ['pendiente', 'en_prueba', 'evaluado', 'aprobado', 'descartado'];
    if (!valid.includes(estado))
      return res.status(400).json({ error: 'Estado inválido' });

    const update = {
      estado,
      $push: { timeline: { estado, by: req.user._id, at: new Date() } },
    };
    if (briefPrueba !== undefined)       update.briefPrueba = briefPrueba;
    if (fechaLimitePrueba !== undefined) update.fechaLimitePrueba = fechaLimitePrueba || null;

    const app = await Application.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    res.json({ ok: true, application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/applications/:id/evaluar — admin
router.patch('/:id/evaluar', auth, roles('admin'), async (req, res) => {
  try {
    const { experiencia, portafolio, pruebaPractica, pensamientoEstrategico, softSkills } = req.body;
    const pilares = { experiencia, portafolio, pruebaPractica, pensamientoEstrategico, softSkills };

    for (const [key, val] of Object.entries(pilares)) {
      if (!val || typeof val.puntaje !== 'number' || val.puntaje < 1 || val.puntaje > 10)
        return res.status(400).json({ error: `Puntaje inválido en ${key} (debe ser 1–10)` });
    }

    const ponderado = (
      experiencia.puntaje            * 0.20 +
      portafolio.puntaje             * 0.25 +
      pruebaPractica.puntaje         * 0.25 +
      pensamientoEstrategico.puntaje * 0.15 +
      softSkills.puntaje             * 0.15
    );
    const nivelCalculado = Math.min(10, Math.max(1, Math.round(ponderado)));
    const rangoPago = PAY_RANGES[nivelCalculado];

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      {
        estado:   'evaluado',
        level:    nivelCalculado,
        payRange: rangoPago,
        evaluacion: {
          experiencia, portafolio, pruebaPractica, pensamientoEstrategico, softSkills,
          nivelCalculado,
          rangoPago,
          evaluadoAt:  new Date(),
          evaluadoPor: req.user._id,
        },
        $push: { timeline: { estado: 'evaluado', by: req.user._id, at: new Date() } },
      },
      { new: true },
    );
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    res.json({ ok: true, application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
