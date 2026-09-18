const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const anomalySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    apiId: { type: String, required: true, ref: 'Api', index: true },
    metricType: { type: String, required: true }, // ERROR_RATE, LATENCY, REQUEST_VOLUME, UPTIME
    detectedValue: { type: Number, required: true },
    baselineValue: { type: Number, required: true },
    deviation: { type: Number, required: true },
    detectedAt: { type: Date, default: Date.now, index: true },
    severity: { type: String, default: 'critical' }, // critical, warning
    status: { type: String, default: 'OPEN' }
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

anomalySchema.index({ apiId: 1, detectedAt: -1 });

anomalySchema.virtual('id').get(function () {
  return this._id;
});

const Anomaly = mongoose.model('Anomaly', anomalySchema, 'anomalies');

module.exports = Anomaly;
