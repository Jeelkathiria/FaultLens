import React from 'react';

export const FaultLensLogo = ({
  size = 28,
  showText = true,
  className = '',
  iconClassName = '',
  textClassName = '',
  light = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek, Compact Stylized Lens & Pulse Icon */}
      <div
        className={`relative flex items-center justify-center rounded-lg ${
          light
            ? 'bg-slate-900/[0.04] border border-slate-200 shadow-2xs'
            : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 shadow-sm shadow-black/50'
        } shrink-0 group hover:border-[#00C2CB]/40 transition-colors ${iconClassName}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 relative z-10"
        >
          <defs>
            <linearGradient id="flCyanGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00C2CB" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="flPulseGrad" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#00C2CB" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Precision Optical Aperture Circle */}
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="url(#flCyanGrad)"
            strokeWidth="1.8"
            strokeDasharray="4 2"
            className="opacity-80 group-hover:opacity-100 transition-opacity"
          />

          {/* Precision Crosshair Ticks */}
          <line x1="16" y1="3" x2="16" y2="6" stroke="#00C2CB" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="16" y1="26" x2="16" y2="29" stroke="#00C2CB" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="3" y1="16" x2="6" y2="16" stroke="#00C2CB" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="26" y1="16" x2="29" y2="16" stroke="#00C2CB" strokeWidth="1.4" strokeLinecap="round" />

          {/* Telemetry Waveform passing through the lens */}
          <path
            d="M 5 16 H 11 L 13.5 11 L 16.5 21 L 18.5 13 L 20.5 17 L 22 16 H 27"
            stroke="url(#flPulseGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Focal Point Indicator */}
          <circle cx="16.5" cy="21" r="1.4" fill="#00C2CB" />
          <circle cx="16.5" cy="21" r="0.8" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Stylized "FaultLens" Wordmark */}
      {showText && (
        <div className="flex items-center tracking-tight">
          <span
            className={`font-extrabold tracking-tight ${
              light ? 'text-slate-900' : 'text-white'
            } ${textClassName || 'text-lg'}`}
          >
            Fault
          </span>
          <span
            className={`font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00C2CB] via-[#38BDF8] to-[#34D399] ${
              textClassName || 'text-lg'
            }`}
          >
            Lens
          </span>
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#00C2CB] animate-pulse" />
        </div>
      )}
    </div>
  );
};
