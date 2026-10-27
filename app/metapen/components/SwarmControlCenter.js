'use client';

import { useMemo, useState } from 'react';
import { CLAWS } from '../../../lib/claws.mjs';
import DragonCore from './DragonCore';
import ClawCard, { ClawExpandPanel } from './ClawCard';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MuseCliStrip from './MuseCliStrip';
import { Badge, theme } from './theme';

export default function SwarmControlCenter({ swarm, caps, jobs, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const expanded = useMemo(() => CLAWS.find((c) => c.id === expandedId) || null, [expandedId]);
  const pendingCount = (caps?.approvals || []).filter((a) => a.state === 'pending').length;
  const jobCount = jobs?.length || 0;

  function toggle(id) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  // Arrange 10 claws: 5 left, 5 right of the brain (responsive stack on narrow).
  const leftClaws = CLAWS.slice(0, 5);
  const rightClaws = CLAWS.slice(5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="mp-swarm-grid" style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr) 260px',
        gap: 14,
        alignItems: 'start',
      }}>
        <style>{`
          @media (max-width: 1100px) {
            .mp-swarm-grid { grid-template-columns: 1fr !important; }
            .mp-claw-orbit { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <LeftSidebar selectedId={expandedId} onSelect={toggle} />

        <section style={{
          background: theme.panel, border: `1px solid ${theme.panelBorder}`,
          borderRadius: 14, padding: 14, minHeight: 520,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong style={{ fontSize: 15, color: theme.accentSoft }}>Claw Swarm · Kali Dragon</strong>
              <Badge tone="concept">concept layout</Badge>
            </div>
            <div style={{ fontSize: 11, color: theme.muted }}>
              Live gateway roles: {swarm ? `${swarm.rolesConfigured}/${swarm.roleCount}` : '—'}
              {swarm?.ready ? <Badge tone="live">ready</Badge> : <Badge tone="warn">not configured</Badge>}
            </div>
          </div>

          <div className="mp-claw-orbit" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 240px 1fr',
            gap: 12,
            alignItems: 'center',
          }}>
            <div style={{ display: 'grid', gap: 8 }}>
              {leftClaws.map((claw) => (
                <ClawCard key={claw.id} claw={claw} expanded={expandedId === claw.id} onToggle={toggle} />
              ))}
            </div>

            <div style={{ position: 'relative', padding: '20px 0 36px' }}>
              {/* connector rays (decorative) */}
              <svg viewBox="0 0 240 240" width="240" height="240" style={{ position: 'absolute', inset: 0, margin: 'auto', opacity: 0.35, pointerEvents: 'none' }} aria-hidden>
                {Array.from({ length: 10 }).map((_, i) => {
                  const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
                  const x2 = 120 + Math.cos(a) * 110;
                  const y2 = 120 + Math.sin(a) * 110;
                  return <line key={i} x1="120" y1="120" x2={x2} y2={y2} stroke="#16a34a" strokeWidth="1" />;
                })}
              </svg>
              <DragonCore />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {rightClaws.map((claw) => (
                <ClawCard key={claw.id} claw={claw} expanded={expandedId === claw.id} onToggle={toggle} />
              ))}
            </div>
          </div>

          {expanded ? <ClawExpandPanel claw={expanded} onClose={() => setExpandedId(null)} /> : null}

          <p style={{ fontSize: 11, color: theme.concept, margin: '12px 0 0' }}>
            ACTIVE / 50 counts and the 50-dot grids are concept/target agent slots. Named tools are a roster catalog;
            unassigned slots are empty. Live advisory swarm remains the 6 gateway roles from /api/swarm.
          </p>
        </section>

        <RightSidebar caps={caps} onRefresh={onRefresh} />
      </div>

      <div style={{ marginTop: 12 }}>
        <MuseCliStrip swarm={swarm} pendingCount={pendingCount} jobCount={jobCount} />
      </div>
    </div>
  );
}
