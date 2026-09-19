const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');
const models = require('../models');

// Configure mongoose settings for pure MongoDB operation
mongoose.set('strictQuery', false);

// Connect to MongoDB
if (!env.isTest) {
  mongoose
    .connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    })
    .then(() => {
      logger.info(`✅ Connected to MongoDB at ${env.MONGODB_URI}`);
    })
    .catch((err) => {
      logger.error('❌ MongoDB connection error:', err.message);
    });
}

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

/**
 * Helper to convert Mongoose doc to clean plain object with 'id'
 */
function formatDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  obj.id = obj._id || obj.id;
  delete obj.__v;
  return obj;
}

/**
 * Translate query filters into native Mongoose query filters
 */
async function translateWhere(where = {}, modelName = '') {
  if (!where || typeof where !== 'object') return {};

  const query = {};

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === 'id') {
      if (val && typeof val === 'object') {
        if (val.not !== undefined) {
          query._id = { $ne: val.not };
        } else if (val.in !== undefined) {
          query._id = { $in: val.in };
        } else {
          query._id = val;
        }
      } else {
        query._id = val;
      }
    } else if (key === 'api' && val && typeof val === 'object') {
      // Handle multi-tenant website / user ownership filters
      let matchingApiIds = null;

      if (val.website && val.website.userId) {
        const userWebsites = await models.Website.find({ userId: val.website.userId }).select('_id');
        const userWebsiteIds = userWebsites.map((w) => w._id);

        let targetWebsiteIds = userWebsiteIds;
        if (val.websiteId) {
          if (typeof val.websiteId === 'object' && val.websiteId.in) {
            targetWebsiteIds = val.websiteId.in.filter((id) => userWebsiteIds.includes(id));
          } else {
            targetWebsiteIds = userWebsiteIds.includes(val.websiteId) ? [val.websiteId] : [];
          }
        }

        const apis = await models.Api.find({ websiteId: { $in: targetWebsiteIds } }).select('_id');
        matchingApiIds = apis.map((a) => a._id);
      } else if (val.websiteId) {
        if (typeof val.websiteId === 'object' && val.websiteId.in) {
          const apis = await models.Api.find({ websiteId: { $in: val.websiteId.in } }).select('_id');
          matchingApiIds = apis.map((a) => a._id);
        } else {
          const apis = await models.Api.find({ websiteId: val.websiteId }).select('_id');
          matchingApiIds = apis.map((a) => a._id);
        }
      }

      if (matchingApiIds !== null) {
        query.apiId = { $in: matchingApiIds };
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const fieldOps = {};
      for (const [op, opVal] of Object.entries(val)) {
        if (op === 'in') fieldOps.$in = opVal;
        else if (op === 'notIn') fieldOps.$nin = opVal;
        else if (op === 'not') fieldOps.$ne = opVal;
        else if (op === 'gte') fieldOps.$gte = opVal;
        else if (op === 'gt') fieldOps.$gt = opVal;
        else if (op === 'lte') fieldOps.$lte = opVal;
        else if (op === 'lt') fieldOps.$lt = opVal;
        else if (op === 'contains') fieldOps.$regex = opVal;
        else fieldOps[op] = opVal;
      }
      query[key] = fieldOps;
    } else {
      query[key] = val;
    }
  }

  return query;
}

/**
 * Translate orderBy { timestamp: 'desc' } -> { timestamp: -1 }
 */
function translateOrderBy(orderBy) {
  if (!orderBy) return {};
  if (Array.isArray(orderBy)) {
    const sort = {};
    orderBy.forEach((item) => {
      Object.entries(item).forEach(([k, v]) => {
        sort[k === 'id' ? '_id' : k] = String(v).toLowerCase() === 'asc' ? 1 : -1;
      });
    });
    return sort;
  }
  const sort = {};
  Object.entries(orderBy).forEach(([k, v]) => {
    sort[k === 'id' ? '_id' : k] = String(v).toLowerCase() === 'asc' ? 1 : -1;
  });
  return sort;
}

/**
 * Resolve relations for populated results
 */
