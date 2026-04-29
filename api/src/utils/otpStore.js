// In-memory OTP store: userId → { code, expiresAt }
// Válido para proceso único. Para multi-instancia reemplazar con Redis.

const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutos

function _generate() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Genera, almacena y retorna el OTP para un userId. Sobreescribe el anterior si ya existía. */
function set(userId) {
  const code = _generate();
  store.set(String(userId), { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

/** Verifica el OTP. Retorna true si es válido y no ha expirado. No lo consume. */
function verify(userId, code) {
  const entry = store.get(String(userId));
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(String(userId));
    return false;
  }
  return entry.code === String(code);
}

/** Elimina el OTP tras verificación exitosa o expiración manual. */
function clear(userId) {
  store.delete(String(userId));
}

module.exports = { set, verify, clear };
