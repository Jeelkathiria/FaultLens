import React from 'react';

/**
 * TechGeometricArtwork
 * Renders the modernist geometric abstract mosaic illustration matching the reference design:
 * - Deep navy, royal violet, cobalt, and cyan color palette
 * - Isometric 3D cube mesh, frequency barcode lines, golden starburst
 * - Tulip petal curves, radiating dandelion antenna, wavy sine ripples, and dotted matrices
 */
export const TechGeometricArtwork = () => {
  return (
    <div className="relative w-full h-full min-h-[540px] lg:min-h-full overflow-hidden select-none bg-[#0B0F28]">
      <svg
        viewBox="0 0 540 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7E22CE" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>

          <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>

          <linearGradient id="sunGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Dotted Grid Pattern for Navy Blocks */}
          <pattern id="dotMatrix" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3B82F6" fillOpacity="0.35" />
          </pattern>

          {/* Cube Texture Pattern */}
          <pattern id="concentricArcs" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="5" stroke="#4338CA" strokeWidth="1" fill="none" opacity="0.4" />
            <circle cx="15" cy="15" r="10" stroke="#4338CA" strokeWidth="1" fill="none" opacity="0.3" />
            <circle cx="15" cy="15" r="14" stroke="#4338CA" strokeWidth="1" fill="none" opacity="0.2" />
          </pattern>
        </defs>

        {/* ---------------- BACKGROUND PANELS ---------------- */}
        {/* Top-Left: Rich Violet Panel */}
        <rect x="0" y="0" width="170" height="175" fill="#6B21A8" />

        {/* Top-Center: Midnight Navy Panel */}
        <rect x="170" y="0" width="160" height="175" fill="#0A0E27" />

        {/* Top-Right: Dark Blue Cube Matrix Area */}
        <rect x="330" y="0" width="210" height="175" fill="#131B3E" />

        {/* Middle-Left to Center: Royal Deep Blue */}
        <rect x="0" y="175" width="260" height="205" fill="#141E47" />

        {/* Middle-Right: Cobalt Indigo */}
        <rect x="260" y="175" width="280" height="205" fill="#1B2559" />

        {/* Horizontal Middle Deep Indigo Strip */}
        <rect x="0" y="375" width="540" height="85" fill="#283593" />

        {/* Bottom Panel: Dark Navy */}
        <rect x="0" y="460" width="540" height="180" fill="#0A0D24" />

        {/* ---------------- TOP LEFT: TULIP / PETAL FORMS ---------------- */}
        {/* Left Petal */}
        <path
          d="M 10 175 C 10 70 85 20 85 20 C 85 20 85 100 85 175 Z"
          fill="#8B5CF6"
          fillOpacity="0.85"
        />
        {/* Right Petal */}
        <path
          d="M 160 175 C 160 70 85 20 85 20 C 85 20 85 100 85 175 Z"
          fill="#A855F7"
          fillOpacity="0.9"
        />

        {/* ---------------- TOP CENTER: DIAMONDS, EQUALIZER, STRIPES ---------------- */}
        {/* Dotted Grid Background Accent in Top Center */}
        <rect x="245" y="15" width="75" height="40" fill="url(#dotMatrix)" />

        {/* Two Angled Diamonds */}
        <polygon points="195,35 208,22 221,35 208,48" fill="#EF4444" />
        <polygon points="218,35 231,22 244,35 231,48" fill="#F59E0B" />

        {/* Cyan Electric Bar */}
        <rect x="180" y="65" width="125" height="10" rx="3" fill="#00D2FF" />

        {/* Barcode / Frequency Equalizer (Alternating vertical white stripes) */}
        <rect x="180" y="80" width="125" height="18" fill="#0A0E27" />
        {Array.from({ length: 24 }).map((_, i) => (
          <rect
            key={i}
            x={182 + i * 5}
            y={82}
            width={i % 3 === 0 ? 3 : 2}
            height={14}
            fill="#FFFFFF"
            rx={0.5}
          />
        ))}

        {/* Lower Indigo Accent Bar */}
        <rect x="180" y="112" width="85" height="8" rx="2" fill="#4F46E5" />

        {/* ---------------- TOP RIGHT: ISOMETRIC 3D CUBES WITH RIPPLES ---------------- */}
        <g opacity="0.8">
          {/* Main Top Cube */}
          {/* Top Face */}
          <polygon points="410,15 465,45 410,75 355,45" fill="#312E81" />
          {/* Left Face */}
          <polygon points="355,45 410,75 410,140 355,110" fill="#1E1B4B" />
          {/* Right Face */}
          <polygon points="410,75 465,45 465,110 410,140" fill="#3730A3" />

          {/* Isometric wireframe lines & concentric patterns */}
          <line x1="410" y1="75" x2="410" y2="140" stroke="#4F46E5" strokeWidth="1.5" />
          <line x1="355" y1="45" x2="410" y2="75" stroke="#4F46E5" strokeWidth="1.5" />
          <line x1="465" y1="45" x2="410" y2="75" stroke="#4F46E5" strokeWidth="1.5" />

          {/* Optical ripple overlay inside cubes */}
          <circle cx="380" cy="95" r="18" stroke="#6366F1" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="380" cy="95" r="10" stroke="#6366F1" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="380" cy="95" r="4" stroke="#6366F1" strokeWidth="1" fill="none" opacity="0.2" />

          <circle cx="440" cy="95" r="16" stroke="#818CF8" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="440" cy="95" r="8" stroke="#818CF8" strokeWidth="1" fill="none" opacity="0.3" />

          {/* Second Adjacent Cube Outline */}
          <polygon points="465,45 520,75 465,105 410,75" fill="#1E293B" opacity="0.5" />
          <polygon points="465,105 520,75 520,135 465,165" fill="#0F172A" opacity="0.7" />
        </g>

        {/* ---------------- MIDDLE SECTION: CHEVRONS, LEAF, BRAID, STARBURST ---------------- */}
        {/* Double Upward Blue Triangles / Chevrons */}
        <polygon points="30,225 50,195 70,225" fill="#4338CA" />
        <polygon points="30,255 50,225 70,255" fill="#4F46E5" />

        {/* Botanical White Petal Cluster & Sparkle Star */}
        <g transform="translate(145, 185)">
          {/* Top Petal */}
          <ellipse cx="20" cy="12" rx="10" ry="6" fill="#818CF8" />
          {/* Middle Petals */}
          <ellipse cx="12" cy="24" rx="10" ry="6" transform="rotate(-25 12 24)" fill="#A5B4FC" />
          <ellipse cx="28" cy="24" rx="10" ry="6" transform="rotate(25 28 24)" fill="#A5B4FC" />
          {/* White 4-Point Diamond Sparkle Star */}
          <path
            d="M 20 38 Q 20 48 10 48 Q 20 48 20 58 Q 20 48 30 48 Q 20 48 20 38 Z"
            fill="#FFFFFF"
          />
        </g>

        {/* Vertical Digital Wavy / Herringbone Braid Pattern */}
        <g transform="translate(225, 195)" stroke="#6366F1" strokeWidth="3" strokeLinecap="round">
          <line x1="0" y1="0" x2="6" y2="8" />
          <line x1="6" y1="8" x2="0" y2="16" />
          <line x1="0" y1="16" x2="6" y2="24" />
          <line x1="6" y1="24" x2="0" y2="32" />

          <line x1="12" y1="0" x2="18" y2="8" />
          <line x1="18" y1="8" x2="12" y2="16" />
          <line x1="12" y1="16" x2="18" y2="24" />
          <line x1="18" y1="24" x2="12" y2="32" />
        </g>

        {/* Middle Right: Horizontal Shadow Striped Hemisphere */}
        <g opacity="0.35">
          <ellipse cx="460" cy="235" rx="75" ry="45" fill="#3B82F6" />
          <line x1="390" y1="220" x2="530" y2="220" stroke="#0F172A" strokeWidth="4" />
          <line x1="385" y1="235" x2="535" y2="235" stroke="#0F172A" strokeWidth="5" />
          <line x1="395" y1="250" x2="525" y2="250" stroke="#0F172A" strokeWidth="4" />
        </g>

        {/* ---------------- GOLDEN 8-POINT STARBURST ---------------- */}
        <g transform="translate(295, 280)">
          {/* 8-Point Star with Yellow Glow */}
          <polygon
            points="0,-26 6,-8 24,-12 11,4 20,20 2,12 -8,25 -8,8 -25,4 -10,-8 -18,-22 -3,-10"
            fill="url(#sunGlow)"
            className="filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
          />
        </g>

        {/* ---------------- TEAL / CYAN OVERLAY RECTANGLE ---------------- */}
        <g transform="translate(26, 290)">
          <rect
            x="0"
            y="0"
            width="65"
            height="85"
            rx="4"
            fill="url(#tealGrad)"
            className="shadow-2xl"
          />
          {/* Angular Inner Shadow Accent */}
          <polygon points="65,0 35,85 65,85" fill="#0891B2" opacity="0.4" />
        </g>

        {/* Fine Horizontal Parallel Guide Lines Behind Teal */}
        <line x1="15" y1="275" x2="280" y2="275" stroke="#0F172A" strokeWidth="3" />
        <line x1="15" y1="285" x2="280" y2="285" stroke="#0F172A" strokeWidth="3" />
        <line x1="15" y1="295" x2="280" y2="295" stroke="#0F172A" strokeWidth="3" />

        {/* 4 Subtle Muted Purple Horizontal Dots/Pills */}
        <circle cx="360" cy="280" r="5" fill="#3B82F6" fillOpacity="0.4" />
        <circle cx="376" cy="280" r="5" fill="#3B82F6" fillOpacity="0.4" />
        <circle cx="392" cy="280" r="5" fill="#3B82F6" fillOpacity="0.4" />
        <circle cx="408" cy="280" r="5" fill="#3B82F6" fillOpacity="0.4" />

        {/* ---------------- RADIATING ANTENNA / DANDELION SATELLITE BURST ---------------- */}
        <g transform="translate(425, 335)">
          {/* Radiating spokes */}
          {[-70, -50, -35, -20, -5, 10, 25, 40, 55, 70].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const r1 = 12;
            const r2 = 38 + (i % 2 === 0 ? 6 : 0);
            const x1 = Math.sin(rad) * r1;
            const y1 = -Math.cos(rad) * r1;
            const x2 = Math.sin(rad) * r2;
            const y2 = -Math.cos(rad) * r2;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#CBD5E1" strokeWidth="1.2" opacity="0.85" />
                <circle cx={x2} cy={y2} r="2.5" fill="#C084FC" />
              </g>
            );
          })}
          {/* Base Arc */}
          <path d="M -25 0 A 25 25 0 0 1 25 0 Z" fill="#1E1B4B" />
        </g>

        {/* ---------------- BOTTOM SECTION: SWEEP RADAR, SINE WAVES, DOT MATRIX ---------------- */}
        {/* Curving concentric guide lines */}
        <path
          d="M 25 435 Q 70 435 70 480 Q 70 515 25 515"
          fill="none"
          stroke="#1E293B"
          strokeWidth="2.5"
        />
        <path
          d="M 35 442 Q 60 442 60 480 Q 60 505 35 505"
          fill="none"
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* Bottom Left: Concentric Purple Arc Sector */}
        <g transform="translate(0, 500)">
          <path
            d="M 0 140 A 140 140 0 0 1 120 40 L 0 40 Z"
            fill="#7C3AED"
            opacity="0.9"
          />
          {/* Inner concentric ring ripples */}
          <circle cx="0" cy="140" r="100" stroke="#9333EA" strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="0" cy="140" r="60" stroke="#C084FC" strokeWidth="1.5" fill="none" opacity="0.5" />
          <circle cx="0" cy="140" r="25" stroke="#E9D5FF" strokeWidth="1" fill="none" opacity="0.4" />
        </g>

        {/* Large Curving Deep Navy Runway / Band */}
        <path
          d="M 380 340 L 490 340 A 60 60 0 0 1 540 400 L 540 420 A 40 40 0 0 1 500 460 L 415 460 A 85 85 0 0 0 330 545 L 330 550 L 375 550 A 40 40 0 0 1 415 510 L 490 510 A 90 90 0 0 0 540 420"
          fill="#060919"
        />

        {/* Large Royal Blue / Indigo Circular Quadrant / Sector */}
        <g transform="translate(420, 540)">
          {/* Bottom-right sector */}
          <path
            d="M 0 0 L 70 0 A 70 70 0 0 1 0 70 Z"
            fill="#3B82F6"
            opacity="0.8"
          />
          {/* Top-right sector */}
          <path
            d="M 0 0 L 85 0 A 85 85 0 0 0 0 -85 Z"
            fill="#1D4ED8"
            opacity="0.9"
          />
          {/* Top-left sector */}
          <path
            d="M 0 0 L 0 -85 A 85 85 0 0 0 -85 0 Z"
            fill="#4F46E5"
            opacity="0.95"
          />
          {/* Bottom-left sector */}
          <path
            d="M 0 0 L -85 0 A 85 85 0 0 0 0 85 Z"
            fill="#6D28D9"
            opacity="0.9"
          />

          {/* Central Target Pivot Point with ring and white dot */}
          <line x1="0" y1="0" x2="0" y2="-90" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
          <circle cx="0" cy="0" r="10" fill="#1E1B4B" />
          <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
        </g>

        {/* Teal Block Inset at Bottom Right */}
        <rect x="420" y="590" width="75" height="50" fill="#06B6D4" />

        {/* Triple Sine Waves (White/Blue ripples) in Lower Middle */}
        <g transform="translate(335, 560)" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.85">
          <path d="M 0 0 Q 7 -6 14 0 T 28 0 T 42 0 T 56 0 T 70 0" />
          <path d="M 0 10 Q 7 4 14 10 T 28 10 T 42 10 T 56 10 T 70 10" />
          <path d="M 0 20 Q 7 14 14 20 T 28 20 T 42 20 T 56 20 T 70 20" />
        </g>

        {/* Bottom Right Dot Matrix (5 rows of 4 teal dots) */}
        <g transform="translate(475, 535)">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 10}
                cy={row * 12}
                r="2.5"
                fill="#FFFFFF"
                opacity="0.9"
              />
            ))
          )}
        </g>
      </svg>
    </div>
  );
};
