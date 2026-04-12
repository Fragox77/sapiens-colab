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

// ─── FINANCIERO ───────────────────────────────────────────────

// PATCH /api/admin/projects/:id/anticipo — Registrar pago de anticipo
router.patch('/projects/:id/anticipo', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'No encontrado' });
    if (project.payments.anticipo.paid)
      return res.status(400).json({ error: 'El anticipo ya fue registrado' });

    project.payments.anticipo.paid  = true;
    project.payments.anticipo.paidAt = new Date();
    project.timeline.push({ action: 'ANTICIPO_RECIBIDO', by: req.user.id });
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/financiero — Reporte financiero completo
router.get('/financiero', async (_req, res) => {
  try {
    const projects = await Project.find({ status: { $ne: 'cancelado' } })
      .populate('client',   'name company')
      .populate('designer', 'name level specialty')
      .sort('-createdAt');

    // ─── KPIs globales ────────────────────────────────────────
    const completados  = projects.filter(p => p.status === 'completado');
    const activos      = projects.filter(p => !['completado', 'cancelado', 'cotizado'].includes(p.status));
    const cotizados    = projects.filter(p => p.status === 'cotizado');

    const totalFacturado  = completados.reduce((a, p) => a + p.pricing.total, 0);
    const comisionSapiens = completados.reduce((a, p) => a + p.pricing.commission, 0);
    const pagadoDisenadores = completados.reduce((a, p) => a + p.pricing.designerPay, 0);

    // Pipeline activo (lo que está en producción, por cobrar)
    const pipelineTotal   = activos.reduce((a, p) => a + p.pricing.total, 0);
    const pipelineBalance = activos
      .filter(p => !p.payments.balance.paid)
      .reduce((a, p) => a + p.pricing.balance, 0);

    // Anticipos pendientes de recibir
    const anticiposPendientes = projects
      .filter(p => !p.payments.anticipo.paid && p.status !== 'cotizado')
      .reduce((a, p) => a + p.pricing.anticipo, 0);

    // Balances pendientes de cobrar (proyectos aprobados)
    const balancesPendientes = projects
      .filter(p => p.status === 'aprobado' && !p.payments.balance.paid)
      .reduce((a, p) => a + p.pricing.balance, 0);

    // ─── Deuda por diseñador (proyectos completados sin liquidar) ─
    const deudaMap = {};
    completados
      .filter(p => p.designer && !p.payments.balance.paid)
      .forEach(p => {
        const id = String(p.designer._id || p.designer);
        if (!deudaMap[id]) deudaMap[id] = { designer: p.designer, proyectos: [], totalDeuda: 0 };
        deudaMap[id].proyectos.push({ id: p._id, title: p.title, pay: p.pricing.designerPay });
        deudaMap[id].totalDeuda += p.pricing.designerPay;
      });

    // ─── Ingresos por mes (últimos 6 meses) ───────────────────
    const porMes = await Project.aggregate([
      { $match: { status: 'completado', completedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id:     { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
        ingresos: { $sum: '$pricing.total' },
        utilidad: { $sum: '$pricing.commission' },
        proyectos: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      kpis: {
        totalFacturado,
        comisionSapiens,
        pagadoDisenadores,
        pipelineTotal,
        anticiposPendientes,
        balancesPendientes,
        totalProyectos: projects.length,
        proyectosActivos: activos.length,
      },
      proyectos: projects.map(p => ({
        _id:    p._id,
        title:  p.title,
        status: p.status,
        client:   p.client,
        designer: p.designer,
        pricing:  p.pricing,
        payments: p.payments,
        createdAt:   p.createdAt,
        completedAt: p.completedAt,
      })),
      deudaDisenadores: Object.values(deudaMap),
      ingresosPorMes: porMes,
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

// GET /api/admin/applications/:id — Detalle de una postulación
router.get('/applications/:id', async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('userId', 'name email level isActive');
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/applications/:id/brief — Asignar brief de prueba técnica
router.patch('/applications/:id/brief', async (req, res) => {
  try {
    const { brief } = req.body;
    if (!brief) return res.status(400).json({ error: 'El brief es requerido' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    if (['aceptada', 'rechazada'].includes(app.status))
      return res.status(400).json({ error: 'No se puede modificar una postulación ya cerrada' });

    app.briefAssigned = brief;
    app.status = 'prueba-enviada';
    await app.save();

    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/applications/:id/activate — Activar diseñador (crear cuenta)
router.patch('/applications/:id/activate', async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    if (app.status === 'aceptada')
      return res.status(400).json({ error: 'Esta postulación ya fue activada' });
    if (app.status === 'rechazada')
      return res.status(400).json({ error: 'No se puede activar una postulación rechazada' });
    if (!app.level)
      return res.status(400).json({ error: 'Debes evaluar y calcular el nivel antes de activar' });

    const existing = await User.findOne({ email: app.email });
    if (existing)
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

    const tempPassword = 'Sapiens' + Math.floor(1000 + Math.random() * 9000);

    const user = await User.create({
      name:        app.name,
      email:       app.email,
      password:    tempPassword,
      role:        'disenador',
      level:       app.level,
      specialty:   app.role,
      portfolio:   app.portfolio || undefined,
      phone:       app.phone,
      isActive:    true,
      isAvailable: true,
    });

    app.userId = user._id;
    app.status = 'aceptada';
    await app.save();

    res.json({ application: app, user: user.toSafeJSON(), tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/applications/:id/reject — Rechazar postulación
router.patch('/applications/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Postulación no encontrada' });
    if (['aceptada', 'rechazada'].includes(app.status))
      return res.status(400).json({ error: 'No se puede modificar una postulación ya cerrada' });

    app.status = 'rechazada';
    if (notes) app.notes = notes;
    await app.save();

    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
