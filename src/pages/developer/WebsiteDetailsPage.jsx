import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, MethodBadge, EnvBadge } from '../../components/common/Badge';
import { AddApiModal } from '../../components/modals/AddApiModal';
import { websiteService } from '../../services/websites';
import { formatUptime, formatLatency, formatNumber } from '../../utils/formatters';
import {
  ArrowLeft,
  Plus,
  Globe,
  Layers,
  Activity,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Lock,
  Server,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const WebsiteDetailsPage = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const { websites, apis, incidents, simulateIncident, addApi, checkWebsiteNow } = useFaultLens();

  const [isAddApiOpen, setIsAddApiOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCheckingNow, setIsCheckingNow] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [checks, setChecks] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Find website
  const website = websites.find((w) => w.id === websiteId);

  const fetchWebsiteData = async (siteId) => {
    if (!siteId) return;
    try {
      setIsLoadingMetrics(true);
      const [metricsRes, checksRes] = await Promise.allSettled([
        websiteService.getWebsiteMetrics(siteId, '24h'),
        websiteService.getWebsiteChecks(siteId, { limit: 10 })
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }
      if (checksRes.status === 'fulfilled' && checksRes.value?.data) {
        setChecks(checksRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching website monitoring metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (website?.id) {
      fetchWebsiteData(website.id);
    }
  }, [website?.id, website?.lastCheckedAt]);

  if (!website) {
    return (
      <div className="space-y-6">
        <Link
          to="/websites"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Websites</span>
        </Link>
        <div className="p-12 text-center text-xs font-mono text-slate-400 border border-[#1E2633] rounded-xl bg-[#0F141D]">
          Website not found. The requested website does not exist or has been removed.
        </div>
      </div>
    );
  }

  const websiteApis = apis.filter((a) => a.websiteId === website.id);
  const websiteIncidents = incidents.filter(
    (i) =>
      (i.websiteId === website.id || websiteApis.some((a) => a.id === i.apiId)) &&
      i.severity !== 'resolved' &&
      i.status !== 'resolved'
  );

  const handleCheckWebsiteNow = async () => {
    if (isCheckingNow) return;
    setIsCheckingNow(true);
    try {
      if (checkWebsiteNow) {
        await checkWebsiteNow(website.id);
      } else {
        await websiteService.checkWebsiteNow(website.id);
      }
      await fetchWebsiteData(website.id);
    } catch (err) {
      console.error('Failed to trigger manual website check:', err);
    } finally {
      setIsCheckingNow(false);
    }
  };

  const handleTriggerTestIncident = async () => {
    setIsSimulating(true);
    try {
      let targetApi = websiteApis[0];
      if (!targetApi && addApi) {
        targetApi = await addApi(website.id, {
          name: 'Root Endpoint',
          endpoint: '/',
          method: 'GET',
          healthCheckEndpoint: '/'
        });
      }
      if (targetApi && simulateIncident) {
        await simulateIncident({
          apiId: targetApi.id,
          title: `Simulated 500 Outage on ${website.name}`,
          description: `Automatic probe detected 4.5σ deviation on ${targetApi.name || targetApi.endpoint}`,
          severity: 'critical'
        });
      }
    } catch (err) {
      console.error('Failed to trigger test incident:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const currentUptime = metrics?.uptime !== undefined ? metrics.uptime : website.uptime;
  const currentResponseTime = website.lastResponseTime !== null && website.lastResponseTime !== undefined
    ? website.lastResponseTime
    : metrics?.currentResponseTime || 0;
  const p50Latency = metrics?.p50 || 0;
  const p95Latency = metrics?.p95 || 0;
  const p99Latency = metrics?.p99 || 0;

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Back Link */}
      <div>
        <Link
          to="/websites"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Websites</span>
        </Link>

        {/* Website Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-[#1E2633] bg-[#0F141D]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{website.name || 'N/A'}</h1>
                <StatusBadge status={website.health || 'healthy'} />
                <EnvBadge env={website.environment || 'production'} />
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1 ${
                    website.healthStatus === 'UP'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : website.healthStatus === 'DEGRADED'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : website.healthStatus === 'DOWN'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>HTTP {website.healthStatus || 'UNKNOWN'}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                <a
                  href={website.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  <span>{website.displayUrl || website.url || 'N/A'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <span>Last checked: {website.lastChecked || 'Never'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={handleCheckWebsiteNow}
              disabled={isCheckingNow}
              id="btn-check-website-now"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              title="Execute immediate live HTTP availability check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNow ? 'animate-spin' : ''}`} />
              <span>{isCheckingNow ? 'Probing...' : 'Check Website Now'}</span>
            </button>

            <button
              onClick={handleTriggerTestIncident}
              disabled={isSimulating}
              id="btn-trigger-test-incident"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              title="Simulate a real-time incident on this website"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Triggering...' : 'Trigger Test Incident'}</span>
            </button>

            <button
              onClick={() => setIsAddApiOpen(true)}
              id="btn-add-api"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Website Top Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Availability"
          value={formatUptime(currentUptime)}
          subtitle="Rolling HTTP SLA"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Response Time"
          value={currentResponseTime ? `${currentResponseTime}ms` : '—'}
          subtitle={metrics?.averageResponseTime ? `Avg: ${metrics.averageResponseTime}ms` : 'Measured via GET probe'}
          icon={Gauge}
          color="indigo"
        />
        <StatCard
          title="APIs"
          value={websiteApis.length}
          subtitle={websiteApis.length === 0 ? 'Pure HTTP monitoring' : 'Monitored endpoints'}
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Active Incidents"
          value={websiteIncidents.length}
          subtitle="Requires attention"
          icon={AlertOctagon}
          color={websiteIncidents.length > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Active Incidents Banner if present */}
      {websiteIncidents.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono text-red-400">
                  ACTIVE INCIDENT {websiteIncidents[0].number}
                </span>
                <span className="text-xs font-medium text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1 font-mono">
                  <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>{website.name}</span>
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {websiteIncidents[0].title}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/incidents/${websiteIncidents[0].id}`)}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all"
          >
            Inspect Incident →
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: Website Health (HTTP Availability, P50/P95/P99, Probes)           */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl border border-[#1E2633] bg-[#0F141D] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2633] pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Website Health</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated HTTP GET availability, baseline response times, and SSL verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                website.healthStatus === 'UP'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : website.healthStatus === 'DEGRADED'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : website.healthStatus === 'DOWN'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {website.healthStatus === 'UP' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {website.healthStatus === 'DEGRADED' && <AlertTriangle className="w-3.5 h-3.5" />}
              {website.healthStatus === 'DOWN' && <XCircle className="w-3.5 h-3.5" />}
              <span>Probe Status: {website.healthStatus || 'UNKNOWN'}</span>
            </span>
          </div>
        </div>

        {/* Latency & HTTP Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</div>
            <div className="text-base font-bold text-emerald-400 mt-1">
              {formatUptime(currentUptime)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current Latency</div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {currentResponseTime ? `${currentResponseTime}ms` : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">P50 Latency</div>
            <div className="text-base font-bold text-slate-200 mt-1">
              {p50Latency ? `${p50Latency}ms` : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">P95 Latency</div>
            <div className="text-base font-bold text-amber-400 mt-1">
              {p95Latency ? `${p95Latency}ms` : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">P99 Latency</div>
            <div className="text-base font-bold text-amber-500 mt-1">
              {p99Latency ? `${p99Latency}ms` : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">HTTP Status</div>
            <div className="text-base font-bold text-slate-100 mt-1 flex items-center gap-1">
              <span>{website.lastStatusCode ? `HTTP ${website.lastStatusCode}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Detail Summary & SSL status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-[#080B12] border border-[#1E2633] space-y-2">
            <div className="text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL / Security</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1">
              <span>TLS Certificate:</span>
              <span className={website.sslValid !== false ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {website.sslValid === false ? 'Invalid / Expired' : 'Valid & Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Protocol:</span>
              <span>{website.url?.startsWith('https') ? 'HTTPS (Port 443)' : 'HTTP (Port 80)'}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#080B12] border border-[#1E2633] space-y-2">
            <div className="text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Probe Configuration</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1">
              <span>Interval:</span>
              <span>{website.monitoringInterval || 60} seconds</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Timeout:</span>
              <span>{website.monitoringTimeout || 10} seconds</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#080B12] border border-[#1E2633] space-y-2">
            <div className="text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Check Timestamps</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1">
              <span>Last Checked:</span>
              <span>{website.lastChecked || 'Never'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Last Success:</span>
              <span>
                {website.lastSuccessfulCheckAt
                  ? new Date(website.lastSuccessfulCheckAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Probe History Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Recent Probe History
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {checks.length} recent checks recorded
            </span>
          </div>

          {checks.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-lg bg-[#080B12]">
              Running background probes... Checks will appear momentarily.
            </div>
          ) : (
            <div className="rounded-lg border border-[#1E2633] bg-[#080B12] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">HTTP Code</th>
                    <th className="py-2.5 px-3.5">Response Time</th>
                    <th className="py-2.5 px-3.5">SSL</th>
                    <th className="py-2.5 px-3.5">Timestamp</th>
                    <th className="py-2.5 px-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2633]">
                  {checks.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-[#0F141D] transition-colors">
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'UP'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.status === 'DEGRADED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-200">
                        {c.statusCode ? `HTTP ${c.statusCode}` : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-200">
                        {c.responseTime > 0 ? `${c.responseTime}ms` : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-400">
                        {c.sslValid === true ? (
                          <span className="text-emerald-400">Valid</span>
                        ) : c.sslValid === false ? (
                          <span className="text-red-400">Issue</span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-400">
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-400 truncate max-w-xs">
                        {c.errorMessage || (c.status === 'UP' ? 'OK' : 'N/A')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: APIs inside Website (Case A vs Case B)                           */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">APIs inside {website.name}</h2>
            <p className="text-xs text-slate-400">
              Individual endpoint telemetry, p95 latencies, and health evaluations
            </p>
          </div>
          <button
            onClick={() => setIsAddApiOpen(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>+ Add New Route</span>
          </button>
        </div>

        {/* API Cards Grid or Case B Info State */}
        {websiteApis.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-[#1E2633] bg-[#0F141D] space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">No APIs registered</div>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                This website is monitored through HTTP availability checks. You can monitor endpoints, telemetry, and request volumes whenever you're ready.
              </p>
            </div>
            <button
              onClick={() => setIsAddApiOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register an API</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {websiteApis.map((api) => {
              return (
                <div
                  key={api.id}
                  onClick={() => navigate(`/websites/${website.id}/apis/${api.id}`)}
                  className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 card-hover-glow cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar: Method & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <MethodBadge method={api.method || 'GET'} />
                      <StatusBadge status={api.status || 'healthy'} />
                    </div>

                    {/* Title & Endpoint */}
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                        <span>{api.name || 'N/A'}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-1 truncate">{api.endpoint || 'N/A'}</div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#1E2633] my-3">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {formatUptime(api.uptime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">P95 Latency</div>
                        <div
                          className={`text-sm font-bold font-mono mt-0.5 ${
                            (api.p95Latency || 0) > 1500
                              ? 'text-red-400'
                              : (api.p95Latency || 0) > 400
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {formatLatency(api.p95Latency)}
                        </div>
                      </div>
                    </div>

                    {/* Error rate callout if high */}
                    {(api.errorRate || 0) > 1 && (
                      <div className="mb-3 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between font-mono">
                        <span>Error rate:</span>
                        <span className="font-bold">{api.errorRate}%</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 font-mono">
                    <span>Interval: {api.monitoringInterval || 'N/A'}</span>
                    <span className="text-indigo-400 group-hover:underline">Deep Dive Telemetry →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add API Modal */}
      <AddApiModal
        isOpen={isAddApiOpen}
        onClose={() => setIsAddApiOpen(false)}
        websiteId={website.id}
        websiteName={website.name}
      />
    </div>
  );
};
