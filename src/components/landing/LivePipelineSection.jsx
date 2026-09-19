import React, { useState } from 'react';
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
  ShieldCheck,
  Terminal,
  Zap
} from 'lucide-react';

export const LivePipelineSection = () => {
  const [selectedStage, setSelectedStage] = useState('bullmq');

  const pipelineStages = [
    {
      id: 'ingest',
      number: '01',
      title: 'Edge Ingest & Probes',
      icon: Globe,
      color: 'indigo',
      shortDesc: 'Automated HTTP/HTTPS health checks and client SDK telemetry ingestion.',
      detail: {
        protocol: 'HTTP/1.1 & HTTPS TLS Handshake',
        throughput: 'Sub-second probe execution',
        verification: 'Expected status code, reachability, timeout & SSL certificate expiration',
        codeSnippet: `POST /api/v1/telemetry HTTP/1.1\nHost: api.faultlens.dev\nX-API-Key: fl_live_...\n{\n  "apiId": "api-payments",\n  "statusCode": 200,\n  "responseTime": 42\n}`
      }
    },
    {
      id: 'redis',
      number: '02',
      title: 'Redis Fast Memory',
      icon: Activity,
      color: 'amber',
      shortDesc: 'Ultra-low latency sliding window buffer and pub/sub distributor.',
      detail: {
        engine: 'Redis 7.2 In-Memory Datastore',
        latency: '< 1ms TCP roundtrip',
        caching: 'Sliding window metric buffers & active state invalidation',
        codeSnippet: `REDIS INFO keyspace:\nused_memory: 12.4M\nconnected_clients: 8\ninstantaneous_ops_per_sec: 14\nkeyspace_hit_ratio: 98.6%`
      }
    },
    {
      id: 'bullmq',
      number: '03',
      title: 'BullMQ Queues',
      icon: Layers,
      color: 'purple',
      shortDesc: 'Distributed background job queues for probes, metrics, and anomaly checks.',
      detail: {
        queues: 'website-health-check, api-health-check, metric-aggregation, anomaly-detection',
        concurrency: 'Deterministic worker concurrency',
        resilience: 'Automatic retry backoff with audit failure tracking',
        codeSnippet: `const { Queue } = require('bullmq');\nconst healthQueue = new Queue('website-health-check', {\n  connection: redisConfig\n});\nawait healthQueue.add('check', { websiteId });`
      }
    },
    {
      id: 'workers',
      number: '04',
      title: 'Node.js Workers',
      icon: Cpu,
      color: 'cyan',
      shortDesc: 'Dedicated event-loop background processors executing probes and baselines.',
      detail: {
        runtime: 'Node.js LTS (V8 Engine)',
        lifecycle: 'Event-driven active, completed, and failed telemetry hooks',
        telemetry: 'Real heap allocation and CPU load monitoring',
        codeSnippet: `worker.on('completed', (job) => {\n  emitInfraEvent({\n    stage: 'WORKER',\n    label: \`Worker completed job #\${job.id}\`,\n    status: 'success'\n  });\n});`
      }
    },
    {
      id: 'processing',
      number: '05',
      title: '2.5σ Baseline Engine',
      icon: Zap,
      color: 'blue',
      shortDesc: 'Real-time statistical evaluation against 30-measurement historical baselines.',
      detail: {
        algorithm: 'Dynamic Mean (μ) & Standard Deviation (σ)',
        trigger: 'Latency > 2.5σ with 50ms buffer to eliminate false alarms',
        healthStatus: 'UP (nominal) → DEGRADED (abnormal latency) → DOWN (failure)',
        codeSnippet: `const isDegraded = (latency - mean) > 2.5 * stdDev;\nif (isDegraded) {\n  status = 'DEGRADED';\n  triggerIncidentIfConsecutive();\n}`
      }
    },
    {
      id: 'database',
      number: '06',
      title: 'MongoDB Datastore',
      icon: Database,
      color: 'emerald',
      shortDesc: 'Permanent persistence for multi-tenant accounts, metrics, logs, and incidents.',
      detail: {
        store: 'MongoDB Document Cluster',
        isolation: 'Strict User → Website → API → Metric ownership enforcement',
        retention: 'Automated 24h rolling aggregations and raw telemetry cleanup',
        codeSnippet: `await db.websiteCheck.create({\n  data: { websiteId, status, statusCode, responseTime, sslValid }\n});`
      }
    },
    {
      id: 'websocket',
      number: '07',
      title: 'WebSocket Broadcast',
      icon: Wifi,
      color: 'rose',
      shortDesc: 'Sub-10ms real-time event dispatching into isolated tenant rooms.',
      detail: {
        transport: 'Socket.IO Engine with JWT Authentication',
        rooms: 'user:{id} for developers, admin:platform for admin overview',
        privacy: 'Zero cross-tenant leakage; developers only receive their own events',
        codeSnippet: `io.to(\`user:\${website.userId}\`).emit('WEBSITE_HEALTH_UPDATED', {\n  healthStatus, responseTime, statusCode\n});`
      }
    }
  ];

  const currentStage = pipelineStages.find((s) => s.id === selectedStage) || pipelineStages[2];

  return (
    <section id="pipeline" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/[0.02] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>100% TRUE OBSERVABILITY PIPELINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Real telemetry in motion. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-200 to-emerald-300">
              Zero fake data. Zero synthetic fallbacks.
            </span>
          </h2>

          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            FaultLens never generates synthetic or fallback metrics. Every displayed number traces directly to a real network probe, MongoDB record, or Node.js runtime measurement.
          </p>
        </div>

        {/* 7-Stage Horizontal Pipeline Flow Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-10">
          {pipelineStages.map((stage) => {
            const isSelected = selectedStage === stage.id;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`relative p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-white/[0.06] shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-white/[0.06] bg-[#0A0E15] hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono text-slate-500">{stage.number}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <div className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Deep-Dive Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0A0E15] p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Explanations & Properties */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">
                <span>PIPELINE STAGE {currentStage.number}</span>
                <span>·</span>
                <span>PRODUCTION ARCHITECTURE</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                {currentStage.title}
              </h3>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {currentStage.shortDesc}
              </p>

              <div className="space-y-3 font-mono text-xs border-y border-white/[0.06] py-4 my-4">
                {Object.entries(currentStage.detail).map(([key, val]) => {
                  if (key === 'codeSnippet') return null;
                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="text-slate-500 uppercase text-[10px]">{key}:</span>
                      <span className="text-slate-200 font-medium text-right">{val}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Enforced with multi-tenant tenant isolation</span>
              </div>
            </div>

            {/* Right: Technical Code Implementation Snippet */}
            <div className="rounded-xl border border-white/[0.08] bg-[#06080C] p-5 font-mono text-xs overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-[11px] text-slate-500 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>backend/src/pipeline/{currentStage.id}.engine.js</span>
                </div>
                <span className="text-emerald-400">LIVE</span>
              </div>

              <pre className="text-slate-300 overflow-x-auto leading-relaxed text-[11px]">
                <code>{currentStage.detail.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
