import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';

// Landing Page Components
import { LandingNavbar } from '../../components/landing/LandingNavbar';
import { HeroBackground } from '../../components/landing/HeroBackground';
import { HeroProductVisual } from '../../components/landing/HeroProductVisual';
import { TrustMetricsStrip } from '../../components/landing/TrustMetricsStrip';
import { LiveGlimpseSection } from '../../components/landing/LiveGlimpseSection';
import { SystemHierarchySection } from '../../components/landing/SystemHierarchySection';
import { AnomalyDetectionSection } from '../../components/landing/AnomalyDetectionSection';
import { IncidentDetectionSection } from '../../components/landing/IncidentDetectionSection';
import { DeploymentCorrelationSection } from '../../components/landing/DeploymentCorrelationSection';
import { HowItWorksSection } from '../../components/landing/HowItWorksSection';
import { ProductPreviewSection } from '../../components/landing/ProductPreviewSection';
import { CtaSection } from '../../components/landing/CtaSection';
import { LandingFooter } from '../../components/landing/LandingFooter';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');

  const handleStart = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#06080C] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-200 overflow-x-hidden font-sans antialiased">
      {/* Sleek Minimal Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-36 sm:pt-44 pb-20 overflow-hidden text-left sm:text-left">
        {/* Background Celestial Spheres & Clean Grid */}
        <HeroBackground />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          
          {/* Release Pill Badge (Styled exactly like reference screenshot) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs font-normal text-slate-300 mb-8 hover:border-white/20 transition-colors"
          >
            <span>Brand new release: v1.8 Professional</span>
          </motion.div>

          {/* Main Clean Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.08] max-w-4xl"
          >
            Monitor. Detect.{' '}
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-[#A7F3D0]">
              Investigate.
            </span>
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal"
          >
            FaultLens gives developers real-time visibility into API health, detects abnormal behavior, and connects incidents to deployments before small issues become major outages. Built with developers in mind.
          </motion.p>

          {/* Combined CTA Pill Bar (Styled exactly like reference image) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <form
              onSubmit={handleStart}
              className="inline-flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md max-w-md w-full gap-2 shadow-xl shadow-black/40"
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-100 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Start Monitoring
              </button>

              <input
                type="text"
                placeholder="your email or api endpoint"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
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
          </motion.div>

          {/* Clean 6-Stage Hero Product Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          >
            <HeroProductVisual />
          </motion.div>

        </div>
      </section>

      {/* Trust & Real-Time Metrics Strip */}
      <TrustMetricsStrip />

      {/* Live System Glimpse (Framer Motion Interactive Inspector) */}
      <LiveGlimpseSection />

      {/* "One Lens for Your Entire System" Hierarchy */}
      <SystemHierarchySection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Anomaly Detection Section */}
      <AnomalyDetectionSection />

      {/* Incident Detection Section */}
      <IncidentDetectionSection />

      {/* Deployment Correlation Section */}
      <DeploymentCorrelationSection />

      {/* Full Console Product Preview in Browser Frame */}
      <ProductPreviewSection />

      {/* Clean Dark CTA Section */}
      <CtaSection />

      {/* Clean Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
