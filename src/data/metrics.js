// Time-series data generator for System Health & API deep dives

export const getSystemHealthData = (metricType = 'requests', timeRange = '24H') => {
  const pointsCount = timeRange === '1H' ? 12 : timeRange === '6H' ? 18 : timeRange === '24H' ? 24 : timeRange === '7D' ? 14 : 30;
  
  const labels = [];
  const data = [];

  for (let i = 0; i < pointsCount; i++) {
    let label = '';
    if (timeRange === '1H') {
      const min = 60 - (pointsCount - i) * 5;
      label = `${min < 10 ? '0' : ''}${min}m`;
    } else if (timeRange === '6H') {
      const h = Math.floor(i / 3);
      label = `-${6 - h}h`;
    } else if (timeRange === '24H') {
      const h = (i + 12) % 24;
      label = `${h < 10 ? '0' : ''}${h}:00`;
    } else if (timeRange === '7D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      label = days[i % 7];
    } else {
      label = `Day ${i + 1}`;
    }

    if (metricType === 'requests') {
      // Base traffic curve with normal fluctuation
      const base = 4200 + Math.sin(i / 3) * 1200 + (Math.random() * 400 - 200);
      data.push({
        time: label,
        requests: Math.round(base),
        successful: Math.round(base * 0.96),
        failed: Math.round(base * 0.04)
      });
    } else if (metricType === 'errorRate') {
      // Visible spike in the last few data points
      const isAnomalyZone = i >= pointsCount - 4;
      const rate = isAnomalyZone ? +(12.5 + (i - (pointsCount - 4)) * 1.8 + Math.random()).toFixed(1) : +(0.8 + Math.random() * 0.5).toFixed(1);
      data.push({
        time: label,
        errorRate: rate,
        threshold: 2.5,
        isAnomaly: isAnomalyZone
      });
    } else { // latency
      const isSpike = i >= pointsCount - 4;
      const p50 = isSpike ? 420 + i * 40 : Math.round(140 + Math.random() * 30);
      const p95 = isSpike ? 2400 + (i - (pointsCount - 4)) * 180 : Math.round(280 + Math.random() * 60);
      const p99 = isSpike ? 3800 + i * 150 : Math.round(450 + Math.random() * 90);
      data.push({
        time: label,
        p50,
        p95,
        p99
      });
    }
  }

  return data;
};

// Error rate data specifically showing the stark anomaly spike on Payment API:
// Normal (~1%) -> Anomaly spike -> Current (17.8%)
export const getPaymentApiErrorRateData = (timeRange = '24H') => {
  return [
    { time: '11:00', errorRate: 0.8, baseline: 1.0, isSpike: false },
    { time: '11:30', errorRate: 0.9, baseline: 1.0, isSpike: false },
    { time: '12:00', errorRate: 1.1, baseline: 1.0, isSpike: false },
    { time: '12:15', errorRate: 1.0, baseline: 1.0, isSpike: false },
    { time: '12:30', errorRate: 1.2, baseline: 1.0, isSpike: false, event: '🚀 Deploy v1.8' },
    { time: '12:32', errorRate: 2.1, baseline: 1.0, isSpike: false },
    { time: '12:34', errorRate: 5.4, baseline: 1.0, isSpike: true },
    { time: '12:35', errorRate: 11.2, baseline: 1.0, isSpike: true },
    { time: '12:36', errorRate: 15.8, baseline: 1.0, isSpike: true, event: '🚨 Incident #1042' },
    { time: '12:38', errorRate: 18.2, baseline: 1.0, isSpike: true },
    { time: '12:40', errorRate: 17.5, baseline: 1.0, isSpike: true },
    { time: '12:45', errorRate: 17.8, baseline: 1.0, isSpike: true, current: true }
  ];
};

// Latency Percentiles (P50, P95, P99) for Payment API
export const getPaymentApiLatencyData = (timeRange = '24H') => {
  return [
    { time: '11:00', p50: 95, p95: 190, p99: 290 },
    { time: '11:30', p50: 102, p95: 205, p99: 310 },
    { time: '12:00', p50: 98, p95: 210, p99: 305 },
    { time: '12:30', p50: 110, p95: 240, p99: 380, event: 'Deploy v1.8' },
    { time: '12:32', p50: 160, p95: 490, p99: 820 },
    { time: '12:34', p50: 380, p95: 1420, p99: 2100 },
    { time: '12:35', p50: 510, p95: 2150, p99: 3400 },
    { time: '12:36', p50: 620, p95: 2800, p99: 4200, event: 'Incident #1042' },
    { time: '12:40', p50: 640, p95: 2850, p99: 4350 },
    { time: '12:45', p50: 620, p95: 2800, p99: 4200 }
  ];
};

// Request volume for Payment API
export const getPaymentApiRequestVolumeData = (timeRange = '24H') => {
  return [
    { time: '11:00', requests: 1820, successful: 1805, errors: 15 },
    { time: '11:30', requests: 2140, successful: 2121, errors: 19 },
    { time: '12:00', requests: 2490, successful: 2463, errors: 27 },
    { time: '12:15', requests: 2600, successful: 2574, errors: 26 },
    { time: '12:30', requests: 2840, successful: 2806, errors: 34 },
    { time: '12:35', requests: 3120, successful: 2770, errors: 350 },
    { time: '12:36', requests: 3250, successful: 2736, errors: 514 },
    { time: '12:40', requests: 3180, successful: 2614, errors: 566 },
    { time: '12:45', requests: 3080, successful: 2532, errors: 548 }
  ];
};
