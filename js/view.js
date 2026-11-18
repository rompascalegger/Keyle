/* Keyle – Ansicht: DOM-Darstellung, Eingabe (Ziehen und Antippen), Effekte */
(function (K) {
  'use strict';
  const U = K.util, D = K.data, F = K.faces, A = K.audio, FX = K.fx;

  const FLOOR_COLORS = { 1: '#c0392b', 2: '#2e86de', 3: '#27ae60', 4: '#8e44ad', 5: '#e67e22', 6: '#16a085', 7: '#d35400', 8: '#c2185b', 9: '#5d6d7e' };
  const tagColor = (room) => (room === 777 ? '#d4a017' : FLOOR_COLORS[Math.floor(room / 100)] || '#666');
  const MOODS = ['😊', '😐', '😒', '😠', '😡', '🤬'];
  const RING_C = 56.55;

  const METALS = ['#i-key', '#i-key2', '#i-key3'];
  const PEN_COLORS = ['#1d1a22', '#7a4a24', '#e0a020', '#d94030', '#2e6fd8', '#3a9a50', '#e06aa3'];

  function keyHTML(key, o) {
    o = o || {};
    const label = o.hidden ? '?' : key.room;
    let cls = 'key fob-' + (key.fob || 'pear');
    if (key.room === 777) cls += ' k777';
    if (key.spare) cls += ' spare';
    if (o.hidden) cls += ' hidden';
    if (o.cls) cls += ' ' + o.cls;
    const data = o.nodata ? '' : ` data-key="${key.id}"`;
    const charm = key.charm ? `<span class="charm">${key.charm}</span>` : '';
    const sk = o.sk ? '<span class="skb">✏️</span>' : '';
    return `<div class="${cls}"${data} style="--tag:${tagColor(key.room)}"><svg class="metal" viewBox="0 0 20 48"><use href="${METALS[key.metal || 0]}"/></svg>${charm}<div class="fob"><b>${label}</b></div>${sk}</div>`;
  }

  // Skizze (Striche mit normierten Koordinaten 0–1) als SVG
  function sketchSVG(strokes) {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + strokes.map((st) => {
      if (st.p.length === 1) return `<circle cx="${(st.p[0][0] * 100).toFixed(1)}" cy="${(st.p[0][1] * 100).toFixed(1)}" r="${(st.w * 50).toFixed(2)}" fill="${st.c}"/>`;
      return `<polyline points="${st.p.map((q) => (q[0] * 100).toFixed(1) + ',' + (q[1] * 100).toFixed(1)).join(' ')}" fill="none" stroke="${st.c}" stroke-width="${(st.w * 100).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('') + '</svg>';
  }
  K.keyHTML = keyHTML;
  K.sketchSVG = sketchSVG;
  K.tagColor = tagColor;

  class View {
    constructor(app) {
      this.app = app;
      this.game = null;
      this.W = 440; this.L = 320; this.LT = 56; this.BT = 422; this.scale = 1;
      const $ = (s) => document.querySelector(s);
      this.el = {
        stage: $('#stage'), shake: $('#shake'), score: $('#score'), coins: $('#coins'), coinsBox: $('.hud-right .coins'),
        nerves: $('#nerves'), shiftlbl: $('#shiftlbl'), leftlbl: $('#leftlbl'), prog: $('#prog'), chain: $('#chain'),
        lobby: $('#lobby'), guests: $('#guests'), gui: $('#gui'), queue: $('#queue'), doorpanels: $('#doorpanels'),
        counter: $('#counter'), loose: $('#loose'), phone: $('#phone'), inspector: $('#inspector'),
        boardwrap: $('#boardwrap'), board: $('#board'), rants: $('#rants'), dark: $('#dark'), book: $('#book'), side: $('#side'),
        hand: $('#hand'), relicbar: $('#relicbar'), btnBook: $('#btn-book'), btnSketch: $('#btn-sketch'), sketch: $('#sketch'), btnBell: $('#btn-bell'), btnPause: $('#btn-pause'),
        chat: $('#chat'), banner: $('#banner'), golden: $('#golden'), floats: $('#floats'), flash: $('#flash'), toast: $('#toast'),
        clockH: $('#clock-h'), clockM: $('#clock-m'),
      };
      this.gEls = new Map();
      this.rantEls = new Map();
      this.pointer = null;
      this.ghost = null;
      this.hover = null;
      this.scoreShown = 0; this.pending = 0;
      this.coinsShown = 0; this.coinsPending = 0;
      this.lastNerves = -1; this.lastMax = -1;
      this.steamT = 0; this.ambT = 0; this.tutT = 0;
      this.bookOpen = false;
      this.toastTimer = null; this.bannerTimer = null;
      this.lightPos = null;
      this.bindInput();
      this.bindUI();
    }

    // ------------------------------------------------------------ Geometrie
    layout(d) {
      this.W = d.W; this.L = d.lobbyH; this.LT = d.hudH; this.BT = d.boardTop; this.BH = d.boardH; this.scale = d.scale;
      this.refreshRect();
      if (this.game && this.game.s) {
        this.fitBoard();
        for (const rec of this.gEls.values()) if (rec.where) this.place(rec, rec.where, true);
      }
    }
    refreshRect() { this.rect = this.el.stage.getBoundingClientRect(); }
    toStage(cx, cy) { return [(cx - this.rect.left) / this.scale, (cy - this.rect.top) / this.scale]; }
    toClient(x, y) { return [this.rect.left + x * this.scale, this.rect.top + y * this.scale]; }
    srect(el) {
      const b = el.getBoundingClientRect();
      const [x, y] = this.toStage(b.left, b.top);
      return { x, y, w: b.width / this.scale, h: b.height / this.scale, cx: x + b.width / this.scale / 2, cy: y + b.height / this.scale / 2 };
    }
    keyEl(id) {
      return Array.from(document.querySelectorAll(`[data-key="${id}"]`)).find((e) => !e.closest('#floats') && !e.closest('.screen'));
    }
    keyCenter(id) {
      const e = this.keyEl(id);
      if (!e) return null;
      const r = this.srect(e);
      if (r.w === 0) return null;
      return { x: r.cx, y: r.cy };
    }
    handSlotCenter(id) {
      const e = this.el.hand.querySelector(`[data-handkey="${id}"]`);
      if (!e) return null;
      const r = this.srect(e);
      return { x: r.cx, y: r.cy };
    }
    guestHead(rec) {
      const p = rec.pos;
      return { x: p.x, y: this.LT + p.y - 113 * p.sc * 0.56 };
    }

    // ------------------------------------------------------------ Lebenszyklus
    attach(game) {
      this.game = game;
      game.on((t, d) => this.onEvent(t, d));
    }

    setupShift() {
      const G = this.game, S = G.s, cfg = S.cfg;
      for (const rec of this.gEls.values()) { rec.body.remove(); rec.ui.remove(); }
      this.gEls.clear();
      for (const el of this.rantEls.values()) el.remove();
      this.rantEls.clear();
      this.el.floats.innerHTML = '';
      this.el.chat.className = 'chat';
      this.closeBook(true);
      this.closeSketch(false, true);
      this.setSketchMode(false);
      this.el.boardwrap.classList.toggle('sway', !!cfg.sway);
      this.el.boardwrap.classList.toggle('dark', !!cfg.dark);
      this.el.boardwrap.classList.toggle('archive', G.char.id === 'archivarin');
      this.buildBoard();
      this.renderLoose();
      this.renderHand();
      this.renderRelics();
      this.renderSide();
      this.el.boardwrap.classList.remove('rattle');
      this.el.counter.classList.remove('rattle');
      this.el.phone.classList.toggle('show', !!cfg.phone);
      this.el.phone.classList.remove('ringing');
      this.el.btnBell.classList.toggle('show', G.has('klingel'));
      this.el.btnBell.classList.remove('used');
      this.el.golden.classList.remove('on');
      this.el.queue.classList.remove('show');
      this.setupInspector(cfg.inspector);
      this.scoreShown = G.run.score; this.pending = 0;
      this.coinsShown = G.run.coins; this.coinsPending = 0;
      this.lastNerves = -1;
      this.lastChain = -1;
      this.el.shiftlbl.textContent = 'Schicht ' + S.n + (cfg.boss ? ' · Boss' : '');
      this.renderHUD(0);
      if (cfg.dark) this.setLight(this.W / 2, this.BH * 0.45);
      this.hideBanner();
    }

    setupInspector(on) {
      const el = this.el.inspector;
      el.classList.toggle('show', !!on);
      if (!on) { el.innerHTML = ''; return; }
      const rng = new U.RNG(777);
      const f = Object.assign(F.gen(rng), { hair: 'receding', hairColor: '#9e9e9e', glasses: 'monocle', beard: 'mustache', hat: 'bowler', hatColor: '#1d1d22', pet: null, extras: [], teeth: null });
      el.innerHTML = F.render(f, 1, { outfit: 'inspector', shirt: '#4a4e69' }) + '<div class="scribble"></div><div class="note">Notiert.</div>';
    }

    // ------------------------------------------------------------ Brett
    buildBoard() {
      const S = this.game.s;
      const n = S.hooks.length;
      const b = this.el.board;
      const r = this.srect(b);
      const BW = Math.max(200, r.w - 20), BH = Math.max(150, r.h - 26);
      let cols = 3, best = 0;
      for (let c = 2; c <= 10; c++) {
        const ks = Math.min(BW / c / 56, BH / Math.ceil(n / c) / 86);
        if (ks > best + 0.001) { best = ks; cols = c; }
      }
      this.cols = cols; this.rows = Math.ceil(n / cols);
      b.style.setProperty('--cols', cols);
      b.innerHTML = S.hooks.map((h) => `<div class="hook" data-hook="${h.idx}"><div class="plate"><b>${h.room}</b></div><div class="peg"></div><div class="sk" data-skroom="${h.room}"></div><div class="slot"></div></div>`).join('');
      this.hookEls = Array.from(b.children);
      S.hooks.forEach((h) => this.renderHook(h.idx));
      this.fitBoard();
    }
    fitBoard() {
      const b = this.el.board;
      const r = this.srect(b);
      const cw = (r.w - 20) / this.cols, ch = (r.h - 26) / this.rows;
      const ks = U.clamp(Math.min(cw / 50, ch / 86), 0.4, 1.6);
      b.style.setProperty('--ks', ks.toFixed(3));
    }
    renderHook(idx, anim) {
      const S = this.game.s, h = S.hooks[idx], cell = this.hookEls && this.hookEls[idx];
      if (!cell) return;
      const slot = cell.lastElementChild;
      slot.innerHTML = h.key != null ? keyHTML(S.keys[h.key], { cls: anim ? 'swing' : '' }) : '';
      const thumb = this.sketchThumb(h.room);
      const sk = cell.querySelector('.sk');
      if (sk.dataset.v !== thumb.length + ':' + (S.sketchV || 0)) { sk.innerHTML = thumb; sk.dataset.v = thumb.length + ':' + (S.sketchV || 0); }
      cell.classList.toggle('has-sk', !!thumb);
    }
    sketchThumb(room) {
      const S = this.game.s;
      if (S.sketches && S.sketches[room]) return sketchSVG(S.sketches[room]);
      if (S.photos && S.photos[room] && S.residents[room]) return '<div class="polaroid">' + F.render(S.residents[room].face, 0, { mini: true }) + '</div>';
      return '';
    }
    hookIdxOf(room) { return this.game.s.hooks.findIndex((h) => h.room === room); }

    // ------------------------------------------------------------ Gäste
    faceOf(g) {
      return g.res.face;
    }
    faceOpts(g) {
      const o = {};
      const grp = g.groupId && this.game.s.groups[g.groupId];
      if (g.type === 'group' && grp) { o.shirt = grp.color; o.outfit = 'tee'; if (!g.res.face.hat) o.hatOverride = { hat: 'cap', hatColor: grp.color }; if (g.leader) o.flag = grp.color; }
      if (g.type === 'band') { o.outfit = 'leather'; }
      if (g.type === 'tourist') { o.outfit = 'hawaii'; }
      if (g.wedding) { o.outfit = 'suit'; o.shirt = '#f4f1ea'; }
      const mod = K.eggs && K.eggs.faceMod(g, g.res.face);
      if (mod) o.mod = mod;
      return o;
    }

    addGuest(g) {
      const body = U.el('div', 'guest');
      body.dataset.guest = g.id;
      body.innerHTML = '<div class="g-face"></div>';
      const ui = U.el('div', 'gui-item');
      ui.dataset.guest = g.id;
      ui.innerHTML = `<div class="g-tag"></div><div class="g-bubble"></div><div class="g-ring"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle class="fg" cx="12" cy="12" r="9"/></svg><i></i></div><div class="g-badge"></div><div class="g-hand"></div>`;
      this.el.guests.appendChild(body);
      this.el.gui.appendChild(ui);
      const rec = {
        g, body, ui, face: body.firstChild,
        bubble: ui.querySelector('.g-bubble'), ring: ui.querySelector('.g-ring'), ringFg: ui.querySelector('.g-ring .fg'),
        ringI: ui.querySelector('.g-ring i'), badge: ui.querySelector('.g-badge'), hand: ui.querySelector('.g-hand'), tag: ui.querySelector('.g-tag'),
        level: -1, where: null, pos: { x: 0, y: 0, sc: 1 },
      };
      this.gEls.set(g.id, rec);
      return rec;
    }

    showGuest(rec) {
      const g = rec.g;
      rec.body.className = 'guest' + (g.res.ghost ? ' ghosty' : '');
      rec.ui.className = 'gui-item';
      rec.level = -1;
      this.renderFace(rec, g.level);
      this.renderBubble(rec);
      this.renderGuestHand(rec);
      const T = D.TYPES[g.type] || D.TYPES.normal;
      rec.badge.textContent = g.wedding ? '💐' : T.badge || '';
      this.renderTag(rec);
      this.updateRing(rec, true);
      this.place(rec, 'door', true);
      rec.body.classList.add('walking');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.place(rec, 'slot');
        setTimeout(() => rec.body.classList.remove('walking'), 760);
      }));
    }

    place(rec, where, instant) {
      const g = rec.g;
      let x, y, sc, z;
      if (where === 'door') {
        x = this.W / 2 + (Math.random() - 0.5) * 24; y = this.L * 0.62; sc = 0.38; z = 2;
      } else {
        const s = K.SLOTS[g.slot] || K.SLOTS[0];
        x = s.fx * this.W; y = this.L + s.dy; sc = s.sc; z = 10 + (2 - s.row) * 10;
      }
      if (g.type === 'kid') sc *= 0.82;
      rec.where = where;
      rec.pos = { x, y, sc };
      const tx = x - 48 * sc, ty = y - 113 * sc;
      const apply = () => {
        rec.body.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sc})`;
        rec.ui.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
        rec.ui.style.setProperty('--sc', sc);
        rec.ui.style.setProperty('--fs', (1 - (1 - sc) * 0.45).toFixed(3));
        rec.body.style.zIndex = z;
        rec.ui.style.zIndex = z;
        rec.ui.classList.toggle('front', where !== 'door' && (K.SLOTS[g.slot] || {}).row === 0);
      };
      if (instant) {
        rec.body.style.transition = 'none'; rec.ui.style.transition = 'none';
        apply();
        void rec.body.offsetWidth;
        rec.body.style.transition = ''; rec.ui.style.transition = '';
      } else apply();
    }

    renderFace(rec, lvl) {
      if (rec.level === lvl) return;
      rec.level = lvl;
      const g = rec.g;
      rec.face.innerHTML = F.render(this.faceOf(g), lvl, this.faceOpts(g));
      for (let i = 0; i <= 5; i++) rec.body.classList.toggle('lvl' + i, i === lvl && g.state !== 'leave' && g.state !== 'away');
    }

    renderBubble(rec) {
      const g = rec.g, b = rec.bubble;
      let html = '', cls = 'g-bubble';
      if (g.kind === 'drop') {
        cls += ' drop';
        if (g.foreign) html = `<small>${g.foreign.lang}</small><b class="fl">${U.esc(g.foreign.text)}</b>`;
        if (!g.res.seenDrop) {
          const has = this.game.s.sketches && this.game.s.sketches[g.room];
          html += `<button class="skbtn" data-sketchbtn="${g.id}">✏️ ${has ? 'Skizze ✓' : 'Skizze'}</button>`;
        }
      } else {
        if (g.complaint) html += '<em>Reklamation!</em>';
        else if (g.type === 'loser') html += '<em>Schlüssel weg!</em>';
        if (g.reveal !== 'face') g.reveal = 'face';
        if (g.reveal === 'room') html += `<small>Zimmer</small><b class="num">${g.room}</b>`;
        else if (g.reveal === 'name') { cls += ' namebub'; html += `<small>Ich bin</small><b class="nm">${U.esc(g.res.first)}<br>${U.esc(g.res.last)}</b>`; }
        else {
          html += `<b class="fq">${U.esc(g.line || 'Na?')}</b>`;
          if (this.game.has('visitenkarten')) html += `<small>${U.esc(g.res.first + ' ' + g.res.last)}</small>`;
        }
        if (g.complaint) cls += ' complaint';
      }
      cls += ' lv' + g.level;
      b.className = cls;
      b.innerHTML = html;
    }

    renderGuestHand(rec) {
      const g = rec.g, S = this.game.s;
      const h = rec.hand;
      if (g.kind !== 'drop' || g.keyId == null || !S.keys[g.keyId]) { h.innerHTML = ''; h.style.display = 'none'; return; }
      const key = S.keys[g.keyId];
      h.style.display = '';
      const sk = S.sketches && S.sketches[g.room] ? '1' : '0';
      if (!h.firstChild || +h.dataset.key !== key.id || h.dataset.sk !== sk) {
        h.dataset.key = key.id;
        h.dataset.sk = sk;
        h.style.setProperty('--skin', this.faceOf(g).skin);
        h.innerHTML = '<div class="paw"></div>' + keyHTML(key, { hidden: !!g.foreign, sk: sk === '1' });
      }
      h.classList.toggle('taken', key.loc !== 'guest');
    }

    renderTag(rec) {
      const g = rec.g;
      const show = this.game.has('stammgast') && g.kind === 'pick' && g.res.seenDrop;
      rec.tag.classList.toggle('show', show);
      if (show) rec.tag.textContent = g.res.first + ' ' + g.res.last;
    }

    updateRing(rec, force) {
      const g = rec.g, lv = g.level;
      const t0 = D.THRESH[lv], t1 = D.THRESH[lv + 1];
      const p = lv >= 5 ? 1 : U.clamp((g.rage - t0) / (t1 - t0), 0, 1);
      rec.ringFg.style.strokeDashoffset = (RING_C * (1 - p)).toFixed(2);
      if (force || rec.ringLv !== lv) {
        rec.ringLv = lv;
        rec.ring.style.setProperty('--rc', D.RAGE_COLORS[lv]);
        rec.ringI.textContent = MOODS[lv];
      }
    }

    leaveGuest(rec, angry) {
      const g = rec.g;
      this.removeRant(g.id);
      rec.level = -1;
      rec.face.innerHTML = F.render(this.faceOf(g), angry ? 5 : 0, this.faceOpts(g));
      for (let i = 0; i <= 5; i++) rec.body.classList.remove('lvl' + i);
      rec.bubble.className = 'g-bubble';
      rec.bubble.innerHTML = angry ? '<b class="nm">Unerhört!</b>' : `<b class="nm">${U.esc(g.res.say || 'Danke!')}</b>`;
      rec.hand.style.display = 'none';
      rec.tag.classList.remove('show');
      rec.body.classList.add(angry ? 'nope' : 'happy');
      setTimeout(() => {
        rec.body.classList.add('out', 'walking');
        rec.ui.classList.add('out');
        this.place(rec, 'door');
      }, angry ? 380 : 300);
    }

    // ------------------------------------------------------------ Hand, Tresen, Relikte
    renderHand() {
      const G = this.game, S = G.s;
      const cap = G.handCap();
      let html = '<span class="lbl">Hand</span>';
      for (let i = 0; i < cap; i++) {
        const e = S.hand[i];
        if (e && S.keys[e.keyId]) {
          const key = S.keys[e.keyId];
          html += `<div class="hslot full" data-handkey="${key.id}">${keyHTML(key, { hidden: this.isHidden(e) })}</div>`;
        } else html += '<div class="hslot"></div>';
      }
      this.el.hand.innerHTML = html;
      for (const rec of this.gEls.values()) if (rec.g.kind === 'drop') this.renderGuestHand(rec);
    }
    isHidden(entry) {
      if (!entry || entry.origin.type !== 'guest') return false;
      const g = this.game.guest(entry.origin.id);
      return !!(g && g.foreign);
    }
    renderLoose() {
      const S = this.game.s;
      this.el.loose.innerHTML = S.counter.map((id) => (S.keys[id] ? `<div class="lk" data-loose="${id}">${keyHTML(S.keys[id])}</div>` : '')).join('');
    }
    renderRelics() {
      const G = this.game;
      this.el.relicbar.innerHTML = G.run.relics.map((id) => {
        const r = D.relic(id);
        return `<div class="ric ${r.rarity === 'rare' ? 'rare' : ''}" data-relic="${id}" title="${U.esc(r.name)}">${r.icon}</div>`;
      }).join('');
    }
    renderSide() {
      const G = this.game, S = G.s;
      if (G.char.id !== 'archivarin') { this.el.side.innerHTML = ''; return; }
      const list = Object.values(S.residents).sort((a, b) => a.last.localeCompare(b.last, 'de') || a.first.localeCompare(b.first, 'de'));
      this.el.side.innerHTML = list.map((r) => {
        const lost = S.keys[r.keyId] && S.keys[r.keyId].loc === 'lost';
        const th = this.sketchThumb(r.room);
        return `<div class="sc ${lost ? 'lost' : ''}" ${lost ? `data-spare="${r.room}"` : `data-draw="${r.room}"`}><div class="ph">${th || '✏️'}</div><div class="nm">${U.esc(r.last)}</div><div class="rm">${r.room}</div></div>`;
      }).join('');
    }

    // ------------------------------------------------------------ Gästebuch
    toggleBook() { if (this.bookOpen) this.closeBook(); else this.openBook(); }
    openBook() {
      const G = this.game, S = G && G.s;
      if (!S || !this.app.playing()) return;
      if (G.char.id === 'archivarin') { this.hint('Die Archivarin hat das Gästebuch schon offen: links am Brett.'); return; }
      const list = Object.values(S.residents).sort((a, b) => a.last.localeCompare(b.last, 'de') || a.first.localeCompare(b.first, 'de'));
      const cards = list.map((r) => {
        const lost = S.keys[r.keyId] && S.keys[r.keyId].loc === 'lost';
        const th = this.sketchThumb(r.room);
        return `<div class="card"><div class="ph ${th ? '' : 'none'}" data-draw="${r.room}">${th || '<span>kein Bild<br>✏️ zeichnen</span>'}</div><div class="tx"><div class="nm">${U.esc(r.first)} <b>${U.esc(r.last)}</b></div><div class="qk">${U.esc(r.quirk || '')}</div></div><div class="rm">${r.room}${lost ? `<button class="spare" data-spare="${r.room}">Zweitschlüssel</button>` : ''}</div></div>`;
      }).join('');
      this.el.book.innerHTML = `<header><div><h3>Gästebuch</h3><div class="hint">Namen und Zimmer – Gesichter musst du dir merken</div></div><button class="x" data-close>✕</button></header><div class="cards">${cards}</div>`;
      this.el.book.classList.add('open');
      this.el.btnBook.classList.add('active');
      this.bookOpen = true;
      G.run.stats.bookOpens++;
      A.page();
    }
    closeBook(silent) {
      if (!this.bookOpen && !silent) return;
      this.el.book.classList.remove('open');
      this.el.btnBook.classList.remove('active');
      if (this.bookOpen && !silent) A.page();
      this.bookOpen = false;
    }
    makeSpare(room, fromEl) {
      const G = this.game;
      const from = fromEl ? this.srect(fromEl) : null;
      const entry = G.pick({ type: 'spare', room });
      if (!entry) return;
      A.pick();
      this.closeBook();
      this.renderSide();
      const to = this.handSlotCenter(entry.keyId);
      if (from && to) this.flyKey(G.s.keys[entry.keyId], { x: from.cx, y: from.cy }, to, { hide: this.el.hand.querySelector(`[data-handkey="${entry.keyId}"] .key`), ks: 0.8 });
      this.ftext('Zweitschlüssel ' + room, this.W / 2, this.BT + 40, 'teal');
    }

    // Gesichter neu zeichnen (z. B. nach einem Easter-Egg-Modus)
    refreshFaces() {
      for (const rec of this.gEls.values()) {
        if (rec.g.state !== 'enter' && rec.g.state !== 'wait') continue;
        rec.level = -1;
        this.renderFace(rec, rec.g.level);
      }
    }

    // ------------------------------------------------------------ Skizzen
    setSketchMode(on) {
      this.sketchMode = !!on;
      if (this.el.btnSketch) this.el.btnSketch.classList.toggle('active', this.sketchMode);
      if (this.sketchMode) {
        if (this.game && this.game.s && this.game.s.hand.length) this.cancelAll();
        this.hint('✏️ Wen zeichnen? Tippe einen <b>Gast mit Schlüssel</b> oder einen <b>Haken</b>.', 0);
      } else if (this.el.banner.innerHTML.indexOf('✏️ Wen') === 0) this.hideBanner();
    }

    sketchTap(cx, cy) {
      const tgt = this.targetAt(cx, cy);
      this.setSketchMode(false);
      if (!tgt) return;
      if (!this.openSketchFor(tgt)) this.hint('Skizzen gehören zu Schlüsseln: Zeichne Gäste, die ihren Schlüssel <b>abgeben</b>.', 2600);
    }

    openSketchFor(tgt) {
      const G = this.game, S = G.s;
      if (tgt.type === 'hook') { this.openSketch(S.hooks[tgt.idx].room); return true; }
      if (tgt.type === 'guest') {
        const g = G.guest(tgt.id);
        if (g && g.kind === 'drop') { this.openSketch(g.room, { hidden: !!g.foreign, guestId: g.id }); return true; }
      }
      return false;
    }

    openSketch(room, o) {
      const G = this.game, S = G && G.s;
      if (!S || !S.residents[room] || !this.app.playing()) return;
      o = o || {};
      this.closeBook(true);
      this.setSketchMode(false);
      this.sketchOpen = true;
      const sg = o.guestId != null ? G.guest(o.guestId) : null;
      this.skFrozen = !!(sg && sg.kind === 'drop' && !sg.res.seenDrop && (sg.state === 'enter' || sg.state === 'wait'));
      this.app.timeFrozen = this.skFrozen;
      this.el.stage.classList.toggle('frozen', this.skFrozen);
      this.skRoom = room;
      this.skStrokes = (S.sketches[room] || []).map((st) => ({ c: st.c, w: st.w, p: st.p.slice() }));
      this.skColor = this.skColor || PEN_COLORS[0];
      this.skWidth = this.skWidth || 0.022;
      const el = this.el.sketch;
      el.innerHTML = `
        <header><div><h3>Skizze</h3><div class="hint">${o.hidden ? 'für diesen Schlüssel' : 'für Schlüssel <b>' + room + '</b>'} · ${this.skFrozen ? '<b class="frz">⏸ Erste Abgabe: Die Zeit steht still</b>' : 'die Uhr läuft weiter'}</div></div><button class="x" data-sk="cancel" aria-label="Abbrechen">✕</button></header>
        <div class="padwrap"><canvas class="pad"></canvas><div class="padhint">Zeichne, was du dir merken willst: Frisur, Hut, Brille …</div></div>
        <div class="tools">
          <div class="colors">${PEN_COLORS.map((c) => `<button class="sw ${c === this.skColor ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Farbe"></button>`).join('')}</div>
          <button class="tool" data-sk="width" aria-label="Strichstärke">${this.skWidth > 0.02 ? '●' : '•'}</button>
          <button class="tool" data-sk="undo" aria-label="Rückgängig">↶</button>
          <button class="tool" data-sk="clear" aria-label="Löschen">🗑</button>
          <button class="btn small" data-sk="done">Anheften</button>
        </div>`;
      el.classList.add('open');
      this.el.btnSketch.classList.add('active');
      const wrap = this.srect(this.el.boardwrap);
      const side = Math.floor(Math.max(150, Math.min(wrap.w - 40, this.BH - 118, 300)));
      const cv = el.querySelector('canvas');
      cv.style.width = side + 'px';
      cv.style.height = side + 'px';
      const dpr = Math.min(2.5, (window.devicePixelRatio || 1) * this.scale);
      cv.width = Math.round(side * dpr);
      cv.height = Math.round(side * dpr);
      this.skCanvas = cv;
      this.skCtx = cv.getContext('2d');
      el.querySelector('.padhint').classList.toggle('gone', this.skStrokes.length > 0);
      this.drawSketch();
      A.page();
    }

    closeSketch(save, silent) {
      this.app.timeFrozen = false;
      this.skFrozen = false;
      this.el.stage.classList.remove('frozen');
      if (!this.sketchOpen) { if (silent) this.el.sketch.classList.remove('open'); return; }
      this.sketchOpen = false;
      this.el.sketch.classList.remove('open');
      this.el.btnSketch.classList.remove('active');
      if (save && this.game && this.game.s) {
        const strokes = this.skStrokes.map((st) => ({ c: st.c, w: st.w, p: st.p.map((q) => [Math.round(q[0] * 1000) / 1000, Math.round(q[1] * 1000) / 1000]) }));
        this.game.setSketch(this.skRoom, strokes);
        if (K.eggs) K.eggs.sketchSaved(this.skRoom, strokes);
        if (strokes.length) { A.hang(); this.toast('Skizze', 'Angeheftet an Haken ' + this.skRoom + '.', 1200); }
      } else if (!silent) A.page();
      this.skDraw = null;
    }

    sketchUndo() {
      this.skStrokes.pop();
      this.drawSketch();
    }

    drawSketch() {
      const c = this.skCtx, cv = this.skCanvas;
      if (!c) return;
      const W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H);
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const st of this.skStrokes) {
        c.strokeStyle = st.c; c.fillStyle = st.c;
        c.lineWidth = st.w * W;
        if (st.p.length === 1) { c.beginPath(); c.arc(st.p[0][0] * W, st.p[0][1] * H, st.w * W / 2, 0, Math.PI * 2); c.fill(); continue; }
        c.beginPath();
        st.p.forEach((q, i) => (i ? c.lineTo(q[0] * W, q[1] * H) : c.moveTo(q[0] * W, q[1] * H)));
        c.stroke();
      }
    }

    bindSketch() {
      const el = this.el.sketch;
      const pos = (e) => {
        const r = this.skCanvas.getBoundingClientRect();
        return [U.clamp((e.clientX - r.left) / r.width, 0, 1), U.clamp((e.clientY - r.top) / r.height, 0, 1)];
      };
      el.addEventListener('pointerdown', (e) => {
        if (!e.target.matches('canvas.pad')) return;
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        const st = { c: this.skColor, w: this.skWidth, p: [pos(e)] };
        this.skStrokes.push(st);
        this.skDraw = { id: e.pointerId, st };
        el.querySelector('.padhint').classList.add('gone');
        this.drawSketch();
      });
      el.addEventListener('pointermove', (e) => {
        const d = this.skDraw;
        if (!d || d.id !== e.pointerId) return;
        const p = pos(e), last = d.st.p[d.st.p.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.006) return;
        d.st.p.push(p);
        if (d.st.p.length > 400) return;
        const c = this.skCtx, W = this.skCanvas.width;
        c.strokeStyle = d.st.c; c.lineWidth = d.st.w * W; c.lineCap = 'round';
        c.beginPath(); c.moveTo(last[0] * W, last[1] * W); c.lineTo(p[0] * W, p[1] * W); c.stroke();
      });
      const end = (e) => { if (this.skDraw && this.skDraw.id === e.pointerId) { this.skDraw = null; this.drawSketch(); } };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('click', (e) => {
        const sw = e.target.closest('[data-color]');
        if (sw) { this.skColor = sw.dataset.color; U.$$('.sw', el).forEach((b) => b.classList.toggle('on', b === sw)); A.click(); return; }
        const b = e.target.closest('[data-sk]');
        if (!b) return;
        const a = b.dataset.sk;
        if (a === 'cancel') this.closeSketch(false);
        else if (a === 'done') this.closeSketch(true);
        else if (a === 'undo') { this.sketchUndo(); A.click(); }
        else if (a === 'clear') { if (this.skStrokes.length && K.eggs) K.eggs.sketchCleared(); this.skStrokes = []; this.drawSketch(); A.swipe(); }
        else if (a === 'width') { this.skWidth = this.skWidth > 0.02 ? 0.012 : 0.026; b.textContent = this.skWidth > 0.02 ? '●' : '•'; A.click(); }
      });
    }

    onSketch(room) {
      const S = this.game.s;
      S.sketchV = (S.sketchV || 0) + 1;
      const i = this.hookIdxOf(room);
      if (i >= 0) {
        this.renderHook(i);
        const sk = this.hookEls[i].querySelector('.sk');
        if (sk && sk.firstChild) { sk.classList.remove('pinned'); void sk.offsetWidth; sk.classList.add('pinned'); }
      }
      for (const rec of this.gEls.values()) if (rec.g.room === room && rec.g.kind === 'drop') { this.renderGuestHand(rec); this.renderBubble(rec); }
      if (this.game.char.id === 'archivarin') this.renderSide();
    }

    // Einmalige Hinweise für neue Mechaniken
    tips(g) {
      const sv = K.save.data;
      sv.tips = sv.tips || {};
      const S = this.game.s;
      let msg = null;
      if (g.kind === 'pick' && g.reveal === 'face' && !sv.tips.face) { sv.tips.face = 1; msg = 'Dieser Gast zeigt nur sein <b>Gesicht</b>. Wer hat vorhin welchen Schlüssel abgegeben?'; }
      else if (g.kind === 'drop' && !g.res.seenDrop && !sv.tips.sketch && !this.app.opts().tutorial) { sv.tips.sketch = 1; msg = '✏️ Tippe <b>Skizze</b> am Gast: Bei der ersten Abgabe steht die Zeit still, während du zeichnest.'; }
      else if (g.kind === 'pick' && g.reveal === 'name' && !sv.tips.name) { sv.tips.name = 1; msg = 'Nur ein <b>Name</b>? Das Gästebuch (G) kennt das Zimmer.'; }
      if (msg) { K.save.save(); setTimeout(() => this.hint(msg, 4200), 500); }
    }

    // ------------------------------------------------------------ Ereignisse aus der Spiellogik
    onEvent(t, d) {
      const G = this.game;
      switch (t) {
        case 'shiftstart': this.setupShift(); break;
        case 'arrive':
          A.door();
          this.el.doorpanels.classList.remove('spin'); void this.el.doorpanels.offsetWidth; this.el.doorpanels.classList.add('spin');
          break;
        case 'queue': break;
        case 'enter': {
          let rec = this.gEls.get(d.g.id);
          if (!rec) rec = this.addGuest(d.g);
          this.showGuest(rec);
          if (this.app.opts().tutorial && G.run.shift === 1) this.tutT = 0;
          if (G.char.id === 'archivarin' && d.g.type === 'loser') this.renderSide();
          this.tips(d.g);
          break;
        }
        case 'level': this.onLevel(d.g, d.prev); break;
        case 'eruption': this.onEruption(d); break;
        case 'serve': this.onServe(d); break;
        case 'miss': this.onMiss(d); break;
        case 'gone': {
          const rec = this.gEls.get(d.g.id);
          if (rec) setTimeout(() => { if (rec.g.state === 'leave') { rec.body.remove(); rec.ui.remove(); this.gEls.delete(d.g.id); } }, 400);
          break;
        }
        case 'return': {
          const rec = this.gEls.get(d.g.id);
          if (rec) { this.renderBubble(rec); rec.badge.textContent = '😤'; }
          A.buzz();
          this.ftext('Reklamation!', this.W / 2, this.LT + this.L * 0.4, 'bad');
          break;
        }
        case 'board': this.renderHook(d.idx); break;
        case 'hand': this.renderHand(); break;
        case 'counter': this.renderLoose(); break;
        case 'chat': this.showChat(d.text); break;
        case 'chathit': this.el.chat.classList.remove('hit'); void this.el.chat.offsetWidth; this.el.chat.classList.add('hit'); A.swipe(); break;
        case 'chatend': this.hideChat(d.dismissed); break;
        case 'kidswap': this.onKidSwap(d); break;
        case 'phone':
          this.el.phone.classList.toggle('ringing', d.on);
          A.ring(d.on);
          if (!d.on && d.quip) { A.click(); this.toast('Telefon', d.quip, 2600); }
          break;
        case 'bell': this.onBell(); break;
        case 'golden':
          this.el.golden.classList.add('on');
          A.golden(); A.goldenMusic(true);
          this.ftext('GOLDENE STUNDE', this.W / 2, this.LT + this.L * 0.35, 'huge gold slow');
          this.flash('gold');
          FX.sparkle(this.W / 2, this.LT + this.L * 0.35, 40, '#ffe08a', 1.8);
          break;
        case 'spare': if (G.char.id === 'archivarin') this.renderSide(); break;
        case 'sketch': this.onSketch(d.room); break;
        case 'relic': this.renderRelics(); this.el.btnBell.classList.toggle('show', G.has('klingel')); break;
      }
    }

    onLevel(g, prev) {
      const rec = this.gEls.get(g.id);
      if (!rec) return;
      this.renderFace(rec, g.level);
      this.renderBubble(rec);
      this.updateRing(rec);
      if (g.level >= 3 && !this.game.has('ohrstoepsel')) this.addRant(rec);
      else this.removeRant(g.id);
      if (g.level > prev && g.level === 3) A.tick();
    }

    onEruption(d) {
      const rec = this.gEls.get(d.g.id);
      A.eruption();
      FX.shake(9, 0.45);
      this.flash('red');
      if (rec) {
        const h = this.guestHead(rec);
        FX.steam(h.x - 26 * rec.pos.sc, h.y, 10);
        FX.steam(h.x + 26 * rec.pos.sc, h.y, 10);
        FX.ring(h.x, h.y, '#ff4d6d', 70);
        this.ftext(d.cost ? 'Eruption! −1 ☕' : 'Blitzableiter! m_R +0.2', h.x, h.y - 40, d.cost ? 'big bad' : 'big gold');
      }
      if (d.cost) this.app.hitstop(90);
    }

    onServe(d) {
      const rec = this.gEls.get(d.g.id);
      const opts = this.app.opts();
      const h = rec ? this.guestHead(rec) : { x: this.W / 2, y: this.LT + this.L / 2 };
      const st = D.STAMPS[d.stamp];
      // Stempel
      const sEl = U.el('div', 'stamp ' + d.stamp, st.label);
      sEl.style.setProperty('--c', st.color);
      sEl.style.left = h.x + 'px'; sEl.style.top = (h.y - 6) + 'px';
      this.el.floats.appendChild(sEl);
      setTimeout(() => sEl.remove(), 1500);
      FX.ink(h.x, h.y, st.color);
      A.stamp(d.stamp);
      if (d.stamp === 'blitz') { FX.sparkle(h.x, h.y, 16, '#ffe08a'); if (opts.hitstop) this.app.hitstop(70); }
      // Tonleiter der Kette
      if (d.chain > d.prevChain) setTimeout(() => A.chainNote(d.chain - 1), 60);
      else if (d.prevChain >= 3 && d.chain === 0) this.ftext('Kette gerissen', this.W / 2, this.LT + 16, 'bad');
      if (d.chain >= 5) FX.shake(Math.min(7, d.chain * 0.3), 0.2);
      // Punkte und Münzen fliegen in die Zähler
      this.pending += d.pts;
      this.flyPoints(d.pts, h.x, h.y - 30, d.pts >= 600 || d.jackpot);
      this.coinsPending += d.coins;
      const cb = this.srect(this.el.coinsBox);
      FX.coins(h.x, h.y, cb.x + 8, cb.cy, d.coins);
      setTimeout(() => { A.coin(d.coins); this.coinsPending -= d.coins; this.bump(this.el.coinsBox); }, 780);
      // Besondere Momente
      let y = h.y - 64;
      if (d.relief) {
        FX.confetti(h.x, h.y - 30, 60);
        A.confetti(); setTimeout(() => A.sigh(), 200);
        this.ftext('Erlösung!', h.x, y, 'big gold'); y -= 26;
      } else if (d.soothed) { this.ftext('Besänftigt! Trinkgeld ×' + (this.game.has('charme') ? 5 : 3), h.x, y, 'teal'); y -= 22; }
      if (d.near) { this.ftext('Gerade noch!', h.x, y, 'big gold'); y -= 26; FX.sparkle(h.x, h.y, 20); }
      if (d.jackpot) {
        A.jackpot();
        this.ftext('JACKPOT ×' + (this.game.has('jackpot') ? 5 : 3), this.W / 2, this.LT + this.L * 0.45, 'huge gold slow');
        FX.sparkle(h.x, h.y, 60, '#ffd700', 2); FX.confetti(h.x, h.y, 40);
        this.flash('gold');
      }
      if (d.event) {
        setTimeout(() => { A.buy(); this.toast('Glücksfall', d.event.text, 1800); }, 250);
        if (d.event.id === 'kaffee') this.renderHUD(0);
      }
      if (rec) this.leaveGuest(rec, false);
      if (this.app.opts().tutorial && this.game.run.shift === 1) this.tutorialProgress();
    }

    onMiss(d) {
      const rec = this.gEls.get(d.g.id);
      const h = rec ? this.guestHead(rec) : { x: this.W / 2, y: this.LT + 100 };
      A.buzz();
      if (d.cost) setTimeout(() => A.nerve(), 120);
      FX.shake(10, 0.35);
      this.flash('red');
      this.ftext(d.saved ? 'Fehlgriff! Notizblock rettet dich' : `Fehlgriff! −${d.cost} ☕`, h.x, h.y - 40, 'big bad');
      if (d.prevChain >= 3) this.ftext('Kette gerissen', this.W / 2, this.LT + 16, 'bad');
      if (this.game.s.cfg.inspector) {
        const note = this.el.inspector.querySelector('.note');
        if (note) { note.textContent = 'Notiert. −' + d.cost; note.classList.add('show'); setTimeout(() => note.classList.remove('show'), 1600); }
      }
      if (rec) this.leaveGuest(rec, true);
    }

    onKidSwap(d) {
      const S = this.game.s;
      const ea = this.hookEls[d.a], eb = this.hookEls[d.b];
      const ra = ea && this.srect(ea.querySelector('.slot')), rb = eb && this.srect(eb.querySelector('.slot'));
      this.renderHook(d.a); this.renderHook(d.b);
      A.giggle();
      [ea, eb].forEach((e) => { if (e) { e.classList.remove('kid'); void e.offsetWidth; e.classList.add('kid'); } });
      if (ra && rb) {
        const ka = S.keys[S.hooks[d.a].key], kb = S.keys[S.hooks[d.b].key];
        const ks = parseFloat(getComputedStyle(this.el.board).getPropertyValue('--ks')) || 1;
        if (ka) this.flyKey(ka, { x: rb.cx, y: rb.y + 30 * ks }, { x: ra.cx, y: ra.y + 30 * ks }, { hide: ea.querySelector('.key'), ks, arc: 50, dur: 420 });
        if (kb) this.flyKey(kb, { x: ra.cx, y: ra.y + 30 * ks }, { x: rb.cx, y: rb.y + 30 * ks }, { hide: eb.querySelector('.key'), ks, arc: -40, dur: 420 });
        FX.sparkle((ra.cx + rb.cx) / 2, (ra.y + rb.y) / 2 + 20, 14, '#ff9bd2');
      }
      const rec = this.gEls.get(d.g.id);
      if (rec) { const hh = this.guestHead(rec); this.ftext('Hihi!', hh.x, hh.y - 40, 'teal'); }
    }

    onBell() {
      A.stamp('blitz');
      this.el.btnBell.classList.add('used');
      for (const rec of this.gEls.values()) {
        if (rec.g.state !== 'enter' && rec.g.state !== 'wait') continue;
        const h = this.guestHead(rec);
        FX.ring(h.x, h.y, '#7ff0d8', 50);
        this.removeRant(rec.g.id);
      }
      this.ftext('Ding! Alle beruhigt.', this.W / 2, this.LT + this.L * 0.4, 'big teal');
    }

    // ------------------------------------------------------------ Plauderer
    showChat(text) {
      const c = this.el.chat;
      c.innerHTML = `<div>${U.esc(text)}</div><div class="hint"><span>💬 Plauderer</span><span>wegwischen ⟷</span></div>`;
      c.style.transform = '';
      c.className = 'chat show';
      A.tick();
    }
    hideChat(dismissed) {
      const c = this.el.chat;
      if (dismissed) {
        A.swipe();
        c.animate([{ transform: c.style.transform || 'none', opacity: 1 }, { transform: `translateX(${(this.chatDx || 1) > 0 ? 480 : -480}px) rotate(${(this.chatDx || 1) > 0 ? 12 : -12}deg)`, opacity: 0 }], { duration: 260, easing: 'ease-in' })
          .onfinish = () => { c.className = 'chat'; c.style.transform = ''; };
      } else c.className = 'chat';
    }

    // ------------------------------------------------------------ Wut über dem Brett
    addRant(rec) {
      const g = rec.g;
      let el = this.rantEls.get(g.id);
      if (!el && this.rantEls.size >= 4) return;
      if (!el) {
        el = U.el('div', 'rant');
        el.textContent = D.RANTS[Math.floor(Math.random() * D.RANTS.length)];
        // Vier feste Plätze, damit sich die Blasen nicht stapeln
        const used = new Set(Array.from(this.rantEls.values()).map((e) => e.dataset.spot));
        const spots = [[0.04, 0.1], [0.5, 0.3], [0.06, 0.52], [0.46, 0.74]];
        const pref = rec.pos.x < this.W / 2 ? [0, 2, 1, 3] : [1, 3, 0, 2];
        const spot = pref.find((i) => !used.has(String(i)));
        const [fx, fy] = spots[spot == null ? 0 : spot];
        el.dataset.spot = spot;
        el.style.left = (fx * this.W + (Math.random() - 0.5) * 16) + 'px';
        el.style.top = (fy * (this.BH - 60) + 8) + 'px';
        this.el.rants.appendChild(el);
        this.rantEls.set(g.id, el);
      }
      el.className = 'rant l' + Math.min(5, g.level);
    }
    removeRant(id) {
      const el = this.rantEls.get(id);
      if (!el) return;
      this.rantEls.delete(id);
      el.classList.add('bye');
      setTimeout(() => el.remove(), 260);
    }

    // ------------------------------------------------------------ Effekte
    flyKey(key, from, to, o) {
      o = o || {};
      const ks = o.ks || 1;
      const wrap = U.el('div', null, keyHTML(key, { hidden: o.hidden, nodata: true }));
      const k = wrap.firstChild;
      k.classList.add('ghost');
      k.style.setProperty('--ks', ks);
      this.el.floats.appendChild(k);
      const w = 36 * ks, h = 62 * ks;
      const arc = o.arc != null ? o.arc : 34;
      const mx = (from.x + to.x) / 2, my = Math.min(from.y, to.y) - arc;
      if (o.hide) o.hide.classList.add('arriving');
      const anim = k.animate([
        { transform: `translate(${from.x - w / 2}px, ${from.y - h / 2}px) rotate(${o.r0 || 0}deg)` },
        { transform: `translate(${mx - w / 2}px, ${my - h / 2}px) rotate(-14deg)`, offset: 0.5 },
        { transform: `translate(${to.x - w / 2}px, ${to.y - h / 2}px) rotate(0deg)` },
      ], { duration: o.dur || 190, easing: 'cubic-bezier(.3,.7,.4,1)' });
      anim.onfinish = () => {
        k.remove();
        if (o.hide) { o.hide.classList.remove('arriving'); if (o.swing) { o.hide.classList.remove('swing'); void o.hide.offsetWidth; o.hide.classList.add('swing'); } }
        if (o.done) o.done();
      };
    }

    flyPoints(pts, x, y, big) {
      const el = U.el('div', 'pts' + (big ? ' big' : ''), '+' + U.fmt(pts));
      this.el.floats.appendChild(el);
      const t = this.srect(this.el.score);
      const tx = t.x + 30, ty = t.cy;
      const anim = el.animate([
        { transform: `translate(${x}px, ${y}px) translate(-50%,-50%) scale(.4)`, opacity: 0 },
        { transform: `translate(${x}px, ${y - 30}px) translate(-50%,-50%) scale(1.2)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${x}px, ${y - 36}px) translate(-50%,-50%) scale(1)`, opacity: 1, offset: 0.48 },
        { transform: `translate(${tx}px, ${ty}px) translate(-50%,-50%) scale(.45)`, opacity: 0.3 },
      ], { duration: 1000, easing: 'cubic-bezier(.55,0,.35,1)' });
      anim.onfinish = () => { el.remove(); this.pending = Math.max(0, this.pending - pts); this.bump(this.el.score); };
    }

    ftext(text, x, y, cls) {
      const el = U.el('div', 'ftext ' + (cls || ''), U.esc(text));
      el.style.left = x + 'px'; el.style.top = y + 'px';
      this.el.floats.appendChild(el);
      setTimeout(() => el.remove(), (cls || '').includes('slow') ? 2100 : 1350);
    }

    bump(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

    flash(kind) {
      if (!this.app.opts().flashes) return;
      const f = this.el.flash;
      f.className = 'flash' + (kind === 'gold' ? ' gold' : '');
      void f.offsetWidth;
      f.classList.add('go');
    }

    toast(title, text, ms) {
      const t = this.el.toast;
      t.innerHTML = `<span class="t">${U.esc(title)}</span>${U.esc(text)}`;
      t.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove('show'), ms || 1800);
    }

    hint(text, ms) {
      const b = this.el.banner;
      b.innerHTML = text;
      b.classList.add('show');
      clearTimeout(this.bannerTimer);
      if (ms !== 0) this.bannerTimer = setTimeout(() => b.classList.remove('show'), ms || 2200);
    }
    hideBanner() { this.el.banner.classList.remove('show'); clearTimeout(this.bannerTimer); }

    setLight(x, y) {
      this.el.boardwrap.style.setProperty('--lx', x + 'px');
      this.el.boardwrap.style.setProperty('--ly', y + 'px');
    }

    // ------------------------------------------------------------ Bild für Bild
    frame(dt) {
      const G = this.game;
      if (!G || !G.s) return;
      const S = G.s;
      let hot = 0, agit = 0;
      this.steamT += dt;
      const puff = this.steamT > 0.14;
      if (puff) this.steamT = 0;
      for (const rec of this.gEls.values()) {
        const g = rec.g;
        if (g.state !== 'enter' && g.state !== 'wait') continue;
        this.updateRing(rec);
        if (g.level >= 4) hot++;
        agit += g.level * g.level;
        if (g.level >= 5 && puff) {
          const h = this.guestHead(rec);
          FX.steam(h.x - 27 * rec.pos.sc, h.y, 1);
          FX.steam(h.x + 27 * rec.pos.sc, h.y, 1);
        }
      }
      this.hot = G.has('ohrstoepsel') ? 0 : hot;
      this.el.counter.classList.toggle('rattle', this.hot > 0);
      this.el.boardwrap.classList.toggle('rattle', this.hot > 0);
      // Lobby-Lautstärke
      this.ambT += dt;
      if (this.ambT > 0.25) {
        this.ambT = 0;
        A.setLobby(S.time < S.quietUntil ? 0 : Math.min(1, agit / 40));
      }
      // Goldene Stunde
      if (this.el.golden.classList.contains('on') && S.time >= S.goldenUntil) {
        this.el.golden.classList.remove('on');
        A.goldenMusic(false);
      }
      // Blinde Haken
      this.el.board.style.setProperty('--label', S.labelAlpha.toFixed(3));
      this.renderHUD(dt);
      // Tutorial
      if (this.app.opts().tutorial && G.run.shift === 1) {
        this.tutT -= dt;
        if (this.tutT <= 0) { this.tutT = 0.2; this.tutorial(); }
      }
    }

    renderHUD(dt) {
      const G = this.game, S = G.s, run = G.run;
      const target = run.score - this.pending;
      if (dt === 0) this.scoreShown = target;
      else this.scoreShown += (target - this.scoreShown) * Math.min(1, dt * 9) + Math.sign(target - this.scoreShown) * Math.min(Math.abs(target - this.scoreShown), dt * 40);
      this.el.score.textContent = (K.eggs && K.eggs.fmtScore(this.scoreShown)) || U.fmt(Math.round(this.scoreShown));
      this.el.coins.textContent = U.fmt(run.coins - this.coinsPending);
      if (run.nerves !== this.lastNerves || run.maxNerves !== this.lastMax) this.renderNerves();
      // Fortschritt
      // Fortschritt in Personen: wer hat abgegeben und wieder abgeholt?
      let left = 0;
      if (S.cast) for (const r of S.cast) if (S.residents[r].phase < 2) left++;
      const people = S.cfg.people || 1;
      this.el.leftlbl.textContent = '· noch ' + left + (left === 1 ? ' Gast' : ' Gäste');
      this.el.prog.style.width = (100 * (1 - left / people)).toFixed(1) + '%';
      // Kette
      const k = Math.min(S.chain, D.CHAIN_CAP);
      const mK = 1 + (G.has('rotekarte') ? 0.2 : 0.1) * k;
      const c = this.el.chain;
      if (this.lastChain !== S.chain) {
        c.querySelector('b').textContent = 'Kette ' + S.chain;
        c.querySelector('em').textContent = '×' + mK.toFixed(1);
        c.classList.toggle('on', S.chain > 0);
        c.style.setProperty('--fl', (0.6 + Math.min(1, S.chain / 20) * 0.9).toFixed(2));
        if (S.chain > (this.lastChain || 0)) this.bump(c);
        this.lastChain = S.chain;
      }
      // Schlange vor der Tür
      const q = S.doorQueue.length;
      this.el.queue.classList.toggle('show', q > 0);
      if (q > 0) this.el.queue.textContent = 'Vor der Tür: ' + q;
      // Uhr in der Lobby
      const mins = S.time;
      this.el.clockM.setAttribute('transform', `rotate(${(mins * 6) % 360} 20 20)`);
      this.el.clockH.setAttribute('transform', `rotate(${(330 + S.n * 15 + mins * 0.5) % 360} 20 20)`);
    }

    renderNerves() {
      const run = this.game.run;
      const prev = this.lastNerves;
      let html = '';
      for (let i = 0; i < run.maxNerves; i++) {
        const full = i < run.nerves;
        let cls = full ? '' : 'empty';
        if (prev >= 0 && !full && i < prev) cls += ' lost';
        if (prev >= 0 && full && i >= prev) cls += ' gain';
        html += `<svg class="${cls}"><use href="#i-cup"/></svg>`;
      }
      this.el.nerves.innerHTML = html;
      this.lastNerves = run.nerves; this.lastMax = run.maxNerves;
    }

    // ------------------------------------------------------------ Tutorial (erste Schicht des ersten Runs)
    tutorial() {
      const G = this.game, S = G.s;
      U.$$('.tut').forEach((e) => e.classList.remove('tut'));
      const g = S.guests.filter((x) => x.state === 'enter' || x.state === 'wait').sort((a, b) => b.x - a.x)[0];
      if (!g) { this.hideBanner(); return; }
      const rec = this.gEls.get(g.id);
      if (!rec) return;
      const hookOf = (room) => S.hooks.findIndex((h) => h.room === room);
      if (g.kind === 'drop') {
        const inHand = S.hand.some((e) => e.keyId === g.keyId);
        const hi = hookOf(g.room);
        if (hi >= 0) this.hookEls[hi].classList.add('tut');
        if (!inHand) rec.hand.classList.add('tut');
        this.hint(`Gast gibt ab: Schlüssel an Haken <b>${g.room}</b> ziehen. Merk dir das Gesicht – oder tippe <b>✏️ Skizze</b>, dann steht die Zeit still.`, 0);
      } else {
        rec.bubble.classList.add('tut');
        this.hint('Dieser Gast will seinen Schlüssel zurück. <b>Wer war das?</b> Zieh den richtigen Schlüssel vom Brett zu ihm.', 0);
      }
    }
    tutorialProgress() {
      this.tutServed = (this.tutServed || 0) + 1;
      if (this.tutServed >= 4) {
        this.app.finishTutorial();
        U.$$('.tut').forEach((e) => e.classList.remove('tut'));
        this.hideBanner();
        this.hint('Sehr gut! Je schneller, desto mehr Punkte. Viel Glück.', 2600);
      }
    }

    // ------------------------------------------------------------ Eingabe
    bindUI() {
      this.el.btnBook.addEventListener('click', () => { A.init(); this.toggleBook(); });
      this.el.btnSketch.addEventListener('click', () => { A.init(); if (this.app.playing()) { if (this.sketchOpen) this.closeSketch(false); else this.setSketchMode(!this.sketchMode); } });
      this.el.stage.addEventListener('dblclick', (e) => {
        if (!this.app.playing() || this.sketchOpen || e.target.closest('#book') || e.target.closest('#sketch')) return;
        const tgt = this.targetAt(e.clientX, e.clientY);
        if (tgt) this.openSketchFor(tgt);
      });
      this.bindSketch();
      this.el.btnBell.addEventListener('click', () => { if (this.app.playing()) this.game.useBell(); });
      this.el.btnPause.addEventListener('click', () => this.app.pause());
      this.el.phone.addEventListener('click', () => { if (this.app.playing()) this.game.answerPhone(); });
      this.el.book.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) { this.closeBook(); return; }
        const sp = e.target.closest('[data-spare]');
        if (sp) { this.makeSpare(+sp.dataset.spare, sp.closest('.card')); return; }
        const dr = e.target.closest('[data-draw]');
        if (dr) { this.closeBook(true); this.openSketch(+dr.dataset.draw); }
      });
      this.el.side.addEventListener('click', (e) => {
        const sp = e.target.closest('[data-spare]');
        if (sp && this.app.playing()) { this.makeSpare(+sp.dataset.spare, sp); return; }
        const dr = e.target.closest('[data-draw]');
        if (dr && this.app.playing()) this.openSketch(+dr.dataset.draw);
      });
      this.el.relicbar.addEventListener('click', (e) => {
        const r = e.target.closest('[data-relic]');
        if (r) this.relicTip(r.dataset.relic);
      });
      // Plauderer wegwischen
      const c = this.el.chat;
      c.addEventListener('pointerdown', (e) => {
        if (!this.app.playing()) return;
        e.stopPropagation();
        this.chatDrag = { x0: e.clientX, id: e.pointerId };
        this.chatDx = 0;
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener('pointermove', (e) => {
        if (!this.chatDrag || this.chatDrag.id !== e.pointerId) return;
        this.chatDx = (e.clientX - this.chatDrag.x0) / this.scale;
        c.style.transform = `translateX(${this.chatDx}px) rotate(${this.chatDx / 30}deg)`;
      });
      const end = (e) => {
        if (!this.chatDrag || this.chatDrag.id !== e.pointerId) return;
        const dx = this.chatDx;
        this.chatDrag = null;
        if (Math.abs(dx) > 70) this.game.hitChat(true);
        else { c.style.transform = ''; this.game.hitChat(false); }
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
    }

    relicTip(id) {
      const r = D.relic(id);
      const old = document.querySelector('.relictip');
      if (old) old.remove();
      const t = U.el('div', 'relictip', `<b>${r.icon} ${U.esc(r.name)}</b>${U.esc(r.desc)}`);
      this.el.shake.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    }

    bindInput() {
      const st = this.el.stage;
      st.addEventListener('pointerdown', (e) => this.onDown(e));
      window.addEventListener('pointermove', (e) => this.onMove(e));
      window.addEventListener('pointerup', (e) => this.onUp(e));
      window.addEventListener('pointercancel', (e) => this.onCancel(e));
      st.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    sourceAt(t) {
      const S = this.game.s;
      const hk = t.closest('[data-handkey]');
      if (hk) return { type: 'handkey', keyId: +hk.dataset.handkey };
      const lk = t.closest('[data-loose]');
      if (lk) return { type: 'counter', keyId: +lk.dataset.loose };
      const hook = t.closest('[data-hook]');
      if (hook) {
        const idx = +hook.dataset.hook;
        return S.hooks[idx] && S.hooks[idx].key != null ? { type: 'hook', idx } : null;
      }
      const ge = t.closest('[data-guest]');
      if (ge) {
        const g = this.game.guest(+ge.dataset.guest);
        if (g && g.kind === 'drop' && g.keyId != null && S.keys[g.keyId] && S.keys[g.keyId].loc === 'guest' && (g.state === 'enter' || g.state === 'wait')) return { type: 'guest', id: g.id };
      }
      return null;
    }

    srcKeyId(src) {
      const S = this.game.s;
      if (src.type === 'hook') return S.hooks[src.idx].key;
      if (src.type === 'guest') { const g = this.game.guest(src.id); return g && g.keyId; }
      if (src.type === 'counter' || src.type === 'handkey') return src.keyId;
      return null;
    }

    targetAt(cx, cy) {
      const els = document.elementsFromPoint(cx, cy);
      for (const el of els) {
        if (el.closest('#floats')) continue;
        if (el.closest('.book.open') || el.closest('#sketch.open') || el.closest('#chat.show') || el.closest('.screen')) return null;
        const hook = el.closest('[data-hook]');
        if (hook) return { type: 'hook', idx: +hook.dataset.hook, el: hook };
        const ge = el.closest('[data-guest]');
        if (ge) {
          const id = +ge.dataset.guest;
          const rec = this.gEls.get(id);
          if (rec && (rec.g.state === 'enter' || rec.g.state === 'wait')) return { type: 'guest', id, el: rec.body };
        }
      }
      return null;
    }

    jitter() {
      const n = this.hot || 0;
      if (!n) return [0, 0];
      const a = Math.min(18, 6 + n * 4);
      const t = performance.now() / 1000;
      return [Math.sin(t * 13.3) * a, Math.cos(t * 10.7) * a * 0.75];
    }
    tapJitter() {
      const n = this.hot || 0;
      if (!n) return [0, 0];
      const a = Math.min(16, 5 + n * 4);
      return [(Math.random() * 2 - 1) * a, (Math.random() * 2 - 1) * a];
    }

    onDown(e) {
      if (!this.app.playing() || !this.game) return;
      A.init();
      const t = e.target;
      if (t.closest('[data-ui]') || t.closest('#chat') || t.closest('#book') || t.closest('.ric') || t.closest('#side') || t.closest('#sketch')) return;
      const sb = t.closest('[data-sketchbtn]');
      if (sb) {
        e.preventDefault();
        const g = this.game.guest(+sb.dataset.sketchbtn);
        if (g && g.kind === 'drop') this.openSketch(g.room, { hidden: !!g.foreign, guestId: g.id });
        return;
      }
      if (this.app.timeFrozen) return;
      this.refreshRect();
      if (this.pointer) return;
      const src = this.sketchMode ? null : this.sourceAt(t);
      this.pointer = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, lastX: e.clientX, tilt: 0, src, t, drag: false, touch: e.pointerType !== 'mouse' };
      if (src) e.preventDefault();
    }

    onMove(e) {
      if (e.pointerType === 'mouse') this.mouse = [e.clientX, e.clientY];
      if (this.game && this.game.s && this.game.s.cfg.dark && this.rect) {
        const [sx, sy] = this.toStage(e.clientX, e.clientY);
        this.setLight(sx - 12, sy - this.BT - 10);
      }
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      p.x = e.clientX; p.y = e.clientY;
      if (!p.drag && p.src && Math.hypot(p.x - p.x0, p.y - p.y0) > 8 * Math.max(1, this.scale * 0.8)) this.startDrag(p);
      if (p.drag) this.moveGhost(p);
    }

    startDrag(p) {
      const G = this.game, S = G.s;
      let entry;
      if (p.src.type === 'handkey') entry = S.hand.find((h) => h.keyId === p.src.keyId);
      else entry = G.pick(p.src);
      if (!entry) { p.src = null; return; }
      p.drag = true;
      p.keyId = entry.keyId;
      const key = S.keys[entry.keyId];
      const wrap = U.el('div', null, keyHTML(key, { hidden: this.isHidden(entry), nodata: true }));
      const k = wrap.firstChild;
      k.classList.add('ghost');
      k.style.setProperty('--ks', 1.15);
      this.el.floats.appendChild(k);
      this.ghost = k;
      // In der Hand liegt er während des Ziehens unsichtbar
      const hs = this.el.hand.querySelector(`[data-handkey="${key.id}"] .key`);
      if (hs) hs.classList.add('arriving');
      A.pick();
      this.moveGhost(p);
    }

    moveGhost(p) {
      const [sx, sy] = this.toStage(p.x, p.y);
      const j = this.jitter();
      p.gx = sx + j[0];
      p.gy = sy + j[1] - (p.touch ? 40 : 6);
      const vx = p.x - p.lastX;
      p.lastX = p.x;
      p.tilt = p.tilt * 0.8 + U.clamp(vx * 1.6, -28, 28) * 0.2;
      const w = 36 * 1.15, h = 62 * 1.15;
      this.ghost.style.transform = `translate(${(p.gx - w / 2).toFixed(1)}px, ${(p.gy - h * 0.35).toFixed(1)}px) rotate(${(-p.tilt).toFixed(1)}deg)`;
      const [cx, cy] = this.toClient(p.gx, p.gy);
      const tgt = this.targetAt(cx, cy);
      const el = tgt && tgt.el;
      if (el !== this.hover) {
        if (this.hover) this.hover.classList.remove('drop-hover');
        if (el) el.classList.add('drop-hover');
        this.hover = el;
      }
    }

    clearHover() { if (this.hover) this.hover.classList.remove('drop-hover'); this.hover = null; }

    onUp(e) {
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      this.pointer = null;
      if (!this.app.playing()) { this.abortDrag(p); return; }
      if (p.drag) {
        const [cx, cy] = this.toClient(p.gx, p.gy);
        const tgt = this.targetAt(cx, cy);
        this.clearHover();
        if (this.ghost) { this.ghost.remove(); this.ghost = null; }
        const from = { x: p.gx, y: p.gy };
        const res = this.game.drop(tgt, p.keyId);
        this.afterDrop(res, from, tgt, 1.15);
      } else {
        this.tap(p.t, e.clientX, e.clientY);
      }
    }

    onCancel(e) {
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      this.pointer = null;
      this.abortDrag(p);
    }

    abortDrag(p) {
      this.clearHover();
      if (this.ghost) { this.ghost.remove(); this.ghost = null; }
      if (p.drag && this.game && this.game.s && this.game.s.hand.some((h) => h.keyId === p.keyId)) {
        const res = this.game.drop(null, p.keyId);
        this.afterDrop(res, { x: p.gx, y: p.gy }, null, 1.15);
      }
    }

    cancelAll() {
      const S = this.game && this.game.s;
      if (!S) return;
      for (const h of S.hand.slice()) {
        const from = this.handSlotCenter(h.keyId);
        const res = this.game.drop(null, h.keyId);
        this.afterDrop(res, from, null, 0.66);
      }
    }

    tapPick(src) {
      const G = this.game;
      const kid = this.srcKeyId(src);
      const from = kid != null ? this.keyCenter(kid) : null;
      const hidden = src.type === 'guest' && G.guest(src.id) && G.guest(src.id).foreign;
      const entry = G.pick(src);
      if (!entry) return;
      A.pick();
      const to = this.handSlotCenter(entry.keyId);
      if (from && to) this.flyKey(G.s.keys[entry.keyId], from, to, { hide: this.el.hand.querySelector(`[data-handkey="${entry.keyId}"] .key`), ks: 0.85, hidden, dur: 170 });
    }

    tap(t, cx, cy) {
      const G = this.game, S = G.s;
      if (this.sketchMode) { this.sketchTap(cx, cy); return; }
      const src = this.sourceAt(t);
      if (S.hand.length) {
        if (src && src.type === 'handkey') {
          const from = this.handSlotCenter(src.keyId);
          this.afterDrop(G.drop(null, src.keyId), from, null, 0.66);
          return;
        }
        const j = this.tapJitter();
        const tgt = this.targetAt(cx + j[0] * this.scale, cy + j[1] * this.scale) || this.targetAt(cx, cy);
        if (tgt && tgt.type === 'hook') {
          const h = S.hooks[tgt.idx];
          if (h.key != null) {
            const last = S.hand[S.hand.length - 1];
            if (!S.cfg.strict && S.hand.length === 1 && last.origin.type === 'hook' && last.origin.idx !== tgt.idx) {
              const from = this.handSlotCenter(last.keyId);
              this.afterDrop(G.drop(tgt, last.keyId), from, tgt, 0.66);
            } else {
              if (S.hand.length >= G.handCap()) this.cancelAll();
              this.tapPick({ type: 'hook', idx: tgt.idx });
            }
            return;
          }
          const entry = G.bestHandFor(tgt);
          const from = this.handSlotCenter(entry.keyId);
          this.afterDrop(G.drop(tgt, entry.keyId), from, tgt, 0.66);
          return;
        }
        if (tgt && tgt.type === 'guest') {
          const g = G.guest(tgt.id);
          if (g && g.kind === 'drop') {
            const mine = S.hand.find((h) => h.origin.type === 'guest' && h.origin.id === g.id);
            if (mine) { const from = this.handSlotCenter(mine.keyId); this.afterDrop(G.drop(null, mine.keyId), from, null, 0.66); return; }
            if (g.keyId != null && S.keys[g.keyId] && S.keys[g.keyId].loc === 'guest') {
              if (S.hand.length >= G.handCap()) this.cancelAll();
              this.tapPick({ type: 'guest', id: g.id });
            }
            return;
          }
          const entry = G.bestHandFor(tgt);
          const from = this.handSlotCenter(entry.keyId);
          this.afterDrop(G.drop(tgt, entry.keyId), from, tgt, 0.66);
          return;
        }
        if (src && src.type === 'counter') {
          if (S.hand.length >= G.handCap()) this.cancelAll();
          this.tapPick(src);
          return;
        }
        this.cancelAll();
        return;
      }
      if (src && src.type !== 'handkey') { this.tapPick(src); return; }
      const ge = t.closest('[data-guest]');
      if (ge) {
        const g = G.guest(+ge.dataset.guest);
        if (g && g.kind === 'pick') this.hint('Erst den Schlüssel vom Brett nehmen, dann den Gast antippen.', 1800);
      }
    }

    afterDrop(res, from, tgt, ks) {
      if (!res || res.r === 'none') return;
      const S = this.game.s;
      const key = res.key;
      ks = ks || 1;
      const boardKs = parseFloat(this.el.board.style.getPropertyValue('--ks')) || 1;
      switch (res.r) {
        case 'served': {
          const g = res.g;
          if (g.kind === 'drop') {
            A.hang();
            const to = this.keyCenter(key ? key.id : S.hooks[res.hookIdx].key);
            const hk = this.hookEls[res.hookIdx];
            const kel = hk && hk.querySelector('.key');
            if (from && to) this.flyKey(S.keys[S.hooks[res.hookIdx].key], from, to, { hide: kel, ks: boardKs, swing: true, dur: 150, arc: 14 });
            else if (kel) kel.classList.add('swing');
          } else {
            const rec = this.gEls.get(g.id);
            if (rec && from && key) {
              const h = this.guestHead(rec);
              this.flyKey(key, from, { x: h.x + 20, y: h.y + 26 }, { ks: 0.9, dur: 170, arc: 20 });
            }
          }
          break;
        }
        case 'placed':
        case 'swap': {
          A.hang();
          const hk = this.hookEls[res.r === 'swap' ? res.a : res.hookIdx];
          const kel = hk && hk.querySelector('.key');
          const to = key && this.keyCenter(key.id);
          if (from && to) this.flyKey(key, from, to, { hide: kel, ks: boardKs, swing: true, dur: 150, arc: 14 });
          else if (kel) kel.classList.add('swing');
          if (res.r === 'swap') {
            const other = this.hookEls[res.b] && this.hookEls[res.b].querySelector('.key');
            if (other) { other.classList.remove('swing'); void other.offsetWidth; other.classList.add('swing'); }
          }
          break;
        }
        case 'bounce': {
          A.bounce();
          const msg = { 'wrong-hook': 'Falscher Haken!', occupied: 'Haken besetzt!', 'drop-guest': 'Will abgeben, nicht nehmen!', 'hang-first': 'Erst an den Haken!' }[res.why] || 'Nein!';
          const at = tgt && tgt.el ? this.srect(tgt.el) : null;
          this.ftext(msg, at ? at.cx : (from ? from.x : this.W / 2), at ? at.y + 6 : (from ? from.y : 300), 'bad');
          if (tgt && tgt.el) { tgt.el.classList.remove('nope'); void tgt.el.offsetWidth; if (tgt.type === 'guest') tgt.el.classList.add('nope'); }
          this.flyBack(key, from, ks);
          break;
        }
        case 'cancel':
          A.tick();
          this.flyBack(key, from, ks);
          break;
        case 'miss': {
          const rec = this.gEls.get(res.g.id);
          if (rec && from && key) {
            const h = this.guestHead(rec);
            this.flyKey(key, from, { x: h.x + 20, y: h.y + 26 }, { ks: 0.9, dur: 170, arc: 20 });
          }
          break;
        }
      }
    }

    flyBack(key, from, ks) {
      if (!key || !from) return;
      const to = this.keyCenter(key.id);
      if (!to) return;
      const el = this.keyEl(key.id);
      const inHook = el && el.closest('.hook');
      const toKs = inHook ? parseFloat(this.el.board.style.getPropertyValue('--ks')) || 1 : el && el.closest('.loose') ? 0.62 : 0.95;
      this.flyKey(key, from, to, { hide: el, ks: toKs, dur: 230, arc: 24, swing: !!inHook });
    }

    keydown(e) {
      if (!this.app.playing()) return false;
      const k = e.key.toLowerCase();
      if (this.sketchOpen) {
        if (k === 'escape') { this.closeSketch(false); return true; }
        if (k === 'enter') { this.closeSketch(true); return true; }
        if (k === 'z' && (e.ctrlKey || e.metaKey)) { this.sketchUndo(); return true; }
        return false;
      }
      if (k === 's') {
        const tgt = this.mouse ? this.targetAt(this.mouse[0], this.mouse[1]) : null;
        if (tgt && this.openSketchFor(tgt)) return true;
        this.setSketchMode(!this.sketchMode);
        return true;
      }
      if (k === 'g') { this.toggleBook(); return true; }
      if (k === 'b') { this.game.useBell(); return true; }
      if (k === 't' || k === ' ') { this.game.answerPhone(); return true; }
      if (k === 'escape') {
        if (this.sketchMode) { this.setSketchMode(false); return true; }
        if (this.bookOpen) { this.closeBook(); return true; }
        if (this.game.s.hand.length) { this.cancelAll(); return true; }
        return false;
      }
      return false;
    }
  }

  K.View = View;
})(window.K);
