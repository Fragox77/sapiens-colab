const router = require('express').Router();
const { createLead } = require('../service/leads.service');

router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantContext && req.tenantContext.tenantId;
    const lead = await createLead(tenantId, req.body);
    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
