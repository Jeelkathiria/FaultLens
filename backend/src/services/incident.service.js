const db = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');
const correlationService = require('./correlation.service');
const { emitIncidentCreated, emitIncidentUpdated, emitIncidentResolved } = require('../websocket/socket');

class IncidentService {
  /**
   * Process a newly detected anomaly to create or update an active incident
   */
  async processAnomaly(anomaly, currentValues = {}) {
    try {
      const api = await db.api.findUnique({
        where: { id: anomaly.apiId },
        include: { website: true }
      });

      if (!api) return null;

      // 1. Check for existing active incident on this API
      const existingIncident = await db.incident.findFirst({
        where: {
          apiId: anomaly.apiId,
          status: { in: ['DETECTED', 'INVESTIGATING'] }
        },
        include: { events: true, api: { include: { website: true } } }
      });

      const now = new Date();

      if (existingIncident) {
        // DUPLICATE PREVENTION: Update existing incident with timeline event
        const updatedSeverity = anomaly.severity === 'critical' ? 'critical' : existingIncident.severity;

        await db.incident.update({
          where: { id: existingIncident.id },
          data: {
            severity: updatedSeverity,
            anomalyId: anomaly.id,
            websiteId: api.websiteId,
            updatedAt: now
          }
        });

        const eventMessage = `${anomaly.metricType.replace('_', ' ')}: baseline ${anomaly.baselineValue} -> current ${anomaly.detectedValue} (${anomaly.deviation}σ)`;
        await this.addIncidentEvent(
          existingIncident.id,
          'anomaly',
          eventMessage,
          { metricType: anomaly.metricType, detectedValue: anomaly.detectedValue, deviation: anomaly.deviation }
        );

        logger.info(`Updated existing incident ${existingIncident.id} for API ${api.name}`);
        const formatted = await this.getIncidentById(existingIncident.id);
        emitIncidentUpdated(formatted);
        return formatted;
      }

      // 2. No active incident exists: Create a NEW incident
      const title = `${anomaly.severity === 'critical' ? 'Critical' : 'Elevated'} ${anomaly.metricType.replace('_', ' ').toLowerCase()} spike on ${api.name}`;
      const description = `Statistical engine detected ${anomaly.deviation}σ deviation on ${anomaly.metricType}. Detected: ${anomaly.detectedValue} vs baseline: ${anomaly.baselineValue}`;

      const incident = await db.incident.create({
        data: {
          apiId: anomaly.apiId,
          websiteId: api.websiteId,
          anomalyId: anomaly.id,
          title,
          description,
          severity: anomaly.severity,
          status: 'DETECTED',
          detectedAt: now
        }
      });

      // 3. Add initial timeline events
      const correlation = await correlationService.correlateIncidentWithDeployment(api.id, now);
      if (correlation && correlation.correlated) {
        await this.addIncidentEvent(
          incident.id,
          'deployment',
          `Deployment ${correlation.version} was recorded ${correlation.timeDifference} prior to anomaly`,
          correlation
        );
      }

      await this.addIncidentEvent(
        incident.id,
        'warning',
        `${anomaly.metricType} exceeded rolling threshold (${anomaly.detectedValue} vs baseline ${anomaly.baselineValue})`,
        { metricType: anomaly.metricType, value: anomaly.detectedValue }
      );

      await this.addIncidentEvent(
        incident.id,
        'anomaly',
        `FaultLens statistical engine detected ${anomaly.deviation}σ deviation on ${api.name}`,
        { anomalyId: anomaly.id, deviation: anomaly.deviation }
      );

      await this.addIncidentEvent(
        incident.id,
        'incident',
        `Incident automatically triggered and notifications dispatched`,
        { autoCreated: true }
      );

      logger.info(`Automated incident ${incident.id} created for ${api.name}`);
      const formatted = await this.getIncidentById(incident.id);
      emitIncidentCreated(formatted);
      return formatted;
    } catch (err) {
      logger.error('Error processing anomaly in IncidentService:', err);
      return null;
    }
  }

  /**
   * Append an event to the incident timeline
   */
  async addIncidentEvent(incidentId, type, message, metadata = null) {
    return db.incidentEvent.create({
      data: {
        incidentId: String(incidentId),
        type,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        timestamp: new Date()
      }
    });
  }

