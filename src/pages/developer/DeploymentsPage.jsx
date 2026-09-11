import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import {
  Rocket,
  GitCommit,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

export const DeploymentsPage = () => {
  const navigate = useNavigate();
  const { deployments } = useFaultLens();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'incident' | 'stable'

  const filteredDeployments = deployments.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesVer = d.version.toLowerCase().includes(q);
      const matchesServ = d.service.toLowerCase().includes(q);
      const matchesCommit = d.commit.toLowerCase().includes(q);
      if (!matchesVer && !matchesServ && !matchesCommit) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Deployments</h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlate Git commits and CI/CD releases with observed API anomalies.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0F141D] border border-[#1E2633]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by version (v1.8), service, or commit hash..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
          {['ALL', 'incident', 'stable'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                statusFilter === filter
                  ? filter === 'incident'
                    ? 'bg-amber-600 text-white'
                    : filter === 'stable'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Releases' : filter === 'incident' ? 'Has Linked Incidents' : 'Stable Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {filteredDeployments.map((dep) => {
          const hasIncident = dep.status === 'incident';

          return (
            <div
              key={dep.id}
              className={`rounded-xl border p-5 transition-all duration-200 card-hover-glow ${
                hasIncident
                  ? 'border-amber-500/30 bg-gradient-to-r from-[#0F141D] via-amber-950/10 to-[#0F141D]'
                  : 'border-[#1E2633] bg-[#0F141D]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Version & Commit Details */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                      hasIncident
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    <Rocket className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base font-bold text-slate-100">{dep.version}</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {dep.service}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({dep.websiteName})</span>

                      {/* Status pill */}
                      {hasIncident ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Incident Correlated</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stable</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-2 font-mono font-medium">
                      {dep.commitMessage}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap font-mono">
                      <span className="flex items-center gap-1 text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-[#1E2633]">
                        <GitCommit className="w-3 h-3 text-indigo-400" />
                        <span>{dep.commit}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-slate-500" />
                        <span>{dep.branch}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{dep.deployedAt}</span>
                      </span>
                      <span>By @{dep.author}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Correlated Incident Banner & Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1E2633]">
                  {dep.correlatedIncidentId ? (
                    <button
                      onClick={() => navigate(`/incidents/${dep.correlatedIncidentId}`)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all group"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{dep.correlationNote || 'Inspect Incident'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">No regressions detected</span>
                  )}
                  <span className="text-[11px] font-mono text-slate-500">Build: {dep.buildDuration} ({dep.ciRunId})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
