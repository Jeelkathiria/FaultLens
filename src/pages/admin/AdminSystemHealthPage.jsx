import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/admin';
import { getSocket } from '../../services/socket';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { InfrastructureFlow } from '../../components/admin/InfrastructureFlow';
import { LiveEventStream } from '../../components/admin/LiveEventStream';
import {
  Server,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  RefreshCw,
  Cpu
} from 'lucide-react';

export const AdminSystemHealthPage = () => {
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState({
    eventsPerSec: 0,
    queueSize: 0,
    processingLatency: '—',
    systemUptime: '—',
    cpuLoad: '—',
    memoryUsage: '—'
  });
  const [infra, setInfra] = useState({
    queues: [],
    redis: { connected: false },
    workers: [],
    recentEvents: [],
    connectedAdmins: 1
  });
  const [latestEvent, setLatestEvent] = useState(null);
  const [eventStream, setEventStream] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [healthRes, infraRes] = await Promise.allSettled([
        adminService.getSystemHealth(),
        adminService.getInfrastructure()
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value) {
        const res = healthRes.value;
        if (Array.isArray(res.services)) setServices(res.services);
        if (res.systemMetrics) setMetrics(res.systemMetrics);
      }

      if (infraRes.status === 'fulfilled' && infraRes.value) {
        const inf = infraRes.value.data || infraRes.value;
        if (inf) {
          setInfra(inf);
          if (Array.isArray(inf.recentEvents) && inf.recentEvents.length > 0) {
            setEventStream((prev) => {
              if (prev.length === 0) return inf.recentEvents;
              // Merge uniquely by id
              const existingIds = new Set(prev.map((e) => e.id));
              const newItems = inf.recentEvents.filter((e) => !existingIds.has(e.id));
              return [...newItems, ...prev].slice(0, 50);
            });
          }
        }
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load system health or infrastructure data:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    loadData().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    // Real-time WebSocket connection to admin:platform room events
    const socket = getSocket();

    const handleInfraEvent = (ev) => {
      if (!isMounted || !ev) return;
      setLatestEvent(ev);
      setEventStream((prev) => {
        const next = [ev, ...prev.filter((item) => item.id !== ev.id)];
        return next.slice(0, 50);
      });
    };

    const handleInfraMetricsUpdated = (snapshot) => {
      if (!isMounted || !snapshot) return;
      setInfra(snapshot);
      if (Array.isArray(snapshot.recentEvents) && snapshot.recentEvents.length > 0) {
        setEventStream((prev) => {
          const map = new Map();
          [...snapshot.recentEvents, ...prev].forEach((item) => {
            if (item && item.id) map.set(item.id, item);
          });
          return Array.from(map.values()).slice(0, 50);
        });
      }
    };

    if (socket) {
      socket.on('INFRA_EVENT', handleInfraEvent);
      socket.on('INFRA_METRICS_UPDATED', handleInfraMetricsUpdated);
    }

    // Periodic background sync every 12 seconds
    const interval = setInterval(loadData, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) {
        socket.off('INFRA_EVENT', handleInfraEvent);
        socket.off('INFRA_METRICS_UPDATED', handleInfraMetricsUpdated);
      }
    };
  }, [loadData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PLATFORM SELF-OBSERVABILITY
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">FaultLens Internal System Health</h1>
          <p className="text-xs text-slate-400">
            Telemetry cluster nodes, real-time BullMQ queues, in-memory Redis buffers, and live pipeline traces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono text-slate-400 hidden sm:block">
            <span>Last Synced: </span>
            <span className="text-slate-200">{lastRefreshed.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              loadData().finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E2633] bg-[#0F141D] hover:bg-[#151C28] text-xs font-mono text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Top Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Events / Sec"
          value={metrics.eventsPerSec ? metrics.eventsPerSec.toLocaleString() : '0'}
          subtitle="UDP/gRPC edge ingest"
          icon={Activity}
          color="indigo"
        />
        <StatCard
          title="Queue Size"
          value={metrics.queueSize || 0}
          subtitle="Sliding window buffer"
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Processing Latency"
          value={metrics.processingLatency || '—'}
          subtitle="Ingest to metric indexing"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="System Uptime"
          value={metrics.systemUptime || '—'}
          subtitle="Node.js process uptime"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* 1. Live Infrastructure Flow Visualization */}
      <InfrastructureFlow
        latestEvent={latestEvent}
        queues={infra.queues}
        redis={infra.redis}
        workers={infra.workers}
        connectedAdmins={infra.connectedAdmins || 1}
      />

      {/* 2. Real-time Infrastructure Event Stream */}
      <LiveEventStream
        events={eventStream}
        isLive={true}
      />

      {/* 4. Core Microservice Components */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-100">Core Microservice Components</h2>
          <p className="text-xs text-slate-400">Real-time daemon operational status and cluster throughput</p>
        </div>

        {services.length === 0 && isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-xl bg-[#0F141D]">
            Querying cluster microservices...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, idx) => {
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 card-hover-glow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Server className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-100 text-sm">{service.name}</span>
                      </div>
                      <StatusBadge status={service.status} />
                    </div>

                    <p className="text-xs text-slate-400 mb-4">{service.description}</p>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#1E2633] font-mono text-xs my-3">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Latency</div>
                        <div className="font-bold text-slate-200 mt-0.5">{service.latency}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Throughput</div>
                        <div className="font-bold text-emerald-400 mt-0.5">{service.throughput || 'Nominal'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2">
                    <span>Engine: {service.version}</span>
                    <span className="text-emerald-400 font-medium">Uptime: {service.uptime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Process Compute & Memory Load */}
      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Node.js Process Compute & Heap Allocation</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live process telemetry measured directly from the Node.js runtime process
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Node.js Runtime (Internal Pipeline)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* CPU */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Process CPU Usage</span>
              <span className="text-slate-100 font-bold">{metrics.cpuLoad || '—'}</span>
            </div>
            <div className="w-full bg-[#080B12] rounded-full h-2.5 border border-[#1E2633] overflow-hidden">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: metrics.cpuLoad && metrics.cpuLoad.endsWith('%') ? metrics.cpuLoad : '0%' }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Heap Memory Usage</span>
              <span className="text-slate-100 font-bold">{metrics.memoryUsage || '—'}</span>
            </div>
            <div className="w-full bg-[#080B12] rounded-full h-2.5 border border-[#1E2633] overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: metrics.memoryUsage && metrics.memoryUsage.includes('%')
                    ? `${parseInt(metrics.memoryUsage, 10)}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

