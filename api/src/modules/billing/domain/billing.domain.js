const PLANS = ['basic', 'pro', 'enterprise'];

const PLAN_MATRIX = {
  basic: {
    monthlyFee: 29,
    commissionRate: 0.25,
    seats: 3,
    maxActiveProjects: 10,
  },
  pro: {
    monthlyFee: 99,
    commissionRate: 0.18,
    seats: 20,
    maxActiveProjects: 80,
  },
  enterprise: {
    monthlyFee: 349,
    commissionRate: 0.12,
    seats: 999,
    maxActiveProjects: 999,
  },
};

function resolvePlan(plan) {
  if (!PLANS.includes(plan)) return 'basic';
  return plan;
}

function getPlanConfig(plan) {
  const normalized = resolvePlan(plan);
  return {
    plan: normalized,
    ...PLAN_MATRIX[normalized],
  };
}

function calculateMonetizationPreview({ plan, monthlyProjects = 0, avgTicket = 0 }) {
  const config = getPlanConfig(plan);
  const commissionRevenue = Math.round(monthlyProjects * avgTicket * config.commissionRate);
  return {
    plan: config.plan,
    monthlyFee: config.monthlyFee,
    commissionRate: config.commissionRate,
    commissionRevenue,
    projectedMRR: config.monthlyFee + commissionRevenue,
  };
}

module.exports = { PLANS, resolvePlan, getPlanConfig, calculateMonetizationPreview };
