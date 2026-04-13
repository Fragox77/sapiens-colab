const { scoreLead } = require('../domain/leads.domain');
const { saveLead } = require('../infra/leads.repository');

async function createLead(tenantId, payload) {
  const score = scoreLead(payload || {});
  return saveLead(tenantId, payload || {}, score);
}

module.exports = { createLead };
