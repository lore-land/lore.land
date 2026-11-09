#!/usr/bin/env node
/**
 * prepare-pie-sounds.mjs — trim a few CC0 takes into book/audio/ for the physical moments of a carry.
 *
 * Each event is a different material in a different register, so a carry can be followed by ear:
 *   crust     a slapstick crack, over the wet fall of a WAP
 *   grass     a guiro scrape
 *   cobble    a clave tick
 *   flour     a cabasa rub, the powder
 *   weight    a frame drum, the pie arriving
 *   floor     a bass drum, where the spill meets the ground
 *   beaver    a log drum, a hollow wooden note, twice and unhurried
 * Knocks stay synthesized: they are out of the chapter's key on purpose, which a sample cannot be.
 * The tuned line stays synthesized too. Sources are the files npm run sounds:fetch already placed
 * in sound-library/ (git-ignored). Each take keeps its gesture (the scrape, the rub, the ring),
 * is peaked near −3 dBFS, and written as mono AAC. Each take lands in book/audio/<event>/<n>.m4a
 * beside <n>.spw, which says what it is and lists the mutations. book/content/sounds.json is the
 * runtime list of those takes.
 *
 *   node book/scripts/tools/prepare-pie-sounds.mjs
 */
import { execFileSync } from 'node:child_process';
import { SOUND_MUTATIONS, mutationEdges, spwQuote } from '../modules/asset-sidecar.mjs';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = resolve(ROOT, 'book/audio');
const VCSL = 'https://github.com/sgossner/VCSL/tree/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e';
const vcsl = (path) => `${VCSL}/${path.split('/').map(encodeURIComponent).join('/')}`;

const V = 'sound-library/vcsl';
const TAKES = [
  // Crust: a high crack. It sits on top of the wet fall; it is not the whole WAP.
  take('wap', 'wap-1', `${V}/Idiophones/Struck Idiophones/Slapstick/slapstick_rr1.wav`, 0.2, 1, 'crust', vcsl('Idiophones/Struck Idiophones/Slapstick')),
  take('wap', 'wap-2', `${V}/Idiophones/Struck Idiophones/Slapstick/slapstick_rr2.wav`, 0.2, 1, 'crust', vcsl('Idiophones/Struck Idiophones/Slapstick')),
  take('wap', 'wap-3', `${V}/Idiophones/Struck Idiophones/Slapstick/slapstick_rr3.wav`, 0.2, 1, 'crust', vcsl('Idiophones/Struck Idiophones/Slapstick')),
  // Grass: a scrape, long enough to be stalks and not a thud.
  take('step-field', 'step-field-1', `${V}/Idiophones/Struck Idiophones/Guiro/Guiro_Fast_rr1_Mid.wav`, 0.34, 0.8, 'grass', vcsl('Idiophones/Struck Idiophones/Guiro')),
  take('step-field', 'step-field-2', `${V}/Idiophones/Struck Idiophones/Guiro/Guiro_Hit_rr2_Mid.wav`, 0.28, 0.8, 'grass', vcsl('Idiophones/Struck Idiophones/Guiro')),
  take('step-field', 'step-field-3', `${V}/Idiophones/Struck Idiophones/Guiro/Guiro_Hit_rr1_Mid.wav`, 0.28, 0.75, 'grass', vcsl('Idiophones/Struck Idiophones/Guiro')),
  // Cobble: a bright tick, nothing like the scrape. The quiet rounds are left out.
  take('step-city', 'step-city-1', `${V}/Idiophones/Struck Idiophones/Claves/Claves1_Hit_v3_rr1_Mid.wav`, 0.2, 0.55, 'cobble', vcsl('Idiophones/Struck Idiophones/Claves')),
  take('step-city', 'step-city-2', `${V}/Idiophones/Struck Idiophones/Claves/Claves2_Hit_v3_rr1_Mid.wav`, 0.2, 0.55, 'cobble', vcsl('Idiophones/Struck Idiophones/Claves')),
  take('step-city', 'step-city-3', `${V}/Idiophones/Struck Idiophones/Claves/Claves2_Hit_v2_rr1_Mid.wav`, 0.2, 0.5, 'cobble', vcsl('Idiophones/Struck Idiophones/Claves')),
  // Flour: beads rubbed, a puff of powder. Brighter than the grass, and only the rounds with a sound in them.
  take('flour', 'flour-1', `${V}/Idiophones/Struck Idiophones/Cabasa/Cabasa1_Rub_v2_rr1_Mid.wav`, 0.4, 0.7, 'flour', vcsl('Idiophones/Struck Idiophones/Cabasa')),
  take('flour', 'flour-2', `${V}/Idiophones/Struck Idiophones/Cabasa/Cabasa1_Rub_v2_rr2_Mid.wav`, 0.4, 0.7, 'flour', vcsl('Idiophones/Struck Idiophones/Cabasa')),
  take('flour', 'flour-3', `${V}/Idiophones/Struck Idiophones/Cabasa/Cabasa1_Hit_rr1_Mid.wav`, 0.22, 0.65, 'flour', vcsl('Idiophones/Struck Idiophones/Cabasa')),
  // The pie's weight arriving: a skin. The hand strokes in this library are nearly silent, so the hits.
  take('land', 'land-1', `${V}/Membranophones/Struck Membranophones/Frame Drum/HDrumL_Hit_v3_rr1_Sum.wav`, 0.32, 0.85, 'weight', vcsl('Membranophones/Struck Membranophones/Frame Drum')),
  take('land', 'land-2', `${V}/Membranophones/Struck Membranophones/Frame Drum/HDrumL_Hit_v3_rr2_Sum.wav`, 0.32, 0.85, 'weight', vcsl('Membranophones/Struck Membranophones/Frame Drum')),
  take('land', 'land-3', `${V}/Membranophones/Struck Membranophones/Frame Drum/HDrumS_Hit_v3_rr1_Sum.wav`, 0.28, 0.8, 'weight', vcsl('Membranophones/Struck Membranophones/Frame Drum')),
  // The floor, under the spill's fall. The louder hits, or the floor is a rumour.
  take('spill', 'spill-1', `${V}/Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v7_rr1_Sum.wav`, 0.5, 0.9, 'floor', vcsl('Membranophones/Struck Membranophones/Bass Drum 1')),
  take('spill', 'spill-2', `${V}/Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v7_rr2_Sum.wav`, 0.5, 0.9, 'floor', vcsl('Membranophones/Struck Membranophones/Bass Drum 1')),
  take('spill', 'spill-3', `${V}/Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v5_rr1_Sum.wav`, 0.5, 0.85, 'floor', vcsl('Membranophones/Struck Membranophones/Bass Drum 1')),
  // A hollow wooden note. The louder drums; a quiet one normalizes into hiss.
  take('beaver', 'beaver-1', `${V}/Idiophones/Struck Idiophones/Slit Drum/LogDrumHi_MedM_v3_rr1_Sum.wav`, 0.42, 0.85, 'hollow wood', vcsl('Idiophones/Struck Idiophones/Slit Drum')),
  take('beaver', 'beaver-2', `${V}/Idiophones/Struck Idiophones/Slit Drum/LogDrumLo_MedM_v3_rr1_Sum.wav`, 0.42, 0.85, 'hollow wood', vcsl('Idiophones/Struck Idiophones/Slit Drum')),
  take('beaver', 'beaver-3', `${V}/Idiophones/Struck Idiophones/Slit Drum/LogDrumHi_MedM_v2_rr1_Sum.wav`, 0.42, 0.8, 'hollow wood', vcsl('Idiophones/Struck Idiophones/Slit Drum')),
];

