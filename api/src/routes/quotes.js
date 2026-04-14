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

module.exports = router;
