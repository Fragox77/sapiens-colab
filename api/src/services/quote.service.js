const crypto = require('crypto');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const User = require('../models/User');
const { calcular } = require('../utils/cotizador');

const VALID_SERVICE_TYPES = ['branding', 'piezas', 'video-motion', 'fotografia', 'social-media', 'web', 'campana'];
const VALID_COMPLEXITIES = ['basica', 'media', 'avanzada'];
const VALID_URGENCIES = ['normal', 'prioritario', 'express'];
const VALID_STAGES = ['NUEVO', 'CONTACTO_INICIAL', 'PROPUESTA_ENVIADA', 'NEGOCIACION', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

function ensureString(value) {
  return String(value || '').trim();
}

function normalizePayload(payload = {}) {
  const client = payload.client || {};
  const normalized = {
    client: {
      name: ensureString(client.name),
      email: ensureString(client.email).toLowerCase(),
      company: ensureString(client.company),
    },
    serviceType: ensureString(payload.serviceType),
    complexity: ensureString(payload.complexity || 'media'),
    urgency: ensureString(payload.urgency || 'normal'),
  };

  if (!normalized.client.name) throw new Error('El nombre del cliente es obligatorio');
  if (!normalized.client.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.client.email)) {
    throw new Error('El email del cliente no es valido');
  }
  if (!VALID_SERVICE_TYPES.includes(normalized.serviceType)) {
    throw new Error('El servicio seleccionado no es valido');
  }
  if (!VALID_COMPLEXITIES.includes(normalized.complexity)) {
    throw new Error('La complejidad seleccionada no es valida');
  }
  if (!VALID_URGENCIES.includes(normalized.urgency)) {
    throw new Error('La urgencia seleccionada no es valida');
  }

  return normalized;
}

function inferLeadScore({ complexity, urgency, serviceType }) {
  const serviceWeight = serviceType === 'campana' || serviceType === 'web' ? 30 : 20;
  const complexityWeight = complexity === 'avanzada' ? 35 : complexity === 'media' ? 25 : 15;
  const urgencyWeight = urgency === 'express' ? 35 : urgency === 'prioritario' ? 25 : 15;
  return Math.min(100, serviceWeight + complexityWeight + urgencyWeight);
}

function stageToLeadStatus(stage) {
  if (stage === 'NUEVO') return 'nuevo';
  if (stage === 'CONTACTO_INICIAL') return 'contactado';
  if (stage === 'PROPUESTA_ENVIADA' || stage === 'NEGOCIACION') return 'calificado';
  if (stage === 'CERRADO_GANADO') return 'convertido';
  return 'descartado';
}

function pushActivity(quote, message, user, type = 'ACTIVITY') {
  quote.crm = quote.crm || {};
  quote.crm.activities = quote.crm.activities || [];
  quote.crm.activities.push({
    type,
    message,
    byId: user?.id ? String(user.id) : null,
    byName: user?.name || 'Sistema',
    at: new Date(),
  });
}

function createTask(quote, { title, dueAt, user }) {
  quote.crm = quote.crm || {};
  quote.crm.tasks = quote.crm.tasks || [];
  quote.crm.tasks.push({
    title,
    status: 'pendiente',
    dueAt: dueAt || null,
    ownerId: user?.id ? String(user.id) : null,
    ownerName: user?.name || 'Sin asignar',
    createdAt: new Date(),
    completedAt: null,
  });
}

function stageTaskTemplate(stage) {
  if (stage === 'CONTACTO_INICIAL') {
    return { title: 'Registrar resultado de primer contacto', dueInHours: 24 };
  }
  if (stage === 'PROPUESTA_ENVIADA') {
    return { title: 'Hacer seguimiento de propuesta enviada', dueInHours: 48 };
  }
  if (stage === 'NEGOCIACION') {
    return { title: 'Definir condiciones finales de cierre', dueInHours: 24 };
  }
  return null;
}

async function resolveClientUser(client) {
  let user = await User.findOne({ email: client.email });
  if (user) return user;

  const generatedPassword = crypto.randomBytes(8).toString('hex');
  user = await User.create({
    name: client.name,
    email: client.email,
    company: client.company || null,
    password: generatedPassword,
    role: 'cliente',
    isActive: true,
  });

  return user;
}

