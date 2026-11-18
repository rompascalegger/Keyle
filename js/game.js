/* Keyle – Spiellogik ohne DOM. Die Ansicht hört auf Ereignisse und ruft pick/drop auf. */
(function (K) {
  'use strict';
  const D = K.data, U = K.util, F = K.faces;

  // Lobby-Plätze: 3 Reihen, vorne gross, hinten klein und versetzt
  const ROWS = [
    { xs: [0.11, 0.305, 0.5, 0.695, 0.89], dy: 24, sc: 1.2 },
    { xs: [0.205, 0.4, 0.6, 0.795], dy: -62, sc: 1.0 },
  ];
  const SLOTS = [];
  ROWS.forEach((r, ri) => r.xs.forEach((fx, ci) => SLOTS.push({ row: ri, col: ci, fx, dy: r.dy, sc: r.sc })));
  const NEIGH = SLOTS.map((s, i) => SLOTS.map((t, j) => (t.row === s.row && Math.abs(t.col - s.col) === 1 ? j : -1)).filter((j) => j >= 0));
  const SLOT_ORDER = [2, 1, 3, 0, 4, 6, 7, 5, 8];

  const ACTIVE = (g) => g.state === 'enter' || g.state === 'wait';

  class Game {
    constructor(o) {
      this.o = o;
      this.listeners = [];
      this.seed = o.seed >>> 0;
      this.char = D.CHARS.find((c) => c.id === o.char) || D.CHARS[0];
      this.hotel = D.HOTELS.find((h) => h.id === o.hotel) || D.HOTELS[0];
      this.cls = D.CLASSES[(o.cls || 1) - 1] || D.CLASSES[0];
      this.relicPool = o.relicPool || D.RELICS.filter((r) => r.cost === 0).map((r) => r.id);
      const nerves = D.START_NERVES + (this.char.id === 'praktikantin' ? 1 : 0) + this.cls.nerves;
      this.run = {
        shift: 0, score: 0, coins: 0,
        nerves: Math.max(1, nerves), maxNerves: D.MAX_NERVES,
        relics: [], over: false,
        stats: { served: 0, blitz: 0, flott: 0, ok: 0, zaeh: 0, errors: 0, eruptions: 0, bestChain: 0, totalX: 0,
          saves: 0, soothed: 0, golden: 0, phone: 0, bookOpens: 0, angriestRoom: null, angriest: 0, jackpots: 0 },
      };
      this.relicRng = new U.RNG(U.hashStr(this.seed + ':relics'));
      this.s = null;
      this.ids = 1;
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, d) { for (const fn of this.listeners) fn(type, d || {}); }
    has(id) { return this.run.relics.includes(id); }
    guest(id) { return this.s.guests.find((g) => g.id === id) || this.s.doorQueue.find((g) => g.id === id); }
    handCap() { return this.has('haende') ? 2 : 1; }
    chainWindow() { return this.has('stoppuhr') ? 7 : D.CHAIN_WINDOW; }

    rageMult() {
      const S = this.s;
      let m = this.cls.rage;
      if (this.char.id === 'praktikantin') m *= 1.1;
      if (this.has('kaffeemaschine')) m *= 0.85;
      if (this.has('espresso')) m *= 1.1;
      if (S.cfg.mutator === 'kaffeepause') m *= 0.7;
      if (S.phone.ringing) m *= 1.2;
      return m;
    }

    // ------------------------------------------------------------------ Schicht
    startShift(n) {
      const rng = new U.RNG(U.hashStr(this.seed + ':shift:' + n));
      const boss = D.bossFor(n);
      const mutator = n >= 11 ? rng.pick(D.MUTATORS).id : null;
      const inspector = boss === 'inspector' || (n >= 20 && n % 5 === 0);
      const hooks = Math.max(4, Math.round(D.baseHooks(n) * this.hotel.hooks));
      let T = D.interval(n);
      if (mutator === 'messe' || mutator === 'kaffeepause') T *= 0.75;
      const cfg = {
        s: n, boss, mutator, inspector, hooks, T, n: D.guestCount(n),
        strict: n < 7, blind: n >= 7, twins: n >= 8, kids: n >= 9,
        phone: n >= 9 || mutator === 'telefon', sway: !!this.hotel.sway, dark: mutator === 'strom',
      };
      this.s = {
        cfg, n, time: 0, rng,
        spawnQueue: [], spawned: 0, doorQueue: [], guests: [],
        hooks: [], keys: {}, residents: {}, rooms: [], counter: [], hand: [],
        chain: this.char.id === 'croupier' ? 3 : 0,
        goldenUntil: -1, phone: { ringing: false, next: 0 },
        chat: null, bellUsed: false, notizUsed: false, eruptions: 0, groups: {},
        labelAlpha: 1, ended: false, quietUntil: 0,
        stats: { served: 0, blitz: 0, flott: 0, ok: 0, zaeh: 0, errors: 0, eruptions: 0, bestChain: 0, score: 0, coins: 0, totalX: 0, saves: 0 },
      };
      this.s.phone.next = mutator === 'telefon' ? 4 : rng.range(9, 16);
      this.run.shift = n;
      this.buildHotel();
      this.buildSchedule();
      this.emit('shiftstart', { cfg });
    }

    buildHotel() {
      const S = this.s, rng = S.rng, cfg = S.cfg;
      const count = cfg.hooks;
      const floors = U.clamp(Math.ceil(count / 5), 2, 9);
      const maxNum = cfg.twins ? 39 : 24;
      const rooms = new Set();
      const similar = [];
      if (cfg.twins) {
        const pairs = Math.max(1, Math.round(count / 9));
        for (let p = 0; p < pairs * 3 && similar.length < pairs * 2; p++) {
          const d = [rng.int(1, Math.min(3, floors)), rng.int(1, 3), rng.int(1, 9)];
          const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
            .map((q) => q.map((i) => d[i]))
            .filter((q) => q[0] >= 1 && q[0] <= floors && q[1] * 10 + q[2] >= 1 && q[1] * 10 + q[2] <= maxNum)
            .map((q) => q[0] * 100 + q[1] * 10 + q[2]);
          const uniq = [...new Set(perms)].filter((r) => !rooms.has(r));
          if (uniq.length >= 2) {
            const two = rng.shuffle(uniq).slice(0, 2);
            two.forEach((r) => rooms.add(r));
            similar.push(two);
          }
        }
      }
      if (this.has('jackpot') || (count >= 12 && rng.chance(0.35))) rooms.add(777);
      let guard = 0;
      while (rooms.size < count && guard++ < 5000) rooms.add(rng.int(1, floors) * 100 + rng.int(1, maxNum));
      S.rooms = [...rooms].sort((a, b) => a - b);
      S.similar = similar;

      // Bewohner: Stammgäste (handgemachte Personas) und zufällige Originale
      const usedLast = new Set();
      const celebOk = cfg.s >= 11, kidOk = cfg.s >= 9;
      const personas = rng.shuffle(D.PERSONAS);
      const nSig = Math.min(personas.length, Math.round(count * 0.45));
      const sigRooms = new Set(rng.shuffle(S.rooms).slice(0, nSig));
      let pi = 0;
      for (const room of S.rooms) {
        let res;
        if (sigRooms.has(room)) {
          const P = personas[pi++];
          const face = Object.assign(F.gen(rng), { pet: null, teeth: null, lip: null, ear: null, extras: [], kid: false, celeb: false }, P.face);
          if (P.face.extras) face.extras = P.face.extras.slice();
          res = { room, first: P.first, last: P.last, quirk: P.quirk, say: P.say, face, celeb: false, kid: false, sig: true };
          usedLast.add(P.last);
        } else {
          let last = rng.pick(D.LAST), tries = 0;
          while (usedLast.has(last) && tries++ < 20) last = rng.pick(D.LAST);
          usedLast.add(last);
          const celeb = celebOk && rng.chance(0.12);
          const kid = !celeb && kidOk && rng.chance(0.12);
          res = { room, first: rng.pick(D.FIRST), last, quirk: rng.pick(D.QUIRKS), say: rng.pick(D.SAYS), face: F.gen(rng, { celeb, kid }), celeb, kid };
          if (celeb) res.quirk = 'Promi. Möchte nicht erkannt werden. Bitte trotzdem erkennen.';
        }
        res.keyId = null; res.seenDrop = false; res.backAt = 0;
        S.residents[room] = res;
      }
      // Seltene Gäste: Geister, Direktoren, Zeitreisende …
      if (this.o.rareBoost || rng.chance(0.3)) {
        const dec = new Date().getMonth() === 11;
        const R = rng.weighted(D.RARE, (r) => (r.id === 'santa' ? (dec ? 6 : 0.3) : 1));
        const cand = S.rooms.filter((r) => !S.residents[r].sig && !S.residents[r].kid && !S.residents[r].celeb && r !== 777);
        if (cand.length) {
          const room = rng.pick(cand);
          let first = R.first, last = R.last, face;
          if (R.id === 'doppel') {
            face = Object.assign(F.gen(new U.RNG(this.char.face.seed)), this.char.face);
            const parts = this.char.name.split(' ');
            first = parts.length > 1 ? parts[0] : 'Ein';
            last = parts.length > 1 ? parts.slice(1).join(' ') : this.char.name;
          } else face = Object.assign(F.gen(rng), { pet: null, teeth: null, lip: null, ear: null, extras: [], kid: false, celeb: false }, R.face);
          if (R.face.extras) face.extras = R.face.extras.slice();
          S.residents[room] = { room, first, last, quirk: R.quirk, say: R.say, face, celeb: false, kid: false, rare: R.id, ghost: !!R.ghost, keyId: null, seenDrop: false, backAt: 0 };
        }
      }
      // Zwillinge: gleicher Nachname, fast gleiches Gesicht, ähnliche Nummer
      if (cfg.twins) {
        const pairs = similar.length ? similar.slice(0, 2) : [];
        for (const [a, b] of pairs) {
          const ra = S.residents[a], rb = S.residents[b];
          if (!ra || !rb || ra.celeb || rb.celeb || ra.kid || rb.kid || ra.rare || rb.rare) continue;
          rb.first = ra.sig ? rng.pick(D.FIRST) : rb.first;
          rb.last = ra.last;
          rb.face = F.twin(ra.face, rng);
          rb.quirk = 'Zwilling. Findet das selbst verwirrend.';
          ra.twin = rb.twin = true;
        }
      }
      // Schlüssel: jeder mit eigenem Anhänger, Metall und Glücksbringer. Das Brett startet leer:
      // Wer einen Schlüssel zurückwill, hat ihn vorher in dieser Schicht abgegeben.
      S.hooks = S.rooms.map((room, idx) => ({ idx, room, key: null }));
      S.sketches = {};
      S.photos = {};
      S.rooms.forEach((room) => {
        const key = {
          id: this.ids++, room, spare: false, loc: 'room', hookIdx: -1, guestId: null,
          fob: rng.pick(D.FOBS), metal: rng.int(0, 2), charm: rng.chance(0.6) ? rng.pick(D.CHARMS) : null,
        };
        S.keys[key.id] = key;
        S.residents[room].keyId = key.id;
      });
    }

    buildSchedule() {
      const S = this.s, cfg = S.cfg, rng = S.rng;
      const q = [];
      let t = 1.0, planned = 0;
      const bossGroups = cfg.boss === 'group' ? [0.12, 0.5] : cfg.boss === 'band' ? [0.3] : [];
      let bg = 0;
      while (planned < cfg.n) {
        let ev;
        const left = cfg.n - planned;
        if (bg < bossGroups.length && planned >= cfg.n * bossGroups[bg] && left >= 3) {
          const size = Math.min(left, cfg.boss === 'band' ? rng.int(4, 5) : rng.int(3, 5));
          ev = { t, size, kind: cfg.boss === 'band' ? 'band' : 'group' };
          bg++;
        } else if (this.hotel.groups && left >= 3 && rng.chance(0.16)) {
          ev = { t, size: rng.int(3, 4), kind: 'group' };
        } else if (cfg.mutator === 'hochzeit' && left >= 3 && rng.chance(0.55)) {
          ev = { t, size: 3, kind: 'wedding' };
        } else {
          ev = { t, size: 1, kind: 'single' };
        }
        q.push(ev);
        planned += ev.size;
        t += cfg.T * rng.range(0.45, 1.55) * Math.pow(ev.size, 0.75);
      }
      S.spawnQueue = q;
    }

    // ------------------------------------------------------------------ Ankunft
    pickType() {
      const s = this.s.n, rng = this.s.rng;
      const types = Object.keys(D.TYPES).filter((k) => D.TYPES[k].w > 0 && D.TYPES[k].from <= s);
      return rng.weighted(types, (k) => (s >= 11 ? (k === 'normal' ? 5 : D.TYPES[k].w * 1.4) : D.TYPES[k].w));
    }

    pools() {
      const S = this.s;
      const busy = new Set();
      S.guests.forEach((g) => busy.add(g.room));
      S.doorQueue.forEach((g) => busy.add(g.room));
      if (this._making) this._making.forEach((g) => busy.add(g.room));
      const drop = [], pick = [];
      for (const r of S.rooms) {
        if (busy.has(r)) continue;
        const k = S.keys[S.residents[r].keyId];
        if (!k) continue;
        if (k.loc === 'room') drop.push(r);
        else if (k.loc === 'hook' && S.residents[r].seenDrop && S.time >= S.residents[r].backAt) pick.push(r);
      }
      return { drop, pick };
    }

    spawnEvent(ev) {
      const S = this.s;
      const made = [];
      this._making = made;
      const gid = ev.kind === 'group' || ev.kind === 'band' ? 'g' + this.ids++ : null;
      if (gid) S.groups[gid] = { erupted: false, color: S.rng.pick(['#e76f51', '#2a9d8f', '#e9c46a', '#8338ec', '#3a86ff', '#ff006e']), kind: ev.kind };
      for (let i = 0; i < ev.size; i++) {
        let type;
        if (ev.kind === 'group') type = 'group';
        else if (ev.kind === 'band') type = 'band';
        else if (ev.kind === 'wedding') type = 'normal';
        else type = this.pickType();
        const g = this.makeGuest(type, { groupId: gid, leader: gid && i === 0, wedding: ev.kind === 'wedding' });
        if (!g) break;
        made.push(g);
      }
      this._making = null;
      S.spawned += made.length;
      const rest = ev.size - made.length;
      if (rest > 0) {
        // Kein passendes Zimmer frei: Rest kommt etwas später
        S.spawnQueue.unshift({ t: S.time + 0.9, size: rest, kind: made.length ? 'single' : ev.kind });
        S.spawnQueue.sort((a, b) => a.t - b.t);
      }
      if (made.length) { this.emit('arrive', { n: made.length }); }
      for (const g of made) {
        const slot = this.freeSlot();
        if (slot >= 0) this.enterGuest(g, slot);
        else { S.doorQueue.push(g); this.emit('queue', { n: S.doorQueue.length }); }
      }
    }

    makeGuest(type, opt) {
      const S = this.s, rng = S.rng;
      const pools = this.pools();
      let T = D.TYPES[type];
      let kind = T.kind || null;
      let pool;
      const reset = () => { type = 'normal'; T = D.TYPES.normal; kind = null; pool = null; };
      if (type === 'celeb') {
        pool = pools.pick.filter((r) => S.residents[r].celeb);
        if (!pool.length) reset();
      } else if (type === 'kid') {
        pool = pools.drop.concat(pools.pick).filter((r) => S.residents[r].kid);
        if (!pool.length) reset();
      } else if (type === 'loser') {
        // Hat den Schlüssel schon einmal abgegeben und wieder geholt – und jetzt verloren
        pool = pools.drop.filter((r) => !S.residents[r].celeb && S.residents[r].seenDrop);
        if (!pool.length) reset();
      } else if (type === 'tourist' && !pools.drop.length) reset();
      if (!pool || !pool.length) {
        if (!kind) {
          if (!pools.drop.length && !pools.pick.length) return null;
          if (!pools.drop.length) kind = 'pick';
          else if (!pools.pick.length) kind = 'drop';
          else {
            const bias = (pools.drop.length - pools.pick.length) / (pools.drop.length + pools.pick.length);
            kind = rng.chance(0.5 + bias * 0.35) ? 'drop' : 'pick';
          }
        }
        pool = kind === 'drop' ? pools.drop : pools.pick;
        if (!pool.length) return null;
      }
      const room = rng.pick(pool);
      const res = S.residents[room];
      if (!kind) kind = S.keys[res.keyId].loc === 'hook' ? 'pick' : 'drop';
      if (type === 'loser') kind = 'pick';
      if (type !== 'group' && type !== 'band' && type !== 'loser') {
        if (res.celeb && kind === 'pick') { type = 'celeb'; T = D.TYPES.celeb; }
        else if (res.kid) { type = 'kid'; T = D.TYPES.kid; }
        else if (type === 'celeb' || type === 'kid') { type = 'normal'; T = D.TYPES.normal; }
      }

      const g = {
        id: this.ids++, room, res, type, kind, r: T.r,
        x: 0, rage: 0, level: 0, erupted: false,
        slot: -1, state: 'door', st: 0, reveal: 'room',
        groupId: opt.groupId || null, leader: !!opt.leader, wedding: !!opt.wedding,
        keyId: null, foreign: null, line: '',
        chatNext: 0, kidNext: 0, kidSwaps: 0, complaint: false, wrongKeyId: null, returnAt: 0,
      };
      if (kind === 'drop') {
        const k = S.keys[res.keyId];
        k.loc = 'guest'; k.guestId = g.id; g.keyId = k.id;
        if (type === 'tourist') g.foreign = D.foreign(room, rng);
        g.line = rng.pick(D.DROP_LINES);
      } else {
        if (type === 'loser') { S.keys[res.keyId].loc = 'lost'; }
        g.reveal = this.revealFor(g);
        g.line = g.reveal === 'face' ? rng.pick(D.FACE_LINES) : '';
      }
      return g;
    }

    revealFor(g) {
      const s = this.s.n, r = this.s.rng.next();
      if (g.type === 'celeb') return 'face';
      if (g.type === 'complaint') return 'room';
      if (g.type === 'loser') return 'name';
      if (s < 2) return 'room';
      if (s < 3) return r < 0.55 ? 'room' : 'face';
      if (s < 6) return r < 0.22 ? 'room' : r < 0.55 ? 'name' : 'face';
      return r < 0.12 ? 'room' : r < 0.4 ? 'name' : 'face';
    }

    setSketch(room, strokes) {
      const S = this.s;
      if (!S || !S.residents[room]) return;
      if (strokes && strokes.length) S.sketches[room] = strokes;
      else delete S.sketches[room];
      this.emit('sketch', { room });
    }

    freeSlot() {
      const used = new Set(this.s.guests.filter(ACTIVE).map((g) => g.slot));
      for (const i of SLOT_ORDER) if (!used.has(i)) return i;
      return -1;
    }

    enterGuest(g, slot) {
      const S = this.s;
      g.slot = slot; g.state = 'enter'; g.st = 0;
      g.chatNext = S.time + 1.6;
      g.kidNext = S.time + 3 + S.rng.range(0, 2);
      if (!S.guests.includes(g)) S.guests.push(g);
      this.emit('enter', { g });
    }

    // ------------------------------------------------------------------ Takt
    update(dt) {
      const S = this.s;
      if (!S || S.ended || this.run.over) return;
      S.time += dt;

      while (S.spawnQueue.length && S.spawnQueue[0].t <= S.time) this.spawnEvent(S.spawnQueue.shift());
      if (S.doorQueue.length) {
        const free = this.freeSlot();
        if (free >= 0) this.enterGuest(S.doorQueue.shift(), free);
      }
      this.updatePhone();

      const golden = S.time < S.goldenUntil;
      const gf = golden ? 0.5 : 1;
      const base = this.rageMult();
      const bySlot = {};
      for (const g of S.guests) if (ACTIVE(g)) bySlot[g.slot] = g;
      const contagious = !this.has('fahrstuhlmusik');

      for (const g of S.guests) {
        if (g.state === 'enter') { g.st += dt; if (g.st >= 0.75) g.state = 'wait'; }
        if (ACTIVE(g)) {
          g.x += dt * gf;
          let m = 1;
          if (contagious) {
            for (const j of NEIGH[g.slot]) {
              const nb = bySlot[j];
              if (!nb) continue;
              const loud = nb.type === 'band' ? 2 : 1;
              if (nb.level >= 5) m += 0.5 * loud;
              else if (nb.level >= 4) m += 0.25 * loud;
            }
          }
          g.rage += dt * g.r * base * gf * m;
        } else if (g.state === 'away') {
          g.x += dt * gf;
          if (S.time >= g.returnAt) this.returnComplaint(g);
        } else if (g.state === 'leave') {
          g.st += dt;
        }
      }
      // Reisegruppe: Die Wut des Schlimmsten gilt für alle
      for (const gid in S.groups) {
        let mx = -1;
        const mem = S.guests.filter((g) => g.groupId === gid && ACTIVE(g));
        for (const g of mem) mx = Math.max(mx, g.rage);
        for (const g of mem) g.rage = mx;
      }
      // Stufenwechsel
      for (const g of S.guests) {
        if (!ACTIVE(g)) continue;
        const lv = D.levelFor(g.rage);
        if (lv !== g.level) {
          const prev = g.level;
          g.level = lv;
          this.emit('level', { g, prev });
          if (lv >= 5 && !g.erupted) this.erupt(g);
          if (this.run.over) return;
        }
        // Plauderer blockiert den Tresen
        if (g.type === 'chatter' && !S.chat && S.time >= g.chatNext) {
          S.chat = { guestId: g.id, hp: 3, text: S.rng.pick(D.CHATTER) };
          this.emit('chat', { g, text: S.chat.text });
        }
        // Kinder vertauschen Schlüssel
        if (g.type === 'kid' && g.kidSwaps < 2 && S.time >= g.kidNext) {
          g.kidNext = S.time + 6 + S.rng.range(0, 3);
          this.kidSwap(g);
        }
      }
      // Weggehende Gäste entfernen
      for (let i = S.guests.length - 1; i >= 0; i--) {
        const g = S.guests[i];
        if (g.state === 'leave' && g.st >= 0.9) { S.guests.splice(i, 1); this.emit('gone', { g }); }
      }
      // Blinde Haken
      S.labelAlpha = S.cfg.blind && !this.has('messingschild') ? Math.max(0.04, 1 - S.time / 28) : 1;

      if (!S.spawnQueue.length && !S.doorQueue.length && !S.guests.length && S.spawned >= S.cfg.n) this.endShift();
    }

    updatePhone() {
      const S = this.s, P = S.phone;
      if (!S.cfg.phone || P.ringing) return;
      if (S.time >= P.next && (S.spawnQueue.length || S.guests.length)) {
        P.ringing = true;
        this.emit('phone', { on: true });
      }
    }

    answerPhone() {
      const S = this.s, P = S.phone;
      if (!P.ringing) return null;
      P.ringing = false;
      P.next = S.time + (S.cfg.mutator === 'telefon' ? S.rng.range(4, 8) : S.rng.range(13, 22));
      this.run.stats.phone++;
      const quip = S.rng.pick(D.PHONE);
      this.emit('phone', { on: false, quip });
      return quip;
    }

    kidSwap(g) {
      const S = this.s;
      const occ = S.hooks.filter((h) => h.key != null);
      if (occ.length < 2) return;
      const a = S.rng.pick(occ);
      const near = occ.filter((h) => h !== a).sort((x, y) => Math.abs(x.idx - a.idx) - Math.abs(y.idx - a.idx)).slice(0, 4);
      const b = S.rng.pick(near);
      const ka = a.key, kb = b.key;
      a.key = kb; b.key = ka;
      S.keys[ka].hookIdx = b.idx; S.keys[kb].hookIdx = a.idx;
      g.kidSwaps++;
      S.kidSwapped = true;
      this.emit('kidswap', { g, a: a.idx, b: b.idx });
    }

    erupt(g) {
      const S = this.s, run = this.run;
      g.erupted = true;
      if (g.groupId) {
        const grp = S.groups[g.groupId];
        if (grp.erupted) return;
        grp.erupted = true;
      }
      let cost = 1;
      if (this.has('blitzableiter')) { cost = 0; S.eruptions++; }
      run.nerves -= cost;
      S.stats.eruptions++; run.stats.eruptions++;
      if (g.rage > run.stats.angriest) { run.stats.angriest = g.rage; run.stats.angriestRoom = g.room; }
      this.emit('eruption', { g, cost });
      this.checkOver();
    }

    useBell() {
      const S = this.s;
      if (!this.has('klingel') || S.bellUsed) return false;
      S.bellUsed = true;
      let calmed = 0;
      for (const g of S.guests) if (ACTIVE(g)) { if (g.level >= 3) calmed++; g.rage = 0; }
      this.emit('bell', { calmed });
      return true;
    }

    hitChat(swipe) {
      const S = this.s;
      if (!S.chat) return;
      S.chat.hp -= swipe ? 3 : 1;
      if (S.chat.hp <= 0) {
        const g = this.guest(S.chat.guestId);
        if (g) g.chatNext = S.time + 7;
        S.chat = null;
        this.emit('chatend', { dismissed: true });
      } else this.emit('chathit', { hp: S.chat.hp });
    }

    // ------------------------------------------------------------------ Hand
    pick(src) {
      const S = this.s;
      if (!S || S.ended || this.run.over) return null;
      let key = null, origin = null;
      if (src.type === 'hook') {
        const h = S.hooks[src.idx];
        if (!h || h.key == null) return null;
        key = S.keys[h.key]; h.key = null; key.hookIdx = -1;
        origin = { type: 'hook', idx: src.idx };
      } else if (src.type === 'guest') {
        const g = this.guest(src.id);
        if (!g || !ACTIVE(g) || g.kind !== 'drop' || g.keyId == null) return null;
        key = S.keys[g.keyId];
        if (!key || key.loc !== 'guest') return null;
        origin = { type: 'guest', id: g.id };
      } else if (src.type === 'counter') {
        key = S.keys[src.keyId];
        if (!key || key.loc !== 'counter') return null;
        S.counter = S.counter.filter((id) => id !== key.id);
        origin = { type: 'counter' };
      } else if (src.type === 'spare') {
        const res = S.residents[src.room];
        const old = res && S.keys[res.keyId];
        if (!old || old.loc !== 'lost') return null;
        delete S.keys[old.id];
        key = { id: this.ids++, room: res.room, spare: true, loc: 'hand', hookIdx: -1, guestId: null, fob: old.fob, metal: old.metal, charm: old.charm };
        S.keys[key.id] = key;
        res.keyId = key.id;
        origin = { type: 'counter' };
        this.emit('spare', { room: res.room });
      }
      if (!key) return null;
      while (S.hand.length >= this.handCap()) this.returnKey(S.hand[0]);
      key.loc = 'hand';
      const entry = { keyId: key.id, origin };
      S.hand.push(entry);
      if (src.type === 'counter') this.emit('counter', {});
      if (src.type === 'hook') this.emit('board', { idx: src.idx });
      this.emit('hand', {});
      return entry;
    }

    removeFromHand(entry) {
      this.s.hand = this.s.hand.filter((e) => e !== entry);
    }

    returnKey(entry) {
      const S = this.s;
      const key = S.keys[entry.keyId];
      this.removeFromHand(entry);
      if (!key) return;
      const o = entry.origin;
      if (o.type === 'hook' && S.hooks[o.idx].key == null) {
        S.hooks[o.idx].key = key.id; key.loc = 'hook'; key.hookIdx = o.idx;
        this.emit('board', { idx: o.idx });
      } else if (o.type === 'guest') {
        const g = this.guest(o.id);
        if (g && ACTIVE(g) && g.keyId === key.id) { key.loc = 'guest'; }
        else { key.loc = 'counter'; S.counter.push(key.id); this.emit('counter', {}); }
      } else {
        key.loc = 'counter'; S.counter.push(key.id); this.emit('counter', {});
      }
      this.emit('hand', { returned: key.id });
    }

    cancelHand() {
      while (this.s.hand.length) this.returnKey(this.s.hand[0]);
    }

    bestHandFor(target) {
      const S = this.s;
      if (S.hand.length <= 1) return S.hand[0];
      let room = null;
      if (target && target.type === 'hook') room = S.hooks[target.idx].room;
      if (target && target.type === 'guest') { const g = this.guest(target.id); room = g && g.room; }
      const hit = S.hand.find((e) => S.keys[e.keyId] && S.keys[e.keyId].room === room);
      return hit || S.hand[S.hand.length - 1];
    }

    /** Legt einen Schlüssel aus der Hand ab. target: {type:'hook',idx} | {type:'guest',id} | null */
    drop(target, keyId) {
      const S = this.s;
      if (!S || !S.hand.length) return { r: 'none' };
      const entry = keyId != null ? S.hand.find((e) => e.keyId === keyId) : this.bestHandFor(target);
      if (!entry) return { r: 'none' };
      const key = S.keys[entry.keyId];
      if (!target) { this.returnKey(entry); return { r: 'cancel', key }; }

      if (target.type === 'hook') {
        const hook = S.hooks[target.idx];
        if (entry.origin.type === 'hook' && entry.origin.idx === target.idx) { this.returnKey(entry); return { r: 'cancel', key }; }
        if (hook.key != null) {
          // Ab Schicht 7: zwei Haken-Schlüssel tauschen (zum Reparieren)
          if (!S.cfg.strict && entry.origin.type === 'hook' && S.hooks[entry.origin.idx].key == null) {
            const other = S.keys[hook.key], oh = S.hooks[entry.origin.idx];
            oh.key = other.id; other.hookIdx = oh.idx;
            hook.key = key.id; key.loc = 'hook'; key.hookIdx = hook.idx;
            this.removeFromHand(entry);
            this.emit('board', { idx: hook.idx }); this.emit('board', { idx: oh.idx }); this.emit('hand', {});
            this.emit('swap', { a: hook.idx, b: oh.idx, fixed: key.room === hook.room || other.room === oh.room });
            return { r: 'swap', key, a: hook.idx, b: oh.idx };
          }
          this.returnKey(entry);
          return { r: 'bounce', why: 'occupied', key };
        }
        const correct = key.room === hook.room;
        if (!correct && S.cfg.strict) { this.returnKey(entry); return { r: 'bounce', why: 'wrong-hook', key }; }
        this.removeFromHand(entry);
        hook.key = key.id; key.loc = 'hook'; key.hookIdx = hook.idx; key.guestId = null;
        this.emit('board', { idx: hook.idx });
        this.emit('hand', {});
        if (entry.origin.type === 'guest') {
          const g = this.guest(entry.origin.id);
          if (g && ACTIVE(g) && g.keyId === key.id) {
            g.keyId = null;
            return this.serve(g, { hookIdx: hook.idx, misplaced: !correct });
          }
        }
        return { r: 'placed', key, correct, hookIdx: hook.idx };
      }

      if (target.type === 'guest') {
        const g = this.guest(target.id);
        if (!g || !ACTIVE(g)) { this.returnKey(entry); return { r: 'cancel', key }; }
        if (g.kind === 'drop') {
          const self = entry.origin.type === 'guest' && entry.origin.id === g.id;
          this.returnKey(entry);
          return { r: self ? 'cancel' : 'bounce', why: 'drop-guest', key, g };
        }
        if (entry.origin.type === 'guest') { this.returnKey(entry); return { r: 'bounce', why: 'hang-first', key, g }; }
        this.removeFromHand(entry);
        this.emit('hand', {});
        if (key.room === g.room) {
          key.loc = 'room'; key.guestId = null;
          return this.serve(g, { key });
        }
        return this.miss(g, key);
      }
      this.returnKey(entry);
      return { r: 'cancel', key };
    }

    // ------------------------------------------------------------------ Wertung
    serve(g, info) {
      const S = this.s, run = this.run, st = run.stats;
      const x = g.x;
      const xEff = Math.max(D.X_MIN, x - (this.has('glocke') ? 1 : 0));
      const prevChain = S.chain;
      const fast = xEff <= this.chainWindow();
      if (fast) S.chain++;
      else if (!this.has('goldschluessel')) S.chain = 0;
      const k = Math.min(S.chain, D.CHAIN_CAP);
      const mK = 1 + (this.has('rotekarte') ? 0.2 : 0.1) * k;
      const mS = 1 + (this.has('nachtzuschlag') ? 0.4 : 0.2) * (S.n - 1);
      const soothed = g.level >= 4;
      let mR = 1 + 0.2 * S.eruptions;
      if (soothed && this.has('charme')) mR *= 1.5;
      const B = D.B * (this.has('trinkgeldglas') ? 0.9 : 1);
      const jackpot = g.room === 777;

      let event = null;
      if (S.rng.chance(D.EVENT_CHANCE * (this.has('glueckskatze') ? 3 : 1))) event = S.rng.weighted(D.EVENTS, (e) => e.w);

      let pts = Math.floor((B * mS * mK * mR) / xEff);
      if (jackpot) pts *= this.has('jackpot') ? 5 : 3;
      if (event && event.id === 'gross') pts *= 2;

      const T = D.TYPES[g.type] || D.TYPES.normal;
      let coins = xEff <= 2 ? 3 : xEff <= 5 ? 2 : 1;
      if (T.tip === 0.5) coins = Math.max(1, Math.floor(coins / 2));
      if (T.tip === 2) coins *= 2;
      if (soothed) coins *= this.has('charme') ? 5 : 3;
      const near = g.level === 4 && g.rage >= D.THRESH[5] * 0.85;
      if (near) coins += 2;
      if (event && event.id === 'stammgast') coins += 8;
      if (this.has('trinkgeldglas')) coins = Math.round(coins * 1.5);

      if (event && event.id === 'pralinen') {
        for (const h of S.guests) if (ACTIVE(h) && h !== g) h.rage = h.level > 0 ? D.THRESH[h.level - 1] + 0.01 : 0;
      }
      if (event && event.id === 'kaffee') run.nerves = Math.min(run.maxNerves, run.nerves + 1);

      run.score += pts; run.coins += coins;
      const stamp = D.stampFor(xEff);
      S.stats.served++; st.served++;
      S.stats[stamp]++; st[stamp]++;
      S.stats.score += pts; S.stats.coins += coins;
      S.stats.totalX += x; st.totalX += x;
      S.stats.bestChain = Math.max(S.stats.bestChain, S.chain);
      st.bestChain = Math.max(st.bestChain, S.chain);
      if (near) { S.stats.saves++; st.saves++; }
      if (soothed) st.soothed++;
      if (jackpot) st.jackpots++;
      if (g.rage > st.angriest && g.level >= 4) { st.angriest = g.rage; st.angriestRoom = g.room; }

      g.state = 'leave'; g.st = 0;
      if (g.kind === 'drop') {
        g.res.seenDrop = true;
        g.res.backAt = S.time + S.rng.range(D.AWAY_MIN, D.AWAY_MAX);
        if (this.has('polaroid')) { S.photos[g.room] = true; this.emit('sketch', { room: g.room }); }
      }
      if (S.chat && S.chat.guestId === g.id) { S.chat = null; this.emit('chatend', {}); }
      if (g.erupted || g.level >= 5) S.quietUntil = S.time + 2.2;

      let golden = false;
      for (const at of D.GOLDEN_AT) if (S.chain >= at && prevChain < at) golden = true;
      if (golden) { S.goldenUntil = S.time + D.GOLDEN_DUR * (this.has('kristall') ? 2 : 1); st.golden++; }

      const res = {
        r: 'served', g, key: info.key || null, x, xEff, pts, coins, stamp, chain: S.chain, prevChain, mK, soothed,
        relief: g.erupted || g.level >= 5, near, jackpot, event, golden, misplaced: !!info.misplaced, hookIdx: info.hookIdx,
      };
      this.emit('serve', res);
      if (golden) this.emit('golden', { until: S.goldenUntil });
      return res;
    }

    miss(g, key) {
      const S = this.s, run = this.run;
      S.stats.errors++; run.stats.errors++;
      const prevChain = S.chain;
      S.chain = 0;
      let cost = S.cfg.inspector || g.type === 'celeb' ? 2 : 1;
      let saved = false;
      if (this.has('notizblock') && !S.notizUsed) { S.notizUsed = true; cost = 0; saved = true; }
      run.nerves -= cost;
      if (this.has('rotekarte')) {
        for (const h of S.guests) if (ACTIVE(h) && h !== g) h.rage = Math.max(h.rage, D.THRESH[Math.min(5, h.level + 1)] + 0.01);
      }
      key.loc = 'away'; key.guestId = g.id;
      g.wrongKeyId = key.id;
      g.awayLevel = g.level;
      g.state = 'away';
      g.returnAt = S.time + D.COMPLAINT_DELAY;
      g.groupId = null;
      if (S.chat && S.chat.guestId === g.id) { S.chat = null; this.emit('chatend', {}); }
      this.emit('miss', { g, key, cost, saved, prevChain });
      this.checkOver();
      return { r: 'miss', g, key, cost, saved };
    }

    returnComplaint(g) {
      const S = this.s;
      g.complaint = true;
      g.type = 'complaint';
      g.reveal = 'room';
      g.line = '';
      const lv = Math.min(5, (g.awayLevel || 0) + 2);
      g.rage = Math.max(g.rage, D.THRESH[lv] + 0.01);
      const key = S.keys[g.wrongKeyId];
      if (key) { key.loc = 'counter'; key.guestId = null; S.counter.push(key.id); this.emit('counter', { from: g.id }); }
      g.wrongKeyId = null;
      g.state = 'door';
      const slot = this.freeSlot();
      if (slot >= 0) this.enterGuest(g, slot);
      else S.doorQueue.unshift(g);
      this.emit('return', { g });
    }

    checkOver() {
      if (this.run.nerves <= 0 && !this.run.over) {
        this.run.nerves = 0;
        this.run.over = true;
        this.cancelHandSilently();
        this.emit('gameover', {});
      }
    }

    cancelHandSilently() { if (this.s) this.s.hand = []; }

    endShift() {
      const S = this.s;
      S.ended = true;
      if (S.phone.ringing) { S.phone.ringing = false; this.emit('phone', { on: false }); }
      this.cancelHand();
      this.emit('shiftend', { stats: S.stats, boss: S.cfg.boss, n: S.n });
    }

    // ------------------------------------------------------------------ Pausenraum
    offerRelics(boss, n) {
      n = n || 3;
      const rng = this.relicRng;
      let cands = this.relicPool.filter((id) => !this.has(id)).map(D.relic).filter(Boolean);
      if (boss) {
        const rare = cands.filter((r) => r.rarity === 'rare');
        cands = rare.length >= n ? rare : rare.concat(cands.filter((r) => r.rarity === 'uncommon'));
        if (cands.length < n) cands = this.relicPool.filter((id) => !this.has(id)).map(D.relic);
      }
      const W = { common: 6, uncommon: 3, rare: boss ? 6 : 1.1 };
      const out = [];
      while (out.length < n && cands.length) {
        const r = rng.weighted(cands, (c) => W[c.rarity]);
        out.push(r);
        cands = cands.filter((c) => c !== r);
      }
      return out;
    }

    shopRelics(exclude) {
      const ex = new Set(exclude || []);
      let cands = this.relicPool.filter((id) => !this.has(id) && !ex.has(id)).map(D.relic);
      const out = [];
      while (out.length < 2 && cands.length) {
        const r = this.relicRng.pick(cands);
        out.push({ relic: r, price: D.PRICES[r.rarity] });
        cands = cands.filter((c) => c !== r);
      }
      return out;
    }

    takeRelic(id) {
      if (this.has(id)) return;
      this.run.relics.push(id);
      if (id === 'espresso') { this.run.maxNerves += 2; this.run.nerves += 2; }
      this.emit('relic', { id });
    }

    spend(n) {
      if (this.run.coins < n) return false;
      this.run.coins -= n;
      return true;
    }

    stars() {
      const completed = Math.max(0, this.run.shift - 1);
      const sc = this.run.score;
      let st = completed + (sc >= 1000 ? Math.floor(Math.log2(sc / 1000)) : 0);
      st = Math.round(st * this.cls.reward);
      return Math.max(1, st);
    }
  }

  K.Game = Game;
  K.SLOTS = SLOTS;
})(window.K);
