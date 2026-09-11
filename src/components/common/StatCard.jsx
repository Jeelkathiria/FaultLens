import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  trendLabel,
  color = 'slate', // 'indigo' | 'emerald' | 'amber' | 'red' | 'slate'
  className = ''
}) => {
  const colorStyles = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 bg-indigo-500/5',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
    amber: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-500/5',
    red: 'border-red-500/20 hover:border-red-500/40 text-red-400 bg-red-500/5',
    slate: 'border-[#1E2633] hover:border-slate-700 text-slate-300 bg-[#0F141D]'
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 card-hover-glow ${
        color === 'slate' ? 'bg-[#0F141D] border-[#1E2633]' : colorStyles[color]
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-slate-900/60 border border-[#1E2633] text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-100 font-mono">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trendDirection === 'up'
                ? 'text-emerald-400'
                : trendDirection === 'down'
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : ''}
            {trend}
          </span>
        )}
      </div>

      {(subtitle || trendLabel) && (
        <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
          {trendLabel && <span>{trendLabel}</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
