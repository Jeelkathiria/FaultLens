import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaultLensLogo } from '../common/FaultLensLogo';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';

export const LandingNavbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Dual Monitoring', href: '#dual-monitoring', hasDropdown: false },
    { label: 'Live Pipeline', href: '#pipeline', hasDropdown: false },
    { label: 'Architecture', href: '#hierarchy', hasDropdown: false },
    { label: 'Anomaly Engine', href: '#anomaly-detection', hasDropdown: false },
    { label: 'Correlation', href: '#correlation', hasDropdown: false },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#06080C]/85 backdrop-blur-md border-b border-white/[0.06] py-3.5 shadow-2xl shadow-black/60'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <FaultLensLogo size={32} textClassName="text-lg font-semibold tracking-tight" />
        </Link>

        {/* Center Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-normal text-slate-300">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="flex items-center gap-1 hover:text-white transition-colors duration-150"
            >
              <span>{link.label}</span>
              {link.hasDropdown && (
                <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              )}
            </a>
          ))}
          <Link
            to="/dashboard"
            className="hover:text-white transition-colors duration-150"
          >
            Dashboard
          </Link>
        </nav>

        {/* Right Authentication & Join Now Pill Button */}
        <div className="hidden sm:flex items-center gap-5">
          <Link
            to="/login"
            className="text-[13px] font-normal text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-100 text-[13px] font-semibold shadow-md shadow-white/5 transition-all duration-150 active:scale-95"
          >
            Join now
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#06080C]/95 backdrop-blur-2xl border-b border-white/[0.08] px-6 py-5 space-y-4"
          >
            <div className="space-y-2 text-sm font-medium">
              {navLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-slate-300 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-white"
              >
                Dashboard
              </Link>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-white/10 text-xs font-medium text-slate-200"
              >
                Log in
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full py-2.5 rounded-lg bg-white text-black text-xs font-semibold"
              >
                Join now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
