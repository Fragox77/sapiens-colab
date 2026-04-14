const crypto = require('crypto');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const User = require('../models/User');
const { calcular } = require('../utils/cotizador');

const VALID_SERVICE_TYPES = ['branding', 'piezas', 'video-motion', 'fotografia', 'social-media', 'web', 'campana'];
const VALID_COMPLEXITIES = ['basica', 'media', 'avanzada'];
const VALID_URGENCIES = ['normal', 'prioritario', 'express'];

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
  const project = await Project.create(buildProjectData({ payload: normalizedPayload, pricing, clientUser }));

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
    project: project._id,
    leadStatus: 'convertido',
    leadScore,
  });

  return {
    quoteId: quote._id,
    projectId: project._id,
    leadStatus: quote.leadStatus,
    leadScore,
    pricing: quote.pricing,
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
      serviceType: project.serviceType,
      complexity: project.complexity,
      urgency: project.urgency,
      createdAt: project.createdAt,
    },
  };
}

async function getQuotesForUser(user) {
  if (!user || !user.id) throw new Error('Usuario no autenticado');

  const dbUser = await User.findById(user.id).select('email role');
  if (!dbUser) throw new Error('Usuario no encontrado');

  const filter = dbUser.role === 'admin' ? {} : { 'client.email': dbUser.email };

  const quotes = await Quote.find(filter)
    .select('client serviceType complexity urgency pricing leadStatus leadScore source project createdAt')
    .populate('project', 'title status createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

  return quotes;
}

async function getQuoteByIdForUser(user, quoteId) {
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    throw new Error('La cotizacion no existe');
  }

  if (!user || !user.id) throw new Error('Usuario no autenticado');

  const dbUser = await User.findById(user.id).select('email role');
  if (!dbUser) throw new Error('Usuario no encontrado');

  const filter = { _id: quoteId };
  if (dbUser.role !== 'admin') {
    filter['client.email'] = dbUser.email;
  }

  const quote = await Quote.findOne(filter)
    .select('client serviceType complexity urgency pricing leadStatus leadScore source crm project createdAt updatedAt')
    .populate('project', 'title status serviceType complexity urgency createdAt');

  if (!quote) {
    throw new Error('La cotizacion no existe o no tienes acceso');
  }

  return quote;
}

module.exports = { createQuoteAndProject, getQuoteByIdForUser, getQuotesForUser };
