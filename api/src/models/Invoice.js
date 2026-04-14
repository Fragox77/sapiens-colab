const mongoose = require('mongoose');

/**
 * Factura / liquidación generada desde una cotización aprobada.
 * Cubre el ciclo completo: anticipo → saldo → liquidación al diseñador.
 */
const invoiceSchema = new mongoose.Schema(
  {
    // ── Referencia al origen ──────────────────────────────────────────────
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    tenantId: { type: String, required: true, index: true },

    // ── Cliente ───────────────────────────────────────────────────────────
    client: {
      name:    { type: String, required: true },
      email:   { type: String, required: true },
      company: { type: String, default: '' },
    },

    // ── Montos (heredados de Quote.pricing) ───────────────────────────────
    subtotal:     { type: Number, required: true },
    iva:          { type: Number, required: true },
    total:        { type: Number, required: true },
    anticipo:     { type: Number, required: true },
    balance:      { type: Number, required: true },
    commission:   { type: Number, required: true },
    designerPay:  { type: Number, required: true },

    // ── Estado de pago ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pendiente', 'anticipo_recibido', 'pagada', 'cancelada'],
      default: 'pendiente',
      index: true,
    },

    // ── Pagos recibidos ───────────────────────────────────────────────────
    payments: [
      {
        amount:    { type: Number, required: true },
        method:    { type: String, enum: ['transferencia', 'efectivo', 'tarjeta', 'crypto'], required: true },
        reference: { type: String, default: '' },
        note:      { type: String, default: '' },
        paidAt:    { type: Date, default: Date.now },
        registeredBy: { type: String, default: null }, // userId
      },
    ],

    // ── Liquidación al diseñador ──────────────────────────────────────────
    liquidation: {
      status: {
        type: String,
        enum: ['pendiente', 'procesada'],
        default: 'pendiente',
      },
      amount:    { type: Number, default: 0 },
      paidAt:    { type: Date, default: null },
      method:    { type: String, default: null },
      reference: { type: String, default: '' },
    },

    dueDate:   { type: Date, default: null },
    notes:     { type: String, default: '' },
  },
  { timestamps: true },
);

invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
