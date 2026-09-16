import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const AnomalyDetectionSection = () => {
  const [showAnomaly, setShowAnomaly] = useState(true);

  return (
    <section id="anomaly-detection" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            Anomaly Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Know when something is wrong. <br />
            <span className="text-slate-400">Before users do.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Static thresholds fail during organic traffic surges. FaultLens evaluates rolling 4-sigma deviations, learning your system's natural rhythms to identify genuine regressions.
          </p>
        </div>

        {/* Clean Anomaly Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0E15]/90 p-6 sm:p-8">
          
          {/* Top Route & Toggle Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-mono text-slate-300">
                Route: <code className="text-emerald-400">POST /api/v1/checkout/charge</code>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Evaluation: 5-minute statistical window against 7-day learned baseline
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono">
              <button
                onClick={() => setShowAnomaly(false)}
                className={`px-3 py-1.5 rounded transition-all ${
                  !showAnomaly ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Normal Baseline
              </button>
              <button
                onClick={() => setShowAnomaly(true)}
                className={`px-3 py-1.5 rounded transition-all ${
                  showAnomaly ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Simulate Anomaly
              </button>
            </div>
          </div>

          {/* SVG Graph Display */}
          <div className="py-6">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Dashed: 3σ Confidence Envelope</span>
                <span>Solid: Observed Telemetry</span>
              </div>
              {showAnomaly && (
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  ANOMALY DETECTED (+4.8σ)
                </span>
              )}
            </div>

            <div className="h-56 sm:h-64 w-full relative bg-[#06080C] rounded-lg border border-white/[0.04] p-4 overflow-hidden">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="anomAreaNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="anomAreaBreach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* 3-Sigma Envelope */}
                <path
                  d="M 0 140 C 100 135, 200 145, 300 138 C 400 142, 500 135, 600 140 S 700 138, 800 142"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {!showAnomaly ? (
                  <>
                    <path
                      d="M 0 150 C 100 144, 200 152, 300 146 C 400 148, 500 142, 600 147 S 700 145, 800 148 L 800 200 L 0 200 Z"
                      fill="url(#anomAreaNormal)"
                    />
                    <path
                      d="M 0 150 C 100 144, 200 152, 300 146 C 400 148, 500 142, 600 147 S 700 145, 800 148"
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d="M 0 150 C 100 144, 200 152, 300 146 C 380 144, 420 130, 480 35 C 530 20, 580 40, 640 45 S 720 48, 800 42 L 800 200 L 0 200 Z"
                      fill="url(#anomAreaBreach)"
                    />
                    <path
                      d="M 0 150 C 100 144, 200 152, 300 146 C 380 144, 420 130, 480 35 C 530 20, 580 40, 640 45 S 720 48, 800 42"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                    />
                    <g transform="translate(480, 35)">
                      <line x1="0" y1="0" x2="0" y2="165" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <circle cx="0" cy="0" r="4" fill="#EF4444" />
                      <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
                      <text x="10" y="4" fill="#EF4444" fontSize="11" fontFamily="monospace">
                        SPIKE: 11.8%
                      </text>
                    </g>
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Clean Metric Readouts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono text-slate-400">BASELINE ERROR RATE</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">1.4%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Learned weekly envelope</div>
            </div>

            <div className={`p-3.5 rounded-lg border transition-colors ${
              showAnomaly ? 'bg-red-500/[0.04] border-red-500/20' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className={`text-xs font-mono ${showAnomaly ? 'text-red-400' : 'text-slate-400'}`}>
                OBSERVED ERROR RATE
              </div>
              <div className={`text-2xl font-bold font-mono mt-1 ${showAnomaly ? 'text-red-400' : 'text-white'}`}>
                {showAnomaly ? '11.8%' : '1.3%'}
              </div>
              <div className={`text-[11px] mt-0.5 ${showAnomaly ? 'text-red-400' : 'text-slate-500'}`}>
                {showAnomaly ? '+742% above baseline' : 'Within envelope'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono text-slate-400">DETECTION ALGORITHM</div>
              <div className="text-xl font-bold font-mono text-white mt-1">4-Sigma EWMA</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Exponentially weighted deviation</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
