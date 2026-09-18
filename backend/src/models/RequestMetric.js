const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const requestMetricSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    apiId: { type: String, required: true, ref: 'Api', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    statusCode: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    method: { type: String, required: true },
    endpoint: { type: String, required: true },
    errorMessage: { type: String, default: null },
    success: { type: Boolean, default: true },
    isHealthCheck: { type: Boolean, default: false }
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

requestMetricSchema.index({ apiId: 1, timestamp: -1 });

requestMetricSchema.virtual('id').get(function () {
  return this._id;
});

const RequestMetric = mongoose.model('RequestMetric', requestMetricSchema, 'request_metrics');

module.exports = RequestMetric;
