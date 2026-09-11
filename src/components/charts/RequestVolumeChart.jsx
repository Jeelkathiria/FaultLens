import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TimeRangeSelector } from '../common/TimeRangeSelector';
import { getPaymentApiRequestVolumeData } from '../../data/metrics';

export const RequestVolumeChart = () => {
  const [timeRange, setTimeRange] = useState('24H');
  const data = getPaymentApiRequestVolumeData(timeRange);

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Request Volume & Distribution</h4>
          <p className="text-xs text-slate-400 mt-0.5">Successful throughput vs HTTP failures</p>
        </div>
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} ranges={['1H', '6H', '24H', '7D']} />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="volSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="volErrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
              formatter={(val, name) => [val.toLocaleString(), name === 'successful' ? '2xx/3xx Successful' : 'Errors / 5xx']}
            />
            <Area
              type="monotone"
              dataKey="successful"
              name="successful"
              stroke="#6366F1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#volSuccess)"
            />
            <Area
              type="monotone"
              dataKey="errors"
              name="errors"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#volErrors)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1E2633] text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Successful Responses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-red-400">Failed Invocations (Errors)</span>
        </div>
      </div>
    </div>
  );
};
