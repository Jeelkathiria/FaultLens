const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const deploymentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    websiteId: { type: String, required: true, ref: 'Website', index: true },
    apiId: { type: String, default: null, ref: 'Api', index: true },
    version: { type: String, required: true },
    commitHash: { type: String, required: true },
    branch: { type: String, default: 'main' },
    environment: { type: String, default: 'PRODUCTION' },
    deployedAt: { type: Date, default: Date.now, index: true },
    status: { type: String, default: 'stable' }, // stable, incident, rolled-back
    message: { type: String, default: null },
    author: { type: String, default: null }
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

deploymentSchema.index({ websiteId: 1, deployedAt: -1 });
deploymentSchema.index({ apiId: 1, deployedAt: -1 });

deploymentSchema.virtual('id').get(function () {
  return this._id;
});

const Deployment = mongoose.model('Deployment', deploymentSchema, 'deployments');

module.exports = Deployment;
