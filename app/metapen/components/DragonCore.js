'use client';

import { Badge, theme } from './theme';

export default function DragonCore() {
  return (
    <div className="mp-dragon-wrap" style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
      <style>{`
        @keyframes mp-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 24px #16a34a88, 0 0 60px #14532d66; }
          50% { transform: scale(1.06); box-shadow: 0 0 40px #4ade80aa, 0 0 90px #16a34a55; }
        }
        @keyframes mp-float {
          0%, 100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        .mp-core {
          width: 140px; height: 140px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #86efac, #16a34a 45%, #052e16 80%);
          border: 2px solid #4ade80;
          animation: mp-pulse 2.8s ease-in-out infinite;
          display: flex; align-items: center; justify-content: center;
          position: absolute; left: 40px; top: 40px; z-index: 2;
        }
        .mp-tag {
          position: absolute; font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          padding: 3px 8px; border-radius: 999px; border: 1px solid #334155;
          background: #0f172acc; color: #94a3b8; animation: mp-float 3.5s ease-in-out infinite;
          white-space: nowrap; z-index: 3;
        }
      `}</style>
      <span className="mp-tag" style={{ top: 8, left: 8, animationDelay: '0s' }}>SHA256</span>
      <span className="mp-tag" style={{ top: 8, right: 4, animationDelay: '0.6s' }}>ZK-SNARK</span>
      <span className="mp-tag" style={{ bottom: 18, left: 24, animationDelay: '1.1s' }}>VERIFIED</span>
      <div className="mp-core" title="Kali Dragon — conceptual core">
        <div style={{ textAlign: 'center', color: '#052e16', lineHeight: 1.15 }}>
          <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 4px #fff8)' }} aria-hidden>🐉</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>KALI</div>
          <div style={{ fontSize: 9, fontWeight: 700 }}>DRAGON</div>
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: -2, left: 0, right: 0, textAlign: 'center',
        fontSize: 10, color: theme.concept, 'zIndex': 4,
      }}>
        <Badge tone="concept">concept</Badge>
        <Badge tone="planned">Planned proofs</Badge>
        <div style={{ marginTop: 4 }}>No live zkVM / hash proof claimed</div>
      </div>
    </div>
  );
}
