export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export const formatLatency = (ms) => {
  if (ms === undefined || ms === null) return '0ms';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
};

export const formatUptime = (rate) => {
  if (rate === undefined || rate === null) return '100.00%';
  return `${Number(rate).toFixed(2)}%`;
};

export const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'healthy':
    case 'stable':
    case 'resolved':
      return {
        label: s === 'stable' ? 'Stable' : s === 'resolved' ? 'Resolved' : 'Healthy',
        color: '#22C55E',
        dotClass: 'bg-emerald-400',
        bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        borderClass: 'border-emerald-500/30'
      };
    case 'degraded':
    case 'warning':
    case 'investigating':
      return {
        label: s === 'investigating' ? 'Investigating' : s === 'warning' ? 'Warning' : 'Degraded',
        color: '#F59E0B',
        dotClass: 'bg-amber-400',
        bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        borderClass: 'border-amber-500/30'
      };
    case 'critical':
    case 'incident':
    case 'detected':
      return {
        label: s === 'detected' ? 'Detected' : s === 'incident' ? 'Incident Detected' : 'Critical',
        color: '#EF4444',
        dotClass: 'bg-red-400',
        bgClass: 'bg-red-500/10 text-red-400 border-red-500/20',
        borderClass: 'border-red-500/30'
      };
    default:
      return {
        label: status,
        color: '#94A3B8',
        dotClass: 'bg-slate-400',
        bgClass: 'bg-slate-800 text-slate-300 border-slate-700',
        borderClass: 'border-slate-700'
      };
  }
};

export const getMethodConfig = (method = 'GET') => {
  const m = method.toUpperCase();
  switch (m) {
    case 'GET':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'POST':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'PUT':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'PATCH':
      return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'DELETE':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

export const getStatusCodeColor = (code) => {
  const status = Number(code);
  if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (status >= 300 && status < 400) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (status >= 500) return 'text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-slate-400 bg-slate-800 border-slate-700';
};
