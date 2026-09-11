import React from 'react';
import { Rocket, AlertTriangle, Activity, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const IncidentTimeline = ({ timeline = [] }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'deployment':
        return <Rocket className="w-4 h-4 text-indigo-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'anomaly':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'incident':
        return <AlertOctagon className="w-4 h-4 text-red-400" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'deployment':
        return 'border-indigo-500/40 bg-indigo-500/10';
      case 'warning':
        return 'border-amber-500/40 bg-amber-500/10';
      case 'anomaly':
        return 'border-purple-500/40 bg-purple-500/10';
      case 'incident':
        return 'border-red-500/50 bg-red-500/20';
      case 'resolved':
        return 'border-emerald-500/40 bg-emerald-500/10';
      default:
        return 'border-[#1E2633] bg-[#0F141D]';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#1E2633]">
      {timeline.map((event, idx) => {
        return (
          <div key={event.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 shadow-md ${getBorderColor(
                event.type
              )}`}
            >
              {getIcon(event.type)}
            </div>

            {/* Event Content Card */}
            <div className="bg-[#0B0F17] border border-[#1E2633] rounded-lg p-3.5 hover:border-slate-700 transition-colors ml-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-100">{event.time}</span>
                  <span className="text-sm font-semibold text-slate-200">{event.title}</span>
                </div>
                {event.badge && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {event.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
