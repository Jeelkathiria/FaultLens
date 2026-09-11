import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const HeroBackground = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Deep Obsidian Matte Void Background */}
      <div className="absolute inset-0 bg-[#06080C]" />

      {/* Clean Orthogonal Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 20%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 20%, transparent 85%)'
        }}
      />

      {/* Grid Intersection Crosshair Glints (like in reference image) */}
      <div className="absolute top-28 left-1/3 w-px h-6 bg-emerald-400/40 blur-[0.5px]" />
      <div className="absolute top-[7.5rem] left-[calc(33.33%-12px)] w-6 h-px bg-emerald-400/40 blur-[0.5px]" />

      <div className="absolute top-44 left-1/2 w-px h-8 bg-emerald-400/50 blur-[0.5px]" />
      <div className="absolute top-[11.8rem] left-[calc(50%-16px)] w-8 h-px bg-emerald-400/50 blur-[0.5px]" />

      <div className="absolute top-36 right-1/4 w-px h-6 bg-emerald-400/30 blur-[0.5px]" />
      <div className="absolute top-[9.5rem] right-[calc(25%-12px)] w-6 h-px bg-emerald-400/30 blur-[0.5px]" />

      {/* Top-Left Dark Celestial Sphere with Subtle Edge Rim Light */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -8, 0],
                x: [0, 4, 0]
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 75% 75%, #0A0E15 0%, #06080C 70%)',
          boxShadow: 'inset -2px -2px 25px rgba(255, 255, 255, 0.08), 0 0 60px rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Sphere Edge Rim Crescent */}
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: 'conic-gradient(from 135deg at 50% 50%, rgba(255,255,255,0.25) 0deg, rgba(52,211,153,0.3) 40deg, transparent 90deg)'
          }}
        />
      </motion.div>

      {/* Bottom-Right Massive Celestial Sphere with Radiant Emerald Rim Light */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -12, 0],
                scale: [1, 1.01, 1]
              }
        }
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[28rem] sm:top-[22rem] lg:top-[16rem] -right-36 sm:-right-24 lg:-right-16 w-[540px] h-[540px] sm:w-[720px] sm:h-[720px] lg:w-[840px] lg:h-[840px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #0B0F16 0%, #07090E 50%, #05070A 90%)',
          boxShadow: `
            inset 2px 2px 20px rgba(52, 211, 153, 0.25),
            inset 0 0 60px rgba(16, 185, 129, 0.1),
            0 -10px 80px -20px rgba(52, 211, 153, 0.25)
          `,
          borderTop: '1.5px solid rgba(52, 211, 153, 0.55)',
          borderLeft: '1px solid rgba(52, 211, 153, 0.25)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
        }}
      >
        {/* Upper Rim Soft Glow */}
        <div className="absolute -top-12 left-1/4 w-3/4 h-28 bg-emerald-500/15 blur-[45px] rounded-full" />
      </motion.div>

      {/* Ambient Deep Atmospheric Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
    </div>
  );
};
