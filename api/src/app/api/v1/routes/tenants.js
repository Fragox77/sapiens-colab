const router = require('express').Router();
const auth = require('../../../../middleware/auth');
const roles = require('../../../../middleware/roles');
const User = require('../../../../models/User');

// GET /api/v1/tenants/me — info del tenant actual (admin)
router.get('/me', auth, roles('admin'), async (req, res) => {
  try {
    const count = await User.countDocuments({ tenantId: req.user.tenantId });
    res.json({
      data: {
        tenantId: req.user.tenantId,
        memberCount: count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
