import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, AlertTriangle, ArrowRight, GitCommit, Clock, GitBranch } from 'lucide-react';

export const DeploymentCorrelationCard = ({ deployment }) => {
  const navigate = useNavigate();

  if (!deployment) {
    return (
      <div className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D] text-slate-400 text-xs">
        No recent deployments correlated within the 60-minute incident detection window.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-[#0F141D] to-[#0F141D] p-6 relative overflow-hidden">
      {/* Visual Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
        <AlertTriangle className="w-4 h-4 animate-pulse" />
        <span>Potential Deployment Correlation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-400" />
              {deployment.version}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {deployment.service}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-[#1E2633]">
              <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
              {deployment.commit}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-[#1E2633]">
            "{deployment.message}"
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="text-[11px] text-slate-500">Deployed</div>
              <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">{deployment.deployedAt}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Incident Detected</div>
              <div className="text-xs font-mono font-semibold text-red-400 mt-0.5">{deployment.detectedAt}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Time Difference</div>
              <div className="text-xs font-mono font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {deployment.timeDifference}
              </div>
            </div>
          </div>
        </div>

        {/* Action Callout */}
        <div className="lg:col-span-1 flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[#1E2633] pt-4 lg:pt-0 lg:pl-6 space-y-3">
          <div className="text-xs text-slate-400 text-left lg:text-right">
            <span className="text-amber-400 font-semibold">High Confidence:</span> Error rate increased sharply shortly after deployment rollout.
          </div>
          <button
            onClick={() => navigate('/deployments')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all group"
          >
            <span>View Deployment</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
