const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const { calcular } = require('../utils/cotizador');

async function logActivity(payload) {
  try {
    await ActivityLog.create(payload);
  } catch (_) {
    // Los logs no deben romper la operacion principal.
  }
}

// ─── CLIENTE ──────────────────────────────────────────────────

// POST /api/projects — Cliente crea pedido
router.post('/', auth, roles('cliente'), async (req, res) => {
  try {
    const { title, description, serviceType, complexity, urgency, format } = req.body;
    const pricing = calcular({ serviceType, complexity, urgency });

    const project = await Project.create({
      client: req.user.id,
      clientId: req.user.id,
      title, description, serviceType, complexity, urgency, format,
      pricing,
      price: pricing.total,
      cost: pricing.designerPay,
      minDesignerLevel: complexity === 'avanzada' ? 7 : complexity === 'media' ? 4 : 1,
    });

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'cliente',
      eventType: 'project_created',
      meta: { serviceType, complexity, urgency, price: pricing.total },
    });

    // Notificar admin vía WebSocket
    req.app.locals.notifyUser('admin', { type: 'NEW_PROJECT', project });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — Lista según rol
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'cliente')   filter = { client: req.user.id };
    if (req.user.role === 'disenador') filter = { designer: req.user.id };
    // admin ve todos

    const projects = await Project.find(filter)
      .populate('client', 'name email company')
      .populate('designer', 'name email level specialty')
      .sort('-createdAt');

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — Detalle
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email company phone')
      .populate('designer', 'name email level specialty portfolio');

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Solo las partes involucradas o admin
    const isOwner = String(project.client._id) === req.user.id;
    const isDesigner = project.designer && String(project.designer._id) === req.user.id;
    if (!isOwner && !isDesigner && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Acceso denegado' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DISEÑADOR ────────────────────────────────────────────────

// PATCH /api/projects/:id/deliver — Diseñador sube entregable
router.patch('/:id/deliver', auth, roles('disenador'), async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'No encontrado' });
    if (String(project.designer) !== req.user.id)
      return res.status(403).json({ error: 'No eres el diseñador asignado' });

    const round = (project.revisions.used || 0) + 1;
    project.deliverables.push({ url: fileUrl, name: fileName, uploadedAt: new Date(), round });
    project.status = 'revision';
    project.deliveredAt = new Date();
    project.timeline.push({ action: 'ENTREGABLE_SUBIDO', by: req.user.id, message: `Ronda ${round}` });
    await project.save();

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'disenador',
      eventType: 'deliverable_uploaded',
      meta: { round, status: project.status },
    });

    // Notificar cliente
    req.app.locals.notifyUser(String(project.client), { type: 'DELIVERABLE_READY', projectId: project._id });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLIENTE: aprobar o pedir revisión ───────────────────────

// PATCH /api/projects/:id/review
router.patch('/:id/review', auth, roles('cliente'), async (req, res) => {
  try {
    const { action, message } = req.body; // 'approve' | 'request-revision'
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'No encontrado' });
    if (String(project.client) !== req.user.id)
      return res.status(403).json({ error: 'No eres el cliente de este proyecto' });

    if (action === 'approve') {
      project.status = 'aprobado';
      project.timeline.push({ action: 'APROBADO_POR_CLIENTE', by: req.user.id });
      req.app.locals.notifyUser(String(project.designer), { type: 'PROJECT_APPROVED', projectId: project._id });
    } else {
      if (project.revisions.used >= project.revisions.max) {
        return res.status(400).json({ error: `Máximo de revisiones (${project.revisions.max}) alcanzado. Revisión extra tiene costo adicional.` });
      }
      project.revisions.used += 1;
      project.status = 'ajuste';
      project.timeline.push({ action: 'REVISION_SOLICITADA', by: req.user.id, message });
      req.app.locals.notifyUser(String(project.designer), { type: 'REVISION_REQUESTED', projectId: project._id, message });
    }

    await project.save();

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'cliente',
      eventType: action === 'approve' ? 'project_approved' : 'project_review_requested',
      meta: { action, message: message || '' },
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/feedback — Cliente califica proyecto completado
router.post('/:id/feedback', auth, roles('cliente'), async (req, res) => {
  try {
    const { rating, nps, comment } = req.body;
    const score = Number(rating);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: 'rating debe estar entre 1 y 5' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (String(project.client) !== req.user.id) {
      return res.status(403).json({ error: 'No eres el cliente de este proyecto' });
    }
    if (!['aprobado', 'completado'].includes(project.status)) {
      return res.status(400).json({ error: 'Solo puedes calificar proyectos aprobados o completados' });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { project: project._id, client: req.user.id },
      {
        $set: {
          project: project._id,
          client: req.user.id,
          designer: project.designer || null,
          rating: score,
          nps: Number.isFinite(Number(nps)) ? Number(nps) : null,
          comment: comment ? String(comment).trim() : '',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await logActivity({
      userId: req.user.id,
      projectId: project._id,
      actorRole: 'cliente',
      eventType: 'feedback_submitted',
      meta: { rating: score },
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
