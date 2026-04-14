const {
  createQuoteAndProject,
  getQuoteByIdForUser,
  getQuotesForUser,
} = require('../services/quote.service');

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

async function listQuotes(req, res) {
  try {
    const quotes = await getQuotesForUser(req.user);
    return res.status(200).json({ success: true, data: quotes });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no encontrado/.test(err.message)
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible listar las cotizaciones',
    });
  }
}

async function getQuoteById(req, res) {
  try {
    const quote = await getQuoteByIdForUser(req.user, req.params.id);
    return res.status(200).json({ success: true, data: quote });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado/.test(err.message)
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible obtener la cotizacion',
    });
  }
}

module.exports = { createQuote, getQuoteById, listQuotes };