function take(event, id, src, max, gain, means, source) {
  const n = id.slice(event.length + 1);
  return { event, id, n, src, max, gain, means, source, author: 'Versilian Studios LLC', license: 'CC0-1.0' };
}

/* What a take is, in a sentence, and the register it is heard in. The sidecar records both. */
const SAYS = {
  'wap-1': 'The first slapstick round: a high crack, the crust breaking.',
  'wap-2': 'The second round, a shade shorter: the same crust, not the same slap.',
  'wap-3': 'The third round: the crust again, so a WAP is never one recording.',
  'step-field-1': 'A fast guiro stroke: stalks brushing past a step.',
  'step-field-2': 'A struck guiro: grass catching, then letting go.',
  'step-field-3': 'Another struck round: the field, not a thud.',
  'step-city-1': 'A clave, the bright one: a cobble under the foot.',
  'step-city-2': 'The second clave: the same stone, a different tick.',
  'step-city-3': 'A softer clave: cobble still, less of it.',
  'flour-1': 'A cabasa rubbed: flour moving, not falling.',
  'flour-2': 'The rub again, the other hand.',
  'flour-3': 'A cabasa hit: a puff, shorter than a pour.',
  'land-1': 'A large frame drum: the pie\'s weight arriving.',
  'land-2': 'The same drum, the other hand.',
  'land-3': 'A smaller drum: the same arrival, less of it.',
  'spill-1': 'The loudest bass drum: the floor taking the pie.',
  'spill-2': 'The second strike of that drum.',
  'spill-3': 'A quieter drum: the floor, further off.',
  'beaver-1': 'A high log drum: a hollow note, unhurried.',
  'beaver-2': 'A low log drum: the same animal, lower.',
  'beaver-3': 'The high drum again, a lighter hand.',
};
const HEAR = {
  wap: { type: 'highpass', freq: 1000, q: 0.7 },
  'step-field': { type: 'bandpass', freq: 1300, q: 0.7 },
  'step-city': { type: 'highpass', freq: 1500, q: 0.7 },
  flour: { type: 'bandpass', freq: 2200, q: 0.6 },
  land: { type: 'lowpass', freq: 1100, q: 0.7 },
  spill: { type: 'lowpass', freq: 200, q: 0.7 },
  beaver: { type: 'bandpass', freq: 420, q: 1.2 },
  'beaver-2': { type: 'bandpass', freq: 360, q: 1.2 },
};
const EVENT_SAYS = {
  wap: 'A slapstick crack over the wet fall: the crust, not the whole pie in the face.',
  'step-field': 'A guiro scrape, long enough to be stalks. A field step, not a thud.',
  'step-city': 'A clave tick. Cobble, bright, nothing like the grass.',
  flour: 'A cabasa: flour as powder, brighter than the grass and shorter than a step.',
  land: 'A frame drum. The pie\'s weight arriving, a skin rather than a click.',
  spill: 'A bass drum under the falling tone: the floor, once the pie has gone down.',
  beaver: 'A log drum, twice and unhurried. Hollow wood, lower than the landing and higher than the floor.',
};

