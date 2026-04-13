const router = require('express').Router();
const { createQuote } = require('../controllers/quote.controller');

// POST /api/quotes
router.post('/', createQuote);

module.exports = router;
