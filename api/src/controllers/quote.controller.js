const {
  createQuoteAndProject,
  getQuoteByIdForUser,
  getQuotesForUser,
  updateQuoteStageForUser,
  addQuoteNoteForUser,
  getCrmKpisForUser,
  getQuoteTimelineForUser,
  addQuoteTaskForUser,
  updateQuoteTaskForUser,
} = require('../services/quote.service');

async function createQuote(req, res) {
  try {
    const result = await createQuoteAndProject(req.body);
    return res.status(201).json({
      success: true,
      message: 'Cotizacion creada y lead registrado en el pipeline CRM',
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

async function updateQuoteStage(req, res) {
  try {
    const quote = await updateQuoteStageForUser(req.user, req.params.id, req.body.stage);
    return res.status(200).json({
      success: true,
      message: 'Etapa actualizada correctamente',
      data: quote,
    });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado/.test(err.message)
        ? 404
        : /etapa seleccionada no es valida/.test(err.message)
          ? 400
          : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible actualizar la etapa',
    });
  }
}

async function addQuoteNote(req, res) {
  try {
    const quote = await addQuoteNoteForUser(req.user, req.params.id, req.body.message);
    return res.status(200).json({
      success: true,
      message: 'Nota agregada correctamente',
      data: quote,
    });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado/.test(err.message)
        ? 404
        : /nota es obligatoria/.test(err.message)
          ? 400
          : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible agregar la nota',
    });
  }
}

async function getCrmKpis(req, res) {
  try {
    const kpis = await getCrmKpisForUser(req.user);
    return res.status(200).json({ success: true, data: kpis });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no encontrado/.test(err.message)
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible calcular KPIs del CRM',
    });
  }
}

async function getQuoteTimeline(req, res) {
  try {
    const data = await getQuoteTimelineForUser(req.user, req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado/.test(err.message)
        ? 404
        : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible consultar el timeline',
    });
  }
}

async function addQuoteTask(req, res) {
  try {
    const data = await addQuoteTaskForUser(req.user, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Tarea agregada', data });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado|tarea/.test(err.message)
        ? 404
        : /obligatorio|valido/.test(err.message)
          ? 400
          : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible agregar la tarea',
    });
  }
}

async function updateQuoteTask(req, res) {
  try {
    const data = await updateQuoteTaskForUser(req.user, req.params.id, req.params.taskId, req.body.status);
    return res.status(200).json({ success: true, message: 'Tarea actualizada', data });
  } catch (err) {
    const status = /autenticado/.test(err.message)
      ? 401
      : /no existe|acceso|no encontrado|tarea/.test(err.message)
        ? 404
        : /obligatorio|valido/.test(err.message)
          ? 400
          : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'No fue posible actualizar la tarea',
    });
  }
}

module.exports = {
  createQuote,
  getQuoteById,
  listQuotes,
  updateQuoteStage,
  addQuoteNote,
  getCrmKpis,
  getQuoteTimeline,
  addQuoteTask,
  updateQuoteTask,
};
