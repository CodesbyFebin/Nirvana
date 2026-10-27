'use client';

import { theme } from './theme';

/** CSS/SVG neon dragon emblem — approximate; no licensed art claimed. */
export default function DragonCore() {
  return (
    <div className="mp-dragon-wrap" style={{
      position: 'relative', width: '100%', maxWidth: 280, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <style>{`
        @keyframes mp-dragon-pulse {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(34,211,238,0.55)) drop-shadow(0 0 28px rgba(74,222,128,0.35)); }
          50% { filter: drop-shadow(0 0 22px rgba(34,211,238,0.85)) drop-shadow(0 0 48px rgba(74,222,128,0.5)); }
        }
        @keyframes mp-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .mp-dragon-svg { animation: mp-dragon-pulse 3.2s ease-in-out infinite; }
        .mp-orbit-ring {
          position: absolute; inset: 18% 12%; border-radius: 50%;
          border: 1px dashed rgba(34,211,238,0.25);
          animation: mp-ring 48s linear infinite; pointer-events: none;
        }
      `}</style>

      <div style={{
        textAlign: 'center', padding: '6px 14px', borderRadius: 8,
        border: `1px solid ${theme.panelBorderStrong}`,
        background: 'rgba(2,14,24,0.75)',
        boxShadow: theme.glowCyan,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 800, letterSpacing: 2,
          background: 'linear-gradient(90deg, #67e8f9, #4ade80, #22d3ee)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}>MeTaPeN</div>
        <div style={{ fontSize: 10, color: theme.cyanSoft, letterSpacing: 0.6, marginTop: 2 }}>
          Muse Wonder / Neural Orchestration
        </div>
      </div>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div className="mp-orbit-ring" />
        <svg className="mp-dragon-svg" viewBox="0 0 200 200" width="200" height="200" aria-hidden>
          <defs>
            <radialGradient id="mpGlow" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mpBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="78" fill="url(#mpGlow)" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" />
          {/* Stylized S-curve dragon silhouette */}
          <path
            d="M58 128 C 52 96, 68 62, 98 54 C 128 46, 152 62, 148 88 C 144 112, 118 118, 108 102 C 98 86, 118 72, 136 78 C 158 86, 164 118, 142 140 C 120 162, 86 158, 70 140 C 62 132, 60 132, 58 128 Z"
            fill="none" stroke="url(#mpBody)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M72 118 C 78 98, 96 88, 112 92 C 128 96, 134 112, 122 122 C 110 132, 90 128, 80 118"
            fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.85"
          />
          {/* Eye */}
          <circle cx="118" cy="78" r="4" fill="#ecfeff" />
          <circle cx="119" cy="77" r="1.6" fill="#022c22" />
          {/* Circuit ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (Math.PI * 2 * i) / 12;
            const x1 = 100 + Math.cos(a) * 70;
            const y1 = 100 + Math.sin(a) * 70;
            const x2 = 100 + Math.cos(a) * 78;
            const y2 = 100 + Math.sin(a) * 78;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(34,211,238,0.45)" strokeWidth="1.2" />;
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={chip}>SHA256 / RECEIPT HASH</span>
        <span style={{ ...chip, borderColor: 'rgba(251,191,36,0.45)', color: theme.warn, boxShadow: '0 0 10px rgba(251,191,36,0.15)' }}>
          ⚠ zkVM NOT CONFIGURED
        </span>
      </div>
    </div>
  );
}

const chip = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.5,
  padding: '4px 10px',
  borderRadius: 999,
  border: `1px solid ${theme.panelBorder}`,
  background: 'rgba(2,14,24,0.85)',
  color: theme.cyanSoft,
  boxShadow: theme.glowCyan,
};
