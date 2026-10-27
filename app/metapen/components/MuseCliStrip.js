'use client';

import { useEffect, useState } from 'react';
import { theme } from './theme';

export default function MuseCliStrip({ swarm, pendingCount, jobCount }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const stamp = new Date().toLocaleTimeString();
    const lines = [
      `[${stamp}] muse async cli ready — concept strip (no remote shell attached)`,
      `[${stamp}] swarm roles configured: ${swarm ? `${swarm.rolesConfigured}/${swarm.roleCount}` : 'n/a'} (live /api/swarm)`,
      `[${stamp}] pending JeV approvals: ${pendingCount} · verification jobs: ${jobCount}`,
      `[${stamp}] hint: muse exec --json <approved task>  # after TTY approve only`,
    ];
    setLogs(lines);
  }, [swarm, pendingCount, jobCount]);

  return (
    <footer style={{
      borderTop: `1px solid ${theme.panelBorder}`, background: '#040806',
      padding: '10px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 12, color: theme.accent, letterSpacing: 0.6 }}>
          MUSE CODE / ASYNC CLI
        </strong>
        <code style={{
          fontSize: 12, color: theme.accentSoft, background: '#0a1a10',
          border: `1px solid ${theme.panelBorder}`, borderRadius: 6, padding: '4px 10px',
        }}>
          muse exec --json &lt;approved task&gt;
        </code>
      </div>
      <div style={{
        marginTop: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11, color: '#86a894', background: '#050a07', border: `1px solid #143024`,
        borderRadius: 8, padding: 10, maxHeight: 88, overflow: 'auto', whiteSpace: 'pre-wrap',
      }} role="log" aria-live="polite">
        {logs.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </footer>
  );
}
