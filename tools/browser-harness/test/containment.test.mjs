// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveRequest, serve } from '../index.mjs';

const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-')));
const root = path.join(base, 'site');
const outside = path.join(base, 'secret.txt');
fs.mkdirSync(path.join(root, 'sub'), { recursive: true });
fs.mkdirSync(path.join(root, '.well-known'));
fs.mkdirSync(path.join(root, '.git'));
fs.writeFileSync(outside, 'secret');
for (const [file, body] of [['index.html', 'home'], ['sub/index.html', 'sub'], ['sub/a.js', 'code'], ['.env', 'KEY=1'], ['.well-known/x', 'ok'], ['.git/config', 'cfg'], ['private.txt', 'p']]) fs.writeFileSync(path.join(root, file), body);
fs.symlinkSync(outside, path.join(root, 'link-out.txt'));
fs.symlinkSync(path.join(root, 'sub/a.js'), path.join(root, 'link-in.js'));
fs.mkdirSync(path.join(root, 'trap'));
fs.symlinkSync(outside, path.join(root, 'trap/index.html'));
test.after(() => fs.rmSync(base, { recursive: true, force: true }));

for (const [url, expected, rules] of /** @type {[string, string | null, import('../index.mjs').ServeRules?][]} */ ([
  ['/', 'index.html'], ['/sub/', 'sub/index.html'], ['/sub/a.js?v=1#x', 'sub/a.js'], ['/link-in.js', 'sub/a.js'],
  ['/missing', null], ['/../secret.txt', null], ['/%2e%2e/secret.txt', null], ['/sub/%2e%2e/%2e%2e/secret.txt', null], ['/sub\\..\\..\\secret.txt', null],
  ['/link-out.txt', null], ['/trap/', null], ['/trap', null], ['/.env', null], ['/.git/config', null], ['/.well-known/x', null], ['/a%00.js', null], ['/%E0%A4%A', null],
  ['/.well-known/x', '.well-known/x', { allowDotPaths: ['.well-known'] }],
  ['/.git/config', null, { allowDotPaths: ['.git'] }], ['/.env', null, { allowDotPaths: ['.env'] }],
  ['/private.txt', null, { denyPaths: ['private.txt'] }], ['/sub/a.js', null, { denyPaths: ['sub/'] }]
])) {
  test(`${url} ${rules ? JSON.stringify(rules) : ''} -> ${expected ?? 'refused'}`, () => {
    assert.equal(resolveRequest(root, url, rules), expected === null ? null : path.join(root, expected));
  });
}

test('binds only to localhost, serves, transforms, refuses other methods', async () => {
  const { server, baseUrl } = await serve({ root, transforms: [{ path: 'sub/a.js', apply: (text) => `${text}+hook` }] });
  try {
    assert.equal(/** @type {import('node:net').AddressInfo} */ (server.address()).address, '127.0.0.1');
    assert.equal(await (await fetch(`${baseUrl}/`)).text(), 'home');
    assert.equal(await (await fetch(`${baseUrl}/sub/a.js`)).text(), 'code+hook');
    assert.equal(fs.readFileSync(path.join(root, 'sub/a.js'), 'utf8'), 'code');
    assert.equal((await fetch(`${baseUrl}/.env`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/`, { method: 'POST' })).status, 405);
    const moved = await fetch(`${baseUrl}/sub?x=1`, { redirect: 'manual' });
    assert.equal(moved.status, 301);
    assert.equal(moved.headers.get('location'), '/sub/?x=1');
  } finally { server.close(); server.closeAllConnections(); }
});
