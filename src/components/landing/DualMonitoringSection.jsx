import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Layers,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Zap,
  Lock,
  ExternalLink,
  Code
} from 'lucide-react';

export const DualMonitoringSection = () => {
  const [activeMode, setActiveMode] = useState('both'); // 'both' | 'web-only' | 'web-apis'

  return (
    <section id="dual-monitoring" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/[0.02] blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>NEW MONITORING ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Websites & APIs. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400">
              Monitored together or independently.
            </span>
          </h2>

          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A website does <strong className="text-slate-200">not</strong> need to contain an API to be monitored. FaultLens provides dual-engine observability: active HTTP/HTTPS health checks for public URLs and deep telemetry ingestion for microservice APIs.
          </p>

          {/* Interactive Mode Filter Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setActiveMode('both')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'both'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Architectures
              </button>
              <button
                onClick={() => setActiveMode('web-only')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'web-only'
                    ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Website Without APIs
              </button>
              <button
                onClick={() => setActiveMode('web-apis')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'web-apis'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Website With APIs
              </button>
            </div>
          </div>
        </div>

        {/* Dual Architecture Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Website Without APIs (Case B) */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`rounded-2xl border transition-all p-6 sm:p-8 flex flex-col justify-between bg-[#0A0E15] ${
              activeMode === 'web-only' || activeMode === 'both'
                ? 'border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-white/[0.06] opacity-40'
            }`}
          >
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                      CASE B · ZERO APIS REQUIRED
                    </div>
                    <h3 className="text-lg font-bold text-white">Pure Website HTTP Monitoring</h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  UP & REACHABLE
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                Ideal for portfolio websites, marketing pages, static documentation, and SaaS frontend entrypoints. FaultLens dispatches real HTTP GET probes to continuously verify reachability without requiring any client-side code integration.
              </p>

              {/* Real Probe Diagnostic Box */}
              <div className="rounded-xl border border-white/[0.08] bg-[#06080C] p-4 space-y-3 font-mono text-xs mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Target URL:</span>
                    <span className="text-slate-200 font-semibold">https://portfolio.dev</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/10">
                    GET · 10s Interval
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <div className="text-[10px] text-slate-500">HTTP STATUS</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">200 OK</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">RESPONSE TIME</div>
                    <div className="text-sm font-bold text-white mt-0.5">38ms</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">SSL CERTIFICATE</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Valid (84d)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">CONSEC. FAILURES</div>
                    <div className="text-sm font-bold text-slate-300 mt-0.5">0</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Baseline Deviation: <strong className="text-emerald-400">Normal (&lt;0.4σ)</strong></span>
                  <span>APIs Attached: <strong className="text-slate-300">0 (Web Only)</strong></span>
                </div>
              </div>

              {/* Capabilities List */}
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Reachability, status code, and timeout measurements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Statistical baseline ($2.5\sigma$) response time anomaly alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real SSL/TLS handshake inspection and expiry warnings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated incident trigger on consecutive failure threshold</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Overall Health Calculation:</span>
              <span className="text-emerald-400 font-semibold">Derived directly from web probes</span>
            </div>
          </motion.div>

          {/* Card 2: Website With APIs (Case A) */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border transition-all p-6 sm:p-8 flex flex-col justify-between bg-[#0A0E15] ${
              activeMode === 'web-apis' || activeMode === 'both'
                ? 'border-indigo-500/40 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                : 'border-white/[0.06] opacity-40'
            }`}
          >
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                      CASE A · MULTI-API ECOSYSTEM
                    </div>
                    <h3 className="text-lg font-bold text-white">Full-Stack Application & API Observability</h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  3 APIS ACTIVE
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                For e-commerce storefronts, SaaS applications, and microservice clusters like <strong className="text-slate-200">ShopSphere</strong>. FaultLens monitors both the parent web domain AND each sub-endpoint with granular telemetry and git commit correlation.
              </p>

              {/* Real Sub-Endpoints Diagnostic Box */}
              <div className="rounded-xl border border-white/[0.08] bg-[#06080C] p-4 space-y-2.5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-slate-300 font-semibold">ShopSphere (https://shopsphere.dev)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">WEB PROBE: UP (54ms)</span>
                </div>

                {/* Sub-Endpoints */}
                <div className="divide-y divide-white/[0.04]">
                  <div className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">POST</span>
                      <span className="text-slate-200">/api/v1/payments</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">142ms · 0.0% err</span>
                  </div>

                  <div className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">GET</span>
                      <span className="text-slate-200">/api/v1/inventory</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">48ms · 0.0% err</span>
                  </div>

                  <div className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">POST</span>
                      <span className="text-slate-200">/api/v1/orders</span>
                    </div>
                    <span className="text-amber-400 font-semibold">210ms · P95 alert</span>
                  </div>
                </div>
              </div>

              {/* Capabilities List */}
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Hierarchical ownership: User → Website → APIs → Telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>P50, P95, and P99 latency percentile distributions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Automated git deployment regression correlation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Telemetry security: API Key strictly verifies website ownership</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Overall Health Calculation:</span>
              <span className="text-indigo-400 font-semibold">Synthesized across web probes + all child APIs</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
