const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },

  // 'cliente' | 'disenador' | 'admin'
  role: { type: String, enum: ['cliente', 'disenador', 'admin'], default: 'cliente' },

  // Solo diseñadores/colaboradores
  level:       { type: Number, min: 1, max: 10, default: null },   // Escala SAPIENS 1-10
  specialty:   { type: String, default: null },                    // diseñador-grafico | video-motion | ...
  portfolio:   { type: String, default: null },                    // URL portafolio
  isActive:    { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },

  // Datos empresa (clientes)
  company:     { type: String, default: null },
  phone:       { type: String, default: null },

  avatar:      { type: String, default: null },
}, { timestamps: true });

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
