const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true, index: true },
    empresa:     { type: String, default: '', trim: true },
    companySize: { type: String, default: '' },
    urgency:     { type: String, default: 'normal' },
    estado:      { type: String, default: 'nuevo' },
    score:       { type: Number, default: 0 },
    source:      { type: String, default: 'web' },
    contact: {
      name:  { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
      phone: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// ── Índices compuestos ──────────────────────────────────────────────────────
//
// 1. Filtro por estado dentro de un tenant (listado CRM, pipeline kanban)
//    db.leads.find({ tenantId, estado }).explain() → winningPlan usa IXSCAN
leadSchema.index({ tenantId: 1, estado: 1 });

// 2. Ranking por score dentro de un tenant (top leads, ordenamiento CRM)
//    db.leads.find({ tenantId }).sort({ score: -1 }).explain() → IXSCAN sin SORT stage
leadSchema.index({ tenantId: 1, score: -1 });

// 3. Búsqueda/agrupación por empresa dentro de un tenant (vista cliente)
//    db.leads.find({ tenantId, empresa }).explain() → IXSCAN sin COLLSCAN
leadSchema.index({ tenantId: 1, empresa: 1 });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
