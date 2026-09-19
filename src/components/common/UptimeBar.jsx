import React from 'react';

export const UptimeBar = ({ history = [], barsCount = 40, className = '' }) => {
  // Pad or trim history to match barsCount
  const displayHistory = history.length > 0 ? history.slice(-barsCount) : Array(barsCount).fill(null);
  while (displayHistory.length < barsCount) {
    displayHistory.unshift(null);
  }

  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`} title="Daily rolling uptime history">
      {displayHistory.map((val, idx) => {
        let colorClass = 'bg-emerald-500 hover:bg-emerald-400';
        let title = '100% uptime';
        let heightPct = 100;

        if (val === null || val === undefined) {
          colorClass = 'bg-slate-800/80 hover:bg-slate-700';
          title = 'No monitoring data';
          heightPct = 35;
        } else if (val < 0.9) {
          colorClass = 'bg-red-500 hover:bg-red-400';
          title = `${(val * 100).toFixed(1)}% uptime (Outage)`;
          heightPct = Math.max(35, val * 100);
        } else if (val < 0.99) {
          colorClass = 'bg-amber-500 hover:bg-amber-400';
          title = `${(val * 100).toFixed(1)}% uptime (Degraded)`;
          heightPct = Math.max(35, val * 100);
        }

        return (
          <div
            key={idx}
            className={`flex-1 min-w-[2px] rounded-sm transition-colors cursor-pointer ${colorClass}`}
            style={{ height: `${heightPct}%` }}
            title={`Day -${barsCount - 1 - idx}: ${title}`}
          />
        );
      })}
    </div>
  );
};
