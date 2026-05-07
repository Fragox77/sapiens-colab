const mongoose = require('mongoose');

const LiquidacionSchema = new mongoose.Schema({
  colaboradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monto:         { type: Number, required: true, min: 1 },
  comprobante:   { type: String, default: '' },
  fecha:         { type: Date, default: Date.now },
  creadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Liquidacion', LiquidacionSchema);
