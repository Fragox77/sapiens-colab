async function getTenantById(tenantId) {
  return {
    id: tenantId,
    name: tenantId === 'public-demo' ? 'Public Demo' : `Tenant ${tenantId}`,
    plan: 'basic',
  };
}

module.exports = { getTenantById };
