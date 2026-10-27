'use client';

import { useState } from 'react';
import { theme } from './theme';

const DEFAULT_LOG = [
  '$ muse exec --json <approved task>',
  '[planner] task queue synchronized',
  '[scope] owned-lab constraints loaded',
  '[Jev] waiting for human approval',
  '[muse] coding session awaiting connection',
];

export default function MuseCliStrip() {
  const [input, setInput] = useState('');
  const [paused, setPaused] = useState(false);
  const [log] = useState(DEFAULT_LOG);

  return (
    <div style={{
      borderTop: `1px solid ${theme.panelBorder}`,
      background: 'rgba(2,10,16,0.96)',
      padding: '8px 12px 6px',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: theme.cyanSoft }}>
          MUSE / ASYNC CODING CLI
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 999,
          border: `1px solid rgba(251,191,36,0.45)`, color: theme.warn,
          background: 'rgba(66,32,6,0.35)',
        }}>
          SESSION NOT CONNECTED
        </div>
      </div>

      <div style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10, color: theme.greenSoft, background: 'rgba(0,8,12,0.9)',
        border: `1px solid ${theme.panelBorder}`, borderRadius: 6,
        padding: '6px 10px', maxHeight: 72, overflow: 'auto', lineHeight: 1.55,
        marginBottom: 6,
      }}>
        {log.map((line, i) => (
          <div key={i} style={{ color: line.startsWith('$') ? theme.cyan : theme.greenSoft }}>
            {paused && i === log.length - 1 ? `${line}  [paused]` : line}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a coding task…"
          style={{
            flex: 1, fontSize: 11, padding: '7px 10px', borderRadius: 6,
            border: `1px solid ${theme.panelBorder}`, background: 'rgba(2,14,22,0.9)',
            color: theme.text, outline: 'none',
          }}
        />
        <button type="button" style={actionBtn} onClick={() => setInput('')}>Run</button>
        <button type="button" style={actionBtn} onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" style={{ ...actionBtn, color: theme.danger, borderColor: 'rgba(248,113,113,0.4)' }}
          onClick={() => { setInput(''); setPaused(false); }}>
          Stop
        </button>
      </div>
    </div>
  );
}

const actionBtn = {
  fontSize: 10, fontWeight: 700, padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
  border: `1px solid ${theme.panelBorderStrong}`,
  background: 'rgba(4,24,36,0.95)', color: theme.cyanSoft,
};
