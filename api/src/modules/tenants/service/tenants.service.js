const { ensureTenantName } = require('../domain/tenants.domain');
const { getTenantById } = require('../infra/tenants.repository');

async function getTenantContext(tenantId) {
  const tenant = await getTenantById(tenantId);
  ensureTenantName(tenant.name);
  return tenant;
}

module.exports = { getTenantContext };
