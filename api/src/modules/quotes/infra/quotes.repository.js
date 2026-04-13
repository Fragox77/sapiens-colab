const QuoteRequest = require('./quote-request.model');

async function saveQuoteRequest({ tenantId, payload, result }) {
  const doc = await QuoteRequest.create({
    tenantId,
    serviceType: payload.serviceType,
    complexity: payload.complexity,
    urgency: payload.urgency,
    lead: payload.lead || undefined,
    pricing: result,
  });

  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    createdAt: doc.createdAt,
  };
}

module.exports = { saveQuoteRequest };
