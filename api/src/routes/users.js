const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// ─── Rutas propias del usuario autenticado ───────────────────────────────────

// GET /api/users/me/financiero — Panel financiero del diseñador
router.get('/me/financiero', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const projects = await Project.find({
      designer: req.user.id,
      status: { $in: ['activo', 'revision', 'ajuste', 'aprobado', 'completado'] },
    }).populate('client', 'name company').sort('-createdAt');

    const data = projects.map(p => ({
      id: p._id,
      title: p.title,
      client: p.client?.name || p.client?.company,
      status: p.status,
      designerPay: p.pricing.designerPay,
      balancePaid: p.payments.balance.paid,
      completedAt: p.completedAt,
    }));

    const totalPendiente = data.filter(p => !p.balancePaid).reduce((a, p) => a + p.designerPay, 0);
    const totalCobrado   = data.filter(p =>  p.balancePaid).reduce((a, p) => a + p.designerPay, 0);

    res.json({ projects: data, totalPendiente, totalCobrado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me — Actualizar perfil propio
router.patch('/me', auth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'company', 'portfolio', 'specialty', 'isAvailable'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rutas admin — CRUD de usuarios ─────────────────────────────────────────

// GET /api/users — lista paginada con filtros
router.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const { role, active, search, page = 1, limit = 200 } = req.query;

    const filter = { deletedAt: null };
    if (role && role !== 'all')  filter.role = role;
    if (active !== undefined)    filter.isActive = active === 'true';
    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [{ name: re }, { email: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(u => u.toSafeJSON()),
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — crear usuario desde admin
router.post('/', auth, roles('admin'), async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

    const user = await User.create({
      name, email, password, role,
      tenantId: req.user.tenantId || req.user.id,
    });
    res.status(201).json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — perfil completo
router.get('/:id', auth, roles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.deletedAt) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id — editar nombre, email, rol, estado
router.patch('/:id', auth, roles('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'role', 'isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/password — cambiar contraseña
router.patch('/:id/password', auth, roles('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.password = newPassword; // pre-save hook hashea automáticamente
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/toggle-access — activar/desactivar acceso
router.patch('/:id/toggle-access', auth, roles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.deletedAt) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.isActive = !user.isActive;
    await user.save();

    // Nota: los tokens JWT activos expirarán naturalmente (TTL 7d).
    // Para invalidación inmediata implementar blacklist de tokens.

    res.json({ ok: true, isActive: user.isActive, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    const Project = require('../models/Project');
    const activeCount = await Project.countDocuments({
      $or: [{ client: req.params.id }, { designer: req.params.id }],
      status: { $in: ['activo', 'revision', 'ajuste'] },
    });
    if (activeCount > 0)
      return res.status(409).json({ error: `El usuario tiene ${activeCount} proyecto(s) activo(s)` });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date(), isActive: false },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
