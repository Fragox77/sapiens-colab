const PROJECT_STATUSES = ['cotizado', 'activo', 'revision', 'aprobado', 'completado'];

function canCreateProject(input) {
  return Boolean(input && input.title && input.serviceType);
}

module.exports = { PROJECT_STATUSES, canCreateProject };
