const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  nps: { type: Number, min: 0, max: 10, default: null },
  comment: { type: String, default: '' },
}, { timestamps: true });

feedbackSchema.index({ project: 1, client: 1 }, { unique: true });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);