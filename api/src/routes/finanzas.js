const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const User = require('../models/User');
const Liquidacion = require('../models/Liquidacion');
const { COMMISSION_RATE } = require('../utils/cotizador');

const RETE_FUENTE = 0.11;

// ─── GET /api/finanzas/resumen ────────────────────────────────
// Accesible a admin y disenador; respuesta distinta por rol.
router.get('/resumen', auth, async (req, res) => {
  try {
    // ── Vista colaborador ──────────────────────────────────────
    if (req.user.role === 'disenador') {
      const { from, to } = req.query;
      const dateFilter = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to)   dateFilter.$lte = new Date(to);

      const match = { designer: req.user._id, status: { $ne: 'cancelado' } };
      if (from || to) match.createdAt = dateFilter;

      const proyectos = await Project.find(match)
        .populate('client', 'name')
        .lean();

      const liquidaciones = await Liquidacion.find({ colaboradorId: req.user._id })
        .sort({ fecha: -1 })
        .lean();

      const anticiposPagados = liquidaciones.reduce((s, l) => s + l.monto, 0);
      const totalGanado      = proyectos.reduce((s, p) => s + (p.pricing.designerPay || 0), 0);
      const porCobrar        = Math.max(0, totalGanado - anticiposPagados);
      const proyectosCompletados = proyectos.filter(p => p.status === 'completado').length;

      const proyectosData = proyectos.map(p => {
        const designerGross  = (p.pricing.subtotal || 0) - (p.pricing.commission || 0);
        const retefuente     = Math.round(designerGross * RETE_FUENTE);
        const ratioAnticipo  = p.pricing.total > 0
          ? (p.pricing.anticipo || 0) / p.pricing.total : 0;
        const anticipoRecibido = p.payments?.anticipo?.paid
          ? Math.round((p.pricing.designerPay || 0) * ratioAnticipo) : 0;
        const saldoPendiente = Math.max(0, (p.pricing.designerPay || 0) - anticipoRecibido);

        let estado = 'activo';
        if (['aprobado', 'completado'].includes(p.status)) {
          estado = anticiposPagados >= totalGanado ? 'liquidado' : 'completado';
        }

        return {
          id: p._id,
          nombre: p.title,
          cliente: p.client?.name || '—',
          valorTotal: p.pricing.total || 0,
          comisionAgencia: p.pricing.commission || 0,
          retefuente,
          neto: p.pricing.designerPay || 0,
          anticipoRecibido,
          saldoPendiente,
          estado,
          fechaEntrega: p.completedAt || p.deadlineAt || null,
        };
      });

      return res.json({
        kpis: { totalGanado, porCobrar, anticiposRecibidos: anticiposPagados, proyectosCompletados },
        proyectos: proyectosData,
        liquidaciones: liquidaciones.map(l => ({
          fecha: l.fecha,
          monto: l.monto,
          comprobante: l.comprobante || '',
        })),
      });
    }

    // ── Vista admin ────────────────────────────────────────────
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso no permitido' });
    }

    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    const match = { status: { $ne: 'cancelado' } };
    if (from || to) match.createdAt = dateFilter;

    const projects = await Project.find(match)
      .populate('client',   'name company')
      .populate('designer', 'name level specialty')
      .lean();

    const liquidaciones = await Liquidacion.find({}).lean();
    const liqByDesigner = {};
    for (const liq of liquidaciones) {
      const id = liq.colaboradorId.toString();
      liqByDesigner[id] = (liqByDesigner[id] || 0) + liq.monto;
    }

    const designerMap = {};
    for (const p of projects) {
      if (!p.designer) continue;
      const did = p.designer._id.toString();
      if (!designerMap[did]) {
        designerMap[did] = {
          id: did, nombre: p.designer.name,
          proyectosActivos: 0, valorBruto: 0,
          comisionAgencia: 0, retefuente: 0, netoPagar: 0,
        };
      }
      const d = designerMap[did];
      if (['activo', 'revision', 'ajuste'].includes(p.status)) d.proyectosActivos++;
      d.valorBruto     += p.pricing.subtotal || 0;
      d.comisionAgencia += p.pricing.commission || 0;
      const designerGross = (p.pricing.subtotal || 0) - (p.pricing.commission || 0);
      d.retefuente     += Math.round(designerGross * RETE_FUENTE);
      d.netoPagar      += p.pricing.designerPay || 0;
    }

    const colaboradores = Object.values(designerMap).map(d => {
      const anticiposPagados = liqByDesigner[d.id] || 0;
      const saldoPendiente   = Math.max(0, d.netoPagar - anticiposPagados);
      let estado;
      if (d.netoPagar === 0)        estado = 'al_dia';
      else if (saldoPendiente <= 0) estado = 'liquidado';
      else                          estado = 'pendiente';
      return { ...d, anticiposPagados, saldoPendiente, estado };
    });

    const facturacionBruta   = projects.reduce((s, p) => s + (p.pricing.total || 0), 0);
    const comisionSapiens    = projects.reduce((s, p) => s + (p.pricing.commission || 0), 0);
    const retencionesTotales = colaboradores.reduce((s, c) => s + c.retefuente, 0);
    const utilidadNeta       = comisionSapiens;

    const proyectos = projects.map(p => {
      const ratioAnticipo = p.pricing.total > 0
        ? (p.pricing.anticipo || 0) / p.pricing.total : 0;
      const did = p.designer?._id?.toString();
      const pagado = did ? (liqByDesigner[did] || 0) : 0;
      let estado = 'activo';
      if (['aprobado', 'completado'].includes(p.status)) {
        estado = pagado >= (p.pricing.designerPay || 0) ? 'liquidado' : 'completado';
      }
      return {
        id: p._id,
        nombre: p.title,
        cliente: p.client?.name || '—',
        colaborador: p.designer?.name || '—',
        colaboradorId: p.designer?._id?.toString() || null,
        valorTotal: p.pricing.total || 0,
        comision: p.pricing.commission || 0,
        netoPagar: p.pricing.designerPay || 0,
        anticipoCliente: p.pricing.anticipo || 0,
        anticipoColaborador: Math.round((p.pricing.designerPay || 0) * ratioAnticipo),
        estado,
      };
    });

    res.json({
      kpis: { facturacionBruta, comisionSapiens, retencionesTotales, utilidadNeta },
      colaboradores,
      proyectos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/finanzas/liquidaciones — solo admin ────────────
router.post('/liquidaciones', auth, roles('admin'), async (req, res) => {
  try {
    const { colaboradorId, monto, comprobante, fecha } = req.body;
    if (!colaboradorId) return res.status(400).json({ error: 'colaboradorId es requerido' });
    if (!monto || Number(monto) <= 0) return res.status(400).json({ error: 'monto debe ser mayor a 0' });

    const colaborador = await User.findById(colaboradorId);
    if (!colaborador || colaborador.role !== 'disenador')
      return res.status(400).json({ error: 'Colaborador no válido' });

    const liq = await Liquidacion.create({
      colaboradorId,
      monto: Number(monto),
      comprobante: comprobante || '',
      fecha: fecha ? new Date(fecha) : new Date(),
      creadoPor: req.user.id,
    });
    res.status(201).json(liq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