function hearOf(item) {
  return HEAR[item.id] || HEAR[item.event];
}

const tmp = mkdtempSync(resolve(tmpdir(), 'pie-sounds-'));
const afconvert = (args) => execFileSync('afconvert', args, { stdio: 'pipe' });

function readPcm(path) {
  const wav = readFileSync(path);
  if (wav.toString('ascii', 0, 4) !== 'RIFF') throw new Error(`${path} is not a wav`);
  let off = 12;
  let data = null;
  let rate = 0;
  let channels = 0;
  let bits = 0;
  while (off + 8 <= wav.length) {
    const id = wav.toString('ascii', off, off + 4);
    const size = wav.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === 'fmt ') {
      channels = wav.readUInt16LE(body + 2);
      rate = wav.readUInt32LE(body + 4);
      bits = wav.readUInt16LE(body + 14);
    } else if (id === 'data') data = wav.subarray(body, body + size);
    off = body + size + (size % 2);
  }
  if (!data || bits !== 16 || channels !== 1) throw new Error(`${path}: want 16-bit mono, got ${bits}-bit ${channels}ch`);
  const samples = new Float32Array(data.length / 2);
  for (let i = 0; i < samples.length; i += 1) samples[i] = data.readInt16LE(i * 2) / 32768;
  return { samples, rate };
}

function writePcm(path, samples, rate) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(s < 0 ? s * 32768 : s * 32767, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

/** The loudest stretch of the recording, up to maxSec, so a quiet opening is not what gets kept.
 *  Fades the edges and peaks at 0.7. Refuses a take whose whole file barely left the noise floor. */
function trim(samples, rate, maxSec) {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) peak = Math.max(peak, Math.abs(samples[i]));
  if (peak < 0.015) throw new Error(`too quiet to keep (peak ${peak.toFixed(3)})`);
  const n = Math.min(samples.length, Math.floor(rate * maxSec));
  const ss = new Float64Array(samples.length + 1);
  for (let i = 0; i < samples.length; i += 1) ss[i + 1] = ss[i] + samples[i] * samples[i];
  const hop = Math.max(1, Math.floor(rate * 0.008));
  let best = -1;
  let at = 0;
  for (let i = 0; i + n <= samples.length; i += hop) {
    const e = ss[i + n] - ss[i];
    if (e > best) { best = e; at = i; }
  }
  const pad = Math.min(at, Math.floor(rate * 0.008));
  const start = at - pad;
  const out = samples.slice(start, Math.min(samples.length, start + n));
  const fade = Math.min(Math.floor(rate * 0.006), Math.floor(out.length / 6));
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    out[i] *= k;
    out[out.length - 1 - i] *= k;
  }
  let p = 0;
  for (let i = 0; i < out.length; i += 1) p = Math.max(p, Math.abs(out[i]));
  const g = 0.7 / (p || 1);
  for (let i = 0; i < out.length; i += 1) out[i] *= g;
  return out;
}

