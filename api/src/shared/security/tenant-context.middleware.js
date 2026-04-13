const IS_PROD = process.env.NODE_ENV === 'production';

function tenantContext(req, _res, next) {
  // En producción: el tenantId viene EXCLUSIVAMENTE del JWT (req.user.tenantId).
  // Aceptar el header x-tenant-id sería un bypass de seguridad — cualquier
  // cliente podría reclamar ser otro tenant.
  //
  // En desarrollo/test: se permite x-tenant-id para facilitar pruebas con
  // herramientas como Postman/Insomnia sin necesidad de generar tokens.
  //
  // Si no hay usuario autenticado (rutas públicas como /quotes) se asigna
  // 'public-demo' como tenant anónimo — esto es intencional y seguro
  // porque ese tenant no tiene datos privados.

  const fromToken  = req.user && req.user.tenantId;
  const fromHeader = !IS_PROD && req.headers['x-tenant-id'];

  req.tenantContext = {
    tenantId: String(fromToken || fromHeader || 'public-demo'),
  };

  next();
}

module.exports = { tenantContext };
