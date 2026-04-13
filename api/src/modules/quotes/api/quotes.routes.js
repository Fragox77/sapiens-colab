const router = require('express').Router();
const { createQuote, getQuoteCatalog } = require('../service/quotes.service');

router.get('/catalog', (_req, res) => {
  res.json(getQuoteCatalog());
});

router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantContext && req.tenantContext.tenantId;
    const quote = await createQuote({ tenantId, input: req.body });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/calculate', async (req, res) => {
  try {
    const tenantId = req.tenantContext && req.tenantContext.tenantId;
    const quote = await createQuote({ tenantId, input: req.body });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
