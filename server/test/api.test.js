import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devfest-'));
for (const f of fs.readdirSync(new URL('../data', import.meta.url))) fs.copyFileSync(new URL(`../data/${f}`, import.meta.url), path.join(tmp, f));
process.env.DATA_DIR = tmp;
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('pw-for-tests', 4);
process.env.LOGIN_RATE_LIMIT = '1000';

const { createApp } = await import('../app.js');
let server, base, token;
before(async () => {
  await new Promise((r) => { server = createApp().listen(0, r); });
  base = `http://localhost:${server.address().port}/api`;
  const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'pw-for-tests' }) });
  token = (await res.json()).token;
});
after(() => server.close());

const call = (p, method = 'GET', body, auth = true) =>
  fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(auth && token ? { authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });

const goodSession = { title: 'T', description: 'D', speakerIds: ['speaker-001'], date: '2026-12-06', startTime: '16:00', endTime: '17:00', room: 'Room B', track: 'Web', type: 'Technical Talk' };

test('public reads work', async () => {
  assert.equal((await call('/speakers', 'GET', null, false)).status, 200);
  assert.equal((await call('/sessions/nope', 'GET', null, false)).status, 404);
});
test('writes require auth', async () => {
  assert.equal((await call('/speakers', 'POST', {}, false)).status, 401);
});
test('wrong password rejected', async () => {
  const r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'x' }) });
  assert.equal(r.status, 401);
});
test('rejects end before start', async () => {
  const r = await call('/sessions', 'POST', { ...goodSession, startTime: '17:00', endTime: '16:00' });
  assert.equal(r.status, 400);
  assert.ok((await r.json()).details.endTime);
});
test('rejects room double-booking and unknown speaker', async () => {
  assert.equal((await call('/sessions', 'POST', { ...goodSession, room: 'Main Hall', startTime: '14:45', endTime: '15:00' })).status, 409);
  assert.equal((await call('/sessions', 'POST', { ...goodSession, speakerIds: ['speaker-999'] })).status, 400);
});
test('session CRUD + speaker delete protection', async () => {
  const c = await call('/sessions', 'POST', goodSession);
  assert.equal(c.status, 201);
  const { id } = await c.json();
  assert.equal((await call(`/sessions/${id}`, 'PUT', { ...goodSession, title: 'Renamed' })).status, 200);
  assert.equal((await call('/speakers/speaker-001', 'DELETE')).status, 409);
  assert.equal((await call(`/sessions/${id}`, 'DELETE')).status, 204);
});
test('concurrent creates do not corrupt or lose data', async () => {
  const mk = (i) => call('/speakers', 'POST', { name: `N${i}`, title: 't', company: 'c', bio: 'b', expertise: [] });
  const rs = await Promise.all(Array.from({ length: 15 }, (_, i) => mk(i)));
  assert.ok(rs.every((r) => r.status === 201));
  const all = await (await call('/speakers', 'GET', null, false)).json();
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  assert.equal(all.length, 8 + 15);
});

test('photo upload: requires auth, accepts real images only', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const up = (body, type, auth = true) => fetch(`${base}/uploads`, { method: 'POST', headers: { 'content-type': type, ...(auth ? { authorization: `Bearer ${token}` } : {}) }, body });
  assert.equal((await up(png, 'image/png', false)).status, 401);
  assert.equal((await up(Buffer.from('<svg onload=alert(1)>'), 'image/png')).status, 400); // fake PNG rejected by signature
  assert.equal((await up(Buffer.from('<svg/>'), 'image/svg+xml')).status, 400);
  const ok = await up(png, 'image/png');
  assert.equal(ok.status, 201);
  const { url } = await ok.json();
  const got = await fetch(`${base.replace('/api', '')}${url}`);
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('x-content-type-options'), 'nosniff');
});
