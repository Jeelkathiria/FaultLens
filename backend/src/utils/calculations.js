/**
 * Mathematical and statistical utility functions for FaultLens metric engine
 */

/**
 * Calculate percentiles (P50, P95, P99) from an array of latencies
 * Using standard nearest-rank method for telemetry distribution
 * @param {number[]} latencies - array of latency values in milliseconds
 * @returns {{ p50: number, p95: number, p99: number, avg: number }}
 */
function calculatePercentiles(latencies = []) {
  if (!latencies || latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;

  const getPercentile = (p) => {
    if (len === 1) return sorted[0];
    const rank = Math.ceil((p / 100) * len);
    const index = Math.min(len - 1, Math.max(0, rank - 1));
    return sorted[index];
  };

  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = +(sum / len).toFixed(2);

  return {
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    avg
  };
}

/**
 * Calculate error rates
 * @param {number} totalRequests
 * @param {number} clientErrors (4xx)
 * @param {number} serverErrors (5xx)
 * @returns {{ overallErrorRate: number, clientErrorRate: number, serverErrorRate: number }}
 */
function calculateErrorRates(totalRequests = 0, clientErrors = 0, serverErrors = 0) {
  if (!totalRequests || totalRequests === 0) {
    return {
      overallErrorRate: 0,
      clientErrorRate: 0,
      serverErrorRate: 0
    };
  }

  const totalErrors = clientErrors + serverErrors;
  return {
    overallErrorRate: +((totalErrors / totalRequests) * 100).toFixed(2),
    clientErrorRate: +((clientErrors / totalRequests) * 100).toFixed(2),
    serverErrorRate: +((serverErrors / totalRequests) * 100).toFixed(2)
  };
}

/**
 * Calculate rolling mean and standard deviation
 * @param {number[]} values
 * @returns {{ mean: number, stdDev: number, variance: number }}
 */
function calculateRollingStats(values = []) {
  if (!values || values.length === 0) {
    return { mean: 0, stdDev: 0, variance: 0 };
  }

  const n = values.length;
  const mean = values.reduce((acc, v) => acc + v, 0) / n;

  if (n === 1) {
    return { mean: +mean.toFixed(2), stdDev: 0, variance: 0 };
  }

  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return {
    mean: +mean.toFixed(2),
    stdDev: +stdDev.toFixed(2),
    variance: +variance.toFixed(2)
  };
}

/**
 * Detect if a current value is statistically anomalous
 * Formula: threshold = mean + sensitivity * standardDeviation
 * @param {number} currentValue
 * @param {number[]} baselineHistory
 * @param {number} sensitivity - default 3.0
 * @param {number} minThreshold - minimum absolute value to avoid false alarms on tiny numbers
 * @returns {{ isAnomaly: boolean, baselineValue: number, deviation: number, threshold: number }}
 */
function evaluateAnomaly(currentValue, baselineHistory = [], sensitivity = 3.0, minThreshold = 1.0) {
  if (!baselineHistory || baselineHistory.length < 3) {
    const isAnomaly = currentValue > minThreshold * 3;
    return {
      isAnomaly,
      baselineValue: +(baselineHistory[0] || currentValue),
      deviation: isAnomaly ? 3.0 : 0.0,
      threshold: minThreshold * 3
    };
  }

  const { mean, stdDev } = calculateRollingStats(baselineHistory);
  const effectiveStdDev = Math.max(stdDev, 0.4);
  const threshold = +(mean + sensitivity * effectiveStdDev).toFixed(2);

  const deviation = effectiveStdDev > 0 ? +((currentValue - mean) / effectiveStdDev).toFixed(2) : 0;
  const isAnomaly = currentValue > threshold && currentValue >= minThreshold;

  return {
    isAnomaly,
    baselineValue: mean,
    deviation,
    threshold
  };
}

/**
 * Calculate uptime percentage
 * @param {number} totalChecks
 * @param {number} failedChecks
 * @returns {number}
 */
function calculateUptime(totalChecks = 0, failedChecks = 0) {
  if (!totalChecks || totalChecks === 0) return 100.0;
  const successful = Math.max(0, totalChecks - failedChecks);
  return +((successful / totalChecks) * 100).toFixed(2);
}

module.exports = {
  calculatePercentiles,
  calculateErrorRates,
  calculateRollingStats,
  evaluateAnomaly,
  calculateUptime
};
