const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

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
    // El cliente que se registra es su propio tenant (instancia independiente)
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
