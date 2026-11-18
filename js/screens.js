/* Keyle – Bildschirme: Titel, Intro, Auszählung, Pausenraum, Kündigung, Hotel-Ausbau, Optionen */
(function (K) {
  'use strict';
  const U = K.util, D = K.data, F = K.faces, A = K.audio, SV = K.save, FX = K.fx;

  const Sc = { onKey: null };
  const root = () => document.getElementById('screens');

  function show(cls, html) {
    const r = root();
    r.innerHTML = '';
    const el = U.el('div', 'screen ' + (cls || ''), html);
    r.appendChild(el);
    Sc.onKey = null;
    el.scrollTop = 0;
    return el;
  }
  function close() {
    const r = root();
    const el = r.firstChild;
    Sc.onKey = null;
    if (!el) return;
    el.classList.add('out');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 220);
  }
  Sc.close = close;

  const coinSvg = '<svg><use href="#i-coin"/></svg>';
  const starSvg = '<svg><use href="#i-star"/></svg>';
  const lockSvg = '<svg><use href="#i-lock"/></svg>';
  const HOTEL_ICONS = { stadt: '🏙️', berg: '🏔️', kapsel: '🛏️', schiff: '🚢' };
  const BOSS_NAMES = { group: 'Reisegruppe', inspector: 'Hotelinspektor', band: 'Rockband' };

  function charFace(c) {
    const f = Object.assign(F.gen(new U.RNG(c.face.seed)), c.face);
    return F.render(f, 0, { mini: true });
  }

  function facadeHTML(seed, unlockedFrac) {
    const rng = new U.RNG(seed || 5);
    const blds = [
      { l: -4, w: 120, h: 62, c: 4, r: 5 },
      { l: 104, w: 150, h: 92, c: 6, r: 8 },
      { l: 246, w: 110, h: 70, c: 4, r: 6 },
      { l: 344, w: 104, h: 54, c: 4, r: 4 },
    ];
    return blds.map((b) => {
      let wins = '';
      for (let i = 0; i < b.c * b.r; i++) {
        const lit = rng.chance(unlockedFrac != null ? unlockedFrac : 0.45);
        wins += `<div class="win ${lit ? 'lit' : ''} ${lit && rng.chance(0.08) ? 'flick' : ''}"></div>`;
      }
      return `<div class="bld" style="left:${b.l}px;width:${b.w}px;height:${b.h}%;grid-template-columns:repeat(${b.c},1fr);grid-template-rows:repeat(${b.r},1fr)">${wins}</div>`;
    }).join('');
  }

  function bind(el, map) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      A.init();
      const fn = map[b.dataset.act];
      if (fn) { A.click(); fn(b, e); }
    });
  }

  // ================================================================ Titel
  Sc.title = function (app) {
    app.state = 'title';
    A.muffle(true);
    const d = SV.data;
    const el = show('solid title-screen', '');
    const render = () => {
      const last = d.last;
      const ci = D.CHARS.findIndex((c) => c.id === last.char);
      const hi = D.HOTELS.findIndex((h) => h.id === last.hotel);
      const c = D.CHARS[Math.max(0, ci)], h = D.HOTELS[Math.max(0, hi)];
      const cLocked = !d.chars.includes(c.id), hLocked = !d.hotels.includes(h.id);
      const cls = D.CLASSES[(last.cls || 1) - 1];
      const dailyBest = d.daily[U.todayKey()];
      el.innerHTML = `
        <div class="stars-bg"></div>
        <div class="facade">${facadeHTML(9)}</div>
        <div class="logo">
          <div class="hookbar"></div>
          <div class="bigkey"><div class="key k777" style="--tag:#d4a017"><svg class="metal" viewBox="0 0 20 48"><use href="#i-key"/></svg><div class="fob"><b>N°1</b></div></div></div>
          <h1><span class="k">Key</span><span class="le">le</span></h1>
          <div class="sub">Der Nachtportier</div>
        </div>
        <div class="tagline">Richtiger Schlüssel, richtiger Gast. Jeder Gast ist sein eigener Timer – und mit jeder Sekunde wütender.</div>
        <div class="bests">
          <span class="chip">🏆 Bestwert ${U.fmt(d.best.score)}</span>
          <span class="chip">🌙 Schicht ${d.best.shift || '–'}</span>
          <span class="chip">${starSvg} ${d.stars} Sterne</span>
        </div>
        <div class="setup">
          <div class="sel ${cLocked ? 'locked' : ''}">
            <button class="arr" data-act="cprev" aria-label="Zurück">‹</button>
            <div class="mid"><div class="pic">${charFace(c)}</div><div class="tx"><div class="k">Rezeption</div><div class="n">${c.name} ${cLocked ? `<span class="lock">${lockSvg}${c.cost}★</span>` : ''}</div><div class="d">${c.desc}</div></div></div>
            <button class="arr" data-act="cnext" aria-label="Weiter">›</button>
          </div>
          <div class="sel ${hLocked ? 'locked' : ''}">
            <button class="arr" data-act="hprev" aria-label="Zurück">‹</button>
            <div class="mid"><div class="em">${HOTEL_ICONS[h.id]}</div><div class="tx"><div class="k">Hotel</div><div class="n">${h.name} ${hLocked ? `<span class="lock">${lockSvg}${h.cost}★</span>` : ''}</div><div class="d">${h.desc}</div></div></div>
            <button class="arr" data-act="hnext" aria-label="Weiter">›</button>
          </div>
          <div class="classpick">
            <span class="k">Hotelklasse</span>
            <span class="st">${D.CLASSES.map((k, i) => `<button data-act="cls" data-v="${i + 1}" class="${i < last.cls ? 'on' : ''}" aria-label="${i + 1} Sterne">${starSvg}</button>`).join('')}</span>
            <span class="note">${cls.note} · ★×${cls.reward}</span>
          </div>
          <div class="classpick">
            <label class="toggle"><input type="checkbox" data-daily ${last.daily ? 'checked' : ''}><span class="sw"></span>Tages-Seed</label>
            <span class="note">${last.daily ? 'Heute für alle gleich' + (dailyBest ? ' · Bestwert ' + U.fmt(dailyBest) : '') : 'Zufällige Nacht'}</span>
          </div>
        </div>
        <button class="btn big" data-act="start" ${cLocked || hLocked ? 'disabled' : ''}>${cLocked || hLocked ? 'Erst freischalten' : 'Schicht beginnen'} <span class="kbd">Enter</span></button>
        <div class="row">
          <button class="btn ghost small" data-act="meta">★ Hotel-Ausbau</button>
          <button class="btn ghost small eggbtn" data-act="eggs">🥚 ${K.eggs.count()}/${K.eggs.E.length}</button>
          <button class="btn ghost small" data-act="howto">So geht's</button>
          <button class="btn ghost small" data-act="options">Optionen</button>
        </div>
        ${Object.keys(K.eggs.modes).filter((m) => K.eggs.modes[m]).length ? `<div class="bests">${Object.keys(K.eggs.modes).filter((m) => K.eggs.modes[m]).map((m) => `<span class="chip">✨ ${m}</span>`).join('')}</div>` : ''}`;
    };
    render();
    const cyc = (list, cur, dir) => list[(list.findIndex((x) => x.id === cur) + dir + list.length) % list.length].id;
    const start = () => {
      const last = d.last;
      if (!d.chars.includes(last.char) || !d.hotels.includes(last.hotel)) return;
      A.init();
      close();
      app.startRun();
    };
    bind(el, {
      cprev: () => { d.last.char = cyc(D.CHARS, d.last.char, -1); SV.save(); render(); },
      cnext: () => { d.last.char = cyc(D.CHARS, d.last.char, 1); SV.save(); render(); },
      hprev: () => { d.last.hotel = cyc(D.HOTELS, d.last.hotel, -1); SV.save(); render(); },
      hnext: () => { d.last.hotel = cyc(D.HOTELS, d.last.hotel, 1); SV.save(); render(); },
      cls: (b) => { d.last.cls = +b.dataset.v; SV.save(); render(); },
      start,
      meta: () => Sc.meta(app, () => Sc.title(app)),
      eggs: () => Sc.eggs(app, () => Sc.title(app)),
      howto: () => Sc.howto(app, () => Sc.title(app)),
      options: () => Sc.options(app, () => Sc.title(app)),
    });
    el.addEventListener('change', (e) => { if (e.target.matches('input[data-daily]')) { d.last.daily = e.target.checked; SV.save(); render(); } });
    Sc.onKey = (e) => { if (e.key === 'Enter') start(); };
  };

  // ================================================================ Anleitung
  Sc.howto = function (app, back) {
    const rng = new U.RNG(3);
    const f1 = F.gen(rng), f2 = F.gen(rng), f3 = F.gen(rng);
    const key = (room) => K.keyHTML({ id: 0, room }, { nodata: true });
    const el = show('solid', `
      <div class="kicker">So geht's</div>
      <h2>Die Nachtschicht</h2>
      <div class="howto">
        <div class="step" style="--i:0"><div class="ill">${key(204)}</div><div class="tx"><b>Abgabe:</b> Gäste mit erhobenem Schlüssel gehen raus. Zieh den Schlüssel an den <b>Haken mit derselben Nummer</b>.</div></div>
        <div class="step" style="--i:1"><div class="ill">${F.render(f1, 0, {})}</div><div class="tx"><b>Rückgabe:</b> Wer seinen Schlüssel zurückwill, hat ihn vorher bei dir <b>abgegeben</b>. Zieh ihn <b>vom Brett zum Gast</b>. Antippen geht auch: erst Schlüssel, dann Ziel.</div></div>
        <div class="step" style="--i:1.5"><div class="ill">✏️</div><div class="tx"><b>Gesichter merken:</b> Wer seinen Schlüssel zurückwill, nennt weder Zimmer noch Namen – nur das Gesicht zählt. Bei der <b>ersten Abgabe</b> eines Gastes: <b>✏️ Skizze</b> antippen, dann <b>steht die Zeit still</b>, während du zeichnest. Die Skizze hängt danach am Haken.</div></div>
        <div class="step" style="--i:2"><div class="ill">${F.render(f2, 3, {})}</div><div class="tx"><b>Jeder Gast ist ein Timer.</b> Er wird langsam wütender, läuft aber nie weg. Nach gut einer Minute explodiert er: <b>−1 Nerv</b> ☕.</div></div>
        <div class="step" style="--i:3"><div class="ill">⚡</div><div class="tx"><b>Punkte = 1000 ÷ Wartezeit.</b> Die ersten Sekunden zählen fast alles. Bedienungen bis 5 s bauen die <b>Kette</b> auf: BLITZ, FLOTT, OK, ZÄH.</div></div>
        <div class="step" style="--i:4"><div class="ill">${F.render(f3, 5, {})}</div><div class="tx"><b>Fehlgriff:</b> falscher Schlüssel = −1 Nerv, und der Gast kommt reklamieren. Bei 0 Nerven bist du gekündigt.</div></div>
        <div class="step" style="--i:5"><div class="ill">📖</div><div class="tx">Ab Schicht 3 nennen Gäste nur noch Namen, später nur ihr Gesicht: Das <b>Gästebuch</b> hilft, aber die Uhr läuft weiter. Tasten: <b>G</b> Gästebuch, <b>T</b> Telefon, <b>B</b> Klingel, <b>Esc</b> Pause.</div></div>
        <div class="step" style="--i:6"><div class="ill">🎰</div><div class="tx">Zwischen den Schichten: <b>Relikt wählen</b> und im Kiosk einkaufen. Nach dem Run gibt's <b>Sterne</b> für den Hotel-Ausbau.</div></div>
        <div class="step" style="--i:7"><div class="ill">🥚</div><div class="tx">Im Hotel sind über <b>130 Easter Eggs</b> versteckt: Geheimwörter, Dinge zum Antippen, seltene Gäste, besondere Daten … Jedes bringt einen Stern.</div></div>
      </div>
      <div class="formula">P = ⌊ B · m<sub>S</sub> · m<sub>K</sub> · m<sub>R</sub> ÷ max(x, 1 s) ⌋</div>
      <button class="btn" data-act="back">Verstanden</button>`);
    bind(el, { back });
    el.addEventListener('scroll', () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) K.eggs.found('m_howto'); });
    if (el.scrollHeight <= el.clientHeight + 4) setTimeout(() => K.eggs.found('m_howto'), 4000);
    Sc.onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { A.click(); back(); } };
  };

  // ================================================================ Optionen
  Sc.options = function (app, back) {
    const o = SV.data.options;
    const el = show('solid', '');
    let armed = false;
    const render = () => {
      el.innerHTML = `
        <div class="kicker">Optionen</div>
        <h2>Einstellungen</h2>
        <div class="panel">
          <div class="opt"><span>Effekte</span><input type="range" min="0" max="1" step="0.05" value="${o.sfx}" data-opt="sfx"></div>
          <div class="opt"><span>Lounge-Musik</span><input type="range" min="0" max="1" step="0.05" value="${o.music}" data-opt="music"></div>
          <div class="opt"><span>Wackeln</span><label class="toggle"><input type="checkbox" data-opt="shake" ${o.shake ? 'checked' : ''}><span class="sw"></span></label></div>
          <div class="opt"><span>Blitze und Flackern</span><label class="toggle"><input type="checkbox" data-opt="flashes" ${o.flashes ? 'checked' : ''}><span class="sw"></span></label></div>
          <div class="opt"><span>Hit-Stop bei BLITZ</span><label class="toggle"><input type="checkbox" data-opt="hitstop" ${o.hitstop ? 'checked' : ''}><span class="sw"></span></label></div>
        </div>
        <div class="panel">
          <div class="opt"><span>Tutorial erneut zeigen</span><button class="btn ghost small" data-act="tut">${SV.data.tutorialDone ? 'Zurücksetzen' : 'Aktiv'}</button></div>
          <div class="opt"><span>Spielstand löschen</span><button class="btn ghost small" data-act="wipe">${armed ? 'Wirklich? Alles weg!' : 'Löschen'}</button></div>
        </div>
        <button class="btn" data-act="back">Zurück</button>`;
    };
    render();
    el.addEventListener('input', (e) => {
      const k = e.target.dataset.opt;
      if (!k) return;
      o[k] = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);
      if (k === 'music' && o.music === 0) K.eggs.found('m_silence');
      SV.save();
      app.applyOptions();
      if (k === 'sfx') A.coin(1);
    });
    const leave = () => { if (armed) K.eggs.found('m_wipe'); back(); };
    bind(el, {
      back: leave,
      tut: () => { SV.data.tutorialDone = false; SV.save(); app.applyOptions(); render(); },
      wipe: () => {
        if (!armed) { armed = true; render(); return; }
        SV.reset(); app.applyOptions(); armed = false; render();
      },
    });
    Sc.onKey = (e) => { if (e.key === 'Escape') leave(); };
  };

  // ================================================================ Schicht-Intro
  Sc.intro = function (app, cfg, onGo) {
    const lines = D.shiftNews(cfg.s, cfg);
    const mut = cfg.mutator && D.MUTATORS.find((m) => m.id === cfg.mutator);
    const boss = cfg.boss ? BOSS_NAMES[cfg.boss] : null;
    const hour = 22 + Math.floor((cfg.s - 1) / 2);
    const time = `${String(hour % 24).padStart(2, '0')}:${(cfg.s - 1) % 2 ? '30' : '00'} · Nachtschicht`;
    const el = show('intro', `
      <div class="time">${time}</div>
      <div class="num">${cfg.s}</div>
      <div class="kicker">Schicht</div>
      ${boss ? `<div class="bossbar">BOSS · ${boss}</div>` : ''}
      ${mut ? `<div class="mutcard"><div class="ic">${mut.icon}</div><div><div class="n">Mutator: ${mut.name}</div><div class="d">${mut.desc}</div></div></div>` : ''}
      ${lines.length ? `<div class="newlist">${lines.map((l, i) => `<div class="it" style="--i:${i}"><span class="tag">NEU</span><span>${U.esc(l)}</span></div>`).join('')}</div>` : ''}
      <div class="bests"><span class="chip">👥 ${cfg.people} Gäste</span><span class="chip">🔑 ${cfg.hooks} Haken</span><span class="chip">⏱ alle ~${cfg.T.toFixed(1)} s</span></div>
      <button class="btn big" data-act="go">Los geht's <span class="kbd">Enter</span></button>`);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      A.init(); A.click();
      close();
      onGo();
    };
    if (boss) setTimeout(() => A.fanfare(), 250); else A.door();
    el.addEventListener('click', go);
    Sc.onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') go(); };
  };

  // ================================================================ Auszählung
  Sc.tally = function (app, d) {
    app.state = 'tally';
    A.muffle(true);
    const st = d.stats, G = app.game;
    const avg = st.served ? st.totalX / st.served : 0;
    const rows = [
      ['Gäste bedient', st.served],
      ['Ø Wartezeit', avg.toFixed(1) + ' s'],
      ['Beste Kette', st.bestChain],
      ['Fehlgriffe', st.errors],
      ['Eruptionen', st.eruptions],
      ['Trinkgeld', '+' + st.coins],
    ];
    const el = show('', `
      <div class="kicker">Auszählung</div>
      <h2>${d.boss ? 'Boss besiegt!' : `Schicht ${d.n} geschafft`}</h2>
      ${d.boss ? `<p>${BOSS_NAMES[d.boss]} überstanden. Seltene Relikte warten.</p>` : ''}
      <div class="tally">
        ${rows.map((r, i) => `<div class="r" style="--i:${i}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
        <div class="stamps" style="animation-delay:.6s">${['blitz', 'flott', 'ok', 'zaeh'].map((k) => `<span style="--c:${D.STAMPS[k].color}">${D.STAMPS[k].label} ${st[k]}</span>`).join('')}</div>
        <div class="r total" style="--i:${rows.length + 1}"><span>Punkte der Schicht</span><b>+${U.fmt(st.score)}</b></div>
        <div class="r" style="--i:${rows.length + 2}"><span>Gesamt</span><b>${U.fmt(G.run.score)}</b></div>
      </div>
      <button class="btn big" data-act="next">Zum Pausenraum <span class="kbd">Enter</span></button>`);
    rows.forEach((r, i) => setTimeout(() => A.tick(), i * 100));
    if (d.boss) A.fanfare(); else A.chainNote(7);
    let done = false;
    const next = () => { if (done) return; done = true; close(); setTimeout(() => Sc.room(app, !!d.boss), 120); };
    bind(el, { next });
    Sc.onKey = (e) => { if (e.key === 'Enter') { A.click(); next(); } };
  };

  // ================================================================ Pausenraum: Relikt-Wahl und Kiosk
  Sc.room = function (app, boss) {
    app.state = 'room';
    const G = app.game, run = G.run;
    let offers = G.offerRelics(boss);
    let taken = null;
    let shop = G.shopRelics(offers.map((r) => r.id));
    const sold = new Set();
    let coffeeBought = 0;
    const el = show('room solid', '');

    const reelHTML = () => offers.map((r, i) => `
      <div class="reel ${r.rarity === 'rare' ? 'rare' : ''} locked" data-reel="${i}">
        <div class="strip"></div>
      </div>`).join('');

    const cellHTML = (r, final) => `<div class="cell ${final ? 'final' : ''}"><div class="ico">${r.icon}</div><div class="dir">${U.esc(r.dir)}</div><div class="nm">${U.esc(r.name)}</div><div class="ds">${U.esc(r.desc)}</div><div class="rar">${D.RARITY[r.rarity]}</div></div>`;

    const render = () => {
      const nxt = run.shift + 1;
      el.innerHTML = `
        <div class="topline">
          <div><div class="kicker" style="text-align:left">Pausenraum</div><h2 style="text-align:left">Kaffee &amp; Kram</h2></div>
          <div class="wallet"><div class="nerves" id="room-nerves"></div><div class="coins">${coinSvg}<b id="room-coins">${run.coins}</b></div></div>
        </div>
        <div class="sect"><span>${boss ? '✨ Seltenes Relikt wählen' : 'Ein Relikt wählen · gratis'}</span><button class="btn ghost small" data-act="reroll" ${taken || run.coins < D.PRICES.reroll || !offers.length ? 'disabled' : ''}>Neu würfeln · ${D.PRICES.reroll} ${coinSvg}</button></div>
        ${offers.length ? `<div class="reels">${reelHTML()}</div>` : '<p>Du besitzt schon alle Relikte. Beeindruckend. Und ein bisschen beunruhigend.</p>'}
        <div class="sect"><span>Kiosk</span></div>
        <div class="shop">
          <div class="item ${run.coins < D.PRICES.coffee || run.nerves >= run.maxNerves ? 'cant' : ''}" data-act="coffee">
            <div class="ico">☕</div><div class="nm">Kaffee</div><div class="ds">+1 Nerv (max. ${run.maxNerves})</div>
            <div class="price">${D.PRICES.coffee} ${coinSvg}</div>
          </div>
          ${shop.map((s, i) => `
          <div class="item ${sold.has(i) ? 'sold' : ''} ${run.coins < s.price ? 'cant' : ''}" data-act="buy" data-i="${i}">
            <div class="ico">${s.relic.icon}</div><div class="nm">${U.esc(s.relic.name)}</div><div class="ds">${U.esc(s.relic.desc)}</div>
            <div class="price">${sold.has(i) ? 'verkauft' : s.price + ' ' + coinSvg}</div>
          </div>`).join('')}
        </div>
        ${run.relics.length ? `<div class="sect"><span>Deine Relikte</span></div><div class="myrelics">${run.relics.map((id) => { const r = D.relic(id); return `<div class="ric ${r.rarity === 'rare' ? 'rare' : ''}" title="${U.esc(r.name + ': ' + r.desc)}">${r.icon}</div>`; }).join('')}</div>` : ''}
        <button class="btn big wide" data-act="next" style="max-width:390px;margin-top:4px">Schicht ${nxt} beginnen <span class="kbd">Enter</span></button>`;
      renderWallet();
    };

    const renderWallet = () => {
      const n = el.querySelector('#room-nerves');
      if (n) n.innerHTML = Array.from({ length: run.maxNerves }, (_, i) => `<svg class="${i < run.nerves ? '' : 'empty'}"><use href="#i-cup"/></svg>`).join('');
      const c = el.querySelector('#room-coins');
      if (c) c.textContent = run.coins;
    };

    const spin = () => {
      const reels = U.$$('.reel', el);
      const pool = D.RELICS;
      reels.forEach((reel, i) => {
        const strip = reel.querySelector('.strip');
        const r = offers[i];
        const filler = Array.from({ length: 9 + i * 3 }, () => pool[Math.floor(Math.random() * pool.length)]);
        strip.innerHTML = filler.map((f) => cellHTML(f, false)).join('') + cellHTML(r, true);
        const h = reel.clientHeight || 178;
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        void strip.offsetWidth;
        const dur = 900 + i * 320;
        strip.style.transition = `transform ${dur}ms cubic-bezier(.12,.8,.22,1)`;
        strip.style.transform = `translateY(${-filler.length * h}px)`;
        const ticks = setInterval(() => A.tick(), 70);
        setTimeout(() => {
          clearInterval(ticks);
          A.clack();
          reel.classList.remove('locked');
          reel.classList.add('stopped');
          if (r.rarity === 'rare') { A.golden(); sparkleAt(reel, '#ffe08a', 26); }
        }, dur);
      });
    };

    const sparkleAt = (node, color, n) => {
      const r = app.view.srect(node);
      FX.sparkle(r.cx, r.cy, n || 16, color || '#ffe08a', 1.2);
    };

    render();
    spin();

    el.addEventListener('click', (e) => {
      const reel = e.target.closest('[data-reel]');
      if (!reel || taken || reel.classList.contains('locked')) return;
      const i = +reel.dataset.reel;
      taken = offers[i];
      G.takeRelic(taken.id);
      A.buy();
      sparkleAt(reel, '#ffd866', 30);
      U.$$('.reel', el).forEach((r, j) => r.classList.add(j === i ? 'taken' : 'dim'));
      const rb = el.querySelector('[data-act="reroll"]');
      if (rb) rb.disabled = true;
      setTimeout(() => {
        const mr = el.querySelector('.myrelics');
        if (!mr) { render(); restoreReels(i); }
        else mr.insertAdjacentHTML('beforeend', `<div class="ric new ${taken.rarity === 'rare' ? 'rare' : ''}" title="${U.esc(taken.name)}">${taken.icon}</div>`);
        renderWallet();
      }, 200);
    });

    // Nach erneutem Rendern bleibt die getroffene Wahl sichtbar
    const restoreReels = (i) => {
      U.$$('.reel', el).forEach((reel, j) => {
        const strip = reel.querySelector('.strip');
        strip.innerHTML = cellHTML(offers[j], true);
        reel.classList.remove('locked');
        reel.classList.add(j === i ? 'taken' : 'dim', 'stopped');
      });
    };

    bind(el, {
      reroll: () => {
        if (taken || !G.spend(D.PRICES.reroll)) return;
        offers = G.offerRelics(boss);
        A.buy();
        render();
        spin();
      },
      coffee: (b) => {
        if (run.nerves >= run.maxNerves) { app.view.ftext('Nerven sind voll', 220, 300, 'bad'); return; }
        if (!G.spend(D.PRICES.coffee)) { A.bounce(); return; }
        run.nerves++; coffeeBought++;
        A.buy(); sparkleAt(b, '#fff3c8', 14);
        const tk = taken;
        render(); restoreAfterRender(tk);
      },
      buy: (b) => {
        const i = +b.dataset.i;
        const s = shop[i];
        if (!s || sold.has(i)) return;
        if (!G.spend(s.price)) { A.bounce(); return; }
        G.takeRelic(s.relic.id);
        sold.add(i);
        A.buy(); sparkleAt(b, '#ffd866', 20);
        const tk = taken;
        render(); restoreAfterRender(tk);
      },
      next: () => {
        if (!taken && offers.length && !el.dataset.warned) {
          el.dataset.warned = '1';
          app.view.toast('Pausenraum', 'Du hast noch kein Relikt gewählt. Nochmal tippen, um ohne weiterzumachen.', 2200);
          return;
        }
        close();
        app.beginShift(run.shift + 1);
      },
    });

    const restoreAfterRender = (tk) => {
      if (tk) restoreReels(offers.indexOf(tk));
      else U.$$('.reel', el).forEach((reel, j) => { reel.querySelector('.strip').innerHTML = cellHTML(offers[j], true); reel.classList.remove('locked'); reel.classList.add('stopped'); });
    };

    Sc.onKey = (e) => { if (e.key === 'Enter') { A.click(); el.querySelector('[data-act="next"]').click(); } };
  };

  // ================================================================ Pause
  Sc.pause = function (app) {
    const G = app.game;
    const el = show('', `
      <div class="kicker">Pause</div>
      <h2>Kurz durchatmen</h2>
      <p>Die Gäste warten. Sie warten nicht gern.</p>
      ${G.run.relics.length ? `<div class="myrelics">${G.run.relics.map((id) => { const r = D.relic(id); return `<div class="ric ${r.rarity === 'rare' ? 'rare' : ''}" title="${U.esc(r.name + ': ' + r.desc)}">${r.icon}</div>`; }).join('')}</div>` : ''}
      <div class="bests"><span class="chip">Seed ${G.seed.toString(36).toUpperCase()}</span>${G.o.daily ? '<span class="chip">Tages-Seed</span>' : ''}<span class="chip">${G.char.name}</span><span class="chip">${G.hotel.name}</span></div>
      <button class="btn big" data-act="resume">Weiter <span class="kbd">Esc</span></button>
      <div class="row"><button class="btn ghost small" data-act="eggs">🥚 ${K.eggs.count()}/${K.eggs.E.length}</button><button class="btn ghost small" data-act="howto">So geht's</button><button class="btn ghost small" data-act="options">Optionen</button><button class="btn ghost small" data-act="quit">Kündigen</button></div>
      <div class="tapnote">Psst … hier kann man auch Wörter tippen.</div>`);
    bind(el, {
      resume: () => app.resume(),
      eggs: () => Sc.eggs(app, () => Sc.pause(app)),
      howto: () => Sc.howto(app, () => Sc.pause(app)),
      options: () => Sc.options(app, () => Sc.pause(app)),
      quit: () => { close(); app.quitRun(); },
    });
    Sc.onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') app.resume(); };
  };

  // ================================================================ Gekündigt
  Sc.over = function (app, res) {
    app.state = 'over';
    const G = app.game, run = G.run;
    const z = D.zeugnis(run.stats, run);
    const salut = { portier: 'Sehr geehrter Nachtportier', praktikantin: 'Sehr geehrte Praktikantin', croupier: 'Sehr geehrter Ex-Croupier', archivarin: 'Sehr geehrte Archivarin' }[G.char.id];
    const date = new Date().toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
    const el = show('solid over', `
      <div class="letter">
        <div class="head"><div class="h">Grand Hotel Keyle</div><small>Direktion · ${date}</small></div>
        <div class="ttl">ARBEITSZEUGNIS</div>
        <p>${salut},</p>
        <p>${z.lines.map(U.esc).join(' ')}</p>
        <div class="sig"><span>Hochachtungsvoll<br>Die Direktion</span><span class="scr">H. Bünzli</span></div>
        <div class="grade"><small>NOTE</small>${String(z.grade).replace('.', ',')}</div>
        <div class="fired">GEKÜNDIGT</div>
      </div>
      <div class="statline">
        <span class="chip">🏆 ${U.fmt(run.score)} Punkte</span>
        <span class="chip">🌙 Schicht ${run.shift}</span>
        <span class="chip">🔗 Kette ${run.stats.bestChain}</span>
        <span class="chip">🔑 ${run.stats.served} bedient</span>
      </div>
      ${res.newBest ? '<div class="newbest">NEUER BESTWERT</div>' : ''}
      <div class="earned">+${res.stars} ${starSvg} <span style="font-size:13px;font-style:normal;opacity:.8">für den Hotel-Ausbau</span></div>
      <button class="btn big" data-act="again">Nochmal <span class="kbd">Enter</span></button>
      <div class="row"><button class="btn ghost small" data-act="meta">★ Hotel-Ausbau</button><button class="btn ghost small" data-act="title">Titel</button></div>`);
    setTimeout(() => { A.slam(); FX.shake(8, 0.35); K.eggs.grade(z.grade); }, 620);
    setTimeout(() => { if (res.stars) A.coin(Math.min(6, res.stars)); }, 1100);
    bind(el, {
      again: () => { close(); app.startRun(); },
      meta: () => Sc.meta(app, () => Sc.title(app)),
      title: () => Sc.title(app),
    });
    Sc.onKey = (e) => { if (e.key === 'Enter') { A.click(); close(); app.startRun(); } };
  };

  // ================================================================ Kuriositätenkabinett (Easter Eggs)
  Sc.eggs = function (app, back) {
    const Eg = K.eggs;
    let sel = null;
    const el = show('solid meta eggs-screen', '');
    const render = () => {
      const n = Eg.count(), tot = Eg.E.length;
      const cats = Eg.CATS.map((c) => {
        const list = Eg.E.filter((e) => e.cat === c.id);
        const f = list.filter((e) => Eg.isFound(e.id)).length;
        return `<div class="ecat"><div class="eh"><span>${c.icon} ${c.name}</span><b>${f}/${list.length}</b></div><div class="ehint">${c.hint}</div>
          <div class="egrid">${list.map((e) => `<button class="ecell ${Eg.isFound(e.id) ? 'got' : ''} ${sel === e.id ? 'sel' : ''}" data-act="pick" data-id="${e.id}" aria-label="${Eg.isFound(e.id) ? U.esc(e.name) : 'Unbekannt'}">${Eg.isFound(e.id) ? e.icon : '🥚'}</button>`).join('')}</div></div>`;
      }).join('');
      const s = sel && Eg.BY[sel];
      const detail = s ? (Eg.isFound(s.id)
        ? `<div class="edetail got"><div class="ei">${s.icon}</div><div><div class="en">${U.esc(s.name)}</div><div class="ed">${U.esc(s.desc)}</div><div class="edate">gefunden am ${new Date(K.save.data.eggs[s.id]).toLocaleDateString('de-CH')}</div></div></div>`
        : `<div class="edetail"><div class="ei">🥚</div><div><div class="en">???</div><div class="ed">Hinweis: ${U.esc(s.hint)}</div></div></div>`)
        : `<div class="edetail"><div class="ei">🔍</div><div><div class="en">Tippe ein Ei an</div><div class="ed">Gefundene Eier zeigen, was sie sind. Die anderen verraten einen Hinweis.</div></div></div>`;
      el.innerHTML = `
        <div class="kicker">Kuriositätenkabinett</div>
        <h2>Easter Eggs</h2>
        <div class="eprog"><i style="width:${(100 * n / tot).toFixed(1)}%"></i><span>${n} / ${tot} gefunden · je +1 ★</span></div>
        ${detail}
        <div class="ecats">${cats}</div>
        <button class="btn" data-act="back">Zurück</button>`;
    };
    render();
    bind(el, { pick: (b) => { sel = b.dataset.id; render(); }, back });
    Sc.onKey = (e) => { if (e.key === 'Escape') back(); };
  };

  // ================================================================ Hotel-Ausbau
  Sc.meta = function (app, back) {
    const d = SV.data;
    let tab = 'relics';
    const el = show('solid meta', '');
    const total = D.RELICS.filter((r) => r.cost > 0).length + D.CHARS.length - 1 + D.HOTELS.length - 1;
    const owned = () => d.relics.length + d.chars.length - 1 + d.hotels.length - 1;
    const render = () => {
      const frac = total ? owned() / total : 1;
      const cols = 9, rows = 4 + Math.round(frac * 4);
      let wins = '';
      const rng = new U.RNG(42);
      for (let i = 0; i < cols * rows; i++) wins += `<div class="win ${rng.next() < 0.15 + frac * 0.8 ? 'lit' : ''}"></div>`;
      const bh = rows * 13 + 16;
      let items = '';
      if (tab === 'relics') {
        items = D.RELICS.map((r) => {
          const own = r.cost === 0 || d.relics.includes(r.id);
          return `<div class="mcard ${own ? 'owned' : ''}"><div class="top"><div class="ico">${r.icon}</div><div><div class="nm">${U.esc(r.name)}</div><div class="rar">${D.RARITY[r.rarity]} · ${U.esc(r.dir)}</div></div></div><div class="ds">${U.esc(r.desc)}</div>${own ? `<div class="own">${r.cost === 0 ? 'Start-Pool' : 'Im Pool'}</div>` : `<button class="btn" data-act="buy" data-kind="relic" data-id="${r.id}" ${d.stars < r.cost ? 'disabled' : ''}>${r.cost} ★ freischalten</button>`}</div>`;
        }).join('');
      } else if (tab === 'chars') {
        items = D.CHARS.map((c) => {
          const own = d.chars.includes(c.id);
          return `<div class="mcard ${own ? 'owned' : ''}"><div class="top"><div class="ico">${charFace(c)}</div><div><div class="nm">${c.name}</div><div class="rar">Rezeption</div></div></div><div class="ds">${c.desc}</div>${own ? '<div class="own">Eingestellt</div>' : `<button class="btn" data-act="buy" data-kind="char" data-id="${c.id}" ${d.stars < c.cost ? 'disabled' : ''}>${c.cost} ★ einstellen</button>`}</div>`;
        }).join('');
      } else {
        items = D.HOTELS.map((h) => {
          const own = d.hotels.includes(h.id);
          return `<div class="mcard ${own ? 'owned' : ''}"><div class="top"><div class="ico">${HOTEL_ICONS[h.id]}</div><div><div class="nm">${h.name}</div><div class="rar">Hotel</div></div></div><div class="ds">${h.desc}</div>${own ? '<div class="own">Eröffnet</div>' : `<button class="btn" data-act="buy" data-kind="hotel" data-id="${h.id}" ${d.stars < h.cost ? 'disabled' : ''}>${h.cost} ★ eröffnen</button>`}</div>`;
        }).join('');
      }
      el.innerHTML = `
        <div class="kicker">Hotel-Ausbau</div>
        <h2>Grand Hotel Keyle</h2>
        <div class="hotelpic" style="--bh:${bh}px"><div class="moon"></div><div class="sign">Keyle</div><div class="bld" style="grid-template-columns:repeat(${cols},12px);height:${bh}px">${wins}</div></div>
        <div class="bests"><span class="chip">${starSvg} ${d.stars} Sterne verfügbar</span><span class="chip">${owned()} / ${total} ausgebaut</span><span class="chip">${d.runs} Runs</span></div>
        <div class="tabs"><button data-act="tab" data-t="relics" class="${tab === 'relics' ? 'on' : ''}">Relikte</button><button data-act="tab" data-t="chars" class="${tab === 'chars' ? 'on' : ''}">Personal</button><button data-act="tab" data-t="hotels" class="${tab === 'hotels' ? 'on' : ''}">Hotels</button></div>
        <div class="metagrid">${items}</div>
        <button class="btn" data-act="back">Zurück</button>`;
    };
    render();
    bind(el, {
      tab: (b) => { tab = b.dataset.t; render(); },
      buy: (b) => {
        const kind = b.dataset.kind, id = b.dataset.id;
        const item = kind === 'relic' ? D.relic(id) : kind === 'char' ? D.CHARS.find((c) => c.id === id) : D.HOTELS.find((h) => h.id === id);
        if (!item || d.stars < item.cost) return;
        d.stars -= item.cost;
        if (kind === 'relic') d.relics.push(id);
        else if (kind === 'char') { d.chars.push(id); d.last.char = id; }
        else { d.hotels.push(id); d.last.hotel = id; }
        SV.save();
        A.buy();
        const r = app.view.srect(b);
        FX.sparkle(r.cx, r.cy, 24, '#ffd866', 1.3);
        render();
      },
      back,
    });
    Sc.onKey = (e) => { if (e.key === 'Escape') back(); };
  };

  K.screens = Sc;
})(window.K);
