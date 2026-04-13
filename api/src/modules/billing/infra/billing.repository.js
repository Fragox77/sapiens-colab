const TenantBilling = require('./tenant-billing.model');

function getDefaultBilling(tenantId) {
  return {
    tenantId,
    plan: 'basic',
    commissionRate: 0.25,
    seats: 3,
    maxActiveProjects: 10,
  };
}

async function getTenantBillingById(tenantId) {
  const existing = await TenantBilling.findOne({ tenantId }).lean();
  if (existing) return existing;

  const created = await TenantBilling.create(getDefaultBilling(tenantId));
  return created.toObject();
}

async function updateTenantPlan(tenantId, payload) {
  const updated = await TenantBilling.findOneAndUpdate(
    { tenantId },
    { $set: { ...payload } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return updated;
}

module.exports = { getTenantBillingById, updateTenantPlan };
