import React from 'react';
import {
  Activity,
  HardDrive,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';

export const RedisHealthPanel = ({ redis = {} }) => {
  const isConnected = !!redis.connected;

  const metrics = [
    {
      label: 'Memory Allocation',
      value: isConnected ? (redis.memoryUsedHuman || `${redis.usedMemoryMb || '0'} MB`) : 'In-Memory',
      sub: isConnected ? (redis.maxMemoryHuman ? `Max: ${redis.maxMemoryHuman}` : `Peak: ${redis.usedMemoryPeakMb || '0'} MB`) : 'Local memory pool',
      icon: HardDrive,
      color: 'amber'
    },
    {
      label: 'Connected Clients',
      value: isConnected ? (redis.connectedClients ?? 1) : 1,
      sub: isConnected ? 'Active connection pool' : 'Local process client',
      icon: Users,
      color: 'indigo'
    },
    {
      label: 'Instantaneous Ops/sec',
      value: isConnected ? (redis.opsPerSec ?? redis.instantaneousOpsPerSec ?? 0) : 0,
      sub: 'Commands per second',
      icon: Zap,
      color: 'emerald'
    },
    {
      label: 'Ping Roundtrip Latency',
      value: (redis.latencyMs !== null && redis.latencyMs !== undefined)
        ? `${redis.latencyMs}ms`
        : (redis.pingLatencyMs !== null && redis.pingLatencyMs !== undefined)
          ? `${redis.pingLatencyMs}ms`
          : '—',
      sub: 'TCP round-trip latency',
      icon: Clock,
      color: 'cyan'
    },
    {
      label: 'Cache Hit Ratio',
      value: isConnected && redis.hitRatio !== null && redis.hitRatio !== undefined ? `${redis.hitRatio}%` : '—',
      sub: 'Keyspace hits vs misses',
      icon: CheckCircle2,
      color: 'emerald'
    },
    {
      label: 'Redis Process Uptime',
      value: isConnected
        ? (redis.uptimeHuman || (redis.uptimeDays !== null && redis.uptimeDays !== undefined ? `${redis.uptimeDays}d` : 'Online'))
        : 'Local',
      sub: isConnected ? `Version: ${redis.version || 'Redis'}` : 'In-Memory Mode',
      icon: Server,
      color: 'slate'
    }
  ];

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2633] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
              IN-MEMORY TELEMETRY
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {isConnected ? 'REDIS CONNECTED' : 'IN-MEMORY FALLBACK'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Redis In-Memory & Queue Engine</h2>
          <p className="text-xs text-slate-400">
            Real Redis INFO statistics parsed directly from the live connection.
          </p>
        </div>

        <div className="text-right font-mono text-xs text-slate-400">
          <div>Engine: <span className="text-slate-200 font-semibold">{redis.version || 'In-Memory Fallback'}</span></div>
          <div className="text-[11px] text-slate-500">
            Total Commands: <span className="text-slate-300">{redis.totalCommandsProcessed?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-[#1E2633] bg-[#080B12] p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider truncate">
                  {m.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              </div>

              <div>
                <div className="text-lg font-mono font-bold text-white">{m.value}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
