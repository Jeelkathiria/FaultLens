import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { HealthMetricsChart } from '../../components/charts/HealthMetricsChart';
import { StatusBadge, EnvBadge } from '../../components/common/Badge';
import { UptimeBar } from '../../components/common/UptimeBar';
import { formatUptime, formatNumber } from '../../utils/formatters';
import {
  Globe,
  Layers,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { websites, apis, incidents } = useFaultLens();

  const totalWebsites = websites.length;
  const totalApis = apis.length;
  const healthyApis = apis.filter(a => a.status === 'healthy').length;
  const activeIncidents = incidents.filter(i => i.severity !== 'resolved' && i.status !== 'resolved');

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Good afternoon, Jeel</h1>
          <p className="text-xs text-slate-400 mt-1">Here's what's happening across your applications.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/websites')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Website</span>
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Websites"
          value={totalWebsites}
          subtitle="Monitored domains"
          icon={Globe}
          trend="+1 this month"
          trendDirection="up"
          color="slate"
        />
        <StatCard
          title="Total APIs"
          value={totalApis}
          subtitle="Endpoints tracked"
          icon={Layers}
          trend="100% telemetry coverage"
          color="indigo"
        />
        <StatCard
          title="Healthy"
          value={healthyApis}
          subtitle={`${((healthyApis / (totalApis || 1)) * 100).toFixed(0)}% within SLA`}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Active Incidents"
          value={activeIncidents.length}
          subtitle="Requires attention"
          icon={AlertOctagon}
          trendDirection="down"
          color={activeIncidents.length > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Active Incidents Alert Banner (if any) */}
      {activeIncidents.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                  {activeIncidents[0].number}
                </span>
                {(activeIncidents[0].websiteName || websites?.find(w => w.id === activeIncidents[0].websiteId)?.name) && (
                  <span className="text-xs font-medium text-indigo-300 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1.5 font-mono">
                    <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{activeIncidents[0].websiteName || websites?.find(w => w.id === activeIncidents[0].websiteId)?.name}</span>
                  </span>
                )}
                {activeIncidents[0].apiName && (
                  <span className="text-xs font-mono text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                    {activeIncidents[0].apiName}
                  </span>
                )}
                <span className="text-sm font-semibold text-slate-100">{activeIncidents[0].title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeIncidents[0].summary}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/incidents/${activeIncidents[0].id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shrink-0"
          >
            <span>Investigate Incident</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overall System Health Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Overall System Health</h2>
            <p className="text-xs text-slate-400">Aggregated throughput, error rate and latency across all clusters</p>
          </div>
        </div>

        <HealthMetricsChart />
      </div>

      {/* Websites Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Applications & Websites</h2>
            <p className="text-xs text-slate-400">Individual health status and rolling 90-day uptime</p>
          </div>
          <button
            onClick={() => navigate('/websites')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View all websites ({websites.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {websites.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#0F141D]">
            N/A - No websites available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {websites.map((website) => {
              return (
                <div
                  key={website.id}
                  onClick={() => navigate(`/websites/${website.id}`)}
                  className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 card-hover-glow cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar: Health Badge & Env */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <StatusBadge status={website.health || 'healthy'} />
                      <EnvBadge env={website.environment || 'production'} />
                    </div>

                    {/* Title & Domain */}
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                        <span>{website.name || 'N/A'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{website.displayUrl || website.url || 'N/A'}</div>
                    </div>

                    {/* Uptime and API stats */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#1E2633] my-3">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">APIs Monitored</div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {website.apiCount !== undefined ? `${website.apiCount} APIs` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Rolling Uptime</div>
                        <div
                          className={`text-sm font-bold font-mono mt-0.5 ${
                            (website.uptime || 0) > 99
                              ? 'text-emerald-400'
                              : (website.uptime || 0) > 95
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {formatUptime(website.uptime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 90-day mini uptime bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                      <span>90-Day History</span>
                      <span>{website.lastChecked || 'N/A'}</span>
                    </div>
                    <UptimeBar history={website.uptimeHistory} barsCount={32} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
