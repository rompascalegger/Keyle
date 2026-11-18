/* Keyle – Partikel (Canvas) und Bildschirmwackeln */
(function (K) {
  'use strict';

  const FX = {
    canvas: null, ctx: null, w: 440, h: 900, dpr: 1,
    parts: [],
    shakeT: 0, shakeMag: 0, shakeDur: 1,
    opts: { shake: true, flashes: true },
  };

  const CONF = ['#ffd23f', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b', '#c77dff', '#ffffff'];

  FX.init = function (canvas) {
    FX.canvas = canvas;
    FX.ctx = canvas.getContext('2d');
  };

  FX.resize = function (w, h, scale) {
    FX.w = w; FX.h = h;
    FX.dpr = Math.min(2.5, (window.devicePixelRatio || 1) * scale);
    FX.canvas.width = Math.round(w * FX.dpr);
    FX.canvas.height = Math.round(h * FX.dpr);
    FX.canvas.style.width = w + 'px';
    FX.canvas.style.height = h + 'px';
  };

  function add(p) {
    if (FX.parts.length > 900) FX.parts.shift();
    p.age = 0;
    FX.parts.push(p);
  }

  FX.confetti = function (x, y, n) {
    n = n || 40;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 180 + Math.random() * 320;
      add({ type: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 520, drag: 1.6, life: 1.4 + Math.random() * 0.9,
        size: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 18, color: CONF[i % CONF.length] });
    }
  };

  FX.steam = function (x, y, n) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      add({ type: 'steam', x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 50, g: -10, drag: 0.8,
        life: 0.9 + Math.random() * 0.6, size: 5 + Math.random() * 5, grow: 18 });
    }
  };

  FX.sparkle = function (x, y, n, color, spread) {
    n = n || 12; spread = spread || 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (60 + Math.random() * 200) * spread;
      add({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 60, drag: 3, life: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3, color: color || '#ffe08a' });
    }
  };

  FX.ring = function (x, y, color, size) {
    add({ type: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 0, life: 0.5, size: size || 60, color: color || '#ffd23f' });
  };

  FX.dust = function (x, y, n) {
    n = n || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI;
      const sp = 40 + Math.random() * 90;
      add({ type: 'steam', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4, g: 0, drag: 3, life: 0.4 + Math.random() * 0.3,
        size: 3 + Math.random() * 3, grow: 10, tint: 'rgba(240,220,200,' });
    }
  };

  FX.ink = function (x, y, color) {
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
      add({ type: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, drag: 7, life: 0.5, size: 2 + Math.random() * 3.5, color });
    }
  };

  FX.coins = function (x, y, tx, ty, n) {
    for (let i = 0; i < Math.min(n, 12); i++) {
      add({ type: 'coin', x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 10, sx: x, sy: y, tx, ty,
        vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 120, g: 0, drag: 0, life: 0.75 + i * 0.05, size: 6 });
    }
  };

  FX.emojiRain = function (ch, n, o) {
    o = o || {};
    const chars = Array.isArray(ch) ? ch : [ch];
    for (let i = 0; i < (n || 30); i++) {
      add({ type: 'emo', ch: chars[i % chars.length], x: Math.random() * FX.w, y: -30 - Math.random() * FX.h * 0.6,
        vx: (Math.random() - 0.5) * 50 + (o.wind || 0), vy: 70 + Math.random() * 140, g: o.g != null ? o.g : 50, drag: 0,
        life: 5 + Math.random() * 2, size: (o.size || 22) + Math.random() * 14, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3 });
    }
  };

  FX.emojiBurst = function (ch, x, y, n, size) {
    const chars = Array.isArray(ch) ? ch : [ch];
    for (let i = 0; i < (n || 12); i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = 160 + Math.random() * 260;
      add({ type: 'emo', ch: chars[i % chars.length], x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 420, drag: 0.8,
        life: 1.6 + Math.random() * 0.8, size: (size || 20) + Math.random() * 10, rot: 0, vr: (Math.random() - 0.5) * 8 });
    }
  };

  FX.emojiFly = function (ch, y, size, speed, dir) {
    dir = dir || 1;
    add({ type: 'emo', ch, x: dir > 0 ? -40 : FX.w + 40, y, vx: (speed || 120) * dir, vy: 0, g: 0, drag: 0,
      life: (FX.w + 80) / (speed || 120), size: size || 34, rot: 0, vr: 0, bob: true, flip: dir < 0 });
  };

  FX.glyphRain = function (chars, color, n) {
    for (let i = 0; i < (n || 60); i++) {
      add({ type: 'glyph', ch: chars[Math.floor(Math.random() * chars.length)], color: color || '#39ff88', x: Math.random() * FX.w,
        y: -20 - Math.random() * FX.h, vx: 0, vy: 160 + Math.random() * 220, g: 0, drag: 0, life: 4 + Math.random() * 2, size: 12 + Math.random() * 10, t: 0 });
    }
  };

  FX.firework = function (x, y) {
    const col = ['#ffd23f', '#ef476f', '#06d6a0', '#4cc9f0', '#c77dff', '#ffffff'][Math.floor(Math.random() * 6)];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, sp = 120 + Math.random() * 120;
      add({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 140, drag: 1.4, life: 1.1 + Math.random() * 0.5, size: 2.5 + Math.random() * 2, color: col });
    }
    FX.ring(x, y, col, 90);
  };

  FX.swissRain = function (n) {
    for (let i = 0; i < (n || 24); i++) {
      add({ type: 'swiss', x: Math.random() * FX.w, y: -30 - Math.random() * FX.h * 0.5, vx: (Math.random() - 0.5) * 40, vy: 80 + Math.random() * 100,
        g: 40, drag: 0, life: 5, size: 16 + Math.random() * 12, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3 });
    }
  };

  FX.snow = function (n) {
    for (let i = 0; i < (n || 2); i++) {
      add({ type: 'dot', x: Math.random() * FX.w, y: -6, vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 40, g: 0, drag: 0,
        life: FX.h / 40, size: 1.5 + Math.random() * 2.5, color: '#ffffff', soft: true });
    }
  };

  FX.shake = function (mag, dur) {
    if (!FX.opts.shake) return;
    if (mag >= FX.shakeMag * (FX.shakeT / FX.shakeDur)) {
      FX.shakeMag = mag; FX.shakeDur = dur || 0.3; FX.shakeT = FX.shakeDur;
    }
  };

  FX.shakeOffset = function () {
    if (FX.shakeT <= 0) return [0, 0];
    const k = FX.shakeT / FX.shakeDur;
    const m = FX.shakeMag * k * k;
    return [(Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m];
  };

  FX.update = function (dt) {
    if (FX.shakeT > 0) FX.shakeT = Math.max(0, FX.shakeT - dt);
    const ps = FX.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      if (p.age >= p.life) { ps.splice(i, 1); continue; }
      if (p.type === 'coin') continue;
      if (p.type === 'emo' || p.type === 'swiss' || p.type === 'glyph') { if (p.y > FX.h + 60 || p.x < -80 || p.x > FX.w + 80) { ps.splice(i, 1); continue; } }
      p.vy += p.g * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
  };

  FX.render = function () {
    const c = FX.ctx;
    if (!c) return;
    c.setTransform(FX.dpr, 0, 0, FX.dpr, 0, 0);
    c.clearRect(0, 0, FX.w, FX.h);
    for (const p of FX.parts) {
      const t = p.age / p.life;
      const fade = 1 - t;
      switch (p.type) {
        case 'conf': {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.scale(1, Math.cos(p.rot * 1.7));
          c.globalAlpha = Math.min(1, fade * 2);
          c.fillStyle = p.color;
          c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
          c.restore();
          break;
        }
        case 'steam': {
          const r = p.size + p.grow * t;
          c.globalAlpha = 0.55 * fade;
          c.fillStyle = (p.tint || 'rgba(255,255,255,') + '1)';
          c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
          break;
        }
        case 'spark': {
          c.globalAlpha = fade;
          c.fillStyle = p.color;
          const s = p.size * (0.6 + fade * 0.6);
          c.save(); c.translate(p.x, p.y); c.rotate(p.age * 6);
          c.beginPath();
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2;
            c.lineTo(Math.cos(a) * s * 2, Math.sin(a) * s * 2);
            c.lineTo(Math.cos(a + Math.PI / 4) * s * 0.5, Math.sin(a + Math.PI / 4) * s * 0.5);
          }
          c.closePath(); c.fill(); c.restore();
          break;
        }
        case 'ring': {
          c.globalAlpha = fade * 0.9;
          c.strokeStyle = p.color;
          c.lineWidth = 4 * fade + 1;
          c.beginPath(); c.arc(p.x, p.y, p.size * U_ease(t), 0, Math.PI * 2); c.stroke();
          break;
        }
        case 'dot': {
          c.globalAlpha = fade;
          c.fillStyle = p.color;
          c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
          break;
        }
        case 'emo': {
          c.save();
          c.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
          const by = p.bob ? Math.sin(p.age * 8) * 4 : 0;
          c.translate(p.x, p.y + by);
          c.rotate(p.rot);
          if (p.flip) c.scale(-1, 1);
          c.font = `${p.size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(p.ch, 0, 0);
          c.restore();
          break;
        }
        case 'glyph': {
          c.globalAlpha = Math.min(1, fade * 1.5);
          c.fillStyle = p.color;
          c.font = `700 ${p.size}px "DM Mono",monospace`;
          c.textAlign = 'center';
          if (Math.random() < 0.05) p.ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 90));
          c.fillText(p.ch, p.x, p.y);
          break;
        }
        case 'swiss': {
          c.save();
          c.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
          c.translate(p.x, p.y); c.rotate(p.rot);
          const z = p.size;
          c.fillStyle = '#d52b1e'; c.fillRect(-z / 2, -z / 2, z, z);
          c.fillStyle = '#fff'; c.fillRect(-z * 0.1, -z * 0.31, z * 0.2, z * 0.62); c.fillRect(-z * 0.31, -z * 0.1, z * 0.62, z * 0.2);
          c.restore();
          break;
        }
        case 'coin': {
          // Bogen vom Gast zum Münzzähler
          const e = U_ease(Math.min(1, t * 1.15));
          const mx = (p.sx + p.tx) / 2 + p.vx * 0.4, my = Math.min(p.sy, p.ty) - 80 + p.vy * 0.2;
          const x = (1 - e) * (1 - e) * p.x + 2 * (1 - e) * e * mx + e * e * p.tx;
          const y = (1 - e) * (1 - e) * p.y + 2 * (1 - e) * e * my + e * e * p.ty;
          c.globalAlpha = t > 0.92 ? (1 - t) / 0.08 : 1;
          const sx = Math.abs(Math.cos(p.age * 10));
          c.fillStyle = '#c99a2e';
          c.beginPath(); c.ellipse(x, y, p.size * (0.35 + sx * 0.65), p.size, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#ffe08a';
          c.beginPath(); c.ellipse(x, y, p.size * (0.35 + sx * 0.65) * 0.7, p.size * 0.7, 0, 0, Math.PI * 2); c.fill();
          break;
        }
      }
    }
    c.globalAlpha = 1;
  };

  function U_ease(t) { return 1 - Math.pow(1 - t, 3); }

  K.fx = FX;
})(window.K);
