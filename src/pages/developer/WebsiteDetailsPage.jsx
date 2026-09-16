import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, MethodBadge, EnvBadge } from '../../components/common/Badge';
import { AddApiModal } from '../../components/modals/AddApiModal';
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
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const WebsiteDetailsPage = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const { websites, apis, incidents } = useFaultLens();

  const [isAddApiOpen, setIsAddApiOpen] = useState(false);

  // Find website
  const website = websites.find(w => w.id === websiteId) || websites[0];

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
        <div className="p-12 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#0F141D]">
          N/A - Website not found or no website records available.
        </div>
      </div>
    );
  }

  const websiteApis = apis.filter(a => a.websiteId === website.id);
  const websiteIncidents = incidents.filter(i => i.websiteId === website.id && i.severity !== 'resolved' && i.status !== 'resolved');

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
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
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
                <span>Last telemetry checked: {website.lastChecked || 'N/A'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddApiOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add API</span>
          </button>
        </div>
      </div>

      {/* Website Top Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Uptime"
          value={formatUptime(website.uptime)}
          subtitle="Rolling 30-day SLA"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="APIs"
          value={websiteApis.length}
          subtitle="Monitored routes"
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Requests"
          value={formatNumber(website.totalRequests24h || 124580)}
          subtitle="Last 24 hours"
          icon={Activity}
          color="indigo"
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
              <div className="text-xs font-bold font-mono text-red-400">
                ACTIVE INCIDENT {websiteIncidents[0].number}
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

      {/* APIs inside Website Section */}
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

        {/* API Cards Grid */}
        {websiteApis.length === 0 ? (
          <div className="p-10 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#0F141D]">
            N/A - No APIs configured for this website yet. Click "+ Add New Route" to register an endpoint.
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
