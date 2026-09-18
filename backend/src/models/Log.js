const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const logSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    apiId: { type: String, required: true, ref: 'Api', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    level: {
      type: String,
      enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
      default: 'INFO',
      index: true
    },
    message: { type: String, required: true },
    statusCode: { type: Number, default: null },
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

logSchema.index({ apiId: 1, timestamp: -1 });

logSchema.virtual('id').get(function () {
  return this._id;
});

const Log = mongoose.model('Log', logSchema, 'logs');

module.exports = Log;
