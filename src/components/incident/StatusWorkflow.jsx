import React from 'react';
import { Check, ShieldAlert, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const StatusWorkflow = ({ currentStatus, onStatusChange }) => {
  const steps = [
    { id: 'detected', label: 'Detected', icon: ShieldAlert },
    { id: 'investigating', label: 'Investigating', icon: Search },
    { id: 'mitigated', label: 'Mitigated', icon: ShieldCheck },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2 }
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStatus);

  return (
    <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Incident Lifecycle Status</h4>
        <span className="text-xs font-mono font-medium text-slate-300 capitalize">
          Current: <span className="text-indigo-400 font-semibold">{currentStatus}</span>
        </span>
      </div>

      {/* Stepper Visualization */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {steps.map((step, idx) => {
          const isPassed = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center text-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all mb-2 ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                    : isPassed
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#080B12] border-[#1E2633] text-slate-500'
                }`}
              >
                {isPassed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent ? 'text-indigo-300 font-semibold' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Workflow Buttons */}
      <div className="pt-4 border-t border-[#1E2633] flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => onStatusChange('detected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            currentStatus === 'detected'
              ? 'bg-red-500/20 border-red-500 text-red-300'
              : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
          }`}
        >
          Acknowledge
        </button>
        <button
          onClick={() => onStatusChange('investigating')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            currentStatus === 'investigating'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
          }`}
        >
          Investigate
        </button>
        <button
          onClick={() => onStatusChange('mitigated')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            currentStatus === 'mitigated'
              ? 'bg-blue-500/20 border-blue-500 text-blue-300'
              : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
          }`}
        >
          Mark Mitigated
        </button>
        <button
          onClick={() => onStatusChange('resolved')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ml-auto ${
            currentStatus === 'resolved'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
          }`}
        >
          ✓ Resolve Incident
        </button>
      </div>
    </div>
  );
};
