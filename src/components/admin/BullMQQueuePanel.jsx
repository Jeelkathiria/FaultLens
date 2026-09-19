import React, { useState } from 'react';
import { adminService } from '../../services/admin';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';

export const BullMQQueuePanel = ({ queues = [], onRefresh }) => {
  const [expandedQueue, setExpandedQueue] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState(null);

  const handleToggleExpand = async (queueName) => {
    if (expandedQueue === queueName) {
      setExpandedQueue(null);
      setJobs([]);
      return;
    }

    setExpandedQueue(queueName);
    setLoadingJobs(true);
    setJobError(null);
    try {
      const res = await adminService.getQueueJobs(queueName);
      if (res && res.data) {
        setJobs(res.data);
      } else if (Array.isArray(res)) {
        setJobs(res);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Failed to load queue jobs:', err);
      setJobError(err.response?.data?.message || err.message);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const getStatusBadge = (queue) => {
    if (queue.active > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (queue.waiting > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          QUEUED ({queue.waiting})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
        IDLE
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2633] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-purple-400">
              DISTRIBUTED WORKERS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BULLMQ & REDIS
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Background Queue Pipeline</h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry and health check job processors. Click any queue to inspect real jobs.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E2633] hover:border-slate-600 bg-[#080B12] text-xs font-mono text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>

      {queues.length === 0 ? (
        <div className="p-8 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#080B12]">
          No active BullMQ queues registered or Redis in-memory mode active.
        </div>
      ) : (
        <div className="space-y-3">
          {queues.map((q) => {
            const isExpanded = expandedQueue === q.name;
            return (
              <div
                key={q.name}
                className="rounded-xl border border-[#1E2633] bg-[#080B12] overflow-hidden transition-colors hover:border-slate-700"
              >
                {/* Queue Summary Header */}
                <div
                  onClick={() => handleToggleExpand(q.name)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200 text-sm">{q.name}</span>
                        {getStatusBadge(q)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Worker concurrency: 1 | Job retention: Automatic cleanup
                      </p>
                    </div>
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F141D] border border-[#1E2633]">
                      <span className="text-slate-500">Wait:</span>
                      <span className={`font-bold ${q.waiting > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {q.waiting || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F141D] border border-[#1E2633]">
                      <span className="text-slate-500">Active:</span>
                      <span className={`font-bold ${q.active > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {q.active || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F141D] border border-[#1E2633]">
                      <span className="text-slate-500">Done:</span>
                      <span className="font-bold text-slate-300">{q.completed || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F141D] border border-[#1E2633]">
                      <span className="text-slate-500">Fail:</span>
                      <span className={`font-bold ${q.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {q.failed || 0}
                      </span>
                    </div>

                    <div className="text-slate-400 pl-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Job Drill-Down */}
                {isExpanded && (
                  <div className="border-t border-[#1E2633] bg-[#0A0D14] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Real Queue Jobs ({jobs.length} loaded)</span>
                      <span className="text-[11px] text-slate-500">Inspecting BullMQ job queue</span>
                    </div>

                    {loadingJobs ? (
                      <div className="p-4 text-center font-mono text-xs text-slate-500">
                        Loading queue jobs...
                      </div>
                    ) : jobError ? (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
                        Failed to fetch jobs: {jobError}
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="p-4 text-center font-mono text-xs text-slate-500 border border-[#1E2633]/60 rounded-lg">
                        ● Queue idle: No waiting, active, or delayed jobs currently in {q.name}.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1E2633]/60 rounded-lg border border-[#1E2633] overflow-hidden">
                        {jobs.map((job) => (
                          <div key={job.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono bg-[#080B12]">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400 font-semibold">#{job.id}</span>
                              <span className="text-slate-200">{job.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                {job.state}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                              {job.timestamp && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {new Date(job.timestamp).toLocaleTimeString()}
                                </span>
                              )}
                              <span>Attempts: {job.attemptsMade || 0}</span>
                              {job.failedReason && (
                                <span className="text-rose-400 truncate max-w-xs">
                                  {job.failedReason}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