/** A take's sidecar: what it is, and the ordered mutations that made the file and how it is heard. */
function sidecar(item, duration) {
  const hear = hearOf(item);
  const says = SAYS[item.id];
  const id = `sound_${item.event.replace(/-/g, '_')}_${item.n}`;
  return `# ${says}
#>${id}
!take{
  *${item.n}{
    .file["${item.n}.m4a"]
    .event["${item.event}"]
    #says[${spwQuote(says)}]
    #means[${spwQuote(item.means)}]
    %gain[${item.gain}]
    %duration[${duration}]
    %cap[${item.max}]
    %hear[${hear.freq}]
    %q[${hear.q}]
    &source[~"${item.source}"]
    #license["${item.license}"]
    #author["${item.author}"]
    #retrieved["2026-11-09"]
${mutationEdges([...SOUND_MUTATIONS, ['heard', hear.type]]).map((edge) => `    ${edge}`).join('\n')}
  }
}
`;
}

function eventSidecar(event, takes) {
  const hear = HEAR[event];
  const id = `sound_event_${event.replace(/-/g, '_')}`;
  return `# ${EVENT_SAYS[event]}
#>${id}
!event{
  *${event.replace(/-/g, '_')}{
    #means["${takes[0].means}"]
    #says["${EVENT_SAYS[event]}"]
    %hear[${hear.freq}]
    %q[${hear.q}]
    =@heard{ @${hear.type} }
    ~"book/audio/${event}"
  }
}
`;
}

mkdirSync(OUT, { recursive: true });
const clear = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) clear(path);
    else if (entry.name.endsWith('.m4a') || entry.name.endsWith('.spw')) rmSync(path);
  }
};
clear(OUT);
const sounds = [];
for (const item of TAKES) {
  const raw = resolve(tmp, `${item.id}-raw.wav`);
  const cut = resolve(tmp, `${item.id}-cut.wav`);
  const file = `/book/audio/${item.event}/${item.n}.m4a`;
  const dest = resolve(ROOT, file.slice(1));
  mkdirSync(dirname(dest), { recursive: true });
  afconvert(['-f', 'WAVE', '-d', 'LEI16', '-c', '1', resolve(ROOT, item.src), raw]);
  const { samples, rate } = readPcm(raw);
  const trimmed = trim(samples, rate, item.max);
  writePcm(cut, trimmed, rate);
  afconvert(['-f', 'm4af', '-d', 'aac', '-c', '1', '-b', '64000', cut, dest]);
  const duration = Math.round((trimmed.length / rate) * 1000) / 1000;
  const bytes = statSync(dest).size;
  sounds.push({
    id: item.id,
    file,
    event: item.event,
    gain: item.gain,
    duration,
    means: item.means,
    source: item.source,
    license: item.license,
    author: item.author,
    retrieved: '2026-11-09',
    hear: hearOf(item),
    says: SAYS[item.id],
    changed: `mono, loudest ${item.max}s, faded, peaked near −3 dBFS, AAC 64 kbps, heard ${hearOf(item).type} at ${hearOf(item).freq} Hz`,
  });
  writeFileSync(resolve(dirname(dest), `${item.n}.spw`), sidecar(item, duration));
  console.log(`${item.event}/${item.n}  ${duration.toFixed(3)}s  ${(bytes / 1024).toFixed(1)} KB`);
}

const byEvent = new Map();
for (const item of TAKES) {
  const list = byEvent.get(item.event) || [];
  list.push(item);
  byEvent.set(item.event, list);
}
for (const [event, takes] of byEvent) writeFileSync(resolve(OUT, event, 'index.spw'), eventSidecar(event, takes));
const indexLines = [...byEvent.keys()].map((event) => `  *${event.replace(/-/g, '_')}{ #means["${byEvent.get(event)[0].means}"] #says["${EVENT_SAYS[event]}"] ~"book/audio/${event}" }`);
writeFileSync(resolve(OUT, 'index.spw'), `# The physical moments of a carry. Each event is a folder; each take is a file and a sidecar.
#>sound_index
!events{
${indexLines.join('\n')}
}
`);

const total = sounds.reduce((sum, s) => sum + statSync(resolve(ROOT, s.file.slice(1))).size, 0);
const doc = {
  about: 'Each physical moment of a carry is a folder under book/audio/. A take is an m4a beside a .spw sidecar: the sidecar says what the take is and lists the mutations that made it (mono, the loudest window, a fade, the peak, AAC) and the register it is heard in. This file is the runtime list of those takes. Knocks stay synthesized, out of key. The synth plays when a file has not arrived. Made by node book/scripts/tools/prepare-pie-sounds.mjs.',
  budgetBytes: 1572864,
  sounds,
};
writeFileSync(resolve(ROOT, 'book/content/sounds.json'), `${JSON.stringify(doc, null, 2)}\n`);
rmSync(tmp, { recursive: true, force: true });
console.log(`${sounds.length} sounds, ${(total / 1024).toFixed(1)} KB`);
