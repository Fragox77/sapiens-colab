const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    serviceType: { type: String, required: true },
    complexity: { type: String, required: true },
    urgency: { type: String, required: true },
    lead: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      company: { type: String, default: '' },
    },
    pricing: {
      base: Number,
      subtotal: Number,
      iva: Number,
      total: Number,
      anticipo: Number,
      balance: Number,
      commission: Number,
      designerGross: Number,
      reteFuente: Number,
      designerPay: Number,
    },
  },
  { timestamps: true }
);

quoteRequestSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.QuoteRequest || mongoose.model('QuoteRequest', quoteRequestSchema);
