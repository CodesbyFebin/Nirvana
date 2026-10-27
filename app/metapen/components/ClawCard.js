'use client';

import { useState } from 'react';
import { theme, Badge } from './theme';

const ICONS = {
  RECON: '◎', WEB: '◈', API: '⬡', IDENTITY: '◈', SOURCE: '⟨⟩',
  DEPENDENCIES: '⧉', CONFIG: '⚙', CLOUD: '☁', DEFENSE: '⛨', EVIDENCE: '▣',
};

export default function ClawCard({ claw, side = 'left' }) {
  const [hover, setHover] = useState(false);
  const tools = (claw.tools || []).filter((t) => t.assigned).slice(0, 4).map((t) => t.name);
  const icon = ICONS[claw.domain] || '◆';
  const filled = Math.max(1, Math.min(10, Math.ceil((claw.activeConcept / claw.capacity) * 10)));

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: hover ? 'rgba(8,28,42,0.95)' : theme.tile,
        border: `1px solid ${hover ? theme.panelBorderStrong : theme.panelBorder}`,
        borderRadius: 8,
        padding: '7px 9px',
        boxShadow: hover ? theme.glowCyan : 'inset 0 0 0 1px rgba(34,211,238,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        minHeight: 68,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center',
          border: `1px solid ${theme.panelBorder}`, color: theme.cyan, fontSize: 11,
          background: 'rgba(2,20,32,0.8)', flexShrink: 0,
          boxShadow: '0 0 8px rgba(34,211,238,0.25)',
        }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, color: theme.text }}>
              {claw.domain} CLAN
            </span>
            <Badge tone="working">WORKING</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: 1,
                  background: i < filled ? theme.cyan : 'rgba(15,30,42,0.9)',
                  boxShadow: i < filled ? '0 0 4px rgba(34,211,238,0.5)' : 'none',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 9, color: theme.muted }}>
              <span style={{ color: theme.greenSoft, fontWeight: 700 }}>{claw.activeConcept}</span>
              {' / '}{claw.capacity}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {tools.map((name) => (
          <span key={name} style={{
            fontSize: 8, padding: '2px 5px', borderRadius: 3,
            border: '1px solid rgba(34,211,238,0.22)',
            background: 'rgba(2,16,26,0.85)', color: theme.cyanSoft, letterSpacing: 0.2,
          }}>{name}</span>
        ))}
      </div>
      {hover && (
        <div style={{
          position: 'absolute',
          ...(side === 'left' ? { right: 5 } : { left: 5 }),
          top: 5,
          display: 'flex', gap: 4,
        }}>
          <button type="button" style={btn}>Pause Clan</button>
          <button type="button" style={btn}>Inspect</button>
        </div>
      )}
    </div>
  );
}

const btn = {
  fontSize: 8, fontWeight: 700, letterSpacing: 0.3, padding: '3px 7px',
  borderRadius: 4, cursor: 'pointer',
  border: `1px solid ${theme.panelBorderStrong}`,
  background: 'rgba(2,20,32,0.95)', color: theme.cyanSoft,
};
