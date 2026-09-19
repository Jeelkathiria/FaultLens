const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const incidentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    apiId: { type: String, required: true, ref: 'Api', index: true },
    websiteId: { type: String, ref: 'Website', index: true },
    anomalyId: { type: String, default: null, ref: 'Anomaly' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, default: 'critical' }, // critical, warning, resolved
    status: {
      type: String,
      enum: ['DETECTED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'],
      default: 'DETECTED',
      index: true
    },
    detectedAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

incidentSchema.index({ apiId: 1, status: 1 });
incidentSchema.index({ websiteId: 1, status: 1 });

incidentSchema.virtual('id').get(function () {
  return this._id;
});

const Incident = mongoose.model('Incident', incidentSchema, 'incidents');

module.exports = Incident;
