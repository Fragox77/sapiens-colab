async function listTenantProjects(tenantId) {
  return {
    tenantId,
    total: 0,
    items: [],
  };
}

module.exports = { listTenantProjects };
