function ensureTenantName(name) {
  if (!name || String(name).trim().length < 2) {
    throw new Error('Nombre de tenant invalido');
  }
}

module.exports = { ensureTenantName };
