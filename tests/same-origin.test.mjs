import test from 'node:test';
import assert from 'node:assert/strict';
import { mutationOriginDenied } from '../lib/same-origin.mjs';

function fake(method, pathname, origin, urlOrigin = 'http://127.0.0.1:3000') {
  return {
    method,
    headers: { get: (name) => (name.toLowerCase() === 'origin' ? origin : null) },
    nextUrl: { pathname, origin: urlOrigin },
  };
}

test('safe methods are not origin-gated', () => {
  assert.equal(mutationOriginDenied(fake('GET', '/api/sessions', null)), null);
  assert.equal(mutationOriginDenied(fake('HEAD', '/api/sessions', null)), null);
  assert.equal(mutationOriginDenied(fake('OPTIONS', '/api/sessions', null)), null);
});

test('non-API mutations are not gated here', () => {
  assert.equal(mutationOriginDenied(fake('POST', '/metapen', null)), null);
});

test('mutating API requires Origin', () => {
  assert.match(mutationOriginDenied(fake('POST', '/api/swarm', null)), /Origin header required/);
  assert.match(mutationOriginDenied(fake('DELETE', '/api/verification/abc', undefined)), /Origin header required/);
});

test('mutating API rejects cross-origin', () => {
  assert.match(
    mutationOriginDenied(fake('POST', '/api/swarm', 'https://evil.example')),
    /Cross-origin/,
  );
});

test('same-origin mutations pass', () => {
  assert.equal(
    mutationOriginDenied(fake('POST', '/api/swarm', 'http://127.0.0.1:3000')),
    null,
  );
});
