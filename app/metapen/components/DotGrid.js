'use client';

import { theme } from './theme';

/** 50-agent concept grid. First `activeConcept` dots glow; named tools tint; rest muted. */
export default function DotGrid({ claw, cols = 10, large = false }) {
  const size = large ? 10 : 6;
  const gap = large ? 4 : 3;
  return (
    <div
      title="Concept agent slots — not live workers"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap,
        width: 'fit-content',
      }}
    >
      {claw.tools.map((tool, i) => {
        const active = i < claw.activeConcept;
        const assigned = tool.assigned;
        let bg = '#1e293b';
        if (active) bg = theme.accent;
        else if (assigned) bg = '#14532d';
        return (
          <span
            key={tool.id}
            style={{
              width: size, height: size, borderRadius: 2,
              background: bg,
              boxShadow: active ? `0 0 6px ${theme.accent}` : 'none',
              opacity: assigned || active ? 1 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}
