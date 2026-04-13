function isValidUserFilter(filter) {
  return !filter || typeof filter === 'string';
}

module.exports = { isValidUserFilter };
