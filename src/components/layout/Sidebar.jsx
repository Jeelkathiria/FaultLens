import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  AlertOctagon,
  Rocket,
  Terminal,
  Settings,
  ShieldCheck,
  Users,
  Server,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  LogOut
} from 'lucide-react';
import { useFaultLens } from '../../context/FaultLensContext';
import { FaultLensLogo } from '../common/FaultLensLogo';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { role, switchRole, incidents, currentUser, logout } = useFaultLens();
  const navigate = useNavigate();

  const activeIncidentsCount = incidents.filter(i => i.severity !== 'resolved' && i.status !== 'resolved').length;

  const devNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    {
      heading: 'MONITORING',
      items: [
        { label: 'Websites', path: '/websites', icon: Globe },
        { label: 'Incidents', path: '/incidents', icon: AlertOctagon, badge: activeIncidentsCount },
        { label: 'Deployments', path: '/deployments', icon: Rocket },
        { label: 'Logs', path: '/logs', icon: Terminal },
      ]
    },
    {
      heading: 'SYSTEM',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    {
      heading: 'PLATFORM MANAGEMENT',
      items: [
        { label: 'Users & Roles', path: '/admin/users', icon: Users },
        { label: 'All Websites', path: '/admin/websites', icon: Globe },
        { label: 'Global Incidents', path: '/admin/incidents', icon: AlertOctagon },
        { label: 'System Health', path: '/admin/system-health', icon: Server },
      ]
    },
    {
      heading: 'SYSTEM',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  const isActualAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN' && role === 'admin';
  const navSections = isActualAdmin ? adminNavItems : devNavItems;

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[#1E2633] bg-[#0F141D] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E2633]">
        <div
          onClick={() => navigate(isActualAdmin ? '/admin' : '/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
          title="FaultLens"
        >
          <FaultLensLogo size={32} showText={false} className="shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                FaultLens
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  isActualAdmin
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {isActualAdmin ? 'ADMIN' : 'PRO'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-0.5">Observability Suite</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section, sIdx) => {
          if (section.path) {
            // Standalone top item
            const Icon = section.icon;
            return (
              <NavLink
                key={section.path}
                to={section.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{section.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded border border-[#1E2633] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {section.label}
                  </div>
                )}
              </NavLink>
            );
          }

          return (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-semibold text-slate-500 tracking-wider">
                  {section.heading}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded border border-[#1E2633] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.badge > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1E2633] bg-[#0B0F17]">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'flex-col justify-center gap-2' : ''
          }`}
        >
          <div className="relative shrink-0">
            {(() => {
              const pic = currentUser?.photoURL || currentUser?.avatar || localStorage.getItem('faultlens_avatar');
              const avatarSrc = pic && !pic.includes('unsplash.com') ? pic : 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexus&backgroundColor=1e1b4b';
              return (
                <img
                  src={avatarSrc}
                  alt={currentUser?.name || "User"}
                  className="w-8 h-8 rounded-full border border-[#1E2633] object-cover bg-slate-900"
                />
              );
            })()}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0F141D]" />
          </div>

          {!isCollapsed ? (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.name || 'Developer'}
              </div>
              <div className="text-[11px] text-slate-400 capitalize flex items-center justify-between gap-1">
                <span>{isActualAdmin ? 'Admin' : 'Developer'}</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (logout) await logout();
                    navigate('/login');
                  }}
                  className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Sign out & go to Login"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (logout) await logout();
                navigate('/login');
              }}
              className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="Sign out & go to Login"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
