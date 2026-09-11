import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, UserCheck, Lock, Mail } from 'lucide-react';
import { useFaultLens } from '../../context/FaultLensContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { switchRole } = useFaultLens();

  const [email, setEmail] = useState('jeel@faultlens.dev');
  const [password, setPassword] = useState('••••••••••••');

  const handleCustomLogin = (e) => {
    e.preventDefault();
    switchRole('developer');
    navigate('/dashboard');
  };

  const handleDemoDev = () => {
    switchRole('developer');
    navigate('/dashboard');
  };

  const handleDemoAdmin = () => {
    switchRole('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">FaultLens</span>
        </Link>
        <p className="text-xs text-slate-400">Developer Observability & Incident Detection Platform</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0F141D] border border-[#1E2633] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Sign in to FaultLens</h2>
          <p className="text-xs text-slate-400 mt-1">Access your application monitors and telemetry dashboard</p>
        </div>

        {/* Demo One-Click Access Presets */}
        <div className="p-3.5 rounded-xl bg-[#080B12] border border-indigo-500/20 space-y-2">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
            Instant Demo Access (No password required)
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDemoDev}
              className="px-3 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Developer View</span>
            </button>
            <button
              onClick={handleDemoAdmin}
              className="px-3 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin View</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1E2633] w-full" />
          <span className="bg-[#0F141D] px-3 text-[11px] text-slate-500 uppercase tracking-wider absolute">
            Or continue with credentials
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
          >
            <span>Sign In to Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
