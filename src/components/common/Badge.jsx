import React from 'react';
import { getStatusConfig, getMethodConfig } from '../../utils/formatters';

export const StatusBadge = ({ status, pulse = true, size = 'sm', className = '' }) => {
  const config = getStatusConfig(status);
  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'md' 
    ? 'text-xs px-2.5 py-1' 
    : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgClass} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (status === 'critical' || status === 'incident' || status === 'degraded' || status === 'warning') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
      </span>
      <span>{config.label}</span>
    </span>
  );
};

export const MethodBadge = ({ method, size = 'sm', className = '' }) => {
  const colorClasses = getMethodConfig(method);
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`font-mono font-semibold rounded border uppercase tracking-wider ${colorClasses} ${sizeClasses} ${className}`}
    >
      {method}
    </span>
  );
};

export const EnvBadge = ({ env = 'Production' }) => {
  const isProd = env.toLowerCase() === 'production';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
        isProd
          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {env}
    </span>
  );
};
