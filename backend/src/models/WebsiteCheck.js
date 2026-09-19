const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const websiteCheckSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    websiteId: { type: String, required: true, ref: 'Website', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['UP', 'DEGRADED', 'DOWN'],
      required: true
    },
    statusCode: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    timeout: { type: Boolean, default: false },
    errorType: {
      type: String,
      enum: ['TIMEOUT', 'DNS_FAILURE', 'CONNECTION_REFUSED', 'HTTP_ERROR', 'SSL_ERROR', 'NETWORK_ERROR', null],
      default: null
    },
    errorMessage: { type: String, default: null },
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

// Compound index for time-series queries
websiteCheckSchema.index({ websiteId: 1, timestamp: -1 });

websiteCheckSchema.virtual('id').get(function () {
  return this._id;
});

const WebsiteCheck = mongoose.model('WebsiteCheck', websiteCheckSchema, 'website_checks');

module.exports = WebsiteCheck;
