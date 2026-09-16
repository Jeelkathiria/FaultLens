const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisAvailable = false;
const inMemoryCache = new Map();

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 5) {
        // Stop spamming reconnect attempts if Redis is not running locally
        return null;
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    logger.info('Connected to Redis server');
  });

  redisClient.on('ready', () => {
    isRedisAvailable = true;
  });

  redisClient.on('error', (err) => {
    if (isRedisAvailable) {
      logger.warn(`Redis connection error: ${err.message}`);
    }
    isRedisAvailable = false;
  });

  redisClient.on('close', () => {
    isRedisAvailable = false;
  });

  // Attempt initial connect asynchronously (skip in test environment)
  if (!env.isTest) {
    redisClient.connect().catch((err) => {
      logger.warn(`Redis unavailable at ${env.REDIS_URL} - using resilient in-memory fallback (${err.message})`);
      isRedisAvailable = false;
    });
  }
} catch (err) {
  logger.warn(`Redis client initialization skipped: ${err.message}`);
}

const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.debug(`Redis get failed for key ${key}: ${err.message}`);
      }
    }
    const memItem = inMemoryCache.get(key);
    if (!memItem) return null;
    if (memItem.expiry && Date.now() > memItem.expiry) {
      inMemoryCache.delete(key);
      return null;
    }
    return memItem.value;
  },

  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    if (isRedisAvailable && redisClient) {
      try {
        if (ttlSeconds) {
          await redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, serialized);
        }
        return true;
      } catch (err) {
        logger.debug(`Redis set failed for key ${key}: ${err.message}`);
      }
    }
    inMemoryCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
    return true;
  },

  async del(key) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {
        logger.debug(`Redis del failed for key ${key}: ${err.message}`);
      }
    }
    inMemoryCache.delete(key);
    return true;
  },

  async flushByPattern(prefix) {
    if (isRedisAvailable && redisClient) {
      try {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err) {
        logger.debug(`Redis flush pattern error: ${err.message}`);
      }
    }
    for (const key of inMemoryCache.keys()) {
      if (key.startsWith(prefix)) {
        inMemoryCache.delete(key);
      }
    }
  },

  isAvailable() {
    return isRedisAvailable;
  },

  getClient() {
    return redisClient;
  }
};

module.exports = {
  redisClient,
  cache,
  isRedisAvailable: () => isRedisAvailable
};
