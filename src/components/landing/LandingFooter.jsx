import React from 'react';
import { Link } from 'react-router-dom';
import { FaultLensLogo } from '../common/FaultLensLogo';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-white/[0.06] py-12 bg-[#06080C] text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/[0.06]">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <Link to="/" className="inline-block">
              <FaultLensLogo size={28} textClassName="text-base font-extrabold" />
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Real-time API monitoring, statistical anomaly detection, and automated deployment correlation.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All systems operational</span>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Product
              </div>
              <ul className="space-y-2">
                <li><a href="#hierarchy" className="hover:text-slate-300 transition-colors">Hierarchy</a></li>
                <li><a href="#anomaly-detection" className="hover:text-slate-300 transition-colors">Anomaly Engine</a></li>
                <li><a href="#correlation" className="hover:text-slate-300 transition-colors">Deployment Correlation</a></li>
                <li><a href="#preview" className="hover:text-slate-300 transition-colors">Console Preview</a></li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Console
              </div>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="hover:text-slate-300 transition-colors">Developer Dashboard</Link></li>
                <li><Link to="/websites" className="hover:text-slate-300 transition-colors">Websites</Link></li>
                <li><Link to="/incidents" className="hover:text-slate-300 transition-colors">Incidents</Link></li>
                <li><Link to="/deployments" className="hover:text-slate-300 transition-colors">Deployments</Link></li>
                <li><Link to="/logs" className="hover:text-slate-300 transition-colors">Logs</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Platform
              </div>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-slate-300 transition-colors">Sign In</Link></li>
                <li><Link to="/admin" className="hover:text-slate-300 transition-colors">Admin Console</Link></li>
                <li><Link to="/settings" className="hover:text-slate-300 transition-colors">Settings</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} FaultLens. Built with developers in mind.
          </div>
          <div className="flex items-center gap-4">
            <span>v1.8 Professional</span>
            <span>·</span>
            <span>Cluster: us-east-1</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
