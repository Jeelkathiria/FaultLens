import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { AlertOctagon, TrendingUp } from 'lucide-react';
import { getPaymentApiErrorRateData } from '../../data/metrics';

export const AnomalyErrorChart = () => {
  const data = getPaymentApiErrorRateData();

  return (
    <div className="rounded-xl border border-red-500/20 bg-[#0F141D] p-6 relative overflow-hidden">
      {/* Background subtle red alert glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Anomaly Summary Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100">Error Rate & Anomaly Detection</h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse-subtle">
              <AlertOctagon className="w-3 h-3" />
              Anomaly Detected (+16.8%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Normal baseline ~1.0% → sharp escalation at 12:34 PM → current 17.8%
          </p>
        </div>

        {/* Metric Pill */}
        <div className="flex items-center gap-3 bg-[#080B12] px-3.5 py-2 rounded-lg border border-[#1E2633]">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Spike Magnitude</div>
            <div className="text-sm font-mono font-bold text-red-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              1.0% → 17.8%
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#0F141D] border border-[#1E2633] p-3 rounded-lg shadow-xl font-mono text-xs">
                      <div className="text-slate-400 mb-1">{label}</div>
                      <div className="text-red-400 font-bold text-sm">
                        Error Rate: {item.errorRate}%
                      </div>
                      <div className="text-slate-500 mt-1">Normal Baseline: {item.baseline}%</div>
                      {item.event && (
                        <div className="mt-2 text-amber-300 font-sans font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.event}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Highlight Anomaly Zone from 12:34 onward */}
            <ReferenceArea x1="12:34" x2="12:45" fill="#EF4444" fillOpacity={0.08} />
            <ReferenceLine y={2.0} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'SLA Ceiling (2%)', fill: '#F59E0B', fontSize: 10, position: 'top' }} />
            <ReferenceLine x="12:30" stroke="#6366F1" strokeDasharray="2 2" label={{ value: 'Deploy v1.8', fill: '#818CF8', fontSize: 10, position: 'insideTopLeft' }} />
            <ReferenceLine x="12:36" stroke="#EF4444" strokeDasharray="2 2" label={{ value: 'Incident #1042', fill: '#EF4444', fontSize: 10, position: 'insideTopLeft' }} />
            <Area
              type="monotone"
              dataKey="errorRate"
              stroke="#EF4444"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#anomalyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Visual Annotation Banner */}
      <div className="mt-4 p-3 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span className="font-semibold">Severe Telemetry Divergence:</span>
          <span>4.8 standard deviations above moving 7-day average.</span>
        </div>
        <span className="font-mono text-red-400 font-medium">P-value &lt; 0.001</span>
      </div>
    </div>
  );
};
