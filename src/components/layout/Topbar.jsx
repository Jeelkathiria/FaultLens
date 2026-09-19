import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import {
  Menu,
  Bell,
  ChevronRight,
  LogOut
} from 'lucide-react';

export const Topbar = ({ onOpenMobileNav }) => {
  const { role, currentUser, logout, incidents } = useFaultLens();
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbTitle = (segment) => {
    switch (segment) {
      case 'dashboard': return 'Dashboard';
      case 'websites': return 'Websites';
      case 'apis': return 'APIs';
      case 'incidents': return 'Incidents';
      case 'deployments': return 'Deployments';
      case 'logs': return 'Logs';
      case 'settings': return 'Settings';
      case 'admin': return 'Admin';
      case 'users': return 'Users';
      case 'system-health': return 'System Health';
      case 'w-ecommerce': return 'My E-Commerce';
      case 'w-foodapp': return 'Food Delivery';
      case 'w-portfolio': return 'Portfolio';
      case 'w-fintech': return 'Fintech Core';
      case 'api-payment': return 'Payment API';
      case 'api-login': return 'Login API';
      case 'api-orders': return 'Orders API';
      case 'inc-1042': return 'Incident #1042';
      case 'inc-1041': return 'Incident #1041';
      default: return segment;
    }
  };

  const activeIncidentsCount = incidents.filter(i => i.severity !== 'resolved' && i.status !== 'resolved').length;

  return (
    <header className="h-16 border-b border-[#1E2633] bg-[#0F141D]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link
            to={role === 'admin' ? '/admin' : '/dashboard'}
            className="hover:text-slate-200 transition-colors text-slate-400"
          >
            FaultLens
          </Link>
          {pathSegments.map((segment, index) => {
            const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
            const isLast = index === pathSegments.length - 1;
            const title = getBreadcrumbTitle(segment);

            return (
              <React.Fragment key={url}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {isLast ? (
                  <span className="text-slate-100 font-semibold">{title}</span>
                ) : (
                  <Link to={url} className="hover:text-slate-200 transition-colors">
                    {title}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions & Role Controls */}
      <div className="flex items-center gap-2.5">
        {/* Active Account Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">{currentUser?.name || (role === 'admin' ? 'Platform Admin' : 'Developer')}</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
            role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          }`}>
            {role}
          </span>
        </div>

        {/* Incidents Quick Badge Link */}
        <button
          onClick={() => navigate('/incidents')}
          className="relative p-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          title="Active Incidents"
        >
          <Bell className="w-4 h-4" />
          {activeIncidentsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {activeIncidentsCount}
            </span>
          )}
        </button>

        {/* Explicit Logout Button for tenant testing */}
        <button
          type="button"
          id="btn-topbar-logout"
          onClick={async () => {
            if (logout) await logout();
            navigate('/login');
          }}
          className="p-2 px-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Log out of current session"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
