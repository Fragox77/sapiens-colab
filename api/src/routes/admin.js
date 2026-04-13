const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const User = require('../models/User');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const { calcularPagoDisenador } = require('../utils/cotizador');

async function logActivity(payload) {
  try {
    await ActivityLog.create(payload);
  } catch (_) {
    // Los logs no deben romper endpoints criticos.
  }
}

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
    project.assignedTo = designerId;
    if (!project.startedAt) project.startedAt = new Date();
    project.status = 'activo';
    project.price = project.pricing.total;
    project.cost = project.pricing.designerPay;
    project.clientId = project.client;
    project.timeline.push({ action: 'ASIGNADO', by: req.user.id, message: `Asignado a ${designer.name}` });
    await project.save();

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'admin',
      eventType: 'project_assigned',
      meta: { designerId, designerName: designer.name },
    });

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

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'admin',
      eventType: 'project_completed',
      meta: { balancePaid: true, designerPay: project.pricing.designerPay },
    });

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
    const [stats] = await Project.aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                activos: { $sum: { $cond: [{ $eq: ['$status', 'activo'] }, 1, 0] } },
                completados: { $sum: { $cond: [{ $eq: ['$status', 'completado'] }, 1, 0] } },
                cotizados: { $sum: { $cond: [{ $eq: ['$status', 'cotizado'] }, 1, 0] } },
              },
            },
          ],
          finanzas: [
            { $match: { status: 'completado' } },
            {
              $group: {
                _id: null,
                total: { $sum: '$pricing.total' },
                utilidad: {
                  $sum: {
                    $subtract: [
                      '$pricing.total',
                      { $add: ['$pricing.designerPay', { $multiply: ['$pricing.total', 0.19] }] },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const counts = (stats && stats.counts && stats.counts[0]) || {
      total: 0,
      activos: 0,
      completados: 0,
      cotizados: 0,
    };

    const rawIngresos = (stats && stats.finanzas && stats.finanzas[0]) || { total: 0, utilidad: 0 };
    const ingresos = { total: rawIngresos.total || 0, utilidad: rawIngresos.utilidad || 0 };

    res.json({
      projects: {
        total: counts.total,
        activos: counts.activos,
        completados: counts.completados,
        cotizados: counts.cotizados,
      },
      finanzas: ingresos,
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

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'admin',
      eventType: 'payment_received',
      meta: { type: 'anticipo', amount: project.pricing.anticipo },
    });

    if (project.status === 'activo') {
      await logActivity({
        userId: req.user.id,
        projectId: project._id,
        actorRole: 'admin',
        eventType: 'project_started',
        meta: { startedAt: new Date().toISOString() },
      });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/financiero — Reporte financiero completo
router.get('/financiero', async (_req, res) => {
  try {
    const [summary] = await Project.aggregate([
      { $match: { status: { $ne: 'cancelado' } } },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalProyectos: { $sum: 1 },
                proyectosActivos: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['activo', 'revision', 'ajuste', 'aprobado']] }, 1, 0],
                  },
                },
                totalFacturado: {
                  $sum: { $cond: [{ $eq: ['$status', 'completado'] }, '$pricing.total', 0] },
                },
                comisionSapiens: {
                  $sum: { $cond: [{ $eq: ['$status', 'completado'] }, '$pricing.commission', 0] },
                },
                pagadoDisenadores: {
                  $sum: { $cond: [{ $eq: ['$status', 'completado'] }, '$pricing.designerPay', 0] },
                },
                pipelineTotal: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['activo', 'revision', 'ajuste', 'aprobado']] }, '$pricing.total', 0],
                  },
                },
                anticiposPendientes: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$payments.anticipo.paid', false] },
                          { $ne: ['$status', 'cotizado'] },
                        ],
                      },
                      '$pricing.anticipo',
                      0,
                    ],
                  },
                },
                balancesPendientes: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'aprobado'] },
                          { $eq: ['$payments.balance.paid', false] },
                        ],
                      },
                      '$pricing.balance',
                      0,
                    ],
                  },
                },
              },
            },
          ],
          deudaDisenadores: [
            {
              $match: {
                status: 'completado',
                designer: { $ne: null },
                'payments.balance.paid': false,
              },
            },
            {
              $group: {
                _id: '$designer',
                proyectos: {
                  $push: { id: '$_id', title: '$title', pay: '$pricing.designerPay' },
                },
                totalDeuda: { $sum: '$pricing.designerPay' },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'designer',
              },
            },
            { $unwind: '$designer' },
            {
              $project: {
                _id: 0,
                designer: {
                  _id: '$designer._id',
                  name: '$designer.name',
                  level: '$designer.level',
                  specialty: '$designer.specialty',
                },
                proyectos: 1,
                totalDeuda: 1,
              },
            },
          ],
          ingresosPorMes: [
            {
              $match: {
                status: 'completado',
                completedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
              },
            },
            {
              $group: {
                _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
                ingresos: { $sum: '$pricing.total' },
                utilidad: { $sum: '$pricing.commission' },
                proyectos: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
        },
      },
    ]);

    const projects = await Project.aggregate([
      { $match: { status: { $ne: 'cancelado' } } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
          pipeline: [{ $project: { name: 1, company: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'designer',
          foreignField: '_id',
          as: 'designer',
          pipeline: [{ $project: { name: 1, level: 1, specialty: 1 } }],
        },
      },
      {
        $addFields: {
          client: { $arrayElemAt: ['$client', 0] },
          designer: { $arrayElemAt: ['$designer', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          status: 1,
          client: 1,
          designer: 1,
          pricing: 1,
          payments: 1,
          createdAt: 1,
          completedAt: 1,
        },
      },
    ]);

    const rawKpis = (summary && summary.kpis && summary.kpis[0]) || {
      totalFacturado: 0,
      comisionSapiens: 0,
      pagadoDisenadores: 0,
      pipelineTotal: 0,
      anticiposPendientes: 0,
      balancesPendientes: 0,
      totalProyectos: 0,
      proyectosActivos: 0,
    };

    const kpis = {
      totalFacturado: rawKpis.totalFacturado || 0,
      comisionSapiens: rawKpis.comisionSapiens || 0,
      pagadoDisenadores: rawKpis.pagadoDisenadores || 0,
      pipelineTotal: rawKpis.pipelineTotal || 0,
      anticiposPendientes: rawKpis.anticiposPendientes || 0,
      balancesPendientes: rawKpis.balancesPendientes || 0,
      totalProyectos: rawKpis.totalProyectos || 0,
      proyectosActivos: rawKpis.proyectosActivos || 0,
    };

    res.json({
      kpis,
      proyectos: projects,
      deudaDisenadores: (summary && summary.deudaDisenadores) || [],
      ingresosPorMes: (summary && summary.ingresosPorMes) || [],
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
