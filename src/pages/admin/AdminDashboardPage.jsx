import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatCard } from '../../components/common/StatCard';
import { adminService } from '../../services/admin';
import {
  Users,
  Globe,
  Layers,
  AlertOctagon,
  Server,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { adminStats, switchRole } = useFaultLens();
  const [platformTraffic, setPlatformTraffic] = useState([]);
  const [eventsPerSec, setEventsPerSec] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadThroughput() {
      try {
        const res = await adminService.getSystemHealth();
        if (isMounted && res) {
          if (Array.isArray(res.hourlyThroughput)) {
            setPlatformTraffic(res.hourlyThroughput);
          }
          if (res.systemMetrics?.eventsPerSec !== undefined) {
            setEventsPerSec(res.systemMetrics.eventsPerSec);
          }
        }
      } catch (err) {
        console.error('Failed to load admin throughput:', err);
      }
    }

    loadThroughput();
    const interval = setInterval(loadThroughput, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ADMIN CONSOLE
            </span>
            <span className="text-xs text-slate-500 font-mono">Platform v3.4.1</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Platform Multi-Tenant Overview</h1>
          <p className="text-xs text-slate-400">Global health, tenant consumption, and system engine observability.</p>
        </div>

        <button
          onClick={() => switchRole('developer')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all self-start sm:self-auto shadow-lg shadow-indigo-600/20"
        >
          <span>Switch to Developer View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Admin 4 Top Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Users"
          value={adminStats.usersCount}
          subtitle="Registered accounts"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Websites"
          value={adminStats.websitesCount}
          subtitle="Monitored domains"
          icon={Globe}
          color="slate"
        />
        <StatCard
          title="APIs"
          value={adminStats.apisCount}
          subtitle="Active endpoints"
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Active Incidents"
          value={adminStats.activeIncidentsCount}
          subtitle="Platform-wide"
          icon={AlertOctagon}
          color="red"
        />
      </div>

      {/* Platform Ingestion Telemetry Chart */}
      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Global Telemetry Ingest Throughput</h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated events/hour across all tenant probe pipelines (last 24h)</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{eventsPerSec.toLocaleString()} Events / Sec</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={platformTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2633" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F141D', borderColor: '#1E2633', borderRadius: '8px' }}
                formatter={(val) => [`${val.toLocaleString()} events`, 'Throughput']}
              />
              <Area
                type="monotone"
                dataKey="throughput"
                stroke="#818CF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#adminThroughput)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Links into Submodules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D] card-hover-glow cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
            Users & Roles Management
          </h4>
          <p className="text-xs text-slate-400 mt-1">Manage 48 registered developers, DevOps, and admin roles.</p>
        </div>

        <div
          onClick={() => navigate('/admin/system-health')}
          className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D] card-hover-glow cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <Server className="w-6 h-6 text-emerald-400" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
            FaultLens Internal Health
          </h4>
          <p className="text-xs text-slate-400 mt-1">API Collector, Anomaly Engine, Redis & TimescaleDB nodes.</p>
        </div>

        <div
          onClick={() => navigate('/admin/incidents')}
          className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D] card-hover-glow cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <AlertOctagon className="w-6 h-6 text-red-400" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-red-300 transition-colors">
            Global Incidents Feed
          </h4>
          <p className="text-xs text-slate-400 mt-1">View all 8 active cross-tenant incidents in real time.</p>
        </div>
      </div>
    </div>
  );
};
