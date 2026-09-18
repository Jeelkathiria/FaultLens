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
    status: { type: String, default: 'healthy' }, // healthy, degraded, critical
    description: { type: String, default: null }
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
