const { SERVICES, calcular } = require('../../../utils/cotizador');
const { validateQuoteInput, normalizeLead } = require('../domain/quote.domain');
const { saveQuoteRequest } = require('../infra/quotes.repository');

function getQuoteCatalog() {
  return {
    services: SERVICES,
    complexities: ['basica', 'media', 'avanzada'],
    urgencies: ['normal', 'prioritario', 'express'],
  };
}

async function createQuote({ tenantId, input }) {
  validateQuoteInput(input);
  const lead = normalizeLead(input);

  const pricing = calcular({
    serviceType: input.serviceType,
    complexity: input.complexity || 'media',
    urgency: input.urgency || 'normal',
  });

  const savedRequest = await saveQuoteRequest({
    tenantId,
    payload: {
      serviceType: input.serviceType,
      complexity: input.complexity || 'media',
      urgency: input.urgency || 'normal',
      lead,
    },
    result: pricing,
  });

  return {
    ...pricing,
    tenantId,
    quoteRequestId: savedRequest.id,
    leadCaptured: Boolean(lead),
  };
}

module.exports = { createQuote, getQuoteCatalog };