function buildProjectData({ payload, pricing, clientUser }) {
  const title = `${payload.serviceType} - ${payload.client.company || payload.client.name}`;
  const description = `Proyecto generado desde cotizador web para ${payload.client.name}`;

  return {
    client: clientUser._id,
    clientId: clientUser._id,
    title,
    description,
    serviceType: payload.serviceType,
    complexity: payload.complexity,
    urgency: payload.urgency,
    format: 'brief-pendiente',
    pricing,
    status: 'cotizado',
    price: pricing.total,
    cost: pricing.designerPay,
    minDesignerLevel: payload.complexity === 'avanzada' ? 7 : payload.complexity === 'media' ? 4 : 1,
    timeline: [
      {
        action: 'COTIZACION_GENERADA',
        by: clientUser._id,
        message: 'Lead convertido automaticamente en proyecto cotizado',
      },
    ],
  };
}

async function createQuoteAndProject(payload) {
  const normalizedPayload = normalizePayload(payload);
  const pricing = calcular({
    serviceType: normalizedPayload.serviceType,
    complexity: normalizedPayload.complexity,
    urgency: normalizedPayload.urgency,
  });

  const clientUser = await resolveClientUser(normalizedPayload.client);
  const leadScore = inferLeadScore(normalizedPayload);
  const quote = await Quote.create({
    client: normalizedPayload.client,
    serviceType: normalizedPayload.serviceType,
    complexity: normalizedPayload.complexity,
    urgency: normalizedPayload.urgency,
    pricing: {
      base: pricing.base,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      total: pricing.total,
      anticipo: pricing.anticipo,
      balance: pricing.balance,
      commission: pricing.commission,
      designerPay: pricing.designerPay,
    },
    leadStatus: 'nuevo',
    stage: 'NUEVO',
    leadScore,
    crm: {
      notes: [],
      activities: [{
        type: 'LEAD_CREATED',
        message: 'Lead creado desde cotizador web',
        byName: normalizedPayload.client.name || 'Sistema',
      }],
      tasks: [{
        title: 'Realizar primer contacto comercial',
        status: 'pendiente',
        dueAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
        ownerName: 'Equipo comercial',
      }],
    },
  });

  return {
    quoteId: quote._id,
    projectId: null,
    leadStatus: quote.leadStatus,
    stage: quote.stage,
    leadScore,
    pricing: quote.pricing,
    project: null,
  };
}

async function getUserScope(user) {
  if (!user || !user.id) throw new Error('Usuario no autenticado');

  const dbUser = await User.findById(user.id).select('email role name');
  if (!dbUser) throw new Error('Usuario no encontrado');

  const filter = dbUser.role === 'admin' ? {} : { 'client.email': dbUser.email };
  return { dbUser, filter };
}

async function ensureProjectForClosedWon(quote, actorId) {
  if (quote.project) {
    quote.leadStatus = 'convertido';
    await quote.save();
    return quote.project;
  }

  const clientUser = await resolveClientUser(quote.client);
  const project = await Project.create(buildProjectData({
    payload: {
      client: quote.client,
      serviceType: quote.serviceType,
      complexity: quote.complexity,
      urgency: quote.urgency,
    },
    pricing: quote.pricing,
    clientUser,
  }));

  project.timeline.push({
    action: 'CRM_CERRADO_GANADO',
    by: actorId || clientUser._id,
    message: 'Lead convertido en proyecto desde CRM',
  });
  await project.save();

  quote.project = project._id;
  quote.leadStatus = 'convertido';
  await quote.save();

  return project._id;
}

async function getQuotesForUser(user) {
  const { filter } = await getUserScope(user);

  const quotes = await Quote.find(filter)
    .select('client serviceType complexity urgency pricing leadStatus stage leadScore source crm project createdAt updatedAt')
    .populate('project', 'title status createdAt')
    .sort({ createdAt: -1 })
    .limit(200);

  return quotes;
}

async function getQuoteByIdForUser(user, quoteId) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  const { dbUser } = await getUserScope(user);

  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter)
    .select('client serviceType complexity urgency pricing leadStatus stage leadScore source crm project createdAt updatedAt')
    .populate('project', 'title status serviceType complexity urgency createdAt');

  if (!quote) {
    throw new Error('La cotizacion no existe o no tienes acceso');
  }

  return quote;
}

async function updateQuoteStageForUser(user, quoteId, nextStage) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  if (!VALID_STAGES.includes(nextStage)) {
    throw new Error('La etapa seleccionada no es valida');
  }

  const { dbUser } = await getUserScope(user);

  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter);
  if (!quote) {
    throw new Error('La cotizacion no existe o no tienes acceso');
  }

  const currentStage = quote.stage || 'NUEVO';
  quote.stage = nextStage;
  quote.leadStatus = stageToLeadStatus(nextStage);
  pushActivity(quote, `Etapa actualizada de ${currentStage} a ${nextStage}`, user, 'STAGE_CHANGED');

  const template = stageTaskTemplate(nextStage);
  if (template) {
    createTask(quote, {
      title: template.title,
      dueAt: new Date(Date.now() + (template.dueInHours * 60 * 60 * 1000)),
      user,
    });
  }

  if (nextStage === 'CERRADO_GANADO') {
    await ensureProjectForClosedWon(quote, user.id);
    pushActivity(quote, 'Lead convertido a proyecto (CERRADO_GANADO)', user, 'LEAD_WON');
    await quote.save();
  } else if (nextStage === 'CERRADO_PERDIDO') {
    pushActivity(quote, 'Oportunidad marcada como perdida', user, 'LEAD_LOST');
    await quote.save();
  } else {
    await quote.save();
  }

  return getQuoteByIdForUser(user, quoteId);
}

