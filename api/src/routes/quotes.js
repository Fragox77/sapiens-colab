const router = require('express').Router();
const auth = require('../middleware/auth');
const {
	createQuote,
	getQuoteById,
	listQuotes,
	updateQuoteStage,
	addQuoteNote,
	getCrmKpis,
	getQuoteTimeline,
	addQuoteTask,
	updateQuoteTask,
} = require('../controllers/quote.controller');

// POST /api/quotes
router.post('/', createQuote);

// GET /api/quotes
router.get('/', auth, listQuotes);

// GET /api/quotes/crm/kpis
router.get('/crm/kpis', auth, getCrmKpis);

// GET /api/quotes/:id
router.get('/:id', auth, getQuoteById);

// GET /api/quotes/:id/timeline
router.get('/:id/timeline', auth, getQuoteTimeline);

// PATCH /api/quotes/:id/stage
router.patch('/:id/stage', auth, updateQuoteStage);

// POST /api/quotes/:id/notes
router.post('/:id/notes', auth, addQuoteNote);

// POST /api/quotes/:id/tasks
router.post('/:id/tasks', auth, addQuoteTask);

// PATCH /api/quotes/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', auth, updateQuoteTask);

// PATCH /api/quotes/:id — Editar datos de la cotización/lead (admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { client, serviceType, complexity, urgency, leadScore } = req.body;
    const Quote = require('../models/Quote');
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    if (client) {
      if (client.name    !== undefined) quote.client.name    = client.name.trim();
      if (client.email   !== undefined) quote.client.email   = client.email.toLowerCase().trim();
      if (client.company !== undefined) quote.client.company = client.company;
      if (client.phone   !== undefined) quote.client.phone   = client.phone;
    }
    if (serviceType !== undefined) quote.serviceType = serviceType;
    if (complexity  !== undefined) quote.complexity  = complexity;
    if (urgency     !== undefined) quote.urgency     = urgency;
    if (leadScore   !== undefined) quote.leadScore   = Number(leadScore);

    await quote.save();
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
