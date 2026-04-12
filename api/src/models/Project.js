const mongoose = require('mongoose');

// Un "Project" = un pedido de un cliente
const projectSchema = new mongoose.Schema({
  // ─── Partes ───────────────────────────────────────────────────
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ─── Descripción ──────────────────────────────────────────────
  title:       { type: String, required: true },
  description: { type: String, required: true },
  serviceType: {
    type: String,
    enum: ['branding', 'piezas', 'video-motion', 'fotografia', 'social-media', 'web', 'campana'],
    required: true,
  },
  complexity: { type: String, enum: ['basica', 'media', 'avanzada'], default: 'media' },
  urgency:    { type: String, enum: ['normal', 'prioritario', 'express'], default: 'normal' },
  format:     { type: String, default: '' },

  // ─── Financiero ───────────────────────────────────────────────
  pricing: {
    base:      { type: Number, required: true },
    subtotal:  { type: Number, required: true },
    iva:       { type: Number, required: true },
    total:     { type: Number, required: true },
    anticipo:  { type: Number, required: true },  // 50% al inicio
    balance:   { type: Number, required: true },  // 50% al cierre
    commission: { type: Number, required: true }, // % SAPIENS COLAB
    designerPay: { type: Number, required: true },// Lo que cobra el diseñador
  },

  // ─── Estado ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: [
      'cotizado',       // Recién creado, pendiente anticipo
      'activo',         // Anticipo pagado, en producción
      'revision',       // Entregable subido, esperando revisión
      'ajuste',         // Cliente pidió cambios (ronda 1 o 2)
      'aprobado',       // Cliente aprobó, pendiente pago final
      'completado',     // Pago final recibido, cerrado
      'cancelado',
    ],
    default: 'cotizado',
  },

  // ─── Revisiones ───────────────────────────────────────────────
  revisions: {
    used:    { type: Number, default: 0 },
    max:     { type: Number, default: 2 },
    extra:   { type: Number, default: 0 },  // Revisiones extras cobradas
  },

  // ─── Archivos ─────────────────────────────────────────────────
  briefFiles:     [{ url: String, name: String, uploadedAt: Date }],
  deliverables:   [{ url: String, name: String, uploadedAt: Date, round: Number }],
  finalFiles:     [{ url: String, name: String, uploadedAt: Date }],

  // ─── Fechas clave ─────────────────────────────────────────────
  deadlineAt:    { type: Date, default: null },
  deliveredAt:   { type: Date, default: null },
  completedAt:   { type: Date, default: null },

  // ─── Pagos ────────────────────────────────────────────────────
  payments: {
    anticipo: {
      paid: { type: Boolean, default: false },
      paidAt: { type: Date, default: null },
    },
    balance: {
      paid: { type: Boolean, default: false },
      paidAt: { type: Date, default: null },
    },
  },

  // ─── Historial / Comments ─────────────────────────────────────
  timeline: [{
    action:    String,
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:   String,
    createdAt: { type: Date, default: Date.now },
  }],

  // Nivel mínimo requerido para asignar
  minDesignerLevel: { type: Number, default: 1 },

}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
