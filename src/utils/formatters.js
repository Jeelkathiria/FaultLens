export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  const val = Number(num);
  if (val === 0) return '0';
  if (val >= 1000000) {
    return (val / 1000000).toFixed(1) + 'M';
  }
  if (val >= 1000) {
    return (val / 1000).toFixed(1) + 'K';
  }
  return val.toLocaleString();
};

export const formatLatency = (ms) => {
  if (ms === undefined || ms === null || isNaN(Number(ms)) || Number(ms) <= 0) return '—';
  const val = Number(ms);
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}s`;
  }
  return `${Math.round(val)}ms`;
};

export const formatUptime = (rate) => {
  if (rate === undefined || rate === null || isNaN(Number(rate))) return '—';
  return `${Number(rate).toFixed(2)}%`;
};

export const formatErrorRate = (rate) => {
  if (rate === undefined || rate === null || isNaN(Number(rate)) || Number(rate) === 0) return '0%';
  return `${Number(rate).toFixed(1)}%`;
};

export const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'healthy':
    case 'stable':
    case 'resolved':
    case 'operational':
      return {
        label: s === 'operational' ? 'Operational' : s === 'stable' ? 'Stable' : s === 'resolved' ? 'Resolved' : 'Healthy',
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
    case 'down':
      return {
        label: s === 'down' ? 'Down' : s === 'detected' ? 'Detected' : s === 'incident' ? 'Incident Detected' : 'Critical',
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
