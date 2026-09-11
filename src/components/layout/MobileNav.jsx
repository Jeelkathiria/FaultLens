import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  LayoutDashboard,
  Globe,
  AlertOctagon,
  Rocket,
  Terminal,
  Settings,
  Users,
  Server
} from 'lucide-react';
import { useFaultLens } from '../../context/FaultLensContext';

export const MobileNav = ({ isOpen, onClose }) => {
  const { role, switchRole, incidents } = useFaultLens();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const activeIncidentsCount = incidents.filter(i => i.severity !== 'resolved' && i.status !== 'resolved').length;

  const navItems = role === 'admin'
    ? [
        { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Users & Roles', path: '/admin/users', icon: Users },
        { label: 'All Websites', path: '/admin/websites', icon: Globe },
        { label: 'Global Incidents', path: '/admin/incidents', icon: AlertOctagon },
        { label: 'System Health', path: '/admin/system-health', icon: Server },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Websites', path: '/websites', icon: Globe },
        { label: 'Incidents', path: '/incidents', icon: AlertOctagon, badge: activeIncidentsCount },
        { label: 'Deployments', path: '/deployments', icon: Rocket },
        { label: 'Logs', path: '/logs', icon: Terminal },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-[#0F141D] border-r border-[#1E2633] h-full flex flex-col p-4 shadow-2xl z-10 animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2633]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-base text-white">FaultLens</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role toggle */}
        <div className="my-4 p-1 rounded-lg bg-[#080B12] border border-[#1E2633] flex">
          <button
            onClick={() => switchRole('developer')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              role === 'developer' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Developer
          </button>
          <button
            onClick={() => switchRole('admin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              role === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Info */}
        <div className="pt-4 border-t border-[#1E2633] flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face"
            alt="Jeel"
            className="w-9 h-9 rounded-full border border-[#1E2633]"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-200">Jeel Kathiria</div>
            <div className="text-xs text-slate-500 capitalize">{role} Account</div>
          </div>
        </div>
      </div>
    </div>
  );
};
