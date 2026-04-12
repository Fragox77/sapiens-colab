const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

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
    const totalCobrado = data.filter(p => p.balancePaid).reduce((a, p) => a + p.designerPay, 0);

    res.json({ projects: data, totalPendiente, totalCobrado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me — Actualizar perfil
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

module.exports = router;
