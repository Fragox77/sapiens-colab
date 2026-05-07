const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Project = require('../models/Project');
const User = require('../models/User');
const Liquidacion = require('../models/Liquidacion');
const { COMMISSION_RATE } = require('../utils/cotizador');

const RETE_FUENTE = 0.11;

// Todos los endpoints requieren auth + rol admin
router.use(auth, roles('admin'));

// ─── GET /api/finanzas/resumen ────────────────────────────────
router.get('/resumen', async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    const match = { status: { $ne: 'cancelado' } };
    if (from || to) match.createdAt = dateFilter;

    // Proyectos del período con client y designer populados
    const projects = await Project.find(match)
      .populate('client',   'name company')
      .populate('designer', 'name level specialty')
      .lean();

    // Liquidaciones agrupadas por colaborador (sin filtro de período, son pagos históricos)
    const liquidaciones = await Liquidacion.find({}).lean();
    const liqByDesigner = {};
    for (const liq of liquidaciones) {
      const id = liq.colaboradorId.toString();
      liqByDesigner[id] = (liqByDesigner[id] || 0) + liq.monto;
    }

    // Agrupar proyectos por diseñador
    const designerMap = {};
    for (const p of projects) {
      if (!p.designer) continue;
      const did = p.designer._id.toString();

      if (!designerMap[did]) {
        designerMap[did] = {
          id: did,
          nombre: p.designer.name,
          proyectosActivos: 0,
          valorBruto: 0,
          comisionAgencia: 0,
          retefuente: 0,
          netoPagar: 0,
        };
      }

      const d = designerMap[did];
      if (['activo', 'revision', 'ajuste'].includes(p.status)) d.proyectosActivos++;

      d.valorBruto    += p.pricing.subtotal || 0;
      d.comisionAgencia += p.pricing.commission || 0;
      const designerGross = (p.pricing.subtotal || 0) - (p.pricing.commission || 0);
      d.retefuente    += Math.round(designerGross * RETE_FUENTE);
      d.netoPagar     += p.pricing.designerPay || 0;
    }

    // Construir array de colaboradores
    const colaboradores = Object.values(designerMap).map(d => {
      const anticiposPagados = liqByDesigner[d.id] || 0;
      const saldoPendiente   = Math.max(0, d.netoPagar - anticiposPagados);
      let estado;
      if (d.netoPagar === 0)       estado = 'al_dia';
      else if (saldoPendiente <= 0) estado = 'liquidado';
      else                          estado = 'pendiente';

      return {
        id: d.id,
        nombre: d.nombre,
        proyectosActivos: d.proyectosActivos,
        valorBruto: d.valorBruto,
        comisionAgencia: d.comisionAgencia,
        retefuente: d.retefuente,
        netoPagar: d.netoPagar,
        anticiposPagados,
        saldoPendiente,
        estado,
      };
    });

    // KPIs globales
    const facturacionBruta    = projects.reduce((s, p) => s + (p.pricing.total || 0), 0);
    const comisionSapiens     = projects.reduce((s, p) => s + (p.pricing.commission || 0), 0);
    const retencionesTotales  = colaboradores.reduce((s, c) => s + c.retefuente, 0);
    const utilidadNeta        = comisionSapiens; // sin gastos operativos registrados

    // Lista de proyectos enriquecida
    const proyectos = projects.map(p => {
      const designerGross = (p.pricing.subtotal || 0) - (p.pricing.commission || 0);
      const ratioAnticipo = p.pricing.total > 0
        ? (p.pricing.anticipo || 0) / p.pricing.total
        : 0;

      let estado = 'activo';
      if (['aprobado', 'completado'].includes(p.status)) {
        const did = p.designer?._id?.toString();
        const pagado = did ? (liqByDesigner[did] || 0) : 0;
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

// ─── POST /api/finanzas/liquidaciones ────────────────────────
router.post('/liquidaciones', async (req, res) => {
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
