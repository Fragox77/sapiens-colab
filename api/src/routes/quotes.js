const router = require('express').Router();
const auth = require('../middleware/auth');
const { createQuote, getQuoteById, listQuotes } = require('../controllers/quote.controller');

// POST /api/quotes
router.post('/', createQuote);

// GET /api/quotes
router.get('/', auth, listQuotes);

// GET /api/quotes/:id
router.get('/:id', auth, getQuoteById);

module.exports = router;
