const COMPLEXITIES = ['basica', 'media', 'avanzada'];
const URGENCIES = ['normal', 'prioritario', 'express'];

function validateQuoteInput(input) {
  const { serviceType, complexity, urgency } = input || {};

  if (!serviceType) {
    throw new Error('serviceType es obligatorio');
  }
  if (!COMPLEXITIES.includes(complexity || 'media')) {
    throw new Error('complexity invalida');
  }
  if (!URGENCIES.includes(urgency || 'normal')) {
    throw new Error('urgency invalida');
  }
}

function normalizeLead(input = {}) {
  if (!input.lead) return null;

  const lead = {
    name: String(input.lead.name || '').trim(),
    email: String(input.lead.email || '').trim().toLowerCase(),
    company: String(input.lead.company || '').trim(),
  };

  if (!lead.email || !lead.email.includes('@')) {
    throw new Error('lead.email invalido');
  }

  return lead;
}

module.exports = { validateQuoteInput, normalizeLead };