  /**
   * List incidents with filters (severity, status, website, api, date range)
   * Strictly enforcing multi-tenant isolation: User -> Website -> API -> Incident
   */
  async getIncidents(filters = {}, userId = null, isAdmin = false) {
    try {
      const where = {};

      if (!isAdmin) {
        if (!userId) {
          throw new UnauthorizedError('User authentication required');
        }
        const userWebsites = await db.website.findMany({ where: { userId }, select: { id: true } });
        const userWebsiteIds = userWebsites.map((w) => w.id);

        if (filters.websiteId) {
          if (userWebsiteIds.includes(filters.websiteId)) {
            where.websiteId = filters.websiteId;
          } else {
            where.websiteId = '__none__';
          }
        } else {
          where.websiteId = { in: userWebsiteIds };
        }
      } else if (filters.websiteId) {
        where.websiteId = filters.websiteId;
      }

      if (filters.apiId) {
        where.apiId = filters.apiId;
      }

      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status.toUpperCase();
      }

      if (filters.severity && filters.severity !== 'ALL') {
        where.severity = filters.severity.toLowerCase();
      }

      if (filters.startDate || filters.endDate) {
        where.detectedAt = {};
        if (filters.startDate) where.detectedAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.detectedAt.lte = new Date(filters.endDate);
      }

      const incidents = await db.incident.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        include: {
          api: {
            include: { website: true }
          },
          anomaly: true,
          events: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      if (!incidents || incidents.length === 0) {
        return [];
      }

      return Promise.all(incidents.map((inc) => this.formatIncident(inc)));
    } catch (err) {
      logger.error(`Database query failed in getIncidents: ${err.message}`);
      return [];
    }
  }

