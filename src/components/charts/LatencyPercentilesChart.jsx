import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import api from '../../services/api';

export const LatencyPercentilesChart = ({ apiId = 'api-payment' }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ p50Latency: 620, p95Latency: 2800, p99Latency: 4200 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLatency() {
      setIsLoading(true);
      try {
        const res = await api.get(`/metrics/${apiId}`, { timeRange: '24h' });
        if (isMounted && res) {
          if (Array.isArray(res.timeSeries)) {
            setData(
              res.timeSeries.map((d) => ({
                time: d.time,
                p50: d.p50 || 0,
                p95: d.p95 || 0,
                p99: d.p99 || 0
              }))
            );
          }
          if (res.summary) {
            setSummary(res.summary);
          }
        }
      } catch (err) {
        console.error('Failed to load latency percentiles:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLatency();
    return () => {
      isMounted = false;
    };
  }, [apiId]);

  const formatLatencyValue = (val) => {
    if (!val && val !== 0) return '--';
    return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val}ms`;
  };

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Latency Percentiles (P50, P95, P99)</h4>
          <p className="text-xs text-slate-400 mt-0.5">Response times across distribution percentiles</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-1 bg-emerald-400 rounded-full" /> P50: {formatLatencyValue(summary.p50Latency)}
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-1 bg-amber-400 rounded-full" /> P95: {formatLatencyValue(summary.p95Latency)}
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-1 bg-red-400 rounded-full" /> P99: {formatLatencyValue(summary.p99Latency)}
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            {isLoading ? 'Loading latency distribution...' : 'No latency records available'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
                formatter={(val, name) => [
                  val >= 1000 ? `${(val / 1000).toFixed(2)}s` : `${val}ms`,
                  name
                ]}
              />
              <Line
                type="monotone"
                dataKey="p50"
                name="P50 (Median)"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
              <Line
                type="monotone"
                dataKey="p95"
                name="P95 Latency"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="p99"
                name="P99 (Tail)"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
