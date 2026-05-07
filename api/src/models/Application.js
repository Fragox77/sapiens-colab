const mongoose = require('mongoose');

const PilarSchema = new mongoose.Schema({
  puntaje: { type: Number, min: 1, max: 10 },
  nota:    { type: String, default: '' },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  // ─── Campos originales ────────────────────────────────────────
  name:         { type: String, required: true },
  email:        { type: String, required: true, lowercase: true },
  phone:        { type: String, required: true },
  city:         { type: String, required: true },
  role:         { type: String, required: true },
  experience:   { type: String, required: true },
  availability: { type: String, required: true },
  portfolio:    { type: String, default: null },
  motivation:   { type: String, required: true },

  status: {
    type: String,
    enum: ['recibida', 'en-evaluacion', 'prueba-enviada', 'evaluada', 'aceptada', 'rechazada'],
    default: 'recibida',
  },
  scores: {
    experiencia: { type: Number, min: 0, max: 10, default: null },
    portafolio:  { type: Number, min: 0, max: 10, default: null },
    prueba:      { type: Number, min: 0, max: 10, default: null },
    estrategia:  { type: Number, min: 0, max: 10, default: null },
    softSkills:  { type: Number, min: 0, max: 10, default: null },
  },
  level:         { type: Number, min: 1, max: 10, default: null },
  payRange:      { type: String, default: null },
  briefAssigned: { type: String, default: null },
  notes:         { type: String, default: null },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ─── Campos nuevos ────────────────────────────────────────────
  tools:           { type: [String], default: [] },
  source:          { type: String, default: null },
  experienceYears: { type: Number, min: 0, max: 15, default: null },
  workDescription: { type: String, default: null },

  estado: {
    type: String,
    enum: ['pendiente', 'en_prueba', 'evaluado', 'aprobado', 'descartado'],
    default: 'pendiente',
  },
  briefPrueba:       { type: String, default: null },
  fechaLimitePrueba: { type: Date, default: null },
  entregaPrueba:     { type: String, default: null },

  evaluacion: {
    experiencia:            { type: PilarSchema, default: null },
    portafolio:             { type: PilarSchema, default: null },
    pruebaPractica:         { type: PilarSchema, default: null },
    pensamientoEstrategico: { type: PilarSchema, default: null },
    softSkills:             { type: PilarSchema, default: null },
    nivelCalculado: { type: Number, default: null },
    rangoPago:      { type: String, default: null },
    evaluadoAt:     { type: Date, default: null },
    evaluadoPor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },

  timeline: [{
    estado: { type: String },
    nota:   { type: String, default: '' },
    by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at:     { type: Date, default: Date.now },
  }],

}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
