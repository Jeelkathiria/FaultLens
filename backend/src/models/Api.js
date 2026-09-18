const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const apiSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    websiteId: { type: String, required: true, ref: 'Website', index: true },
    name: { type: String, required: true, trim: true },
    endpoint: { type: String, required: true, trim: true },
    method: { type: String, default: 'GET', uppercase: true },
    healthCheckEndpoint: { type: String, default: null },
    monitoringInterval: { type: Number, default: 60 }, // in seconds
    expectedStatusCode: { type: Number, default: 200 },
    timeout: { type: Number, default: 10000 }, // in milliseconds
    status: { type: String, default: 'UNKNOWN' }, // UNKNOWN, HEALTHY, DEGRADED, CRITICAL
    lastCheckedAt: { type: Date, default: null },
    lastResponseTime: { type: Number, default: null },
    lastStatusCode: { type: Number, default: null },
    lastCheckSuccess: { type: Boolean, default: null },
    lastError: { type: String, default: null }
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

apiSchema.virtual('id').get(function () {
  return this._id;
});

const Api = mongoose.model('Api', apiSchema, 'apis');

module.exports = Api;
