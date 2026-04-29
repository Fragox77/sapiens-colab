const Lead = require('./lead.model');

async function saveLead(tenantId, payload, score) {
  const doc = await Lead.create({
    tenantId,
    empresa:     payload.empresa     || payload.company || '',
    companySize: payload.companySize || '',
    urgency:     payload.urgency     || 'normal',
    estado:      payload.estado      || 'nuevo',
    score,
    source:      payload.source      || 'web',
    contact: {
      name:  payload.contact?.name  || payload.name  || '',
      email: payload.contact?.email || payload.email || '',
      phone: payload.contact?.phone || payload.phone || '',
    },
  });
  return doc.toObject();
}

module.exports = { saveLead };
