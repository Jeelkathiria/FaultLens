import React from 'react';
import { Activity, Sparkles, AlertOctagon, Rocket } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Monitor',
      description: 'Track requests, latency, uptime, and errors across your APIs with sub-second precision.',
      icon: Activity,
    },
    {
      number: '02',
      title: 'Detect',
      description: 'Identify abnormal behavior using continuous monitoring baselines and 4-sigma anomaly detection.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Investigate',
      description: 'Turn anomalies into actionable incidents with detailed percentiles, status distributions, and logs.',
      icon: AlertOctagon,
    },
    {
      number: '04',
      title: 'Correlate',
      description: 'Connect incidents with recent deployments to identify potential triggers and roll back regressions.',
      icon: Rocket,
    }
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Four cohesive phases of observability
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            From synthetic health checks to automated deployment correlation, built without unnecessary overhead.
          </p>
        </div>

        {/* 4 Clean Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-white/[0.06] bg-[#0A0E15] hover:border-white/10 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-mono text-slate-500 font-bold">
                      {step.number}
                    </span>
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
