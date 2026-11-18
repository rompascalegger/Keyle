/* Keyle – Ton: alles mit WebAudio erzeugt, keine Audiodateien */
(function (K) {
  'use strict';

  const A = {
    ctx: null, ok: false,
    vol: { sfx: 0.8, music: 0.5 },
    music: { on: false, timer: null, next: 0, step: 0 },
    ringTimer: null,
  };

  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    try { A.ctx = new C(); } catch (e) { return; }
    const c = A.ctx;
    A.master = c.createGain(); A.master.gain.value = 0.9;
    A.comp = c.createDynamicsCompressor();
    A.comp.threshold.value = -16; A.comp.ratio.value = 4; A.comp.attack.value = 0.003; A.comp.release.value = 0.2;
    A.master.connect(A.comp); A.comp.connect(c.destination);

    A.sfx = c.createGain(); A.sfx.connect(A.master);
    A.musicBus = c.createGain();
    A.musicFilter = c.createBiquadFilter(); A.musicFilter.type = 'lowpass'; A.musicFilter.frequency.value = 16000;
    A.musicBus.connect(A.musicFilter); A.musicFilter.connect(A.master);

    // Raumhall für Musik und Glocken
    A.verb = c.createConvolver(); A.verb.buffer = impulse(c, 2.2, 2.5);
    A.verbGain = c.createGain(); A.verbGain.gain.value = 0.22;
    A.verb.connect(A.verbGain); A.verbGain.connect(A.master);
    A.sfxSend = c.createGain(); A.sfxSend.connect(A.verb);
    A.musicSend = c.createGain(); A.musicSend.connect(A.verb);

    // Rauschbuffer
    A.noiseBuf = makeNoise(c, 2, false);
    A.brownBuf = makeNoise(c, 4, true);

    // Lobby-Geräusch: gefiltertes Gemurmel, Lautstärke folgt der Wut
    A.amb = c.createGain(); A.amb.gain.value = 0;
    const src = c.createBufferSource(); src.buffer = A.brownBuf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6;
    A.ambLfo = c.createOscillator(); A.ambLfo.frequency.value = 0.35;
    const lfoG = c.createGain(); lfoG.gain.value = 140; A.ambLfo.connect(lfoG); lfoG.connect(bp.frequency);
    src.connect(bp); bp.connect(A.amb); A.amb.connect(A.sfx);
    src.start(); A.ambLfo.start();

    A.ok = true;
    A.applyVolumes();
  };

  function impulse(c, dur, decay) {
    const len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function makeNoise(c, dur, brown) {
    const len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }

  A.applyVolumes = function () {
    if (!A.ok) return;
    const t = A.ctx.currentTime;
    A.sfx.gain.setTargetAtTime(A.vol.sfx, t, 0.05);
    A.musicBus.gain.setTargetAtTime(A.vol.music * 0.55, t, 0.05);
    A.sfxSend.gain.setTargetAtTime(A.vol.sfx, t, 0.05);
    A.musicSend.gain.setTargetAtTime(A.vol.music * 0.55, t, 0.05);
  };

  // ---------- Bausteine ----------
  function env(g, t, a, peak, d) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(f, o) {
    if (!A.ok) return;
    o = o || {};
    const c = A.ctx, t = (o.t != null ? o.t : c.currentTime);
    const osc = c.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || o.d || 0.2));
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    env(g, t, o.a || 0.005, o.v || 0.2, o.d || 0.2);
    let node = osc;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; node.connect(fl); node = fl; }
    node.connect(g); g.connect(o.dest || A.sfx);
    if (o.verb) g.connect(o.dest === A.musicBus ? A.musicSend : A.sfxSend);
    osc.start(t); osc.stop(t + (o.a || 0.005) + (o.d || 0.2) + 0.05);
  }

  function noise(o) {
    if (!A.ok) return;
    const c = A.ctx, t = (o.t != null ? o.t : c.currentTime);
    const src = c.createBufferSource(); src.buffer = A.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = o.ft || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t); fl.Q.value = o.q || 1;
    if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + (o.d || 0.2));
    const g = c.createGain(); env(g, t, o.a || 0.002, o.v || 0.2, o.d || 0.15);
    src.connect(fl); fl.connect(g); g.connect(o.dest || A.sfx);
    if (o.verb) g.connect(o.dest === A.musicBus ? A.musicSend : A.sfxSend);
    src.start(t, Math.random() * 1.5); src.stop(t + (o.a || 0.002) + (o.d || 0.15) + 0.05);
  }

  function bell(f, o) {
    o = o || {};
    const v = o.v || 0.16, d = o.d || 1.2;
    const parts = [[1, 1], [2.0, 0.45], [2.76, 0.3], [5.4, 0.12]];
    parts.forEach(([m, g], i) => tone(f * m, { t: o.t, v: v * g, d: d / (1 + i * 0.8), a: 0.002, verb: true, dest: o.dest }));
  }

  function now() { return A.ok ? A.ctx.currentTime : 0; }

  // ---------- Effekte ----------
  A.chainNote = function (i) {
    if (!A.ok) return;
    const deg = i % 21;
    const semi = SCALE[deg % 7] + 12 * Math.floor(deg / 7);
    bell(mtof(72 + semi), { v: 0.13, d: 1.4 });
  };

  A.stamp = function (kind) {
    if (!A.ok) return;
    const t = now();
    tone(150, { t, to: 55, glide: 0.12, d: 0.16, v: 0.5, type: 'sine' });
    noise({ t, f: 2400, q: 0.7, d: 0.05, v: 0.25 });
    if (kind === 'blitz') {
      bell(2093, { t: t + 0.01, v: 0.16, d: 1.6 });
      bell(3136, { t: t + 0.06, v: 0.08, d: 1.2 });
    } else if (kind === 'flott') {
      tone(1320, { t: t + 0.01, d: 0.09, v: 0.12, type: 'triangle' });
      tone(1760, { t: t + 0.06, d: 0.09, v: 0.1, type: 'triangle' });
    } else if (kind === 'ok') {
      tone(660, { t: t + 0.01, d: 0.12, v: 0.08, type: 'triangle' });
    } else {
      tone(300, { t: t + 0.02, to: 110, glide: 0.4, d: 0.42, v: 0.12, type: 'sawtooth', lp: 600 });
    }
  };

  A.pick = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 7000, q: 2, d: 0.04, v: 0.12, ft: 'highpass' });
    tone(2637, { t, d: 0.07, v: 0.05 });
    tone(3520, { t: t + 0.03, d: 0.06, v: 0.04 });
  };

  A.hang = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 1800, q: 4, d: 0.05, v: 0.3 });
    tone(940, { t, d: 0.08, v: 0.1, type: 'triangle' });
    tone(2794, { t: t + 0.02, d: 0.3, v: 0.04 });
  };

  A.bounce = function () {
    if (!A.ok) return;
    tone(340, { to: 170, glide: 0.18, d: 0.2, v: 0.15, type: 'triangle' });
  };

  A.buzz = function () {
    if (!A.ok) return;
    const t = now();
    tone(98, { t, d: 0.32, v: 0.18, type: 'square', lp: 900 });
    tone(104, { t, d: 0.32, v: 0.16, type: 'square', lp: 900 });
    tone(80, { t, to: 40, d: 0.3, v: 0.4 });
  };

  A.coin = function (n) {
    if (!A.ok) return;
    const t = now();
    for (let i = 0; i < Math.min(n, 6); i++) {
      tone(2637, { t: t + i * 0.06, d: 0.08, v: 0.06, type: 'square', lp: 6000 });
      tone(3951, { t: t + i * 0.06 + 0.03, d: 0.2, v: 0.05 });
    }
  };

  A.door = function () {
    if (!A.ok) return;
    const t = now();
    bell(1318.5, { t, v: 0.035, d: 0.8 });
    bell(1046.5, { t: t + 0.14, v: 0.03, d: 1 });
  };

  A.eruption = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 700, to: 3800, q: 0.8, a: 0.05, d: 0.9, v: 0.35 });
    tone(82, { t, d: 0.7, v: 0.22, type: 'sawtooth', lp: 400 });
    tone(87, { t: t + 0.05, d: 0.7, v: 0.18, type: 'sawtooth', lp: 400 });
    tone(520, { t: t + 0.05, to: 260, glide: 0.5, d: 0.5, v: 0.08, type: 'sawtooth', lp: 1500 });
  };

  A.sigh = function () {
    if (!A.ok) return;
    noise({ f: 1300, to: 380, q: 1.4, a: 0.12, d: 0.7, v: 0.22 });
  };

  A.confetti = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 1500, q: 0.5, d: 0.08, v: 0.4 });
    [0, 4, 7, 12].forEach((s, i) => bell(mtof(84 + s), { t: t + 0.05 + i * 0.05, v: 0.06, d: 0.8 }));
  };

  A.golden = function () {
    if (!A.ok) return;
    const t = now();
    [0, 4, 7, 11, 14, 19, 24].forEach((s, i) => bell(mtof(72 + s), { t: t + i * 0.07, v: 0.08, d: 1.8 }));
  };

  A.giggle = function () {
    if (!A.ok) return;
    const t = now();
    for (let i = 0; i < 5; i++) tone(900 + (i % 2) * 260, { t: t + i * 0.09, to: 1100 + (i % 2) * 200, glide: 0.06, d: 0.07, v: 0.06, type: 'triangle' });
  };

  A.page = function () {
    if (!A.ok) return;
    noise({ f: 2600, to: 5000, q: 0.8, a: 0.03, d: 0.18, v: 0.12 });
  };

  A.swipe = function () {
    if (!A.ok) return;
    noise({ f: 600, to: 3000, q: 0.9, a: 0.02, d: 0.2, v: 0.15 });
  };

  A.nerve = function () {
    if (!A.ok) return;
    const t = now();
    tone(220, { t, to: 110, glide: 0.4, d: 0.45, v: 0.18, type: 'triangle' });
    noise({ t: t + 0.02, f: 4000, q: 3, d: 0.12, v: 0.1 });
  };

  A.jackpot = function () {
    if (!A.ok) return;
    const t = now();
    for (let i = 0; i < 12; i++) bell(mtof(79 + [0, 4, 7, 12][i % 4]), { t: t + i * 0.06, v: 0.06, d: 0.6 });
  };

  A.clack = function () {
    if (!A.ok) return;
    noise({ f: 1100, q: 3, d: 0.06, v: 0.35 });
    tone(420, { d: 0.06, v: 0.1, type: 'square', lp: 1600 });
  };

  A.tick = function () {
    if (!A.ok) return;
    noise({ f: 5000, q: 2, d: 0.015, v: 0.1 });
  };

  A.buy = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 3000, q: 1, d: 0.1, v: 0.15 });
    bell(2637, { t: t + 0.05, v: 0.12, d: 1 });
    bell(3520, { t: t + 0.12, v: 0.1, d: 1 });
  };

  A.click = function () {
    if (!A.ok) return;
    tone(1200, { d: 0.03, v: 0.06, type: 'triangle' });
  };

  A.slam = function () {
    if (!A.ok) return;
    const t = now();
    tone(120, { t, to: 38, glide: 0.25, d: 0.35, v: 0.7 });
    noise({ t, f: 900, q: 0.5, d: 0.25, v: 0.5 });
  };

  A.sadTrombone = function () {
    if (!A.ok) return;
    const t = now() + 0.2;
    [[311, 0.35], [293.7, 0.35], [277.2, 0.35], [261.6, 1.1]].forEach(([f, d], i) => {
      const st = t + i * 0.42;
      tone(f, { t: st, d, v: 0.12, type: 'sawtooth', lp: 900, a: 0.03 });
      if (i === 3) tone(f, { t: st, d, v: 0.06, type: 'sawtooth', lp: 900, a: 0.03, detune: 20 });
    });
  };

  A.fanfare = function () {
    if (!A.ok) return;
    const t = now();
    [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [16, 0.6]].forEach(([s, dt]) => {
      tone(mtof(67 + s), { t: t + dt, d: 0.5, v: 0.08, type: 'sawtooth', lp: 2500, a: 0.02 });
      bell(mtof(79 + s), { t: t + dt, v: 0.04, d: 0.8 });
    });
  };

  // ---------- Easter-Egg-Klänge ----------
  A.egg = function () {
    if (!A.ok) return;
    const t = now();
    [0, 7, 12, 16, 19, 24].forEach((s, i) => bell(mtof(76 + s), { t: t + i * 0.06, v: 0.09, d: 1.6 }));
    [60, 64, 67, 72].forEach((m) => tone(mtof(m), { t: t + 0.36, d: 1.4, v: 0.05, type: 'sawtooth', lp: 1800, a: 0.04 }));
    noise({ t: t + 0.3, f: 8000, q: 0.6, d: 0.6, v: 0.05, ft: 'highpass' });
  };
  A.yodel = function () {
    if (!A.ok) return;
    const t = now();
    [[67, 0.22], [76, 0.18], [67, 0.18], [79, 0.3], [76, 0.18], [72, 0.18], [67, 0.4]].reduce((acc, [m, d]) => {
      tone(mtof(m), { t: t + acc, d: d + 0.05, v: 0.12, type: 'triangle', a: 0.02 });
      tone(mtof(m) * 1.003, { t: t + acc, d: d + 0.05, v: 0.05, type: 'sine', a: 0.02 });
      return acc + d;
    }, 0);
  };
  A.alphorn = function () {
    if (!A.ok) return;
    const t = now();
    [[43, 1.1], [50, 0.8], [55, 1.6]].reduce((acc, [m, d]) => { tone(mtof(m), { t: t + acc, d, v: 0.16, type: 'sawtooth', lp: 700, a: 0.18 }); return acc + d * 0.9; }, 0);
  };
  A.cuckoo = function () {
    if (!A.ok) return;
    const t = now();
    for (let i = 0; i < 2; i++) { tone(659, { t: t + i * 0.7, d: 0.22, v: 0.14, a: 0.01 }); tone(523, { t: t + i * 0.7 + 0.25, d: 0.32, v: 0.14, a: 0.01 }); }
  };
  A.guitar = function () {
    if (!A.ok) return;
    const t = now();
    [40, 47, 52, 55, 59, 64].forEach((m, i) => tone(mtof(m), { t: t + i * 0.03, d: 1.6, v: 0.07, type: 'sawtooth', lp: 1400 + i * 300, a: 0.003 }));
  };
  A.thunder = function () {
    if (!A.ok) return;
    const t = now();
    noise({ t, f: 120, to: 60, q: 0.5, a: 0.02, d: 1.8, v: 0.6, ft: 'lowpass' });
    noise({ t: t + 0.1, f: 400, to: 80, q: 0.7, a: 0.05, d: 1.2, v: 0.3, ft: 'lowpass' });
  };
  A.quack = function () {
    if (!A.ok) return;
    const t = now();
    for (let i = 0; i < 3; i++) tone(520 - i * 30, { t: t + i * 0.18, to: 300, glide: 0.12, d: 0.12, v: 0.12, type: 'sawtooth', lp: 1200 });
  };
  A.meow = function () {
    if (!A.ok) return;
    tone(600, { to: 900, glide: 0.2, d: 0.45, v: 0.1, type: 'triangle', a: 0.04 });
  };
  A.boo = function () {
    if (!A.ok) return;
    tone(220, { to: 140, glide: 1.2, d: 1.3, v: 0.12, type: 'sine', a: 0.2 });
    tone(330, { to: 210, glide: 1.2, d: 1.3, v: 0.06, type: 'sine', a: 0.2 });
  };

  // Telefon klingelt bis zum Abnehmen
  A.ring = function (on) {
    if (!A.ok) return;
    if (A.ringTimer) { clearInterval(A.ringTimer); A.ringTimer = null; }
    if (!on) return;
    const once = () => {
      const t = now();
      for (let i = 0; i < 2; i++) {
        const st = t + i * 0.45;
        for (let k = 0; k < 8; k++) {
          tone(k % 2 ? 480 : 440, { t: st + k * 0.045, d: 0.04, v: 0.05, type: 'square', lp: 2200, a: 0.002 });
        }
      }
    };
    once();
    A.ringTimer = setInterval(once, 2200);
  };

  A.setLobby = function (level) {
    if (!A.ok) return;
    A.amb.gain.setTargetAtTime(0.015 + Math.min(1, level) * 0.22, A.ctx.currentTime, 0.4);
  };

  A.muffle = function (on) {
    if (!A.ok) return;
    A.musicFilter.frequency.setTargetAtTime(on ? 700 : 16000, A.ctx.currentTime, 0.25);
  };

  A.goldenMusic = function (on) {
    if (!A.ok) return;
    A.goldenOn = on;
  };

  // ---------- Lounge-Musik (generativ) ----------
  const CHORDS = [
    { root: 38, notes: [62, 65, 69, 72, 76] }, // Dm9
    { root: 43, notes: [59, 62, 65, 69, 76] }, // G13
    { root: 36, notes: [60, 64, 67, 71, 74] }, // Cmaj9
    { root: 45, notes: [61, 64, 67, 70, 73] }, // A7b9
  ];
  const BPM = 78;

  function ep(m, t, v, d) {
    // E-Piano per FM
    const c = A.ctx, f = mtof(m);
    const car = c.createOscillator(); car.frequency.value = f;
    const mod = c.createOscillator(); mod.frequency.value = f * 1.0;
    const mg = c.createGain(); mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    const g = c.createGain(); env(g, t, 0.006, v, d);
    car.connect(g); g.connect(A.musicBus); g.connect(A.musicSend);
    car.start(t); mod.start(t); car.stop(t + d + 0.1); mod.stop(t + d + 0.1);
  }

  function schedule() {
    const c = A.ctx;
    const beat = 60 / BPM;
    while (A.music.next < c.currentTime + 0.25) {
      const t = A.music.next;
      const step = A.music.step; // Achtel
      const bar = Math.floor(step / 8);
      const ch = CHORDS[Math.floor(bar / 2) % CHORDS.length];
      const pos = step % 8;
      // Swing
      const swing = pos % 2 === 1 ? beat * 0.16 : 0;
      const tt = t + swing;
      if (bar % 2 === 0 && pos === 0) ch.notes.forEach((n, i) => ep(n, tt + i * 0.012, 0.045, beat * 3.2));
      if (pos === 5 && bar % 2 === 1) ch.notes.slice(1, 4).forEach((n) => ep(n, tt, 0.03, beat * 1.6));
      // Walking Bass
      if (pos % 2 === 0) {
        const walk = [0, 7, 12, 10, 0, 3, 5, 6];
        const m = ch.root + walk[(pos / 2 + (bar % 2) * 4) % 8];
        tone(mtof(m), { t: tt, d: beat * 0.9, v: 0.11, type: 'triangle', lp: 700, dest: A.musicBus, a: 0.01 });
      }
      // Besen
      noise({ t: tt, f: 7000, q: 0.7, d: pos % 4 === 2 ? 0.16 : 0.05, v: pos % 4 === 2 ? 0.045 : 0.018, ft: 'highpass', dest: A.musicBus });
      // Goldene Stunde: Glitzer-Arpeggio
      if (A.goldenOn && pos % 2 === 0) bell(mtof(ch.notes[(step / 2) % ch.notes.length] + 24), { t: tt, v: 0.03, d: 0.6, dest: A.musicBus });
      A.music.step++;
      A.music.next += beat / 2;
    }
  }

  A.startMusic = function () {
    if (!A.ok || A.music.on) return;
    A.music.on = true;
    A.music.next = A.ctx.currentTime + 0.1;
    A.music.timer = setInterval(schedule, 60);
  };
  A.stopMusic = function () {
    A.music.on = false;
    if (A.music.timer) clearInterval(A.music.timer);
    A.music.timer = null;
  };

  K.audio = A;
})(window.K);
