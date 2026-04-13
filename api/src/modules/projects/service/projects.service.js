const { canCreateProject } = require('../domain/projects.domain');
const { listTenantProjects } = require('../infra/projects.repository');

async function getProjectsByTenant(tenantId) {
  return listTenantProjects(tenantId);
}

function validateProjectPayload(payload) {
  if (!canCreateProject(payload)) {
    throw new Error('title y serviceType son obligatorios');
  }
}

module.exports = { getProjectsByTenant, validateProjectPayload };
