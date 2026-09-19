const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const websiteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: { type: String, required: true, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    environment: {
      type: String,
      enum: ['PRODUCTION', 'STAGING', 'DEVELOPMENT'],
      default: 'PRODUCTION'
    },
    status: { type: String, default: 'healthy' }, // overall: healthy, degraded, critical
    description: { type: String, default: null },
    // Website-level HTTP Monitoring configuration and state
    monitoringEnabled: { type: Boolean, default: true },
    monitoringInterval: { type: Number, default: 60 }, // interval in seconds
    monitoringTimeout: { type: Number, default: 10 }, // timeout in seconds
    expectedStatusCodes: { type: [Number], default: [200] },
    healthStatus: {
      type: String,
      enum: ['UP', 'DEGRADED', 'DOWN', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    lastCheckedAt: { type: Date, default: null },
    lastSuccessfulCheckAt: { type: Date, default: null },
    lastResponseTime: { type: Number, default: null },
    lastStatusCode: { type: Number, default: null },
    lastError: { type: String, default: null },
    consecutiveFailures: { type: Number, default: 0 },
    sslValid: { type: Boolean, default: null }
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

websiteSchema.virtual('id').get(function () {
  return this._id;
});

const Website = mongoose.model('Website', websiteSchema, 'websites');

module.exports = Website;
