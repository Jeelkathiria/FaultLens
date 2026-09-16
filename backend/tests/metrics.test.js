const {
  calculatePercentiles,
  calculateErrorRates,
  calculateRollingStats,
  calculateUptime
} = require('../src/utils/calculations');

describe('Metric & Latency Engine Unit Tests', () => {
  describe('Percentile Calculations (P50, P95, P99)', () => {
    it('calculates exact percentiles for normal latency distribution', () => {
      // 100 sample latencies from 10ms to 1000ms
      const latencies = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
      const result = calculatePercentiles(latencies);

      expect(result.p50).toBeGreaterThanOrEqual(500);
      expect(result.p50).toBeLessThanOrEqual(510);
      expect(result.p95).toBeGreaterThanOrEqual(940);
      expect(result.p99).toBeGreaterThanOrEqual(980);
      expect(result.avg).toBeCloseTo(505, 0);
    });

    it('handles empty or single value arrays gracefully', () => {
      expect(calculatePercentiles([])).toEqual({ p50: 0, p95: 0, p99: 0, avg: 0 });
      expect(calculatePercentiles([150])).toEqual({ p50: 150, p95: 150, p99: 150, avg: 150 });
    });

    it('correctly reflects high percentile latency tail spikes', () => {
      // 94 requests at 50ms, 6 requests spiked at 3000ms
      const latencies = [...Array(94).fill(50), ...Array(6).fill(3000)];
      const result = calculatePercentiles(latencies);

      expect(result.p50).toBe(50);
      expect(result.p95).toBe(3000);
      expect(result.p99).toBe(3000);
    });
  });

  describe('Error Rate Calculations', () => {
    it('calculates overall, 4xx client, and 5xx server error rates', () => {
      const totalRequests = 1000;
      const clientErrors = 20; // 2%
      const serverErrors = 30; // 3%

      const rates = calculateErrorRates(totalRequests, clientErrors, serverErrors);

      expect(rates.overallErrorRate).toBe(5.0);
      expect(rates.clientErrorRate).toBe(2.0);
      expect(rates.serverErrorRate).toBe(3.0);
    });

    it('handles zero requests without dividing by zero', () => {
      const rates = calculateErrorRates(0, 0, 0);
      expect(rates.overallErrorRate).toBe(0);
      expect(rates.clientErrorRate).toBe(0);
      expect(rates.serverErrorRate).toBe(0);
    });
  });

  describe('Uptime SLA Calculations', () => {
    it('calculates percentage uptime correctly', () => {
      expect(calculateUptime(10000, 2)).toBe(99.98);
      expect(calculateUptime(100, 0)).toBe(100.0);
      expect(calculateUptime(100, 10)).toBe(90.0);
    });
  });

  describe('Rolling Baseline Statistics', () => {
    it('calculates rolling mean, variance, and standard deviation', () => {
      const history = [10, 12, 11, 9, 13, 11];
      const stats = calculateRollingStats(history);

      expect(stats.mean).toBe(11.0);
      expect(stats.stdDev).toBeGreaterThan(1.0);
      expect(stats.stdDev).toBeLessThan(2.0);
    });
  });
});
