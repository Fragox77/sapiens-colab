const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    client: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      company: { type: String, default: '', trim: true },
    },
    serviceType: {
      type: String,
      enum: ['branding', 'piezas', 'video-motion', 'fotografia', 'social-media', 'web', 'campana'],
      required: true,
    },
    complexity: {
      type: String,
      enum: ['basica', 'media', 'avanzada'],
      required: true,
      default: 'media',
    },
    urgency: {
      type: String,
      enum: ['normal', 'prioritario', 'express'],
      required: true,
      default: 'normal',
    },
    pricing: {
      base: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      iva: { type: Number, required: true },
      total: { type: Number, required: true },
      anticipo: { type: Number, required: true },
      balance: { type: Number, required: true },
      commission: { type: Number, required: true },
      designerPay: { type: Number, required: true },
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    leadStatus: {
      type: String,
      enum: ['nuevo', 'contactado', 'calificado', 'convertido', 'descartado'],
      default: 'convertido',
      index: true,
    },
    leadScore: { type: Number, default: 0 },
    source: { type: String, default: 'cotizador-web' },
    crm: {
      owner: { type: String, default: 'pendiente' },
      tags: [{ type: String }],
      notes: [{ message: String, at: { type: Date, default: Date.now } }],
      nextActionAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

quoteSchema.index({ 'client.email': 1, createdAt: -1 });
quoteSchema.index({ leadStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);
