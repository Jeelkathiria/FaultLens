import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Activity,
  GitBranch,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export const LiveGlimpseSection = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [simulatedError, setSimulatedError] = useState(12.4);

  const tabs = [
    { id: 'request', label: '01 · Request Trace', icon: Code, badge: 'Sub-second' },
    { id: 'anomaly', label: '02 · Anomaly Math', icon: Sparkles, badge: '4-Sigma' },
    { id: 'diff', label: '03 · Deployment Diff', icon: GitBranch, badge: 'Git Correlator' },
    { id: 'triage', label: '04 · Incident Audit', icon: AlertOctagon, badge: 'Auto-Triage' },
  ];

  return (
    <section id="glimpse" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C] overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-cyan-300 mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>POWERED BY FRAMER MOTION</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4"
          >
            A closer glimpse inside <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-[#00C2CB]">
              real-time telemetry
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-400 leading-relaxed"
          >
            Take an interactive look at the engine. Inspect raw network packets, experiment with statistical thresholds, and trace regression diffs in real time.
          </motion.p>
        </div>

        {/* Interactive Glimpse Frame */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.08] bg-[#0A0E15]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Framer Motion Animated Tab Bar */}
          <div className="flex items-center gap-1.5 p-2 border-b border-white/[0.06] bg-white/[0.02] overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 whitespace-nowrap ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlimpseTab"
                      className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/10 shadow-inner"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-[#00C2CB]' : 'text-slate-500'}`} />
                  <span className="relative z-10">{tab.label}</span>
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded border ${
                    isActive ? 'bg-[#00C2CB]/10 text-[#00C2CB] border-[#00C2CB]/30' : 'bg-white/[0.02] text-slate-500 border-white/[0.04]'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Area with AnimatePresence */}
          <div className="p-6 sm:p-8 min-h-[380px]">
            <AnimatePresence mode="wait">
              {/* TAB 1: REQUEST TRACE GLIMPSE */}
              {activeTab === 'request' && (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        POST 200 OK
                      </span>
                      <span className="text-sm font-mono text-white">/api/v1/checkout/process</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Total Latency: 137ms</span>
                    </div>
                  </div>

                  {/* Latency Waterfall Breakdown */}
                  <div>
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                      Sub-Millisecond Waterfall Timing
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-slate-400 text-[11px]">DNS Resolve</span>
                        <div className="flex-1 bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '4%' }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="bg-cyan-400 h-full rounded-full"
                          />
                        </div>
                        <span className="w-12 text-right text-slate-300 text-[11px]">3ms</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-20 text-slate-400 text-[11px]">TLS Handshake</span>
                        <div className="flex-1 bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '12%' }}
                            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                            className="bg-indigo-400 h-full rounded-full"
                          />
                        </div>
                        <span className="w-12 text-right text-slate-300 text-[11px]">14ms</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-20 text-slate-400 text-[11px]">Server TTFB</span>
                        <div className="flex-1 bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '78%' }}
                            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                            className="bg-[#00C2CB] h-full rounded-full"
                          />
                        </div>
                        <span className="w-12 text-right text-slate-300 text-[11px]">112ms</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-20 text-slate-400 text-[11px]">Transfer</span>
                        <div className="flex-1 bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '6%' }}
                            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                            className="bg-emerald-400 h-full rounded-full"
                          />
                        </div>
                        <span className="w-12 text-right text-slate-300 text-[11px]">8ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Header & Payload Preview */}
                  <div className="p-4 rounded-xl bg-[#06080C] border border-white/[0.06] text-xs font-mono text-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Decrypted Payload Summary</div>
                    <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto">
{`{
  "status": "success",
  "route": "/api/v1/checkout/process",
  "client_ip": "198.51.100.24",
  "tls_version": "TLSv1.3",
  "http_protocol": "h2",
  "correlation_id": "fl-req-8842b109"
}`}
                    </pre>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: ANOMALY MATH GLIMPSE */}
              {activeTab === 'anomaly' && (
                <motion.div
                  key="anomaly"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Interactive 4-Sigma Deviation Simulator
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Drag the slider to test how the statistical engine triggers anomalies dynamically.
                      </p>
                    </div>

                    <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                      simulatedError > 3.5
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {simulatedError > 3.5 ? '● ANOMALY BREACH' : '● WITHIN 3σ BASELINE'}
                    </div>
                  </div>

                  {/* Interactive Slider */}
                  <div className="p-5 rounded-xl bg-[#06080C] border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Simulate Error Rate Shift:</span>
                      <span className="text-lg font-bold text-white">{simulatedError.toFixed(1)}%</span>
                    </div>

                    <input
                      type="range"
                      min="0.5"
                      max="20.0"
                      step="0.1"
                      value={simulatedError}
                      onChange={(e) => setSimulatedError(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00C2CB]"
                    />

                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>0.5% (Normal)</span>
                      <span>Baseline SLA: 2.0%</span>
                      <span>10.0% (Severe)</span>
                      <span>20.0% (Outage)</span>
                    </div>
                  </div>

                  {/* Math Formula Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="text-slate-500 text-[10px]">BASELINE μ</div>
                      <div className="text-white font-bold mt-0.5">1.14%</div>
                      <div className="text-[10px] text-slate-500">7-day weighted mean</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="text-slate-500 text-[10px]">STANDARD DEVIATION σ</div>
                      <div className="text-white font-bold mt-0.5">0.24%</div>
                      <div className="text-[10px] text-slate-500">Learned variance</div>
                    </div>

                    <div className={`p-3 rounded-lg border transition-colors ${
                      simulatedError > 3.5 ? 'bg-red-500/[0.05] border-red-500/30' : 'bg-white/[0.02] border-white/[0.04]'
                    }`}>
                      <div className={`text-[10px] ${simulatedError > 3.5 ? 'text-red-400' : 'text-slate-500'}`}>
                        Z-SCORE DEVIATION
                      </div>
                      <div className={`text-base font-bold mt-0.5 ${simulatedError > 3.5 ? 'text-red-400' : 'text-white'}`}>
                        {((simulatedError - 1.14) / 0.24).toFixed(1)}σ
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {simulatedError > 3.5 ? 'Threshold > 4.0σ tripped' : 'Normal safe bounds'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: DEPLOYMENT DIFF GLIMPSE */}
              {activeTab === 'diff' && (
                <motion.div
                  key="diff"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <GitBranch className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-semibold">commit #8f92a1</span>
                      <span className="text-slate-500">by</span>
                      <span className="text-slate-300">@jeel</span>
                      <span className="text-slate-500">· 6m before incident</span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      DEPLOYMENT CORRELATION MATCH (94.2%)
                    </span>
                  </div>

                  {/* Git Diff Code Viewer */}
                  <div className="rounded-xl bg-[#06080C] border border-white/[0.06] p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                    <div className="text-slate-500 text-[11px] pb-2 border-b border-white/[0.04] mb-2">
                      diff --git a/services/payment/client.ts b/services/payment/client.ts
                    </div>
                    <div className="text-slate-400">@@ -42,7 +42,7 @@ export class StripeClient &#123;</div>
                    <div className="text-slate-400">&nbsp;  const httpConfig = &#123;</div>
                    <div className="text-red-400 bg-red-950/20 px-1 py-0.5 rounded -mx-1">
                      -    timeoutMs: 5000, // 5 second gateway grace period
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded -mx-1">
                      +    timeoutMs: 500,  // Aggressive timeout (caused 504 drops!)
                    </div>
                    <div className="text-slate-400">&nbsp;    retries: 2</div>
                    <div className="text-slate-400">&nbsp;  &#125;;</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300 flex items-center justify-between">
                    <span>Identified Cause: Premature socket termination on slow payment webhook responses.</span>
                    <span className="text-cyan-400 font-mono text-[11px]">Regression resolved</span>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: INCIDENT AUDIT GLIMPSE */}
              {activeTab === 'triage' && (
                <motion.div
                  key="triage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-red-400 uppercase">
                        INCIDENT #1042 AUDIT TIMELINE
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Target: Payment Service</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 text-[11px] w-16 shrink-0">12:30:14</span>
                      <div className="flex-1">
                        <span className="text-white font-medium">Deployment v1.8 Completed</span>
                        <span className="text-slate-500 text-[10px] block">Pipeline release pushed to us-east-1 production cluster</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Git Tag</span>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 text-[11px] w-16 shrink-0">12:34:20</span>
                      <div className="flex-1">
                        <span className="text-amber-400 font-medium">Latency Drift Observed</span>
                        <span className="text-slate-500 text-[10px] block">P95 climbs to 742ms (+303% shift above 184ms baseline)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Metric</span>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/30">
                      <span className="text-red-400 text-[11px] w-16 shrink-0">12:36:02</span>
                      <div className="flex-1">
                        <span className="text-red-300 font-medium">Incident Declared & Alert Dispatched</span>
                        <span className="text-slate-400 text-[10px] block">Correlated with Deployment v1.8 · Dispatched to On-Call SRE</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">PagerDuty</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar */}
          <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2CB]" />
              <span>FaultLens Telemetry Engine</span>
            </span>
            <span className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
              <span>Inspect live cluster</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
