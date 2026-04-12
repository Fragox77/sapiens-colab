const mongoose = require('mongoose');

// Postulaciones de freelancers
const applicationSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, lowercase: true },
  phone:        { type: String, required: true },
  city:         { type: String, required: true },
  role:         { type: String, required: true }, // diseñador-grafico, video-motion, etc.
  experience:   { type: String, required: true }, // '0-1', '1-2', '2-5', '5-10', '10+'
  availability: { type: String, required: true },
  portfolio:    { type: String, default: null },
  motivation:   { type: String, required: true },

  // Evaluación
  status: {
    type: String,
    enum: ['recibida', 'en-evaluacion', 'prueba-enviada', 'evaluada', 'aceptada', 'rechazada'],
    default: 'recibida',
  },

  // Scores (5 pilares)
  scores: {
    experiencia:  { type: Number, min: 0, max: 10, default: null },
    portafolio:   { type: Number, min: 0, max: 10, default: null },
    prueba:       { type: Number, min: 0, max: 10, default: null },
    estrategia:   { type: Number, min: 0, max: 10, default: null },
    softSkills:   { type: Number, min: 0, max: 10, default: null },
  },

  // Calculado automáticamente: ponderado 20/25/25/15/15
  level:     { type: Number, min: 1, max: 10, default: null },
  payRange:  { type: String, default: null }, // '$800k–$1.5M'

  briefAssigned: { type: String, default: null },
  notes:         { type: String, default: null },

  // Si fue aceptada, el User creado
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
