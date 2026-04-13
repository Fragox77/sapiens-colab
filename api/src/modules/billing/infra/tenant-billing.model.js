const mongoose = require('mongoose');

const tenantBillingSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
    commissionRate: { type: Number, default: 0.25 },
    seats: { type: Number, default: 3 },
    maxActiveProjects: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TenantBilling || mongoose.model('TenantBilling', tenantBillingSchema);