async function resolveIncludes(item, include, modelName) {
  if (!item || !include) return item;

  // Website relations
  if (modelName === 'Website') {
    if (include.apis) {
      const apis = await models.Api.find({ websiteId: item.id });
      item.apis = await Promise.all(
        apis.map(async (a) => {
          const apiObj = formatDoc(a);
          if (include.apis.include && include.apis.include.incidents) {
            const incWhere = include.apis.include.incidents.where
              ? await translateWhere(include.apis.include.incidents.where)
              : {};
            const incs = await models.Incident.find({ apiId: apiObj.id, ...incWhere });
            apiObj.incidents = incs.map(formatDoc);
          }
          return apiObj;
        })
      );
    }
    if (include.deployments) {
      const deps = await models.Deployment.find({ websiteId: item.id }).sort({ deployedAt: -1 });
      item.deployments = deps.map(formatDoc);
    }
    if (include.user) {
      const u = await models.User.findById(item.userId);
      item.user = formatDoc(u);
    }
    if (include.checks) {
      const checks = await models.WebsiteCheck.find({ websiteId: item.id }).sort({ timestamp: -1 }).limit(include.checks.take || 20);
      item.checks = checks.map(formatDoc);
    }
  }

  // Api relations
  if (modelName === 'Api') {
    if (include.website) {
      const w = await models.Website.findById(item.websiteId);
      item.website = formatDoc(w);
    }
    if (include.incidents) {
      const incWhere = include.incidents.where ? await translateWhere(include.incidents.where) : {};
      const incs = await models.Incident.find({ apiId: item.id, ...incWhere });
      item.incidents = incs.map(formatDoc);
    }
  }

  // Incident relations
  if (modelName === 'Incident') {
    if (include.api) {
      const api = await models.Api.findById(item.apiId);
      const apiObj = formatDoc(api);
      if (apiObj && include.api.include && include.api.include.website) {
        const w = await models.Website.findById(apiObj.websiteId);
        apiObj.website = formatDoc(w);
      }
      item.api = apiObj;
    }
    if (include.website || !item.websiteId) {
      if (item.websiteId) {
        const w = await models.Website.findById(item.websiteId);
        item.website = formatDoc(w);
      } else if (item.api?.websiteId) {
        item.websiteId = item.api.websiteId;
        const w = await models.Website.findById(item.api.websiteId);
        item.website = formatDoc(w);
      }
    }
    if (include.events) {
      const sort = include.events.orderBy ? translateOrderBy(include.events.orderBy) : { timestamp: 1 };
      const events = await models.IncidentEvent.find({ incidentId: item.id }).sort(sort);
      item.events = events.map(formatDoc);
    }
    if (include.anomaly && item.anomalyId) {
      const anom = await models.Anomaly.findById(item.anomalyId);
      item.anomaly = formatDoc(anom);
    }
  }

  // Deployment relations
  if (modelName === 'Deployment') {
    if (include.website) {
      const w = await models.Website.findById(item.websiteId);
      item.website = formatDoc(w);
    }
    if (include.api && item.apiId) {
      const api = await models.Api.findById(item.apiId);
      item.api = formatDoc(api);
    }
  }

  // Log relations
  if (modelName === 'Log') {
    if (include.api) {
      const api = await models.Api.findById(item.apiId);
      const apiObj = formatDoc(api);
      if (apiObj && include.api.include && include.api.include.website) {
        const w = await models.Website.findById(apiObj.websiteId);
        apiObj.website = formatDoc(w);
      }
      item.api = apiObj;
    }
  }

  // ApiKey relations
  if (modelName === 'ApiKey') {
    if (include.user) {
      const u = await models.User.findById(item.userId);
      item.user = formatDoc(u);
    }
  }

  return item;
}

/**
 * Creates a clean MongoDB adapter around a Mongoose model
 */
