function canLogin(email, password) {
  return Boolean(email && password);
}

module.exports = { canLogin };
