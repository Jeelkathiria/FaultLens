const incidentService = require('../src/services/incident.service');
const prisma = require('../src/config/database');

jest.mock('../src/config/database', () => {
  const mockEvents = [];
  return {
    api: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'api-payment',
        name: 'Payment API',
        websiteId: 'w-ecommerce',
        website: { id: 'w-ecommerce', name: 'My E-Commerce' }
      }),
      update: jest.fn().mockResolvedValue({})
    },
    website: {
      update: jest.fn().mockResolvedValue({})
    },
    incident: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    incidentEvent: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `evt-${Date.now()}`, ...data };
        mockEvents.push(item);
        return Promise.resolve(item);
      })
    },
    deployment: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({})
    }
  };
});

describe('Incident Engine Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an incident when a critical anomaly occurs and no active incident exists', async () => {
    // No existing incident
    prisma.incident.findFirst.mockResolvedValue(null);

    const createdIncident = {
      id: 'inc-999',
      apiId: 'api-payment',
      title: 'Critical error rate spike on Payment API',
      description: 'Deviation: 4.8 sigma',
      severity: 'critical',
      status: 'DETECTED',
      detectedAt: new Date(),
      events: []
    };

    prisma.incident.create.mockResolvedValue(createdIncident);
    prisma.incident.findUnique.mockResolvedValue({
      ...createdIncident,
      api: { name: 'Payment API', website: { name: 'My E-Commerce' } }
    });

    const anomaly = {
      id: 'anom-1',
      apiId: 'api-payment',
      metricType: 'ERROR_RATE',
      detectedValue: 18.5,
      baselineValue: 1.2,
      deviation: 4.8,
      severity: 'critical'
    };

    const result = await incidentService.processAnomaly(anomaly);

    expect(result).toBeDefined();
    expect(prisma.incident.create).toHaveBeenCalled();
    expect(prisma.incidentEvent.create).toHaveBeenCalled();
  });

  it('prevents duplicate incidents by updating the ongoing active incident', async () => {
    const existingActiveIncident = {
      id: 'inc-999',
      apiId: 'api-payment',
      severity: 'critical',
      status: 'INVESTIGATING',
      events: []
    };

    // Active incident already exists
    prisma.incident.findFirst.mockResolvedValue(existingActiveIncident);
    prisma.incident.update.mockResolvedValue(existingActiveIncident);
    prisma.incident.findUnique.mockResolvedValue({
      ...existingActiveIncident,
      api: { name: 'Payment API', website: { name: 'My E-Commerce' } }
    });

    const secondAnomaly = {
      id: 'anom-2',
      apiId: 'api-payment',
      metricType: 'ERROR_RATE',
      detectedValue: 19.2,
      baselineValue: 1.2,
      deviation: 5.1,
      severity: 'critical'
    };

    await incidentService.processAnomaly(secondAnomaly);

    // Should NOT create a second incident
    expect(prisma.incident.create).not.toHaveBeenCalled();
    // Should update the existing incident
    expect(prisma.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'inc-999' } })
    );
  });

  it('transitions incident status through lifecycle to RESOLVED', async () => {
    const incident = {
      id: 'inc-999',
      apiId: 'api-payment',
      severity: 'critical',
      status: 'INVESTIGATING',
      detectedAt: new Date(),
      api: { id: 'api-payment', websiteId: 'w-ecommerce', website: { id: 'w-ecommerce', name: 'My E-Commerce' } },
      events: []
    };

    prisma.incident.findUnique.mockResolvedValue(incident);
    prisma.incident.update.mockResolvedValue({
      ...incident,
      status: 'RESOLVED',
      resolvedAt: new Date()
    });
    prisma.incident.count.mockResolvedValue(0);

    const updated = await incidentService.updateStatus('inc-999', 'RESOLVED', { name: 'Jeel', role: 'DEVELOPER' });

    expect(updated.status).toBe('resolved');
    expect(prisma.incident.update).toHaveBeenCalled();
  });
});
