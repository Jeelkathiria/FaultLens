import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, MethodBadge } from '../../components/common/Badge';
import { AnomalyErrorChart } from '../../components/charts/AnomalyErrorChart';
import { LatencyPercentilesChart } from '../../components/charts/LatencyPercentilesChart';
import { RequestVolumeChart } from '../../components/charts/RequestVolumeChart';
import { TimeRangeSelector } from '../../components/common/TimeRangeSelector';
import { formatLatency, formatUptime, formatNumber } from '../../utils/formatters';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Rocket,
  AlertOctagon,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const ApiDetailsPage = () => {
  const { websiteId, apiId } = useParams();
  const navigate = useNavigate();
  const { websites, apis, incidents } = useFaultLens();

  const [timeRange, setTimeRange] = useState('24H');

  const website = websites.find(w => w.id === websiteId) || websites[0];
  const api = apis.find(a => a.id === apiId) || apis[0];

  // Correlated incident (e.g. #1042 for Payment API)
  const correlatedIncident = incidents.find(i => i.apiId === api.id && i.severity !== 'resolved' && i.status !== 'resolved');

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div>
        <Link
          to={`/websites/${website.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {website.name}</span>
        </Link>

        {/* API Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-[#1E2633] bg-[#0F141D]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <MethodBadge method={api.method} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{api.name}</h1>
                <StatusBadge status={api.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-slate-200 font-semibold">{api.endpoint}</span>
                <span>•</span>
                <span>Health check: {api.healthCheckEndpoint}</span>
                <span>•</span>
                <span>Interval: {api.monitoringInterval}</span>
              </div>
            </div>
          </div>

          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} ranges={['1H', '6H', '24H', '7D']} />
        </div>
      </div>

      {/* Correlated Incident Prompt Banner if active */}
      {correlatedIncident && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 to-[#0F141D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                  {correlatedIncident.number}
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Potential Deployment Correlation (v1.8)
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">{correlatedIncident.title}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/incidents/${correlatedIncident.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shrink-0"
          >
            <span>View Incident #{correlatedIncident.number}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Requests"
          value={formatNumber(api.requestsCount || 25430)}
          subtitle="Throughput volume"
          icon={Activity}
          trend="+14.2%"
          trendDirection="up"
          color="indigo"
        />
        <StatCard
          title="Error Rate"
          value={`${api.errorRate}%`}
          subtitle="Observed 5xx / 4xx"
          icon={AlertTriangle}
          trend={api.errorRate > 5 ? '+16.8% anomaly spike' : 'Normal'}
          trendDirection={api.errorRate > 5 ? 'down' : 'neutral'}
          color={api.errorRate > 5 ? 'red' : 'slate'}
        />
        <StatCard
          title="P95 Latency"
          value={formatLatency(api.p95Latency)}
          subtitle="Tail response time"
          icon={Clock}
          trend={api.p95Latency > 1000 ? '+1,230% degradation' : 'Stable'}
          trendDirection={api.p95Latency > 1000 ? 'down' : 'up'}
          color={api.p95Latency > 1000 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(api.uptime)}
          subtitle="Availability SLA"
          icon={ShieldCheck}
          color={api.uptime > 99 ? 'emerald' : 'slate'}
        />
      </div>

      {/* Visual Anomaly Error Rate Chart Section (Killer visual) */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Real-Time Anomaly & Error Detection</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Temporal correlation between normal baseline, anomaly divergence, and current error percentage
          </p>
        </div>

        <AnomalyErrorChart />
      </div>

      {/* Latency Percentiles & Request Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyPercentilesChart />
        <RequestVolumeChart />
      </div>

      {/* Endpoint Performance Breakdown Table */}
      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden">
        <div className="p-5 border-b border-[#1E2633] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sub-Endpoint Performance Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Route-level distribution for {api.name}</p>
          </div>
          <span className="text-xs font-mono text-slate-400">3 sub-routes profiled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono">
              <tr>
                <th className="py-3 px-5">Sub-Endpoint</th>
                <th className="py-3 px-5">Requests</th>
                <th className="py-3 px-5">Error Rate</th>
                <th className="py-3 px-5">P95 Latency</th>
                <th className="py-3 px-5 text-right">Status Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2633] font-mono">
              {(api.endpointsTable || [
                { endpoint: 'POST /payment', requests: 12430, errorRate: '18.2%', p95: '2.9s', status: 500 },
                { endpoint: 'GET /payment', requests: 8240, errorRate: '2.1%', p95: '410ms', status: 200 },
                { endpoint: 'POST /refund', requests: 4760, errorRate: '4.8%', p95: '620ms', status: 200 },
              ]).map((row, idx) => {
                const isHighError = parseFloat(row.errorRate) > 10;
                return (
                  <tr key={idx} className="hover:bg-[#141B26] transition-colors">
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      {row.endpoint}
                    </td>
                    <td className="py-3 px-5 text-slate-300">
                      {formatNumber(row.requests)}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          isHighError ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'text-slate-300'
                        }`}
                      >
                        {row.errorRate}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-200">
                      {row.p95}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                          row.status >= 500
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
