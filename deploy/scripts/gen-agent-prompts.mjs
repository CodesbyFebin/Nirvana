#!/usr/bin/env node
/**
 * MetaPen — agent prompt generator.
 *
 * Reads lib/claws.mjs (the single source of truth for the 10 claws and their
 * tool catalogs) and emits a single Kubernetes ConfigMap containing 500 agent
 * mastery prompts: 10 claws x 50 agents = 500 agents, one tool per agent.
 *
 * Named tools -> "<TOOL>-PRIME" keys with a tool-specific mastery prompt.
 * Unassigned/padding slots -> honest placeholder keys "<domain>-slot-NN",
 * clearly marked as EMPTY / not a live worker.
 *
 * Every prompt bakes in the non-negotiable ethical guardrails:
 *   - owned-lab scope is law (scope.yaml)
 *   - auth file required before any execution
 *   - read-only recon by default; NO exploitation without explicit JeV approval
 *
 * Usage:
 *   node deploy/scripts/gen-agent-prompts.mjs
 * Output:
 *   deploy/k8s/agent-prompts.configmap.yaml
 */

import { CLAWS } from '../../lib/claws.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../k8s/agent-prompts.configmap.yaml');

const GUARDRAILS =
  'Ethical guardrails (non-negotiable): owned-lab scope is law (scope.yaml); ' +
  'an auth file is required before any execution; read-only recon by default; ' +
  'NO exploitation without explicit JeV (--mev) approval. Full audit logs + zkVM ' +
  'hash receipt (Planned) for every action.';

function safeKey(s) {
  // ConfigMap keys must match [-._a-zA-Z0-9]+
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// YAML block scalar: emit each prompt as a literal block to avoid escaping issues.
function blockScalar(key, text, indent = '  ') {
  const body = text
    .split('\n')
    .map((line) => `${indent}  ${line}`.replace(/\s+$/g, ''))
    .join('\n');
  return `${indent}${key}: |-\n${body}`;
}

function masteryPrompt(domain, toolName, hint) {
  const prime = `${safeKey(toolName)}-PRIME`;
  return (
    `${prime}: You master ONLY ${toolName}. You are a dedicated specialist agent ` +
    `in CLAW ${domain}. ${hint}\n` +
    `Deep expertise: flags, options, output parsing, and edge cases of ${toolName} ` +
    `and nothing else. Hand off anything outside ${toolName} to the Central Brain.\n` +
    `${GUARDRAILS}`
  );
}

function placeholderPrompt(domain, slotNo) {
  return (
    `PLACEHOLDER (generated): empty agent slot ${slotNo} in CLAW ${domain}. ` +
    `This is NOT a live worker and masters no tool yet. Fill only when a real ` +
    `tool adapter exists. Until then it stays idle.\n` +
    `${GUARDRAILS}`
  );
}

const entries = [];
let assignedCount = 0;
let placeholderCount = 0;

for (const claw of CLAWS) {
  const domain = claw.domain;
  const shortDomain = domain.toLowerCase();
  for (const tool of claw.tools) {
    if (tool.assigned) {
      const key = `${safeKey(tool.name)}-PRIME`;
      entries.push({ key, text: masteryPrompt(domain, tool.name, tool.mastery) });
      assignedCount += 1;
    } else {
      // honest placeholder, e.g. recon-slot-41
      const slotNo = String(tool.slot).padStart(2, '0');
      const key = `${shortDomain}-slot-${slotNo}`;
      entries.push({ key, text: placeholderPrompt(domain, slotNo) });
      placeholderCount += 1;
    }
  }
}

// Deduplicate keys (some tools repeat across claws, e.g. ffuf/hakrawler/slither).
// Keep claw-qualified keys unique by suffixing the claw code on collision.
const seen = new Map();
for (const e of entries) {
  if (!seen.has(e.key)) {
    seen.set(e.key, 1);
  } else {
    const n = seen.get(e.key) + 1;
    seen.set(e.key, n);
    e.key = `${e.key}-${n}`;
  }
}

const header = `# GENERATED FILE — do not edit by hand.
# Produced by deploy/scripts/gen-agent-prompts.mjs from lib/claws.mjs.
# 10 claws x 50 agents = 500 mastery prompts (one tool per agent).
# Named tools -> <TOOL>-PRIME. Padding slots -> <domain>-slot-NN (PLACEHOLDER).
# Assigned agents: ${assignedCount} | Placeholder slots: ${placeholderCount} | Total: ${entries.length}
apiVersion: v1
kind: ConfigMap
metadata:
  name: metapen-agent-prompts
  labels:
    app.kubernetes.io/name: metapen
    app.kubernetes.io/component: agent-prompts
  annotations:
    metapen.io/generated-by: deploy/scripts/gen-agent-prompts.mjs
    metapen.io/total-agents: "${entries.length}"
    metapen.io/assigned-agents: "${assignedCount}"
    metapen.io/placeholder-slots: "${placeholderCount}"
data:
`;

const body = entries.map((e) => blockScalar(e.key, e.text)).join('\n');

writeFileSync(OUT, header + body + '\n', 'utf8');

console.log(`Wrote ${OUT}`);
console.log(`Total keys: ${entries.length} (assigned=${assignedCount}, placeholders=${placeholderCount})`);
