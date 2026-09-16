const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('error', (e) => {
  logger.error('Prisma Database Error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Database Warning:', e);
});

module.exports = prisma;
