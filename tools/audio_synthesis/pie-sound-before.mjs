/* The lanes' soundscape as it was before pie-sound.mjs (pie-game.mjs, release 2026_11_08.W), kept to A/B against it in pie-sound-audition.html. */
/* ─── Soundscape: WAP and the tactile notes of the carry, synthesized; no files ───
 * One bus for every sound: a compressor, and a short echo the size of a lane. Every sound
 * is panned to where it happened. Things the land gives play in the chapter's own key, a
 * pentatonic that climbs as they come (a minor one while the mimes hold the chapter);
 * knocks are out of key, on purpose. While the land runs at a beaver's pace the bus is
 * muffled, as if heard through slow time; while the mimes lead, it thins, the way it is
 * harder to wonder about pie. Footsteps know the ground: grass in the field, cobbles in
 * the city. */
let audio = null;
let bus = null;
const sound = { root: 293.66, minor: false, ground: 'field', muffled: false, thin: false };
const ROOTS = [293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23];
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];
/** Browsers let sound start only from a gesture: the click or key that starts a carry. */
function primeAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    ensureBus();
  } catch { /* silent, then */ }
}
function ensureBus() {
  if (!audio || bus) return bus;
  const input = audio.createGain();
  const muffle = audio.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 16000;
  const thin = audio.createBiquadFilter();
  thin.type = 'highpass';
  thin.frequency.value = 30;
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const master = audio.createGain();
  master.gain.value = 0.9;
  const echo = audio.createDelay(0.6);
  echo.delayTime.value = 0.14;
  const feedback = audio.createGain();
  feedback.gain.value = 0.2;
  const wet = audio.createGain();
  wet.gain.value = 0.14;
  input.connect(muffle).connect(thin).connect(comp).connect(master).connect(audio.destination);
  thin.connect(echo);
  echo.connect(feedback).connect(echo);
  echo.connect(wet).connect(comp);
  bus = { input, muffle, thin };
  return bus;
}
/** Where the carry is: the chapter's key and ground, and whether the mimes hold it. */
function setSoundPlace({ chapter = 1, held = false } = {}) {
  sound.root = ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.minor = held;
  sound.ground = chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city';
}
/** The land's pace and the mimes' hold, heard: muffled in slow time, thinner while they lead. */
function setSoundMood({ muffled = false, thin = false } = {}) {
  if (!audio || !bus) return;
  const t = audio.currentTime;
  if (muffled !== sound.muffled) bus.muffle.frequency.setTargetAtTime(muffled ? 1300 : 16000, t, 0.12);
  if (thin !== sound.thin) bus.thin.frequency.setTargetAtTime(thin ? 420 : 30, t, 0.2);
  sound.muffled = muffled;
  sound.thin = thin;
}
/** A degree of the chapter's pentatonic, in octaves from its root. */
const note = (degree, octave = 0) => {
  const scale = sound.minor ? MINOR : MAJOR;
  const d = Math.max(0, Math.round(degree));
  return sound.root * 2 ** (octave + Math.floor(d / 5) + scale[d % 5] / 12);
};
const outlet = (pan = 0) => {
  ensureBus();
  if (!bus) return audio.destination;
  if (!audio.createStereoPanner) return bus.input;
  const panner = audio.createStereoPanner();
  panner.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  panner.connect(bus.input);
  return panner;
};
function wapSound(lift = 1, pan = 0) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    const t = audio.currentTime;
    const out = audio.createGain();
    out.gain.value = 0.5;
    out.connect(outlet(pan));
    // The W: a short drop in pitch, like a cheek meeting crust.
    const thump = audio.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(320, t);
    thump.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    const thumpGain = audio.createGain();
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    thump.connect(thumpGain).connect(out);
    thump.start(t);
    thump.stop(t + 0.18);
    // The AP: filling, everywhere — a burst of noise through a closing filter.
    const length = Math.floor(audio.sampleRate * 0.22);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const splat = audio.createBufferSource();
    splat.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(1800, t);
    band.frequency.exponentialRampToValueAtTime(260, t + 0.2);
    const splatGain = audio.createGain();
    splatGain.gain.setValueAtTime(0.0001, t);
    splatGain.gain.exponentialRampToValueAtTime(0.8, t + 0.01);
    splatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    splat.connect(band).connect(splatGain).connect(out);
    splat.start(t);
    // And the clown's delight: two honks.
    [0.2, 0.34].forEach((at, i) => {
      const horn = audio.createOscillator();
      horn.type = 'square';
      horn.frequency.setValueAtTime((i ? 660 : 520) * lift, t + at);
      horn.frequency.linearRampToValueAtTime((i ? 700 : 560) * lift, t + at + 0.09);
      const hornGain = audio.createGain();
      hornGain.gain.setValueAtTime(0.0001, t + at);
      hornGain.gain.exponentialRampToValueAtTime(0.12, t + at + 0.01);
      hornGain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.1);
      horn.connect(hornGain).connect(out);
      horn.start(t + at);
      horn.stop(t + at + 0.12);
    });
  } catch { /* a silent WAP is still a WAP */ }
}

/** Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, and the Egg's hum. */
function playTone(kind, param = 1, pan = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime;
    const out = outlet(pan);
    const tone = (type, f0, f1, dur, vol, delay = 0) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t + delay);
      if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + Math.min(0.015, dur * 0.25));
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      osc.connect(g).connect(out);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.02);
    };
    // A slow swell, for things that are said rather than struck.
    const swell = (type, f, dur, vol, delay = 0) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t + delay);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      osc.connect(g).connect(out);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.02);
    };
    const hiss = (f0, f1, dur, vol, q = 1.8, delay = 0) => {
      const len = Math.max(1, Math.floor(audio.sampleRate * dur));
      const buf = audio.createBuffer(1, len, audio.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = audio.createBufferSource();
      src.buffer = buf;
      const flt = audio.createBiquadFilter();
      flt.type = 'bandpass';
      flt.Q.value = q;
      flt.frequency.setValueAtTime(f0, t + delay);
      flt.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + delay + dur);
      const g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      src.connect(flt).connect(g).connect(out);
      src.start(t + delay);
    };
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ.
      case 'step':
        if (sound.ground === 'field') { hiss(1600 + (param > 0 ? 200 : 0), 700, 0.05, 0.05, 1.2); tone('sine', 120, 70, 0.04, 0.04); }
        else { tone('triangle', 150 + (param > 0 ? 14 : 0), 70, 0.035, 0.055); hiss(3200, 2200, 0.02, 0.03, 3); }
        break;
      case 'catch': tone('sine', note(2), note(4), 0.09, 0.1); tone('triangle', note(4), note(5), 0.11, 0.08, 0.04); break;
      case 'hop': tone('triangle', 210, 430, 0.11, 0.11); hiss(900, 2400, 0.08, 0.03, 1.5); break;
      case 'land': tone('triangle', 175, 85, 0.06, 0.08); if (sound.ground === 'field') hiss(900, 400, 0.06, 0.05); break;
      case 'deft': tone('sine', note(4), note(6), 0.11, 0.11); tone('sine', note(6), note(8), 0.12, 0.09, 0.05); break;
      case 'throw': hiss(820, 2100, 0.085, 0.12, 2.2); tone('sine', 280, 420, 0.07, 0.06); break;
      case 'glass': tone('sine', 1175, 1185, 0.22, 0.12); tone('sine', 1760, 1780, 0.26, 0.09, 0.03); break;
      case 'post': tone('triangle', 440, 660, 0.17, 0.12); break;
      case 'ramp': tone('sine', 350, 560, 0.12, 0.09); break;
      // A boonberry: two notes that climb the key as they come, and an airy glimpse after.
      case 'berry': {
        const d = 2 + (Number(param) || 0) % 6;
        tone('sine', note(d), note(d) * 1.003, 0.1, 0.1);
        tone('sine', note(d + 2), note(d + 2) * 1.003, 0.16, 0.09, 0.06);
        hiss(5200, 7800, 0.18, 0.025, 4, 0.08);
        break;
      }
      case 'sweet': [0, 2, 4, 5].forEach((d, i) => tone('sine', note(d, 1), note(d, 1) * 1.004, 0.16, 0.08, i * 0.05)); break;
      // A boneberry: low and woody, like a mallet on a bowl, savoury rather than sweet.
      case 'bone': tone('sine', note(0, -1), note(0, -1) * 0.97, 0.22, 0.15); tone('sine', note(3, -1), note(3, -1) * 0.98, 0.18, 0.08, 0.07); hiss(2600, 1800, 0.02, 0.05, 3); break;
      // A baneberry squashed: a wet pop, and nothing said.
      case 'squash': tone('sine', 150, 55, 0.09, 0.14); hiss(320, 120, 0.08, 0.08, 1.2); break;
      // A baneberry foretelling: two notes a semitone apart, swelling, and a whisper under them.
      case 'foretell': swell('triangle', note(0, -1), 0.9, 0.06); swell('triangle', note(0, -1) * 1.0595, 0.9, 0.05, 0.05); hiss(900, 700, 0.7, 0.03, 6); break;
      // ... and as it comes: a fall, low, out of key.
      case 'fulfil': tone('sawtooth', note(2, -1) * 1.0595, note(0, -1) * 0.94, 0.32, 0.06); tone('sine', 90, 55, 0.25, 0.1); break;
      // A slow beaver: two wooden tocks, unhurried.
      case 'beaver': tone('sine', 520, 380, 0.05, 0.12); tone('sine', 470, 340, 0.05, 0.1, 0.32); break;
      case 'share': tone('triangle', note(3), note(3) * 1.004, 0.12, 0.1); tone('triangle', note(5), note(5) * 1.004, 0.16, 0.1, 0.05); break;
      case 'flour': hiss(640, 170, 0.16, 0.14, 1.1); break;
      // A wonder: an arpeggio in the chapter's key, its shape by kind.
      case 'wonder': {
        const shape = param === 'contrivance' ? [0, 2, 4, 5] : param === 'bracework' ? [0, 3, 5, 8] : param === 'saying' ? [4, 2, 0, 5] : [0, 2, 3, 5];
        shape.forEach((d, i) => tone('sine', note(d, 1), note(d, 1) * 1.005, 0.22, 0.08, i * 0.05));
        break;
      }
      case 'knock': tone('sawtooth', 190, 68, 0.15, 0.12); hiss(420, 120, 0.12, 0.12, 1.5); tone('sine', 80, 45, 0.18, 0.12); break;
      case 'foil': tone('square', 520, 180, 0.2, 0.1); tone('triangle', note(4), note(6), 0.14, 0.1, 0.08); break;
      case 'egg': tone('sine', 130.8, 131.2, 0.45, 0.11); tone('sine', 196, 196.5, 0.45, 0.08, 0.03); break;
      case 'spill': tone('triangle', 280, 65, 0.32, 0.2); hiss(1100, 160, 0.28, 0.2, 1.2); break;
      default: break;
    }
  } catch { /* silent play still counts */ }
}

export { primeAudio, wapSound, playTone, setSoundPlace, setSoundMood };
