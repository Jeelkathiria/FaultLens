import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';
import { MethodBadge } from '../common/Badge';
import { formatLatency, formatNumber } from '../../utils/formatters';
import { websiteService } from '../../services/websites';

export const SubEndpointBreakdownTable = ({ api, timeRange = '24H' }) => {
  const [data, setData] = useState(api?.endpointsTable || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [sortField, setSortField] = useState('requests');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [copiedPath, setCopiedPath] = useState(null);

  // Fetch live breakdown for API & timeRange
  const fetchBreakdown = useCallback(async () => {
    if (!api?.id) return;
    setLoading(true);
    try {
      const res = await websiteService.getSubEndpoints(api.id, timeRange.toLowerCase());
      if (Array.isArray(res) && res.length > 0) {
        setData(res);
      } else if (api?.endpointsTable && api.endpointsTable.length > 0) {
        setData(api.endpointsTable);
      }
    } catch (err) {
      console.warn('Failed to fetch sub-endpoints, using fallback:', err.message);
      if (api?.endpointsTable && api.endpointsTable.length > 0) {
        setData(api.endpointsTable);
      }
    } finally {
      setLoading(false);
    }
  }, [api?.id, api?.endpointsTable, timeRange]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  // Handle route copying
  const handleCopy = (path) => {
    navigator.clipboard?.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  // Available HTTP methods in the dataset
  const availableMethods = useMemo(() => {
    const methods = new Set();
    data.forEach((row) => {
      const m = (row.method || row.endpoint?.split(' ')[0] || 'GET').toUpperCase();
      methods.add(m);
    });
    return ['ALL', ...Array.from(methods)];
  }, [data]);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered and sorted routes
  const filteredAndSortedRows = useMemo(() => {
    let result = [...data];

    // Method filtering
    if (selectedMethod !== 'ALL') {
      result = result.filter(row => {
        const m = (row.method || row.endpoint?.split(' ')[0] || 'GET').toUpperCase();
        return m === selectedMethod;
      });
    }

    // Search query filtering (by endpoint path or method)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(row => {
        const ep = (row.endpoint || row.path || '').toLowerCase();
        const m = (row.method || '').toLowerCase();
        return ep.includes(q) || m.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA, valB;

      if (sortField === 'endpoint') {
        valA = (a.path || a.endpoint || '').toLowerCase();
        valB = (b.path || b.endpoint || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'requests') {
        valA = Number(a.requests) || 0;
        valB = Number(b.requests) || 0;
      } else if (sortField === 'errorRate') {
        valA = parseFloat(a.errorRateNum !== undefined ? a.errorRateNum : a.errorRate) || 0;
        valB = parseFloat(b.errorRateNum !== undefined ? b.errorRateNum : b.errorRate) || 0;
      } else if (sortField === 'p95') {
        valA = parseFloat(a.p95Num !== undefined ? a.p95Num : a.p95) || 0;
        valB = parseFloat(b.p95Num !== undefined ? b.p95Num : b.p95) || 0;
      } else if (sortField === 'status') {
        valA = Number(a.status) || 200;
        valB = Number(b.status) || 200;
      } else {
        valA = 0;
        valB = 0;
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [data, selectedMethod, searchQuery, sortField, sortDirection]);

  // Aggregate metrics across routes
  const summary = useMemo(() => {
    if (!data.length) {
      return { totalRequests: 0, maxErrorRoute: null, slowestRoute: null, avgP95: 0 };
    }

    let totalRequests = 0;
    let maxErrorRoute = data[0];
    let slowestRoute = data[0];
    let totalP95 = 0;

    data.forEach((r) => {
      const req = Number(r.requests) || 0;
      const err = parseFloat(r.errorRateNum !== undefined ? r.errorRateNum : r.errorRate) || 0;
      const p95 = parseFloat(r.p95Num !== undefined ? r.p95Num : r.p95) || 0;

      totalRequests += req;
      totalP95 += p95;

      const maxErr = parseFloat(maxErrorRoute.errorRateNum !== undefined ? maxErrorRoute.errorRateNum : maxErrorRoute.errorRate) || 0;
      if (err > maxErr) maxErrorRoute = r;

      const maxSlow = parseFloat(slowestRoute.p95Num !== undefined ? slowestRoute.p95Num : slowestRoute.p95) || 0;
      if (p95 > maxSlow) slowestRoute = r;
    });

    const avgP95 = data.length > 0 ? Math.round(totalP95 / data.length) : 0;
    return { totalRequests, maxErrorRoute, slowestRoute, avgP95 };
  }, [data]);

  const maxRequestsInSet = useMemo(() => {
    return Math.max(...data.map(r => Number(r.requests) || 1), 1);
  }, [data]);

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 font-bold" />
    );
  };

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden transition-all shadow-xl shadow-black/20">
      {/* Header Bar */}
      <div className="p-5 border-b border-[#1E2633] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-[#141A24] to-[#0F141D]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100">Sub-Endpoint Performance Breakdown</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Live Aggregation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Route-level distribution for <span className="text-slate-300 font-semibold">{api?.name || 'API'}</span> across the past {timeRange}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-mono text-slate-400 bg-[#0B0F17] px-3 py-1.5 rounded-lg border border-[#1E2633]">
            <span className="text-indigo-400 font-bold">{filteredAndSortedRows.length}</span> / {data.length} routes
          </span>

          <button
            onClick={fetchBreakdown}
            disabled={loading}
            title="Refresh Route Metrics"
            className="p-1.5 rounded-lg bg-[#0B0F17] border border-[#1E2633] text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mini Performance Profile Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#1E2633] divide-x divide-[#1E2633] bg-[#0B0F17]/50 text-xs font-mono">
        <div className="p-3.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>Profiled Requests</span>
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {formatNumber(summary.totalRequests)}
          </div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Avg P95 Latency</span>
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-1">
            {summary.avgP95 > 0 ? `${summary.avgP95} ms` : '—'}
          </div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Highest Error Route</span>
          </div>
          <div className="text-sm font-bold text-amber-400 mt-1 truncate" title={summary.maxErrorRoute?.endpoint || 'None'}>
            {summary.maxErrorRoute && summary.totalRequests > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="text-red-400">{summary.maxErrorRoute.errorRate}</span>
                <span className="text-[10px] text-slate-400 font-normal truncate">
                  {summary.maxErrorRoute.path || summary.maxErrorRoute.endpoint}
                </span>
              </span>
            ) : (
              '0.0%'
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Slowest Tail</span>
          </div>
          <div className="text-sm font-bold text-purple-400 mt-1 truncate" title={summary.slowestRoute?.endpoint || 'None'}>
            {summary.slowestRoute && summary.totalRequests > 0 ? (
              <span className="flex items-center gap-1.5">
                <span>{summary.slowestRoute.p95}</span>
                <span className="text-[10px] text-slate-400 font-normal truncate">
                  {summary.slowestRoute.path || summary.slowestRoute.endpoint}
                </span>
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar: Search & Method Filter */}
      <div className="p-3.5 border-b border-[#1E2633] bg-[#0C1018] flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sub-endpoint path or method..."
            className="w-full pl-9 pr-7 py-1.5 rounded-lg bg-[#0B0F17] border border-[#1E2633] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Method filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Method:
          </span>
          {availableMethods.map((method) => {
            const isSelected = selectedMethod === method;
            return (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`px-2 py-1 text-[11px] font-mono font-medium rounded-md transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-[#0B0F17] text-slate-400 hover:text-slate-200 border border-[#1E2633] hover:border-slate-700'
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('endpoint')}
                className="py-3 px-5 cursor-pointer hover:text-slate-200 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Sub-Endpoint Route</span>
                  {renderSortIcon('endpoint')}
                </div>
              </th>
              <th
                onClick={() => handleSort('requests')}
                className="py-3 px-5 cursor-pointer hover:text-slate-200 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Requests & Share</span>
                  {renderSortIcon('requests')}
                </div>
              </th>
              <th
                onClick={() => handleSort('errorRate')}
                className="py-3 px-5 cursor-pointer hover:text-slate-200 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Error Rate</span>
                  {renderSortIcon('errorRate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('p95')}
                className="py-3 px-5 cursor-pointer hover:text-slate-200 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>P95 Latency</span>
                  {renderSortIcon('p95')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-5 text-right cursor-pointer hover:text-slate-200 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>HTTP Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2633] font-mono">
            {filteredAndSortedRows.length > 0 ? (
              filteredAndSortedRows.map((row, idx) => {
                const parts = (row.endpoint || '').split(' ');
                const method = row.method || (parts.length > 1 ? parts[0] : api?.method || 'GET');
                const path = row.path || (parts.length > 1 ? parts.slice(1).join(' ') : row.endpoint || '/');

                const errNum = parseFloat(row.errorRateNum !== undefined ? row.errorRateNum : row.errorRate) || 0;
                const p95Num = parseFloat(row.p95Num !== undefined ? row.p95Num : row.p95) || 0;
                const reqNum = Number(row.requests) || 0;
                const reqShare = maxRequestsInSet > 0 ? Math.min(100, Math.round((reqNum / maxRequestsInSet) * 100)) : 0;

                const isCriticalError = errNum >= 15;
                const isWarnError = errNum > 3 && errNum < 15;
                const isSlowP95 = p95Num >= 800;
                const isModerateP95 = p95Num >= 300 && p95Num < 800;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-[#141B26] transition-colors group"
                  >
                    {/* Sub-Endpoint Path & Method */}
                    <td className="py-3.5 px-5 font-semibold text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <MethodBadge method={method} size="xs" />
                        <span className="text-slate-200 font-mono tracking-tight text-xs hover:text-indigo-300 transition-colors">
                          {path}
                        </span>
                        <button
                          onClick={() => handleCopy(path)}
                          title="Copy path"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-slate-500 rounded transition-opacity"
                        >
                          {copiedPath === path ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Requests & Volume Share Bar */}
                    <td className="py-3.5 px-5 text-slate-300">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{formatNumber(reqNum)}</span>
                          <span className="text-[10px] text-slate-500">{reqShare}% share</span>
                        </div>
                        <div className="h-1.5 w-28 bg-[#1A2230] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(5, reqShare)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Error Rate */}
                    <td className="py-3.5 px-5">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            isCriticalError
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : isWarnError
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {row.errorRate}
                        </span>
                      </div>
                    </td>

                    {/* P95 Latency */}
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-bold ${
                          isSlowP95
                            ? 'text-red-400'
                            : isModerateP95
                            ? 'text-amber-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.p95}
                      </span>
                    </td>

                    {/* HTTP Status Code */}
                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded border text-[11px] font-bold ${
                          row.status >= 500
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : row.status >= 400
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {row.status} {row.status >= 500 ? 'ERR' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10 px-5 text-center">
                  <div className="max-w-xs mx-auto text-slate-400 space-y-2">
                    <p className="text-xs">
                      {data.length === 0
                        ? 'No route telemetry recorded for this API yet.'
                        : 'No sub-endpoints match your current filter.'}
                    </p>
                    {data.length > 0 && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedMethod('ALL');
                        }}
                        className="px-3 py-1 rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs transition-colors"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubEndpointBreakdownTable;
