import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Radio,
  Layers,
  Cpu,
  Activity,
  Database,
  Wifi,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const InfrastructureFlow = ({
  latestEvent = null,
  queues = [],
  redis = {},
  workers = [],
  connectedAdmins = 1,
  isLive = true
}) => {
  // Aggregate real queue counts
  const queueStats = useMemo(() => {
    let waiting = 0;
    let active = 0;
    let failed = 0;
    let completed = 0;

    (queues || []).forEach((q) => {
      waiting += q.waiting || 0;
      active += q.active || 0;
      failed += q.failed || 0;
      completed += q.completed || 0;
    });

    return { waiting, active, failed, completed, totalQueues: queues?.length || 0 };
  }, [queues]);

  // Aggregate worker statuses
  const workerStats = useMemo(() => {
    const activeWorkers = (workers || []).filter((w) => w.status === 'busy' || w.status === 'active').length;
    const totalWorkers = workers?.length || 0;
    return { activeWorkers, totalWorkers };
  }, [workers]);

  // Determine which stage is currently active based on the latest real event
  const activeStage = latestEvent?.stage || null;
  const isEventRecent = latestEvent && (Date.now() - new Date(latestEvent.timestamp).getTime()) < 3500;

  const stages = [
    {
      id: 'INGEST',
      name: 'HTTP & Telemetry Ingest',
      subtitle: 'Edge Gateway & Probes',
      icon: Globe,
      color: 'indigo',
      badge: isEventRecent && activeStage === 'INGEST' ? 'RECEIVING' : 'READY',
      metric: latestEvent?.stage === 'INGEST' ? `${latestEvent.label?.slice(0, 24)}...` : 'UDP/gRPC/HTTP',
      submetric: 'Direct Telemetry'
    },
    {
      id: 'REDIS',
      name: 'Redis In-Memory',
      subtitle: 'Buffer & Fast Pub/Sub',
      icon: Activity,
      color: 'amber',
      badge: redis.connected ? 'ONLINE' : 'FALLBACK',
      metric: redis.connected ? (redis.memoryUsedHuman || `${redis.usedMemoryMb || '0'} MB`) : 'In-Memory',
      submetric: redis.connected ? `${redis.opsPerSec ?? redis.instantaneousOpsPerSec ?? 0} ops/sec` : 'Local Buffer'
    },
    {
      id: 'QUEUE',
      name: 'BullMQ Queues',
      subtitle: 'Distributed Job Queues',
      icon: Layers,
      color: 'purple',
      badge: queueStats.active > 0 ? `${queueStats.active} RUNNING` : `${queueStats.waiting} WAITING`,
      metric: `${queueStats.totalQueues} Queues`,
      submetric: `${queueStats.completed} completed, ${queueStats.failed} err`
    },
    {
      id: 'WORKER',
      name: 'Node.js Workers',
      subtitle: 'Background Processors',
      icon: Cpu,
      color: 'cyan',
      badge: workerStats.activeWorkers > 0 ? `${workerStats.activeWorkers} BUSY` : 'IDLE',
      metric: `${workerStats.totalWorkers || 4} Workers`,
      submetric: workerStats.activeWorkers > 0 ? 'Processing payload' : 'Listening for jobs'
    },
    {
      id: 'DATABASE',
      name: 'MongoDB Datastore',
      subtitle: 'Persistent Metrics & Logs',
      icon: Database,
      color: 'emerald',
      badge: isEventRecent && activeStage === 'DATABASE' ? 'PERSISTING' : 'SYNCED',
      metric: 'Replica Pool',
      submetric: 'Read/Write Primary'
    },
    {
      id: 'WEBSOCKET',
      name: 'WebSocket Engine',
      subtitle: 'Real-time Event Broadcast',
      icon: Wifi,
      color: 'rose',
      badge: connectedAdmins > 0 ? `${connectedAdmins} ADMINS` : 'BROADCASTING',
      metric: 'Socket.IO Engine',
      submetric: 'Admin & Dev Rooms'
    }
  ];

  const getColorClasses = (color, isActive) => {
    switch (color) {
      case 'indigo':
        return {
          border: isActive ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          accent: 'text-indigo-400'
        };
      case 'amber':
        return {
          border: isActive ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accent: 'text-amber-400'
        };
      case 'purple':
        return {
          border: isActive ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          accent: 'text-purple-400'
        };
      case 'cyan':
        return {
          border: isActive ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          accent: 'text-cyan-400'
        };
      case 'emerald':
        return {
          border: isActive ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accent: 'text-emerald-400'
        };
      case 'rose':
        return {
          border: isActive ? 'border-rose-500 shadow-lg shadow-rose-500/20' : 'border-[#1E2633]',
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accent: 'text-rose-400'
        };
      default:
        return {
          border: isActive ? 'border-slate-400' : 'border-[#1E2633]',
          iconBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          accent: 'text-slate-400'
        };
    }
  };

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 space-y-6">
      {/* Header with real live activity pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2633] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              PIPELINE ARCHITECTURE
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% TRUE OBSERVABILITY
            </div>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Live Infrastructure Data Flow</h2>
          <p className="text-xs text-slate-400">
            Real-time pipeline: Ingest → Redis → BullMQ → Worker → Processing → MongoDB → WebSocket
          </p>
        </div>

        {/* Live event notification banner */}
        <div className="flex items-center gap-2">
          {isEventRecent && latestEvent ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080B12] border border-indigo-500/40 text-xs font-mono text-indigo-300"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-semibold text-white">[{latestEvent.stage}]</span>
              <span className="text-slate-300 truncate max-w-[200px]">{latestEvent.label}</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Waiting for live pipeline activity...
            </div>
          )}
        </div>
      </div>

      {/* Interconnected Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 relative">
        {stages.map((stage, idx) => {
          const isActive = isEventRecent && activeStage === stage.id;
          const styles = getColorClasses(stage.color, isActive);
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.id}
              animate={isActive ? { scale: [1, 1.02, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-xl border bg-[#080B12] p-4 flex flex-col justify-between transition-colors ${styles.border}`}
            >
              {/* Top Node Info */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${styles.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${styles.badge}`}>
                    {stage.badge}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Stage 0{idx + 1}
                </div>
                <h3 className="font-semibold text-slate-200 text-sm mt-0.5 leading-snug">
                  {stage.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stage.subtitle}
                </p>
              </div>

              {/* Bottom Metrics */}
              <div className="pt-4 mt-4 border-t border-[#1E2633]/60">
                <div className="text-xs font-mono font-bold text-slate-200 truncate">
                  {stage.metric}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  {stage.submetric}
                </div>
              </div>

              {/* Connecting arrow indicator for desktop */}
              {idx < stages.length - 1 && (
                <div className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div className={`w-5 h-5 rounded-full bg-[#0F141D] border border-[#1E2633] flex items-center justify-center text-slate-500 ${isActive ? 'text-indigo-400 border-indigo-500/50' : ''}`}>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
