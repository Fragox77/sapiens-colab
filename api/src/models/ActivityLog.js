const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  actorRole: { type: String, enum: ['admin', 'cliente', 'disenador'], required: true },
  eventType: {
    type: String,
    enum: [
      'project_created',
      'project_assigned',
      'project_started',
      'deliverable_uploaded',
      'project_review_requested',
      'project_approved',
      'project_completed',
      'payment_received',
      'feedback_submitted',
    ],
    required: true,
    index: true,
  },
  durationMinutes: { type: Number, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

activityLogSchema.index({ eventType: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);