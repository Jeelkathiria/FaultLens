const { evaluateAnomaly } = require('../src/utils/calculations');

describe('Statistical Anomaly Detection Unit Tests', () => {
  const baselineHistory = [1.2, 1.4, 1.1, 1.3, 1.5, 1.2, 1.4, 1.3]; // Stable ~1.3% error rate

  it('correctly flags normal behavior without false alarms', () => {
    const normalValue = 1.6;
    const result = evaluateAnomaly(normalValue, baselineHistory, 3.0, 1.0);

    expect(result.isAnomaly).toBe(false);
    expect(result.baselineValue).toBeCloseTo(1.3, 1);
    expect(result.deviation).toBeLessThan(3.0);
  });

  it('detects abnormal spike exceeding mean + 3*stdDev', () => {
    const spikeValue = 11.8; // Error rate spiked to 11.8%!
    const result = evaluateAnomaly(spikeValue, baselineHistory, 3.0, 1.0);

    expect(result.isAnomaly).toBe(true);
    expect(result.baselineValue).toBeCloseTo(1.3, 1);
    expect(result.deviation).toBeGreaterThan(4.0);
    expect(spikeValue).toBeGreaterThan(result.threshold);
  });

  it('respects sensitivity parameter tuning', () => {
    const moderateIncrease = 3.2;

    // With high sensitivity (e.g. 1.5 sigma), it triggers an alert
    const sensitive = evaluateAnomaly(moderateIncrease, baselineHistory, 1.5, 1.0);
    expect(sensitive.isAnomaly).toBe(true);

    // With conservative sensitivity (e.g. 5.0 sigma), it ignores moderate changes
    const conservative = evaluateAnomaly(moderateIncrease, baselineHistory, 5.0, 1.0);
    expect(conservative.isAnomaly).toBe(false);
  });

  it('avoids false alarms on small numbers using minimum threshold', () => {
    const zeroHistory = [0.01, 0.02, 0.01, 0.02];
    // A jump from 0.01 to 0.08 might mathematically be 4 standard deviations, but is practically negligible
    const result = evaluateAnomaly(0.08, zeroHistory, 3.0, 1.0);
    expect(result.isAnomaly).toBe(false);
  });
});
