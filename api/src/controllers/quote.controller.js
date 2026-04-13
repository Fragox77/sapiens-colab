const { createQuoteAndProject } = require('../services/quote.service');

async function createQuote(req, res) {
  try {
    const result = await createQuoteAndProject(req.body);
    return res.status(201).json({
      success: true,
      message: 'Cotizacion creada y proyecto generado en estado Cotizado',
      data: result,
    });
  } catch (err) {
    const status = /obligatorio|valido|seleccionado/.test(err.message) ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible crear la cotizacion',
    });
  }
}

module.exports = { createQuote };
