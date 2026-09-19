import React, { useState } from 'react';
import {
  Terminal,
  Pause,
  Play,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';

export const LiveEventStream = ({ events = [], isLive = true }) => {
  const [filterStage, setFilterStage] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);

  const stages = ['ALL', 'INGEST', 'QUEUE', 'WORKER', 'PROCESSING', 'DATABASE', 'WEBSOCKET'];

  const filteredEvents = events.filter((ev) => {
    if (filterStage === 'ALL') return true;
    return ev.stage === filterStage;
  });

  const getStageBadgeStyle = (stage) => {
    switch (stage) {
      case 'INGEST':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'REDIS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'QUEUE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'WORKER':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DATABASE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'WEBSOCKET':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusDot = (status) => {
    if (status === 'error' || status === 'failed') {
      return <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />;
    }
    if (status === 'active' || status === 'waiting') {
      return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />;
    }
    return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />;
  };

  const formatTimestamp = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    } catch (_) {
      return ts || '—';
    }
  };

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2633] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400">
              AUDIT TRAIL & TRACES
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {isPaused ? 'PAUSED' : 'LIVE STREAM'}
            </div>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Real-time Infrastructure Event Stream</h2>
          <p className="text-xs text-slate-400">
            Chronological log of real HTTP ingests, BullMQ queue transitions, worker tasks, and WebSocket pushes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isPaused
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-[#080B12] border-[#1E2633] hover:border-slate-600 text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Stage Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {stages.map((stage) => {
          const isSelected = filterStage === stage;
          return (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-[#080B12] text-slate-400 hover:text-slate-200 border border-[#1E2633]'
              }`}
            >
              {stage}
            </button>
          );
        })}
      </div>

      {/* Stream List */}
      <div className="rounded-xl border border-[#1E2633] bg-[#080B12] overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-1">
            <Radio className="w-5 h-5 mx-auto text-slate-600 mb-2" />
            <div>Waiting for live infrastructure activity...</div>
            <div className="text-[11px] text-slate-600">
              Only genuine backend probes, API telemetry, BullMQ jobs, and WebSocket broadcasts will appear here.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2633]/60 max-h-[420px] overflow-y-auto">
            {filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const hasDetails = ev.details && Object.keys(ev.details).length > 0;

              return (
                <div key={ev.id} className="p-3 hover:bg-[#0F141D] transition-colors">
                  <div
                    onClick={() => hasDetails && setExpandedEventId(isExpanded ? null : ev.id)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                      hasDetails ? 'cursor-pointer select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getStatusDot(ev.status)}
                      <span className="text-slate-500 text-[11px] flex-shrink-0">
                        {formatTimestamp(ev.timestamp)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${getStageBadgeStyle(ev.stage)}`}>
                        {ev.stage}
                      </span>
                      <span className="text-slate-200 truncate">
                        {ev.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-slate-500 text-[11px]">
                      {ev.type && <span className="text-slate-400">{ev.type}</span>}
                      {hasDetails && (
                        <span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-2 p-2.5 rounded bg-[#05070B] border border-[#1E2633] text-[11px] font-mono text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
