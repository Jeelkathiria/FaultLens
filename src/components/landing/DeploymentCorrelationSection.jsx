import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Activity, AlertTriangle, AlertOctagon, GitCommit, ArrowRight } from 'lucide-react';

export const DeploymentCorrelationSection = () => {
  const navigate = useNavigate();

  const nodes = [
    {
      step: '01',
      title: 'Deployment',
      time: '12:30 PM',
      primary: 'Payment Svc v1.8',
      desc: 'Release container pushed to cluster.',
      icon: Rocket,
    },
    {
      step: '02',
      title: 'Latency Shift',
      time: '12:34 PM',
      primary: 'P95: 184ms → 742ms',
      desc: 'Observed tail latency climbs on checkout.',
      icon: Activity,
    },
    {
      step: '03',
      title: 'Error Rate',
      time: '12:35 PM',
      primary: '504 Timeouts (12.8%)',
      desc: 'Error rates violate baseline envelopes.',
      icon: AlertTriangle,
    },
    {
      step: '04',
      title: 'Incident',
      time: '12:36 PM',
      primary: 'Incident #1042',
      desc: 'Triage ticket generated with traces.',
      icon: AlertOctagon,
    },
    {
      step: '05',
      title: 'Correlation',
      time: '12:36 PM',
      primary: 'Potential Deploy Trigger',
      desc: 'Correlated with release v1.8 (6m ago).',
      icon: GitCommit,
    }
  ];

  return (
    <section id="correlation" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#06080C]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-left sm:text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            Root Cause Identification
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            What changed? Find the answer faster.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            FaultLens correlates abnormal API behavior with recent deployments to help developers identify potential triggers faster.
          </p>
        </div>

        {/* Clean Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            const isLast = idx === nodes.length - 1;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                  isLast
                    ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                    : 'bg-[#0A0E15] border-white/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                    <span>EVENT {node.step}</span>
                    <span>{node.time}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${isLast ? 'text-emerald-400' : 'text-slate-300'}`} />
                    <span className="text-xs font-semibold text-slate-200">
                      {node.title}
                    </span>
                  </div>

                  <div className={`text-xs font-mono font-medium ${isLast ? 'text-emerald-400' : 'text-white'}`}>
                    {node.primary}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer / Note */}
        <div className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <span className="text-slate-200 font-medium">Correlation Note: </span>
            <span>FaultLens highlights potential deployment triggers through temporal proximity and route topology without asserting false certainty.</span>
          </div>
          <button
            onClick={() => navigate('/deployments')}
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap"
          >
            Explore Deployments →
          </button>
        </div>
      </div>
    </section>
  );
};
