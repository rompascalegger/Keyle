/* Keyle – Hilfsfunktionen: seedbarer Zufall, Formatierung, DOM-Helfer */
window.K = window.K || {};
(function (K) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  class RNG {
    constructor(seed) { this.f = mulberry32((seed >>> 0) || 1); }
    next() { return this.f(); }
    range(a, b) { return a + (b - a) * this.f(); }
    int(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
    chance(p) { return this.f() < p; }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.f() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    weighted(items, wfn) {
      let total = 0;
      for (const it of items) total += Math.max(0, wfn(it));
      if (total <= 0) return items[0];
      let r = this.f() * total;
      for (const it of items) {
        r -= Math.max(0, wfn(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    }
  }

  const U = {
    RNG,
    hashStr,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    // Schweizer Zahlenformat: 12'450
    fmt(n) {
      n = Math.floor(n);
      const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '’');
      return (n < 0 ? '-' : '') + s;
    },
    fmtSec(x) { return x.toFixed(1).replace('.', '.') + ' s'; },
    el(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    $(sel, root) { return (root || document).querySelector(sel); },
    $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },
    esc(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    todayKey() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
  };

  K.util = U;
})(window.K);
