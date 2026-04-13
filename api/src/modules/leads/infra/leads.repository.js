async function saveLead(tenantId, payload, score) {
  return {
    id: `${tenantId}-lead-${Date.now()}`,
    tenantId,
    ...payload,
    score,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { saveLead };
