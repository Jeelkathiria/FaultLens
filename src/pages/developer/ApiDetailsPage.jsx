import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, MethodBadge } from '../../components/common/Badge';
import { AnomalyErrorChart } from '../../components/charts/AnomalyErrorChart';
import { LatencyPercentilesChart } from '../../components/charts/LatencyPercentilesChart';
import { RequestVolumeChart } from '../../components/charts/RequestVolumeChart';
import { TimeRangeSelector } from '../../components/common/TimeRangeSelector';
import { SubEndpointBreakdownTable } from '../../components/api/SubEndpointBreakdownTable';
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
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const ApiDetailsPage = () => {
  const { websiteId, apiId } = useParams();
  const navigate = useNavigate();
  const { websites, apis, incidents, checkApiNow } = useFaultLens();

  const [timeRange, setTimeRange] = useState('24H');
  const [isChecking, setIsChecking] = useState(false);

  const api = apis.find(a => a.id === apiId);
  const website = websites.find(w => w.id === (websiteId || api?.websiteId));

  const handleCheckNow = async () => {
    if (isChecking || !api) return;
    setIsChecking(true);
    try {
      await checkApiNow(api.id);
    } finally {
      setIsChecking(false);
    }
  };

  if (!api) {
    return (
      <div className="space-y-6">
        <Link
          to={website ? `/websites/${website.id}` : '/websites'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {website?.name || 'Websites'}</span>
        </Link>
        <div className="p-12 text-center text-xs font-mono text-slate-400 border border-[#1E2633] rounded-xl bg-[#0F141D]">
          API endpoint not found. The requested API does not exist or has been removed.
        </div>
      </div>
    );
  }

  // Correlated incident (e.g. #1042 for Payment API)
  const correlatedIncident = incidents.find(i => i.apiId === api.id && i.severity !== 'resolved' && i.status !== 'resolved');

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div>
        <Link
          to={website ? `/websites/${website.id}` : '/websites'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {website?.name || 'Websites'}</span>
        </Link>

        {/* API Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-[#1E2633] bg-[#0F141D]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <MethodBadge method={api.method || 'GET'} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{api.name || 'N/A'}</h1>
                <StatusBadge status={api.status || 'UNKNOWN'} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-slate-200 font-semibold">{api.endpoint || 'N/A'}</span>
                <span>•</span>
                <span>Health check: {api.healthCheckEndpoint || 'N/A'}</span>
                <span>•</span>
                <span>Interval: {api.monitoringInterval || '60s'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCheckNow}
              disabled={isChecking}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Now'}</span>
            </button>
            <TimeRangeSelector selected={timeRange} onChange={setTimeRange} ranges={['1H', '6H', '24H', '7D']} />
          </div>
        </div>

        {/* Live Monitoring Quick Status Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-4 rounded-xl bg-[#080B12] border border-[#1E2633]">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Last Checked</div>
            <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
              {api.lastChecked || 'Never'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Last Response</div>
            <div className="text-xs font-mono font-bold mt-0.5 flex items-center gap-1.5">
              {api.lastCheckSuccess === true ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {api.lastResponse || '200 OK'}
                </span>
              ) : api.lastCheckSuccess === false ? (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {api.lastResponse || `${api.lastStatusCode || 'ERR'}`}
                </span>
              ) : (
                <span className="text-slate-400">Not checked yet</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Response Time</div>
            <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
              {api.lastResponseTime !== null && api.lastResponseTime !== undefined ? `${api.lastResponseTime} ms` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Expected Status / Timeout</div>
            <div className="text-xs font-mono font-semibold text-slate-400 mt-0.5">
              {api.expectedStatusCode || 200} / {api.timeout || 10000}ms
            </div>
          </div>
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
          value={formatNumber(api.requestsCount !== undefined ? api.requestsCount : 0)}
          subtitle="Throughput volume"
          icon={Activity}
          trend="+14.2%"
          trendDirection="up"
          color="indigo"
        />
        <StatCard
          title="Error Rate"
          value={`${api.errorRate !== undefined ? api.errorRate : 0}%`}
          subtitle="Observed 5xx / 4xx"
          icon={AlertTriangle}
          trend={api.errorRate > 5 ? '+16.8% anomaly spike' : 'Normal'}
          trendDirection={api.errorRate > 5 ? 'down' : 'neutral'}
          color={api.errorRate > 5 ? 'red' : 'slate'}
        />
        <StatCard
          title="P95 Latency"
          value={formatLatency(api.p95Latency || 0)}
          subtitle="Tail response time"
          icon={Clock}
          trend={api.p95Latency > 1000 ? '+1,230% degradation' : 'Stable'}
          trendDirection={api.p95Latency > 1000 ? 'down' : 'up'}
          color={api.p95Latency > 1000 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(api.uptime !== undefined ? api.uptime : 100)}
          subtitle="Availability SLA"
          icon={ShieldCheck}
          color={(api.uptime || 100) > 99 ? 'emerald' : 'slate'}
        />
      </div>

      {/* Latency Percentiles Pill Strip */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0F141D] border border-[#1E2633] text-center font-mono">
        <div className="border-r border-[#1E2633]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Median (P50)</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{formatLatency(api.p50Latency || 0)}</div>
        </div>
        <div className="border-r border-[#1E2633]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tail (P95)</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">{formatLatency(api.p95Latency || 0)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Max Spike (P99)</div>
          <div className="text-sm font-bold text-purple-400 mt-0.5">{formatLatency(api.p99Latency || 0)}</div>
        </div>
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

        <AnomalyErrorChart apiId={api?.id} />
      </div>

      {/* Latency Percentiles & Request Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyPercentilesChart apiId={api?.id} />
        <RequestVolumeChart apiId={api?.id} />
      </div>

      {/* Endpoint Performance Breakdown Table */}
      <SubEndpointBreakdownTable api={api} timeRange={timeRange} />
    </div>
  );
};
