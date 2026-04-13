async function getSessionMetadata() {
  return { authProvider: 'local-jwt' };
}

module.exports = { getSessionMetadata };
