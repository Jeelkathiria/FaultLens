import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { TimeRangeSelector } from '../common/TimeRangeSelector';
import { getSystemHealthData } from '../../data/metrics';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

export const HealthMetricsChart = () => {
  const [metricType, setMetricType] = useState('requests'); // 'requests' | 'errorRate' | 'latency'
  const [timeRange, setTimeRange] = useState('24H');

  const data = getSystemHealthData(metricType, timeRange);

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#080B12] border border-[#1E2633]">
          <button
            onClick={() => setMetricType('requests')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              metricType === 'requests'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Requests
          </button>
          <button
            onClick={() => setMetricType('errorRate')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              metricType === 'errorRate'
                ? 'bg-red-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Error Rate
          </button>
          <button
            onClick={() => setMetricType('latency')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              metricType === 'latency'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Latency
          </button>
        </div>

        {/* Time Filters */}
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metricType === 'requests' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
                formatter={(val) => [`${val.toLocaleString()} reqs`, 'Throughput']}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#requestsGradient)"
              />
            </AreaChart>
          ) : metricType === 'errorRate' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
                formatter={(val) => [`${val}%`, 'Error Rate']}
              />
              <ReferenceLine y={2.5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Threshold 2.5%', fill: '#F59E0B', fontSize: 11, position: 'insideTopRight' }} />
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#EF4444' }}
                activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
                formatter={(val, name) => [`${val}ms`, name.toUpperCase()]}
              />
              <Line type="monotone" dataKey="p50" stroke="#22C55E" strokeWidth={1.5} dot={false} name="P50" />
              <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} dot={false} name="P95" />
              <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={1.5} dot={false} name="P99" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#1E2633] text-xs text-slate-400">
        <div className="flex items-center gap-4">
          {metricType === 'requests' && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Inbound API Invocations</span>
            </div>
          )}
          {metricType === 'errorRate' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Observed 5xx & 4xx Failures</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500" />
                <span className="text-amber-400">Alert Threshold</span>
              </div>
            </>
          )}
          {metricType === 'latency' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>P50 (Median)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>P95 (Degradation)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>P99 (Tail)</span>
              </div>
            </>
          )}
        </div>
        <div className="text-slate-500">Live telemetry synchronized</div>
      </div>
    </div>
  );
};
