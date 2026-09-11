import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, RotateCw, Activity, Layers, AlertOctagon, Rocket, Terminal, ExternalLink } from 'lucide-react';
import { FaultLensLogo } from '../common/FaultLensLogo';

export const ProductPreviewSection = () => {
  const navigate = useNavigate();

  return (
    <section id="preview" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            Console Experience
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Your API health. At a glance.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            High-density telemetry without cognitive clutter. Everything you need to monitor health, debug latency, and investigate regressions.
          </p>
        </div>

        {/* Clean Browser Frame */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0E15] shadow-2xl overflow-hidden">
          {/* Top Address Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center gap-2 px-4 py-1 rounded bg-[#06080C] border border-white/[0.06] text-xs font-mono text-slate-400 max-w-sm w-full justify-center">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>https://app.faultlens.dev/dashboard</span>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] font-mono text-slate-400">TOTAL REQUESTS</div>
                <div className="text-xl font-bold font-mono text-white mt-1">24.8K</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">↑ 12.4% vs 1h ago</div>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] font-mono text-slate-400">ERROR RATE</div>
                <div className="text-xl font-bold font-mono text-red-400 mt-1">1.2%</div>
                <div className="text-[10px] text-red-400 mt-0.5">Alert: 1 route degraded</div>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] font-mono text-slate-400">P95 LATENCY</div>
                <div className="text-xl font-bold font-mono text-white mt-1">184ms</div>
                <div className="text-[10px] text-slate-500 mt-0.5">P99: 412ms</div>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] font-mono text-slate-400">ACTIVE INCIDENTS</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">1 Active</div>
                <div className="text-[10px] text-amber-400 mt-0.5">Triage in progress</div>
              </div>
            </div>

            {/* Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs font-mono text-slate-400 mb-3">REQUEST VOLUME BY MINUTE</div>
                <div className="h-32 flex items-end gap-1.5 pt-2">
                  {[40, 48, 45, 55, 60, 65, 70, 75, 68, 85, 90, 80, 65, 72, 78, 88, 95, 82, 70, 68].map((val, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t-sm ${idx >= 15 ? 'bg-red-400/80' : 'bg-emerald-400/70'}`}
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                  <span>12:00 PM</span>
                  <span>12:30 PM (Deploy v1.8)</span>
                  <span className="text-red-400">12:36 PM (Spike)</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-3">RECENT DEPLOYMENTS</div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Payment Service v1.8</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">commit #8f92a1 (6m ago)</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Correlated
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Orders API v1.7</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">commit #3a41b2 (3h ago)</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] text-emerald-400">
                        Healthy
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04] flex justify-end">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    Open Full Developer Dashboard →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
