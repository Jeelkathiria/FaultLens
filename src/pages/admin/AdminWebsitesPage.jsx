import React, { useState } from 'react';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatusBadge, EnvBadge } from '../../components/common/Badge';
import { formatUptime, formatNumber } from '../../utils/formatters';
import { Globe, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminWebsitesPage = () => {
  const navigate = useNavigate();
  const { websites } = useFaultLens();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = websites.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.displayUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Tenant Websites</h1>
          <p className="text-xs text-slate-400 mt-1">Global inventory of registered domains across all developer organizations.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Domains: <span className="text-slate-100 font-bold">{websites.length}</span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#0F141D] border border-[#1E2633]">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domains..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono">
            <tr>
              <th className="py-3.5 px-5">Website</th>
              <th className="py-3.5 px-5">Environment</th>
              <th className="py-3.5 px-5">Health</th>
              <th className="py-3.5 px-5">APIs</th>
              <th className="py-3.5 px-5">Uptime</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2633]">
            {filtered.map(w => (
              <tr key={w.id} className="hover:bg-[#141B26] transition-colors">
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-slate-100">{w.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{w.displayUrl}</div>
                </td>
                <td className="py-3.5 px-5"><EnvBadge env={w.environment} /></td>
                <td className="py-3.5 px-5"><StatusBadge status={w.health} /></td>
                <td className="py-3.5 px-5 font-mono text-slate-200">{w.apiCount} APIs</td>
                <td className="py-3.5 px-5 font-mono font-bold text-slate-200">{formatUptime(w.uptime)}</td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    onClick={() => navigate(`/websites/${w.id}`)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View as Dev →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
