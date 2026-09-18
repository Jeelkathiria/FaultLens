const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const metricAggregateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    apiId: { type: String, required: true, ref: 'Api', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    requestCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    clientErrorCount: { type: Number, default: 0 },
    serverErrorCount: { type: Number, default: 0 },
    avgLatency: { type: Number, default: 0 },
    p50: { type: Number, default: 0 },
    p95: { type: Number, default: 0 },
    p99: { type: Number, default: 0 }
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

metricAggregateSchema.index({ apiId: 1, timestamp: -1 });

metricAggregateSchema.virtual('id').get(function () {
  return this._id;
});

const MetricAggregate = mongoose.model('MetricAggregate', metricAggregateSchema, 'metric_aggregates');

module.exports = MetricAggregate;
