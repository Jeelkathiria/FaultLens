import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatusBadge, EnvBadge } from '../../components/common/Badge';
import { UptimeBar } from '../../components/common/UptimeBar';
import { AddWebsiteModal } from '../../components/modals/AddWebsiteModal';
import { formatUptime, formatNumber } from '../../utils/formatters';
import {
  Globe,
  Plus,
  LayoutGrid,
  List,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const WebsitesPage = () => {
  const navigate = useNavigate();
  const { websites } = useFaultLens();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL'); // 'ALL' | 'healthy' | 'degraded' | 'critical'

  const filteredWebsites = websites.filter((w) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = w.name.toLowerCase().includes(q);
      const matchesUrl = w.url.toLowerCase().includes(q);
      if (!matchesName && !matchesUrl) return false;
    }
    if (healthFilter !== 'ALL' && w.health !== healthFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Websites</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor all your applications and their APIs.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Website</span>
        </button>
      </div>

      {/* Filter and View Mode Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0F141D] border border-[#1E2633]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search websites by name or URL..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Health filter pills */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            {['ALL', 'healthy', 'degraded', 'critical'].map((filter) => (
              <button
                key={filter}
                onClick={() => setHealthFilter(filter)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                  healthFilter === filter
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'All Health' : filter}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Websites Grid View */}
      {viewMode === 'grid' ? (
        filteredWebsites.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#0F141D]">
            N/A - No websites available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWebsites.map((website) => {
              return (
                <div
                  key={website.id}
                  onClick={() => navigate(`/websites/${website.id}`)}
                  className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 card-hover-glow cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <StatusBadge status={website.health || 'healthy'} />
                      <EnvBadge env={website.environment || 'production'} />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                        <span>{website.name || 'N/A'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{website.displayUrl || website.url || 'N/A'}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1E2633] my-3">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">APIs</div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {website.apiCount !== undefined ? `${website.apiCount}` : '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</div>
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
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Response</div>
                        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                          {website.lastResponseTime !== null && website.lastResponseTime !== undefined
                            ? `${website.lastResponseTime}ms`
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {website.activeIncidents > 0 && (
                      <div className="mb-3 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{website.activeIncidents} Active Incident</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-mono">
                      <span>Uptime Timeline</span>
                      <span>Last checked: {website.lastChecked || 'Never'}</span>
                    </div>
                    <UptimeBar history={website.uptimeHistory} barsCount={36} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* List View */
        <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono">
              <tr>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">HTTP Probe</th>
                <th className="py-3 px-4">APIs</th>
                <th className="py-3 px-4">Response</th>
                <th className="py-3 px-4">Rolling Uptime</th>
                <th className="py-3 px-4">Incidents</th>
                <th className="py-3 px-4">Last Checked</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2633]">
              {filteredWebsites.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-mono text-xs text-slate-500">
                    N/A - No websites available
                  </td>
                </tr>
              ) : (
                filteredWebsites.map((website) => (
                  <tr
                    key={website.id}
                    onClick={() => navigate(`/websites/${website.id}`)}
                    className="hover:bg-[#141B26] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{website.name || 'N/A'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{website.displayUrl || website.url || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={website.health || 'healthy'} />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          website.healthStatus === 'UP'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : website.healthStatus === 'DEGRADED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : website.healthStatus === 'DOWN'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {website.healthStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {website.apiCount !== undefined ? `${website.apiCount}` : '0'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {website.lastResponseTime !== null && website.lastResponseTime !== undefined
                        ? `${website.lastResponseTime}ms`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {formatUptime(website.uptime)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {website.activeIncidents > 0 ? (
                        <span className="text-red-400 font-semibold">{website.activeIncidents} active</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{website.lastChecked || 'Never'}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 font-medium">
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Website Modal */}
      <AddWebsiteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