async function addQuoteNoteForUser(user, quoteId, message) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  const trimmed = ensureString(message);
  if (!trimmed) throw new Error('La nota es obligatoria');

  const { dbUser } = await getUserScope(user);

  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter);
  if (!quote) {
    throw new Error('La cotizacion no existe o no tienes acceso');
  }

  quote.crm = quote.crm || {};
  quote.crm.notes = quote.crm.notes || [];
  quote.crm.notes.push({
    message: trimmed,
    authorId: String(user.id),
    authorName: user.name || dbUser.name || 'Usuario',
    at: new Date(),
  });
  pushActivity(quote, `Se agrego nota comercial: ${trimmed}`, user, 'NOTE_ADDED');
  await quote.save();

  return getQuoteByIdForUser(user, quoteId);
}

async function getQuoteTimelineForUser(user, quoteId) {
  const quote = await getQuoteByIdForUser(user, quoteId);
  const activities = (quote.crm?.activities || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at));
  const notes = (quote.crm?.notes || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at));
  const tasks = (quote.crm?.tasks || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    quoteId: quote._id,
    stage: quote.stage,
    leadStatus: quote.leadStatus,
    activities,
    notes,
    tasks,
  };
}

async function addQuoteTaskForUser(user, quoteId, payload) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  const title = ensureString(payload?.title);
  if (!title) throw new Error('El titulo de la tarea es obligatorio');

  const { dbUser } = await getUserScope(user);
  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter);
  if (!quote) throw new Error('La cotizacion no existe o no tienes acceso');

  const dueAt = payload?.dueAt ? new Date(payload.dueAt) : null;
  createTask(quote, {
    title,
    dueAt: Number.isNaN(dueAt?.getTime?.()) ? null : dueAt,
    user,
  });
  pushActivity(quote, `Se creo tarea comercial: ${title}`, user, 'TASK_CREATED');
  await quote.save();

  return getQuoteTimelineForUser(user, quoteId);
}

async function updateQuoteTaskForUser(user, quoteId, taskId, status) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  if (!['pendiente', 'completada'].includes(status)) {
    throw new Error('El estado de tarea no es valido');
  }

  const { dbUser } = await getUserScope(user);
  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter);
  if (!quote) throw new Error('La cotizacion no existe o no tienes acceso');

  const task = (quote.crm?.tasks || []).find((item) => String(item._id) === String(taskId));
  if (!task) throw new Error('La tarea no existe');

  task.status = status;
  task.completedAt = status === 'completada' ? new Date() : null;
  pushActivity(quote, `Tarea ${status === 'completada' ? 'completada' : 'reabierta'}: ${task.title}`, user, 'TASK_UPDATED');
  await quote.save();

  return getQuoteTimelineForUser(user, quoteId);
}

async function getCrmKpisForUser(user) {
  const { filter } = await getUserScope(user);
  const quotes = await Quote.find(filter)
    .select('stage pricing.total createdAt')
    .lean();

  const totalLeads = quotes.length;
  const wonLeads = quotes.filter((q) => q.stage === 'CERRADO_GANADO').length;
  const conversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(2)) : 0;

  const pipelineValue = quotes
    .filter((q) => q.stage !== 'CERRADO_PERDIDO' && q.stage !== 'CERRADO_GANADO')
    .reduce((sum, q) => sum + (q.pricing?.total || 0), 0);

  const leadsByStage = VALID_STAGES.reduce((acc, stage) => {
    acc[stage] = quotes.filter((q) => (q.stage || 'NUEVO') === stage).length;
    return acc;
  }, {});

  return {
    totalLeads,
    wonLeads,
    conversionRate,
    pipelineValue,
    leadsByStage,
  };
}

module.exports = {
  createQuoteAndProject,
  getQuoteByIdForUser,
  getQuotesForUser,
  updateQuoteStageForUser,
  addQuoteNoteForUser,
  getCrmKpisForUser,
  getQuoteTimelineForUser,
  addQuoteTaskForUser,
  updateQuoteTaskForUser,
};
