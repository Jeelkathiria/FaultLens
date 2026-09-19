import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SimulateIncidentModal } from '../../components/modals/SimulateIncidentModal';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Activity,
  Globe,
  Zap
} from 'lucide-react';

export const IncidentsPage = () => {
  const navigate = useNavigate();
  const { incidents, websites, apis } = useFaultLens();

  const getWebsiteName = (inc) => {
    return (
      inc.websiteName ||
      websites?.find((w) => w.id === inc.websiteId)?.name ||
      websites?.find((w) => w.id === apis?.find((a) => a.id === inc.apiId)?.websiteId)?.name ||
      ''
    );
  };

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'critical' | 'warning' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter !== 'ALL') {
      if (activeFilter === 'resolved' && inc.status !== 'resolved' && inc.severity !== 'resolved') {
        return false;
      }
      if (activeFilter !== 'resolved' && inc.severity !== activeFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const siteName = getWebsiteName(inc);
      const matchesTitle = inc.title?.toLowerCase().includes(q);
      const matchesApi = inc.apiName?.toLowerCase().includes(q);
      const matchesNum = inc.number?.toLowerCase().includes(q);
      const matchesWebsite = siteName.toLowerCase().includes(q);
      if (!matchesTitle && !matchesApi && !matchesNum && !matchesWebsite) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Incidents</h1>
          <p className="text-xs text-slate-400 mt-1">Automatically detected abnormal behavior and regressions.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {incidents.filter(i => i.severity !== 'resolved' && i.status !== 'resolved').length} Active
          </span>

          <button
            onClick={() => setIsSimulateModalOpen(true)}
            id="btn-simulate-incident-page"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shadow-red-600/20 cursor-pointer"
            title="Trigger a real-time incident test on any website"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+ Simulate Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0F141D] border border-[#1E2633]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by incident number (#1042), API, or title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Severity filter tabs */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
          {['ALL', 'critical', 'warning', 'resolved'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                activeFilter === filter
                  ? filter === 'critical'
                    ? 'bg-red-600 text-white'
                    : filter === 'warning'
                    ? 'bg-amber-600 text-white'
                    : filter === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Incidents' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Cards List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="N/A - No Incidents Available"
            description="All monitored API endpoints are operating within normal baseline SLA thresholds (N/A)."
            actionLabel="View All"
            onAction={() => {
              setActiveFilter('ALL');
              setSearchQuery('');
            }}
          />
        ) : (
          filteredIncidents.map((incident) => {
            const isCritical = incident.severity === 'critical';
            const isResolved = incident.status === 'resolved' || incident.severity === 'resolved';
            const websiteName = getWebsiteName(incident);

            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className={`rounded-xl border p-5 transition-all duration-200 card-hover-glow cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCritical
                    ? 'border-red-500/30 bg-gradient-to-r from-[#0F141D] via-[#140E14] to-[#0F141D]'
                    : isResolved
                    ? 'border-emerald-500/20 bg-[#0F141D]'
                    : 'border-amber-500/30 bg-[#0F141D]'
                }`}
              >
                {/* Left: Metadata & summary */}
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : isResolved
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-indigo-300 transition-colors">
                        {incident.number || 'N/A'}
                      </span>
                      {websiteName && (
                        <span className="text-xs font-medium text-indigo-300 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1.5 font-mono">
                          <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{websiteName}</span>
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                        {incident.apiName || 'N/A'}
                      </span>
                      <StatusBadge status={incident.severity || 'healthy'} size="xs" />
                      {incident.correlatedDeployment && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Correlated with {incident.correlatedDeployment.version || 'release'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mt-1.5 group-hover:text-white transition-colors">
                      {incident.title || 'N/A'}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 font-mono">{incident.summary || 'N/A'}</p>
                  </div>
                </div>

                {/* Right: Metrics & Time */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#1E2633]">
                  {incident.metrics ? (
                    <div className="text-left md:text-right font-mono text-xs">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Metric Jump</div>
                      <div className="text-red-400 font-bold mt-0.5">
                        {incident.metrics.errorRateBefore || 'N/A'} → {incident.metrics.errorRateCurrent || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-left md:text-right font-mono text-xs">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Metric Jump</div>
                      <div className="text-slate-400 font-bold mt-0.5">N/A</div>
                    </div>
                  )}

                  <div className="text-right font-mono text-xs">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>Detected</span>
                    </div>
                    <div className="text-slate-300 mt-0.5 font-semibold">{incident.timeAgo || 'N/A'}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800/60 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SimulateIncidentModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
      />
    </div>
  );
};
