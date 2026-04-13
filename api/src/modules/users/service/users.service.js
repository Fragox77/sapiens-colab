const { isValidUserFilter } = require('../domain/users.domain');
const { listUsersByTenant } = require('../infra/users.repository');

async function getUsers(tenantId, filter) {
  if (!isValidUserFilter(filter)) {
    throw new Error('Filtro de usuario invalido');
  }
  return listUsersByTenant(tenantId);
}

module.exports = { getUsers };
