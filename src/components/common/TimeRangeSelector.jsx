import React from 'react';

export const TimeRangeSelector = ({ selected, onChange, ranges = ['1H', '6H', '24H', '7D', '30D'] }) => {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0B0F17] border border-[#1E2633]">
      {ranges.map((range) => {
        const isActive = selected === range;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};
