import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

export const IncidentDetectionSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3">
            Incident Management
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Turn noise into actionable incidents
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Avoid alert fatigue. FaultLens groups correlated telemetry spikes into structured incident records with pre-computed baselines, error traces, and triage ownership.
          </p>
        </div>

        {/* Clean Incident Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0E15]/90 p-6 sm:p-8 max-w-3xl mx-auto">
          
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-mono font-semibold text-red-400">
                CRITICAL INCIDENT #1042
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Detected 2m ago</span>
            </div>
          </div>

          <div className="py-5">
            <div className="text-xs font-mono text-slate-400 mb-1">
              Service: <span className="text-white">Payment API (/api/v1/checkout)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              Severe Latency & Error Rate Spike
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              4.8σ anomaly triggered after sudden 504 Gateway Timeouts on checkout endpoints. Correlated with recent deployment release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] font-mono text-slate-400">ERROR RATE SURGE</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm text-slate-500 line-through font-mono">1.4%</span>
                <span className="text-xl font-bold font-mono text-red-400">12.8%</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">SLA threshold: 2.0%</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] font-mono text-slate-400">P95 TAIL LATENCY</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm text-slate-500 line-through font-mono">184ms</span>
                <span className="text-xl font-bold font-mono text-amber-400">742ms</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Baseline: 180ms</div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
            <div className="text-xs font-mono text-slate-400">
              Workflow: <span className="text-slate-200">Investigating</span>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Investigate Incident</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
