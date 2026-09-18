const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * FaultLens Express Telemetry Middleware
 * Captures request latency, method, endpoint, status code, and errors.
 * Guarantees zero blocking of response pipelines and failsafe delivery.
 *
 * @param {Object} options
 * @param {string} options.apiKey - FaultLens API Key
 * @param {string} options.apiId - FaultLens API identifier (or serviceId)
 * @param {string} [options.serverUrl] - FaultLens Backend URL (default: http://localhost:5000)
 * @param {boolean} [options.enabled] - Enable/disable monitoring (default: true)
 * @param {number} [options.batchIntervalMs] - Flush interval in ms (default: 2000)
 */
function faultLens(options = {}) {
  const apiKey = options.apiKey || process.env.FAULTLENS_API_KEY;
  const apiId = options.apiId || options.serviceId || process.env.FAULTLENS_API_ID;
  const serverUrl =
    options.collectorUrl ||
    options.serverUrl ||
    process.env.FAULTLENS_COLLECTOR_URL ||
    process.env.FAULTLENS_SERVER_URL ||
    'http://localhost:5000';
  const enabled = options.enabled !== false && Boolean(apiKey && apiId);
  const batchIntervalMs = options.batchIntervalMs || 2000;

  if (!enabled) {
    // Return transparent no-op middleware if not configured
    return (req, res, next) => next();
  }

  const queue = [];
  let flushTimer = null;

  function flushTelemetryQueue() {
    if (queue.length === 0) return;

    const itemsToSend = queue.splice(0, 50);

    for (const item of itemsToSend) {
      sendAsync(serverUrl, apiKey, item);
    }
  }

  function scheduleFlush() {
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushTelemetryQueue();
      }, batchIntervalMs);
    }
  }

  function sendAsync(urlStr, key, payload) {
    try {
      const parsedUrl = new URL(`${urlStr.replace(/\/$/, '')}/api/v1/telemetry`);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const data = JSON.stringify(payload);

      const req = client.request(
        parsedUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': key,
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 4000
        },
        (res) => {
          res.resume(); // Consume response data to free up memory
        }
      );

      req.on('error', () => {
        // FAIL-SAFE: NEVER throw or disrupt monitored application
      });

      req.on('timeout', () => {
        req.destroy();
      });

      req.write(data);
      req.end();
    } catch (_) {
      // Fail-safe protection
    }
  }

  // The Express middleware function
  return function faultLensMiddleware(req, res, next) {
    const startTime = process.hrtime();

    // Hook into response finish event
    res.on('finish', () => {
      try {
        const diff = process.hrtime(startTime);
        const responseTime = Math.round(diff[0] * 1000 + diff[1] / 1e6); // in ms
        const statusCode = res.statusCode;

        // Skip internal or static health check paths if desired
        const endpoint = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path || req.url;

        let errorMessage = null;
        if (statusCode >= 400 && res.statusMessage) {
          errorMessage = res.statusMessage;
        }

        const telemetryPayload = {
          apiId,
          timestamp: new Date().toISOString(),
          statusCode,
          responseTime,
          method: req.method,
          endpoint,
          errorMessage
        };

        queue.push(telemetryPayload);
        scheduleFlush();
      } catch (_) {
        // Safeguard to ensure telemetry never impacts response pipeline
      }
    });

    next();
  };
}

module.exports = faultLens;
