const { getTenantBillingById, updateTenantPlan } = require('../infra/billing.repository');
const {
  PLANS,
  resolvePlan,
  getPlanConfig,
  calculateMonetizationPreview,
} = require('../domain/billing.domain');

function listPlans() {
  return PLANS.map((plan) => getPlanConfig(plan));
}

async function getBillingOverview(tenantId) {
  const data = await getTenantBillingById(tenantId);
  const config = getPlanConfig(data.plan);
  return {
    ...data,
    plan: resolvePlan(data.plan),
    monthlyFee: config.monthlyFee,
    maxActiveProjects: config.maxActiveProjects,
    model: 'saas-plus-commission',
  };
}

function previewBilling(payload = {}) {
  return calculateMonetizationPreview({
    plan: payload.plan,
    monthlyProjects: Number(payload.monthlyProjects || 0),
    avgTicket: Number(payload.avgTicket || 0),
  });
}

async function changeTenantPlan(tenantId, plan) {
  const config = getPlanConfig(plan);
  return updateTenantPlan(tenantId, {
    plan: config.plan,
    commissionRate: config.commissionRate,
    seats: config.seats,
    maxActiveProjects: config.maxActiveProjects,
  });
}

module.exports = { listPlans, getBillingOverview, previewBilling, changeTenantPlan };