  /**
   * Get single incident by ID with tenant security check
   */
  async getIncidentById(id, userId = null, isAdmin = false) {
    const incident = await db.incident.findUnique({
      where: { id },
      include: {
        api: {
          include: { website: true }
        },
        anomaly: true,
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    if (!isAdmin && userId) {
      let isOwner = false;
      if (incident.api?.website?.userId === userId) {
        isOwner = true;
      } else if (incident.websiteId) {
        const w = await db.website.findUnique({ where: { id: incident.websiteId } });
        if (w && w.userId === userId) isOwner = true;
      }
      if (!isOwner) {
        throw new NotFoundError('Incident not found');
      }
    }

    return this.formatIncident(incident);
  }

  /**
   * Update incident status (DETECTED -> INVESTIGATING -> MITIGATED -> RESOLVED)
   */
  async updateStatus(id, newStatus, user = null) {
    const upperStatus = newStatus.toUpperCase();
    const validStatuses = ['DETECTED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'];

    if (!validStatuses.includes(upperStatus)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const incident = await db.incident.findUnique({
      where: { id },
      include: { api: { include: { website: true } } }
    });

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    if (user && user.role !== 'ADMIN') {
      let isOwner = false;
      if (incident.api?.website?.userId === user.id) {
        isOwner = true;
      } else if (incident.websiteId) {
        const w = await db.website.findUnique({ where: { id: incident.websiteId } });
        if (w && w.userId === user.id) isOwner = true;
      }
      if (!isOwner) {
        throw new NotFoundError('Incident not found');
      }
    }

    const updateData = { status: upperStatus };
    const now = new Date();

    if (upperStatus === 'INVESTIGATING' && !incident.acknowledgedAt) {
      updateData.acknowledgedAt = now;
    } else if (upperStatus === 'RESOLVED') {
      updateData.resolvedAt = now;
      updateData.severity = 'resolved';
    }

    const updated = await db.incident.update({
      where: { id },
      data: updateData,
      include: {
        api: { include: { website: true } },
        anomaly: true,
        events: { orderBy: { timestamp: 'asc' } }
      }
    });

    // Add timeline event for status transition
    const userName = user?.name ? `${user.name} (${user.role})` : 'Developer';
    await this.addIncidentEvent(
      id,
      upperStatus === 'RESOLVED' ? 'resolved' : 'action',
      `Status updated to ${upperStatus} by ${userName}`,
      { status: upperStatus, updatedBy: userName }
    );

    // If resolved, restore API and website status to healthy if no other active incidents
    if (upperStatus === 'RESOLVED') {
      if (incident.apiId) {
        const otherActive = await db.incident.count({
          where: {
            apiId: incident.apiId,
            status: { in: ['DETECTED', 'INVESTIGATING'] },
            id: { not: id }
          }
        });

        if (otherActive === 0) {
          await db.api.update({
            where: { id: incident.apiId },
            data: { status: 'healthy' }
          });
        }
      }

      const targetWebsiteId = incident.websiteId || updated.api?.websiteId;
      if (targetWebsiteId) {
        const otherWebActive = await db.incident.count({
          where: {
            websiteId: targetWebsiteId,
            status: { in: ['DETECTED', 'INVESTIGATING'] },
            id: { not: id }
          }
        });
        if (otherWebActive === 0) {
          await db.website.update({
            where: { id: targetWebsiteId },
            data: { status: 'healthy' }
          });
        }
      }

      const formatted = await this.formatIncident(updated);
      emitIncidentResolved(formatted);
      return formatted;
    }

    const formatted = await this.formatIncident(updated);
    emitIncidentUpdated(formatted);
    return formatted;
  }

  /**
   * Simulate / Trigger a test incident on an API
   */
  async simulateIncident(apiId, options = {}, user = null) {
    const api = await db.api.findUnique({
      where: { id: apiId },
      include: { website: true }
    });

    if (!api) throw new NotFoundError('API not found');

    if (user && user.role !== 'ADMIN' && api.website?.userId !== user.id) {
      throw new NotFoundError('API not found');
    }

    const now = new Date();
    const severity = (options.severity || 'critical').toLowerCase();
    const title = options.title || `Elevated error rate & latency regression on ${api.name}`;
    const description = options.description || `Simulated observability incident triggered on ${api.endpoint}`;

    // Create anomaly record
    let anomaly = null;
    try {
      anomaly = await db.anomaly.create({
        data: {
          apiId: api.id,
          metricType: 'ERROR_RATE',
          detectedValue: severity === 'critical' ? 19.4 : 5.8,
          baselineValue: 1.1,
          deviation: 4.5,
          severity,
          status: 'OPEN',
          detectedAt: now
        }
      });
    } catch (_) {}

    // Create Incident record
    const incident = await db.incident.create({
      data: {
        apiId: api.id,
        websiteId: api.websiteId,
        anomalyId: anomaly?.id || null,
        title,
        description,
        severity,
        status: 'DETECTED',
        detectedAt: now
      }
    });

    // Add timeline events
    await this.addIncidentEvent(
      incident.id,
      'warning',
      `Error rate exceeded rolling 3.0σ threshold (19.4% vs baseline 1.1%)`,
      { metricType: 'ERROR_RATE', value: 19.4 }
    );

    await this.addIncidentEvent(
      incident.id,
      'anomaly',
      `Statistical engine detected abnormal regression spike on ${api.name}`,
      { anomalyId: anomaly?.id, deviation: 4.5 }
    );

    await this.addIncidentEvent(
      incident.id,
      'incident',
      `Incident test simulation triggered by ${user?.name || 'Developer'}`,
      { simulated: true }
    );

    // Update API and Website status to critical/degraded
    await db.api.update({
      where: { id: api.id },
      data: { status: severity }
    });

    if (api.websiteId) {
      await db.website.update({
        where: { id: api.websiteId },
        data: { status: severity }
      });
    }

    const formatted = await this.getIncidentById(incident.id);
    emitIncidentCreated(formatted);
    return formatted;
  }

  /**
   * Automatically trigger or update an active incident when an API health check fails
   */
  async triggerIncidentForApiFailure(api, failureData = {}) {
    try {
      const apiId = api.id || api._id;
      const websiteId = api.websiteId;

      const existingIncident = await db.incident.findFirst({
        where: {
          apiId,
          status: { in: ['DETECTED', 'INVESTIGATING'] }
        }
      });

      const now = new Date();
      if (existingIncident) {
        await this.addIncidentEvent(
          existingIncident.id,
          'warning',
          `Health check failure: ${failureData.errorMessage || 'HTTP ' + failureData.statusCode}`,
          failureData
        );
        const formatted = await this.getIncidentById(existingIncident.id);
        emitIncidentUpdated(formatted);
        return formatted;
      }

      const severity = failureData.statusCode >= 500 || failureData.status === 'CRITICAL' ? 'critical' : 'warning';
      const title = `Health check outage on ${api.name} (${failureData.statusCode || 'Timeout'})`;
      const description = failureData.errorMessage || `Automated health check failed connecting to ${failureData.targetUrl || api.endpoint}`;

      const incident = await db.incident.create({
        data: {
          apiId,
          websiteId,
          title,
          description,
          severity,
          status: 'DETECTED',
          detectedAt: now
        }
      });

      await this.addIncidentEvent(
        incident.id,
        'warning',
        `Automated probe failed: ${failureData.errorMessage || 'HTTP status ' + failureData.statusCode}`,
        failureData
      );

      await this.addIncidentEvent(
        incident.id,
        'incident',
        `Incident automatically raised for endpoint outage`,
        { autoTriggered: true }
      );

      const formatted = await this.getIncidentById(incident.id);
      emitIncidentCreated(formatted);
      return formatted;
    } catch (err) {
      logger.error('Error in triggerIncidentForApiFailure:', err);
      return null;
    }
  }

  /**
   * Format database Incident into the structure expected by the frontend
   */
  async formatIncident(incident) {
    const formatTime = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const incidentId = String(incident.id || incident._id);
    const detectedDate = incident.detectedAt ? new Date(incident.detectedAt) : new Date();
    const diffMinutes = Math.max(1, Math.round((Date.now() - detectedDate.getTime()) / (60 * 1000)));
    const duration = incident.resolvedAt
      ? `${Math.max(1, Math.round((new Date(incident.resolvedAt) - detectedDate) / (60 * 1000)))} minutes`
      : `${diffMinutes} minutes`;

    // Fetch deployment correlation if not directly stored
    let correlatedDeployment = null;
    const deploymentEvent = incident.events?.find((e) => e.type === 'deployment');
    if (deploymentEvent && deploymentEvent.metadata) {
      correlatedDeployment = deploymentEvent.metadata;
    } else if (incident.apiId) {
      correlatedDeployment = await correlationService.correlateIncidentWithDeployment(
        incident.apiId,
        incident.detectedAt
      );
    }

    // Build timeline items
    const timeline = (incident.events || []).map((e, idx) => {
      let badge = 'Event';
      if (e.type === 'deployment') badge = e.metadata?.version || 'Deploy';
      if (e.type === 'warning') badge = 'Warning';
      if (e.type === 'anomaly') badge = 'Anomaly';
      if (e.type === 'incident') badge = (incident.severity || 'CRITICAL').toUpperCase();
      if (e.type === 'resolved') badge = 'Resolved';
      if (e.type === 'action') badge = 'Action';

      return {
        id: String(e.id || e._id || `t-${idx}`),
        time: formatTime(e.timestamp),
        type: e.type,
        title: (e.message || '').split(':')[0] || e.message,
        description: e.message,
        badge
      };
    });

    // Build activity audit log
    const activityLog = (incident.events || [])
      .filter((e) => e.type === 'action' || e.type === 'incident' || e.type === 'resolved')
      .map((e) => ({
        user: e.metadata?.updatedBy || 'System Bot',
        action: e.message,
        time: formatTime(e.timestamp)
      }));

    if (activityLog.length === 0) {
      activityLog.push({
        user: 'System Bot',
        action: 'Incident created automatically',
        time: formatTime(incident.detectedAt)
      });
    }

    const numStr = `#${incidentId.slice(-4).toUpperCase()}`;
    const websiteId = incident.websiteId || incident.api?.websiteId || incident.api?.website?.id || '';
    const websiteName = incident.website?.name || incident.api?.website?.name || (websiteId ? 'Website' : 'N/A');

    // Compute authentic metrics from real records
    let affectedCountStr = '0 requests';
    let latencyCurrentStr = '—';
    let latencyBeforeStr = '—';
    let errorRateBeforeStr = '0%';
    let errorRateCurrentStr = '0%';

    if (incident.websiteId && !incident.apiId) {
      let failedChecks = 0;
      if (db.websiteCheck && typeof db.websiteCheck.count === 'function') {
        failedChecks = await db.websiteCheck.count({
          where: {
            websiteId: incident.websiteId,
            status: 'DOWN',
            timestamp: { gte: detectedDate }
          }
        });
      }
      affectedCountStr = `${Math.max(1, failedChecks)} probe failures`;
      latencyCurrentStr = incident.website?.lastResponseTime ? `${incident.website.lastResponseTime}ms` : 'Timeout';
      errorRateBeforeStr = '0%';
      errorRateCurrentStr = '100% outage';
    } else if (incident.apiId) {
      let failedRequests = 0;
      if (db.requestMetric && typeof db.requestMetric.count === 'function') {
        failedRequests = await db.requestMetric.count({
          where: {
            apiId: incident.apiId,
            statusCode: { gte: 400 },
            timestamp: { gte: detectedDate }
          }
        });
      }
      affectedCountStr = `${failedRequests} failed requests`;
      if (incident.anomaly) {
        errorRateBeforeStr = `${incident.anomaly.baselineValue}%`;
        errorRateCurrentStr = `${incident.anomaly.detectedValue}%`;
        if (incident.anomaly.metricType === 'latency') {
          latencyBeforeStr = `${incident.anomaly.baselineValue}ms`;
          latencyCurrentStr = `${incident.anomaly.detectedValue}ms`;
        }
      }
    }

    return {
      id: incidentId,
      number: numStr,
      title: incident.title,
      summary: incident.description,
      apiId: incident.apiId,
      apiName: incident.api?.name || 'API',
      websiteId,
      websiteName,
      severity: (incident.severity || 'critical').toLowerCase(),
      status: (incident.status || 'detected').toLowerCase(),
      detectedAt: formatTime(incident.detectedAt || new Date()),
      detectedTimestamp: detectedDate.toISOString(),
      duration,
      timeAgo: `${diffMinutes} min ago`,
      metrics: {
        errorRateBefore: errorRateBeforeStr,
        errorRateCurrent: errorRateCurrentStr,
        latencyBefore: latencyBeforeStr,
        latencyCurrent: latencyCurrentStr,
        affectedRequests: affectedCountStr,
        impactedUsers: '—'
      },
      correlatedDeployment,
      timeline,
      activityLog
    };
  }
}

module.exports = new IncidentService();
