const router    = require('express').Router();
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User      = require('../models/User');
const otpStore  = require('../utils/otpStore');
const { sendOtpEmail } = require('../utils/mailer');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const otpLimit   = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, tenantId: user.tenantId || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const user = await User.create({ name, email, password, company, phone, role: 'cliente' });
    user.tenantId = user._id.toString();
    await user.save();
    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', loginLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (!user.isActive)
      return res.status(403).json({ error: 'Cuenta desactivada. Contacta a SAPIENS COLAB.' });

    // Admins requieren 2FA: enviar OTP y devolver token temporal (sin JWT real)
    if (user.role === 'admin') {
      const otp = otpStore.set(user._id);
      try {
        await sendOtpEmail(user.email, otp);
      } catch (mailErr) {
        console.error('[2FA] Error al enviar OTP:', mailErr.message);
        return res.status(503).json({ error: 'Error al enviar el código de verificación. Intenta más tarde.' });
      }
      // pendingToken: JWT de corta duración marcado con pending2fa — no sirve como acceso
      const pendingToken = jwt.sign(
        { id: String(user._id), pending2fa: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ requiresOtp: true, pendingToken });
    }

    // Diseñadores y clientes: login normal sin 2FA
    res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp  — segunda fase del login admin
router.post('/verify-otp', otpLimit, async (req, res) => {
  try {
    const { pendingToken, otp } = req.body;
    if (!pendingToken || !otp)
      return res.status(400).json({ error: 'pendingToken y otp son requeridos' });

    let payload;
    try {
      payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Asegurar que este token es exclusivamente para 2FA, no un JWT de sesión normal
    if (!payload.pending2fa)
      return res.status(401).json({ error: 'Token inválido' });

    if (!otpStore.verify(payload.id, otp))
      return res.status(401).json({ error: 'Código incorrecto o expirado' });

    otpStore.clear(payload.id);

    const user = await User.findById(payload.id);
    if (!user || !user.isActive)
      return res.status(403).json({ error: 'Cuenta no disponible' });

    res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
