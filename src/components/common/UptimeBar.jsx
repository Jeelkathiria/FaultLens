import React from 'react';

export const UptimeBar = ({ history = [], barsCount = 40, className = '' }) => {
  // Pad or trim history to match barsCount
  const displayHistory = history.length > 0 ? history.slice(-barsCount) : Array(barsCount).fill(1);
  while (displayHistory.length < barsCount) {
    displayHistory.unshift(1);
  }

  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`} title="90-day rolling uptime history">
      {displayHistory.map((val, idx) => {
        let colorClass = 'bg-emerald-500 hover:bg-emerald-400';
        let title = '100% uptime';
        if (val < 0.9) {
          colorClass = 'bg-red-500 hover:bg-red-400';
          title = `${(val * 100).toFixed(1)}% uptime (Outage)`;
        } else if (val < 0.99) {
          colorClass = 'bg-amber-500 hover:bg-amber-400';
          title = `${(val * 100).toFixed(1)}% uptime (Degraded)`;
        }

        return (
          <div
            key={idx}
            className={`flex-1 min-w-[2px] rounded-sm transition-colors cursor-pointer ${colorClass}`}
            style={{ height: `${Math.max(35, val * 100)}%` }}
            title={`Day -${barsCount - idx}: ${title}`}
          />
        );
      })}
    </div>
  );
};
