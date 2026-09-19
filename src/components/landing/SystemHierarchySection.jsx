import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Globe,
  Activity,
  AlertTriangle,
  AlertOctagon,
  GitBranch
} from 'lucide-react';

export const SystemHierarchySection = () => {
  const steps = [
    {
      level: '01',
      title: 'Tenant Isolation & Ownership Chain',
      example: 'Developer → Website → Web Probes / APIs',
      desc: 'Strict multi-tenant security boundary. Every website, probe, and metric is cryptographically tied to the authenticated developer.',
      icon: ShieldCheck,
    },
    {
      level: '02',
      title: 'Websites & Applications (Dual-Path)',
      example: 'Case A: Microservices with APIs · Case B: Standalone Web Apps',
      desc: 'Websites without APIs receive direct automated HTTP/HTTPS health checks. Complex applications map child APIs with consolidated health.',
      icon: Globe,
    },
    {
      level: '03',
      title: 'Web Probes & Real-Time Telemetry',
      example: 'Automated GET Probes + Sub-second Ingestion',
      desc: 'Real HTTP status codes, SSL validation, response times, and P95 latency streamed directly into Redis fast memory.',
      icon: Activity,
    },
    {
      level: '04',
      title: '2.5σ Dynamic Statistical Baselines',
      example: 'Baseline breach: Latency > (μ + 2.5σ, min 50ms buffer)',
      desc: 'Dynamic statistical engine evaluates rolling 30-check windows. Filters natural traffic spikes while catching authentic regressions.',
      icon: AlertTriangle,
    },
    {
      level: '05',
      title: 'Automated Incidents & State Engine',
      example: 'Incident #1042 declared with automated audit log',
      desc: 'Consecutive probe dropouts or baseline breaches automatically create actionable incidents with complete error traces.',
      icon: AlertOctagon,
    },
    {
      level: '06',
      title: 'Deployment Correlation',
      example: 'Deploy v1.8 (commit #8f92a1) Correlated',
      desc: 'Temporally connects performance regressions directly to recent git commit releases within the change window.',
      icon: GitBranch,
    }
  ];

  return (
    <section id="hierarchy" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            System Hierarchy
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            One lens for your entire system
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Follow the clean flow of telemetry. See how FaultLens translates raw network signals into root cause deployment correlation.
          </p>
        </div>

        {/* Vertical Hierarchy Flow */}
        <div className="relative">
          {/* Subtle Vertical Line */}
          <div className="absolute top-6 bottom-6 left-5 sm:left-1/2 -translate-x-1/2 w-px bg-white/[0.08]" />

          <div className="space-y-6 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 ${
                    isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Content Box */}
                  <div className={`w-full sm:w-1/2 pl-12 sm:pl-0 ${isEven ? 'sm:pr-8 sm:text-right' : 'sm:pl-8 sm:text-left'}`}>
                    <div className="p-4 sm:p-5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/10 transition-colors">
                      <div className={`flex items-center gap-2 mb-1 text-xs font-mono text-slate-400 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                        <span>STEP {step.level}</span>
                        <span>·</span>
                        <span className="text-slate-200">{step.title}</span>
                      </div>
                      <div className="text-sm font-semibold text-white font-mono">
                        {step.example}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Central Node Indicator */}
                  <div className="absolute left-5 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg bg-[#0A0E15] border border-white/10 flex items-center justify-center z-10">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="hidden sm:block sm:w-1/2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
