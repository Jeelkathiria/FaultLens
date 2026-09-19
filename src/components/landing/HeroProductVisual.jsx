import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  GitCommit,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Layers,
  ChevronRight,
  Pause,
  Play
} from 'lucide-react';

export const HeroProductVisual = () => {
  const [stage, setStage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // 6-Stage sequence: 1 Normal -> 2 Surge -> 3 Anomaly -> 4 Incident -> 5 Correlate -> 1 Reset
  useEffect(() => {
    if (isPaused) return;
    const duration = stage === 5 ? 6500 : 4500;
    const timer = setTimeout(() => {
      setStage((prev) => (prev >= 5 ? 1 : prev + 1));
    }, duration);
    return () => clearTimeout(timer);
  }, [stage, isPaused]);

  const stages = [
    {
      id: 1,
      label: 'Normal',
      requests: '18.4K',
      requestsChange: '+2.1%',
      errorRate: '1.1%',
      latency: '162ms',
      uptime: '99.98%',
      statusText: 'All systems operational',
      paymentStatus: 'Healthy',
      paymentBadge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      anomaly: false,
      incident: false,
      correlated: false,
    },
    {
      id: 2,
      label: 'Surge',
      requests: '24.8K',
      requestsChange: '+34.8%',
      errorRate: '1.4%',
      latency: '198ms',
      uptime: '99.96%',
      statusText: 'Traffic increasing (+34%)',
      paymentStatus: 'Healthy',
      paymentBadge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      anomaly: false,
      incident: false,
      correlated: false,
    },
    {
      id: 3,
      label: 'Anomaly',
      requests: '26.2K',
      requestsChange: '+42.0%',
      errorRate: '12.4%',
      latency: '680ms',
      uptime: '99.82%',
      statusText: 'Anomaly: 2.5σ baseline breach',
      paymentStatus: 'Degraded',
      paymentBadge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      anomaly: true,
      incident: false,
      correlated: false,
    },
    {
      id: 4,
      label: 'Incident',
      requests: '25.9K',
      requestsChange: '+40.8%',
      errorRate: '14.8%',
      latency: '742ms',
      uptime: '99.40%',
      statusText: 'Critical incident #1042 declared',
      paymentStatus: 'Critical',
      paymentBadge: 'text-red-400 bg-red-500/10 border-red-500/20',
      anomaly: true,
      incident: true,
      correlated: false,
    },
    {
      id: 5,
      label: 'Correlate',
      requests: '25.5K',
      requestsChange: '+38.5%',
      errorRate: '14.2%',
      latency: '715ms',
      uptime: '99.38%',
      statusText: 'Correlated with Deploy v1.8 (6m ago)',
      paymentStatus: 'Critical',
      paymentBadge: 'text-red-400 bg-red-500/10 border-red-500/20',
      anomaly: true,
      incident: true,
      correlated: true,
    }
  ];

  const current = stages.find((s) => s.id === stage) || stages[0];

  return (
    <div
      className="relative w-full max-w-5xl mx-auto mt-14 text-left select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Console Frame */}
      <div className="relative rounded-xl border border-white/[0.08] bg-[#0A0E15]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
        
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>

            <div className="h-3.5 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300 font-medium">
                faultlens // live telemetry
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
          </div>

          {/* Right Status Indicator & Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${stage >= 4 ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className={stage >= 4 ? 'text-red-400 font-medium' : 'text-slate-300'}>
                {current.statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Stage Selector Bar */}
        <div className="px-4 sm:px-6 py-2 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1 hidden sm:inline">Story:</span>
            {stages.map((s) => {
              const isActive = s.id === stage;
              return (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black font-semibold'
                      : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black' : 'bg-slate-600'}`} />
                  <span>0{s.id} {s.label}</span>
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden md:inline">Auto-cycle: {stage}/5</span>
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Clean 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-mono">REQUESTS</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {current.requests}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {current.requestsChange}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 12 endpoints</div>
            </div>

            <div className={`p-3.5 rounded-lg border transition-colors ${
              stage >= 3 ? 'bg-red-500/[0.04] border-red-500/30' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className={`text-[11px] font-mono ${stage >= 3 ? 'text-red-400' : 'text-slate-400'}`}>
                ERROR RATE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl sm:text-2xl font-bold font-mono ${stage >= 3 ? 'text-red-400' : 'text-white'}`}>
                  {current.errorRate}
                </span>
              </div>
              <div className={`text-[10px] mt-0.5 ${stage >= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                {stage >= 3 ? 'Baseline 1.1% exceeded' : 'Baseline 1.1%'}
              </div>
            </div>

            <div className={`p-3.5 rounded-lg border transition-colors ${
              stage >= 3 ? 'bg-amber-500/[0.04] border-amber-500/30' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className={`text-[11px] font-mono ${stage >= 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                P95 LATENCY
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl sm:text-2xl font-bold font-mono ${stage >= 3 ? 'text-amber-400' : 'text-white'}`}>
                  {current.latency}
                </span>
              </div>
              <div className={`text-[10px] mt-0.5 ${stage >= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                {stage >= 3 ? 'Spike detected' : 'Target < 200ms'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-mono">AVG UPTIME</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {current.uptime}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Rolling 30-day SLA</div>
            </div>
          </div>

          {/* SVG Telemetry Chart */}
          <div className="rounded-lg border border-white/[0.06] bg-[#06080C]/80 p-4 sm:p-5 relative">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-slate-300 font-medium">API LATENCY TELEMETRY</span>
              {stage >= 3 && (
                <span className="text-xs font-mono text-red-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  ANOMALY DETECTED: 2.5σ BASELINE BREACH
                </span>
              )}
            </div>

            <div className="h-44 sm:h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 160">
                <defs>
                  <linearGradient id="cleanAreaNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="cleanAreaSpike" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Subtle baseline dashed envelope */}
                <path
                  d="M 0 120 C 100 116, 200 124, 300 118 C 400 122, 500 117, 600 120"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Dynamic Curves */}
                {stage <= 2 ? (
                  <>
                    <path
                      d={stage === 1
                        ? "M 0 122 Q 60 116, 120 124 T 240 118 T 360 120 T 480 119 T 600 121 L 600 160 L 0 160 Z"
                        : "M 0 122 Q 60 110, 120 102 T 240 92 T 360 84 T 480 80 T 600 76 L 600 160 L 0 160 Z"
                      }
                      fill="url(#cleanAreaNormal)"
                    />
                    <path
                      d={stage === 1
                        ? "M 0 122 Q 60 116, 120 124 T 240 118 T 360 120 T 480 119 T 600 121"
                        : "M 0 122 Q 60 110, 120 102 T 240 92 T 360 84 T 480 80 T 600 76"
                      }
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d="M 0 122 Q 60 118, 120 120 T 200 115 Q 260 110, 310 32 Q 350 20, 390 28 Q 440 38, 490 35 T 600 30 L 600 160 L 0 160 Z"
                      fill="url(#cleanAreaSpike)"
                    />
                    <path
                      d="M 0 122 Q 60 118, 120 120 T 200 115 Q 260 110, 310 32 Q 350 20, 390 28 Q 440 38, 490 35 T 600 30"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                    />
                    {/* Spike Marker */}
                    <g transform="translate(340, 22)">
                      <line x1="0" y1="0" x2="0" y2="135" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <circle cx="0" cy="0" r="4" fill="#EF4444" />
                      <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
                    </g>
                  </>
                )}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/[0.04]">
              <span>12:30:00</span>
              <span>12:32:00</span>
              <span>12:34:00 (Traffic)</span>
              <span className={stage >= 3 ? 'text-red-400' : ''}>12:36:00 (Spike)</span>
              <span>12:38:00</span>
            </div>
          </div>

          {/* Bottom Split: APIs & Correlation Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Monitored APIs */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Monitored APIs
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04] text-xs font-mono">
                <span className="text-slate-200">Payment API (/checkout)</span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${current.paymentBadge}`}>
                  {current.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04] text-xs font-mono">
                <span className="text-slate-200">Orders API (/orders)</span>
                <span className="px-2 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04] text-xs font-mono">
                <span className="text-slate-200">Auth API (/auth/jwt)</span>
                <span className="px-2 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  Healthy
                </span>
              </div>
            </div>

            {/* Correlation & Incident Feed */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Incident & Deployment Linkage
                </div>

                {stage < 4 && (
                  <div className="text-xs text-slate-400 font-mono py-2 space-y-1">
                    <div className="text-emerald-400">● Telemetry within baseline</div>
                    <div className="text-[11px] text-slate-500">No active incidents or deployment regressions detected.</div>
                  </div>
                )}

                {stage === 4 && (
                  <div className="p-2.5 rounded bg-red-500/[0.06] border border-red-500/20 text-xs font-mono space-y-1">
                    <div className="text-red-400 font-semibold">● INCIDENT #1042 DECLARED</div>
                    <div className="text-slate-300 text-[11px]">Payment API error rate 14.8% exceeded baseline 1.1%</div>
                  </div>
                )}

                {stage === 5 && (
                  <div className="p-2.5 rounded bg-emerald-500/[0.05] border border-emerald-500/20 text-xs font-mono space-y-1.5">
                    <div className="text-emerald-400 font-semibold flex items-center gap-1">
                      <GitCommit className="w-3.5 h-3.5 text-amber-300" />
                      <span>Deployment v1.8 Correlated (6m ago)</span>
                    </div>
                    <div className="text-slate-400 text-[10px] space-y-0.5 border-l border-emerald-500/30 pl-2">
                      <div>12:30 Deploy v1.8 (Payment Service)</div>
                      <div>12:34 Latency increased (+360%)</div>
                      <div>12:36 Anomaly & incident triggered</div>
                    </div>
                    <div className="text-amber-300 text-[11px] font-sans pt-0.5">
                      Potential deployment correlation detected
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-white/[0.04] mt-2">
                Engine: 4-sigma EWMA baseline profiler
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
