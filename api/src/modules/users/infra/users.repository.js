async function listUsersByTenant(tenantId) {
  return {
    tenantId,
    total: 0,
    items: [],
  };
}

module.exports = { listUsersByTenant };