function createAdapter(Model, modelName) {
  return {
    model: Model,

    async findUnique(args = {}) {
      const where = await translateWhere(args.where, modelName);
      let query = Model.findOne(where);
      if (args.select) {
        const sel = { ...args.select };
        if (sel.id) {
          sel._id = 1;
          delete sel.id;
        }
        query = query.select(sel);
      }
      const doc = await query.exec();
      if (!doc) return null;
      let obj = formatDoc(doc);
      if (args.include) {
        obj = await resolveIncludes(obj, args.include, modelName);
      }
      return obj;
    },

    async findFirst(args = {}) {
      const where = await translateWhere(args.where, modelName);
      let query = Model.findOne(where);
      if (args.orderBy) query = query.sort(translateOrderBy(args.orderBy));
      if (args.select) {
        const sel = { ...args.select };
        if (sel.id) {
          sel._id = 1;
          delete sel.id;
        }
        query = query.select(sel);
      }
      const doc = await query.exec();
      if (!doc) return null;
      let obj = formatDoc(doc);
      if (args.include) {
        obj = await resolveIncludes(obj, args.include, modelName);
      }
      return obj;
    },

    async findMany(args = {}) {
      const where = await translateWhere(args.where, modelName);
      let query = Model.find(where);
      if (args.orderBy) query = query.sort(translateOrderBy(args.orderBy));
      if (args.skip) query = query.skip(args.skip);
      if (args.take) query = query.limit(args.take);
      if (args.select) {
        const sel = { ...args.select };
        if (sel.id) {
          sel._id = 1;
          delete sel.id;
        }
        query = query.select(sel);
      }

      const docs = await query.exec();
      let items = docs.map(formatDoc);

      if (args.include) {
        items = await Promise.all(items.map((item) => resolveIncludes(item, args.include, modelName)));
      }

      return items;
    },

    async create(args = {}) {
      const data = { ...args.data };
      if (data.id) {
        data._id = data.id;
        delete data.id;
      }
      const doc = await Model.create(data);
      let obj = formatDoc(doc);
      if (args.include) {
        obj = await resolveIncludes(obj, args.include, modelName);
      }
      return obj;
    },

    async createMany(args = {}) {
      const list = args.data.map((item) => {
        const copy = { ...item };
        if (copy.id) {
          copy._id = copy.id;
          delete copy.id;
        }
        return copy;
      });
      const res = await Model.insertMany(list);
      return { count: res.length };
    },

    async update(args = {}) {
      const where = await translateWhere(args.where, modelName);
      const data = { ...args.data };
      if (data.id) delete data.id;

      const updated = await Model.findOneAndUpdate(where, { $set: data }, { new: true });
      if (!updated) return null;
      let obj = formatDoc(updated);
      if (args.include) {
        obj = await resolveIncludes(obj, args.include, modelName);
      }
      return obj;
    },

    async updateMany(args = {}) {
      const where = await translateWhere(args.where, modelName);
      const data = { ...args.data };
      if (data.id) delete data.id;

      const res = await Model.updateMany(where, { $set: data });
      return { count: res.modifiedCount };
    },

    async delete(args = {}) {
      const where = await translateWhere(args.where, modelName);
      const doc = await Model.findOneAndDelete(where);
      return formatDoc(doc);
    },

    async deleteMany(args = {}) {
      const where = args.where ? await translateWhere(args.where, modelName) : {};
      const res = await Model.deleteMany(where);
      return { count: res.deletedCount };
    },

    async count(args = {}) {
      const where = args.where ? await translateWhere(args.where, modelName) : {};
      return Model.countDocuments(where);
    }
  };
}

const db = {
  mongoose,
  models,

  // Direct access to native Mongoose models
  User: models.User,
  Website: models.Website,
  WebsiteCheck: models.WebsiteCheck,
  Api: models.Api,
  ApiKey: models.ApiKey,
  RequestMetric: models.RequestMetric,
  MetricAggregate: models.MetricAggregate,
  Anomaly: models.Anomaly,
  Incident: models.Incident,
  IncidentEvent: models.IncidentEvent,
  Deployment: models.Deployment,
  Log: models.Log,

  // Clean data access adapters
  user: createAdapter(models.User, 'User'),
  website: createAdapter(models.Website, 'Website'),
  websiteCheck: createAdapter(models.WebsiteCheck, 'WebsiteCheck'),
  api: createAdapter(models.Api, 'Api'),
  apiKey: createAdapter(models.ApiKey, 'ApiKey'),
  requestMetric: createAdapter(models.RequestMetric, 'RequestMetric'),
  metricAggregate: createAdapter(models.MetricAggregate, 'MetricAggregate'),
  anomaly: createAdapter(models.Anomaly, 'Anomaly'),
  incident: createAdapter(models.Incident, 'Incident'),
  incidentEvent: createAdapter(models.IncidentEvent, 'IncidentEvent'),
  deployment: createAdapter(models.Deployment, 'Deployment'),
  log: createAdapter(models.Log, 'Log'),

  async $disconnect() {
    await mongoose.disconnect();
  }
};

module.exports = db;
