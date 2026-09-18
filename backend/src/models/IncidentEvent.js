const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const incidentEventSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    incidentId: { type: String, required: true, ref: 'Incident', index: true },
    type: { type: String, required: true }, // deployment, warning, anomaly, incident, action, resolved
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  {
    timestamps: false,
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

incidentEventSchema.index({ incidentId: 1, timestamp: -1 });

incidentEventSchema.virtual('id').get(function () {
  return this._id;
});

const IncidentEvent = mongoose.model('IncidentEvent', incidentEventSchema, 'incident_events');

module.exports = IncidentEvent;
