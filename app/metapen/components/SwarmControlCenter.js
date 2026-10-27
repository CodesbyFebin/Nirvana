'use client';

import { CLAWS, coverageMatrix } from '../../../lib/claws.mjs';
import { theme } from './theme';
import DragonCore from './DragonCore';
import ClawCard from './ClawCard';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

export default function SwarmControlCenter({ swarm, caps, jobs, desk }) {
  const claws = CLAWS;
  const matrix = coverageMatrix();
  const left = claws.slice(0, 5);
  const right = claws.slice(5, 10);

  return (
    <div className="mp-swarm-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(190px, 230px) minmax(0, 1fr) minmax(200px, 250px)',
      gap: 10,
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      padding: '0 10px',
    }}>
      <style>{`
        @media (max-width: 1100px) {
          .mp-swarm-grid { grid-template-columns: 1fr !important; overflow: auto !important; }
          .mp-claw-orbit { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <LeftSidebar claws={claws} matrix={matrix} />

      <div className="mp-claw-orbit" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(130px, 1fr) minmax(190px, 260px) minmax(130px, 1fr)',
        gap: 8,
        alignItems: 'center',
        minHeight: 0,
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {left.map((c) => <ClawCard key={c.id} claw={c} side="left" />)}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 260, borderRadius: 12, padding: 8,
          border: `1px solid ${theme.panelBorder}`,
          background: 'radial-gradient(ellipse at center, rgba(8,40,56,0.55) 0%, rgba(2,10,16,0.15) 70%)',
          boxShadow: 'inset 0 0 40px rgba(34,211,238,0.08)',
          gap: 6,
        }}>
          <DragonCore />
          <div style={{ fontSize: 9, color: theme.muted, textAlign: 'center' }}>
            Live gateway: {swarm ? `${swarm.rolesConfigured}/${swarm.roleCount}` : '—'}
            {swarm?.ready ? ' · ready' : ' · not configured'}
            {typeof jobs?.length === 'number' ? ` · jobs ${jobs.length}` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {right.map((c) => <ClawCard key={c.id} claw={c} side="right" />)}
        </div>
      </div>

      <RightSidebar
        desk={desk}
        verification={jobs?.length ? { summary: `${jobs.length} verification job(s) from /api/verification` } : null}
        capabilities={caps}
      />
    </div>
  );
}
