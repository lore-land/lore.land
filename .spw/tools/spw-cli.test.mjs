// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refusal } from './spw-cli.mjs';

for (const args of [['census', '.spw'], ['resolve', '--from', '.spw'], ['format', '.spw', '--check'], ['mount', 'check'], ['mutate', '--help'], []]) {
  test(`allows: ${args.join(' ') || '(no command)'}`, () => assert.equal(refusal(args), null));
}
for (const args of [['mutate', 'x'], ['pulse'], ['refresh'], ['mem', 'dump'], ['format', '.spw'], ['mount', 'init'], ['measure', 'docs', '--write'], ['atlas', '--save'], ['census', '--write=1']]) {
  test(`refuses: ${args.join(' ')}`, () => assert.notEqual(refusal(args), null));
}
