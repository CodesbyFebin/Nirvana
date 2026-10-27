import test from 'node:test';
import assert from 'node:assert/strict';
import { CLAWS, SWARM_CONCEPT, coverageMatrix, clawById } from '../lib/claws.mjs';

test('ten claws each expose exactly 50 slots', () => {
  assert.equal(CLAWS.length, 10);
  for (const claw of CLAWS) {
    assert.equal(claw.tools.length, 50);
    assert.equal(claw.capacity, 50);
    assert.ok(claw.activeConcept >= 0 && claw.activeConcept <= claw.capacity);
    const named = claw.tools.filter((t) => t.assigned);
    assert.ok(named.length > 0);
    assert.ok(named.length < 50, claw.domain + ' should keep unassigned slots');
    assert.ok(claw.tools.some((t) => !t.assigned));
  }
});

test('swarm map numbers are concept constants', () => {
  assert.equal(SWARM_CONCEPT.supervisors, 10);
  assert.equal(SWARM_CONCEPT.specialists, 500);
  assert.equal(SWARM_CONCEPT.active, 32);
  assert.equal(SWARM_CONCEPT.idle, 468);
  assert.match(SWARM_CONCEPT.label, /concept/i);
});

test('coverage matrix marks concept and clawById works', () => {
  const matrix = coverageMatrix();
  assert.equal(matrix.length, 10);
  assert.ok(matrix.every((row) => row.concept === true));
  assert.equal(clawById('claw-01').domain, 'RECON');
  assert.equal(clawById('missing'), null);
});
