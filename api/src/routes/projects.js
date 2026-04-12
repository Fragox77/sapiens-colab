const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const { calcular } = require('../utils/cotizador');

// ─── CLIENTE ──────────────────────────────────────────────────

// POST /api/projects — Cliente crea pedido
router.post('/', auth, roles('cliente'), async (req, res) => {
  try {
    const { title, description, serviceType, complexity, urgency, format } = req.body;
    const pricing = calcular({ serviceType, complexity, urgency });

    const project = await Project.create({
      client: req.user.id,
      title, description, serviceType, complexity, urgency, format,
      pricing,
      minDesignerLevel: complexity === 'avanzada' ? 7 : complexity === 'media' ? 4 : 1,
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
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
