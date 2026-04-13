const { canLogin } = require('../domain/auth.domain');
const { getSessionMetadata } = require('../infra/auth.repository');

async function getAuthInfo() {
  const metadata = await getSessionMetadata();
  return {
    strategies: ['jwt-access-token', 'refresh-token-rotation'],
    mfaSupported: true,
    ...metadata,
  };
}

function validateLoginInput(input) {
  if (!canLogin(input && input.email, input && input.password)) {
    throw new Error('email y password son obligatorios');
  }
}

module.exports = { getAuthInfo, validateLoginInput };
