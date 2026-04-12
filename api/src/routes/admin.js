const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const User = require('../models/User');
const Application = require('../models/Application');
const { calcularPagoDisenador } = require('../utils/cotizador');

// Todos los endpoints requieren auth + rol admin
router.use(auth, roles('admin'));

// ─── PROYECTOS ────────────────────────────────────────────────

// PATCH /api/admin/projects/:id/assign — Asignar diseñador
router.patch('/projects/:id/assign', async (req, res) => {
  try {
    const { designerId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const designer = await User.findById(designerId);
    if (!designer || designer.role !== 'disenador')
      return res.status(400).json({ error: 'Diseñador no válido' });
    if (designer.level < project.minDesignerLevel)
      return res.status(400).json({ error: `Este proyecto requiere nivel mínimo ${project.minDesignerLevel}. El diseñador está en nivel ${designer.level}` });

    project.designer = designerId;
    project.status = 'activo';
    project.timeline.push({ action: 'ASIGNADO', by: req.user.id, message: `Asignado a ${designer.name}` });
    await project.save();

    // Notificar diseñador
    req.app.locals.notifyUser(designerId, { type: 'PROJECT_ASSIGNED', projectId: project._id });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/projects/:id/complete — Cerrar y liquidar
router.patch('/projects/:id/complete', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('designer');
    if (!project) return res.status(404).json({ error: 'No encontrado' });
    if (project.status !== 'aprobado')
      return res.status(400).json({ error: 'El cliente debe aprobar antes de cerrar' });

    project.status = 'completado';
    project.completedAt = new Date();
    project.payments.balance.paid = true;
    project.payments.balance.paidAt = new Date();
    project.timeline.push({ action: 'COMPLETADO', by: req.user.id });
    await project.save();

    res.json({ project, designerPay: project.pricing.designerPay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USUARIOS ─────────────────────────────────────────────────

// GET /api/admin/designers — Diseñadores disponibles
router.get('/designers', async (_req, res) => {
  try {
    const designers = await User.find({ role: 'disenador', isActive: true })
      .select('name email level specialty isAvailable')
      .sort('-level');
    res.json(designers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DASHBOARD ────────────────────────────────────────────────

// GET /api/admin/dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const [total, activos, completados, cotizados] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'activo' }),
      Project.countDocuments({ status: 'completado' }),
      Project.countDocuments({ status: 'cotizado' }),
    ]);

    const ingresos = await Project.aggregate([
      { $match: { status: 'completado' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' }, utilidad: { $sum: { $subtract: ['$pricing.total', { $add: ['$pricing.designerPay', { $multiply: ['$pricing.total', 0.19] }] }] } } } },
    ]);

    res.json({
      projects: { total, activos, completados, cotizados },
      finanzas: ingresos[0] || { total: 0, utilidad: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POSTULACIONES ────────────────────────────────────────────

// GET /api/admin/applications
router.get('/applications', async (_req, res) => {
  try {
    const apps = await Application.find().sort('-createdAt');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/applications/:id/evaluate
router.patch('/applications/:id/evaluate', async (req, res) => {
  try {
    const { scores, notes, status } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'No encontrada' });

    app.scores = { ...app.scores, ...scores };
    if (notes) app.notes = notes;
    if (status) app.status = status;

    // Calcular level automático (ponderado)
    const { experiencia = 0, portafolio = 0, prueba = 0, estrategia = 0, softSkills = 0 } = app.scores;
    const weighted = (experiencia * 0.20) + (portafolio * 0.25) + (prueba * 0.25) + (estrategia * 0.15) + (softSkills * 0.15);
    app.level = Math.max(1, Math.min(10, Math.round(weighted)));

    const payRanges = {
      1: '$800k–$1.5M', 2: '$800k–$1.5M', 3: '$800k–$1.5M',
      4: '$1.5M–$3.5M', 5: '$1.5M–$3.5M', 6: '$1.5M–$3.5M',
      7: '$3.5M–$5M',   8: '$3.5M–$5M',
      9: '$5M+',        10: '$5M+',
    };
    app.payRange = payRanges[app.level];

    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
