const correlationService = require('../src/services/correlation.service');
const prisma = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  api: {
    findUnique: jest.fn()
  },
  deployment: {
    findMany: jest.fn(),
    update: jest.fn().mockResolvedValue({})
  }
}));

describe('Deployment Correlation Engine Unit Tests', () => {
  const mockApi = { id: 'api-payment', name: 'Payment API', websiteId: 'w-ecommerce' };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.api.findUnique.mockResolvedValue(mockApi);
  });

  it('identifies potential correlation for a recent deployment (6 mins ago)', async () => {
    const anomalyTime = new Date('2026-09-13T12:36:00Z');
    const deployTime = new Date('2026-09-13T12:30:00Z'); // 6 mins earlier

    prisma.deployment.findMany.mockResolvedValue([
      {
        id: 'dep-108',
        version: 'v1.8',
        commitHash: 'a8f192b99',
        deployedAt: deployTime,
        author: 'alex.chen',
        message: 'Switch to 3DS pipeline'
      }
    ]);

    const result = await correlationService.correlateIncidentWithDeployment('api-payment', anomalyTime, 60);

    expect(result).not.toBeNull();
    expect(result.correlated).toBe(true);
    expect(result.version).toBe('v1.8');
    expect(result.timeDifference).toBe('6 minutes');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.reason).toContain('Potential deployment correlation');
  });

  it('returns null when no deployments exist within the window', async () => {
    const anomalyTime = new Date('2026-09-13T12:36:00Z');
    prisma.deployment.findMany.mockResolvedValue([]);

    const result = await correlationService.correlateIncidentWithDeployment('api-payment', anomalyTime, 60);

    expect(result).toBeNull();
  });
});
