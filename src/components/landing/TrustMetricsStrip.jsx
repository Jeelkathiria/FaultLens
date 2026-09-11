import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Clock, Sparkles } from 'lucide-react';

export const TrustMetricsStrip = () => {
  const metrics = [
    {
      value: '12',
      label: 'APIs Monitored',
      sublabel: 'Zero configuration setup',
      icon: Activity,
    },
    {
      value: '99.98%',
      label: 'Avg System Uptime',
      sublabel: 'Continuous 30-day SLA',
      icon: ShieldCheck,
    },
    {
      value: 'P95 / P99',
      label: 'Latency Percentiles',
      sublabel: 'Sub-second precision',
      icon: Clock,
    },
    {
      value: '24 / 7',
      label: 'Anomaly Detection',
      sublabel: '4σ statistical profiling',
      icon: Sparkles,
    }
  ];

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-12">
      <div className="rounded-xl border border-white/[0.08] bg-[#0A0D14]/80 backdrop-blur-md p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`pt-4 sm:pt-0 ${idx > 0 ? 'sm:pl-6 lg:pl-8' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                  {item.value}
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  {item.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
