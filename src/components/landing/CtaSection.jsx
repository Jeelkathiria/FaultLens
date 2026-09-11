import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaultLensLogo } from '../common/FaultLensLogo';

export const CtaSection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <section className="relative z-10 py-28 border-t border-white/[0.06] bg-[#06080C] text-left sm:text-center overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="mb-6 flex sm:justify-center">
          <FaultLensLogo size={32} textClassName="text-xl font-extrabold" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Stop guessing.{' '}
          <span className="block sm:inline text-slate-400">Start seeing.</span>
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Monitor your APIs, detect anomalies, investigate incidents, and understand what changed before regressions reach your users.
        </p>

        {/* Clean CTA Input/Pill Bar */}
        <div className="flex sm:justify-center">
          <form
            onSubmit={handleSubmit}
            className="inline-flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md max-w-md w-full gap-2"
          >
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-white text-black hover:bg-slate-100 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              Start Monitoring
            </button>

            <input
              type="text"
              placeholder="your email or api endpoint"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 px-3 py-1.5 outline-none flex-1 font-mono"
            />

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium whitespace-nowrap transition-colors"
            >
              Explore Demo
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center sm:justify-center gap-4 text-xs font-mono text-slate-500">
          <span>Zero agent overhead</span>
          <span>·</span>
          <span>Sub-second alerts</span>
          <span>·</span>
          <span>Automatic deployment correlation</span>
        </div>
      </div>
    </section>
  );
};
