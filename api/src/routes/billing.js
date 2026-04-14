const router = require('express').Router();
const auth   = require('../middleware/auth');
const roles  = require('../middleware/roles');
const Invoice = require('../models/Invoice');
const Quote   = require('../models/Quote');

// ── POST /api/billing/invoices — crear factura desde cotización ───────────────
router.post('/invoices', auth, roles('admin'), async (req, res) => {
  try {
    const { quoteId, dueDate, notes } = req.body;
    if (!quoteId) return res.status(400).json({ error: 'quoteId es requerido' });

    const quote = await Quote.findById(quoteId);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const existing = await Invoice.findOne({ quote: quoteId });
    if (existing) return res.status(409).json({ error: 'Ya existe una factura para esta cotización', invoiceId: existing._id });

    const invoice = await Invoice.create({
      quote:       quoteId,
      project:     quote.project || null,
      tenantId:    req.user.tenantId,
      client:      quote.client,
      subtotal:    quote.pricing.subtotal,
      iva:         quote.pricing.iva,
      total:       quote.pricing.total,
      anticipo:    quote.pricing.anticipo,
      balance:     quote.pricing.balance,
      commission:  quote.pricing.commission,
      designerPay: quote.pricing.designerPay,
      dueDate:     dueDate || null,
      notes:       notes   || '',
    });

    res.status(201).json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/billing/invoices — listar facturas del tenant ───────────────────
router.get('/invoices', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { tenantId: req.user.tenantId };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('quote', 'serviceType client.name')
      .populate('project', 'title');

    const total = await Invoice.countDocuments(filter);
    res.json({ data: invoices, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/billing/invoices/:id ─────────────────────────────────────────────
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('quote')
      .populate('project', 'title status');
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/billing/invoices/:id/payments — registrar pago ─────────────────
router.post('/invoices/:id/payments', auth, roles('admin'), async (req, res) => {
  try {
    const { amount, method, reference, note } = req.body;
    if (!amount || !method) return res.status(400).json({ error: 'amount y method son requeridos' });

    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    if (invoice.status === 'cancelada') return res.status(400).json({ error: 'La factura está cancelada' });

    invoice.payments.push({ amount, method, reference, note, registeredBy: req.user.id });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= invoice.total) {
      invoice.status = 'pagada';
    } else if (totalPaid >= invoice.anticipo) {
      invoice.status = 'anticipo_recibido';
    }

    await invoice.save();
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/billing/invoices/:id/liquidation — marcar liquidación al diseñador
router.patch('/invoices/:id/liquidation', auth, roles('admin'), async (req, res) => {
  try {
    const { method, reference } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    if (invoice.status !== 'pagada') return res.status(400).json({ error: 'La factura debe estar pagada para liquidar' });

    invoice.liquidation = {
      status:    'procesada',
      amount:    invoice.designerPay,
      paidAt:    new Date(),
      method:    method    || 'transferencia',
      reference: reference || '',
    };
    await invoice.save();
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/billing/invoices/:id/cancel ────────────────────────────────────
router.patch('/invoices/:id/cancel', auth, roles('admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    if (invoice.status === 'pagada') return res.status(400).json({ error: 'No se puede cancelar una factura pagada' });

    invoice.status = 'cancelada';
    await invoice.save();
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
