/* Keyle – Start, Spielschleife mit festem Zeitschritt, Bildschirmfluss */
(function (K) {
  'use strict';
  const U = K.util, A = K.audio, FX = K.fx, SV = K.save;
  const STEP = 1 / 60;

  const App = {
    state: 'boot',
    game: null, view: null,
    acc: 0, last: 0, hitstopUntil: 0, slowUntil: 0,
    _opts: null,

    init() {
      SV.load();
      FX.init(document.getElementById('fx'));
      this.view = new K.View(this);
      this.applyOptions();
      this.layout();
      window.addEventListener('resize', () => this.layout());
      if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.layout());
      window.addEventListener('keydown', (e) => this.onKey(e));
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(); });
      const unlock = () => {
        A.init();
        A.vol = { sfx: SV.data.options.sfx, music: SV.data.options.music };
        A.applyVolumes();
        if (SV.data.options.music > 0) A.startMusic();
        A.muffle(this.state !== 'play');
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      K.eggs.init();
      K.screens.title(this);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.layout());
      requestAnimationFrame((t) => this.frame(t));
      // Für Tests und Neugierige
      window.KEYLE = this;
    },

    opts() { return this._opts; },

    applyOptions() {
      const o = SV.data.options;
      this._opts = Object.assign({}, o, { tutorial: !SV.data.tutorialDone });
      document.body.classList.toggle('no-shake', !o.shake);
      document.body.classList.toggle('no-flash', !o.flashes);
      FX.opts.shake = o.shake;
      A.vol = { sfx: o.sfx, music: o.music };
      A.applyVolumes();
      if (A.ok) { if (o.music > 0) A.startMusic(); else A.stopMusic(); }
    },

    finishTutorial() {
      SV.data.tutorialDone = true;
      SV.save();
      this.applyOptions();
    },

    layout() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const W = 440;
      const portrait = vw / vh < 0.8;
      let H = portrait ? Math.round((W * vh) / vw) : 880;
      H = U.clamp(H, 780, 980);
      const scale = Math.min(vw / W, vh / H);
      const stage = document.getElementById('stage');
      stage.style.setProperty('--H', H + 'px');
      const left = (vw - W * scale) / 2, top = (vh - H * scale) / 2;
      stage.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
      stage.classList.toggle('flat', portrait && vw < 640);
      const hudH = 56, counterH = 46, trayH = 64;
      const rest = H - hudH - counterH - trayH;
      const lobbyH = Math.round(rest * 0.44);
      const boardH = rest - lobbyH;
      const vars = {
        '--hud-h': hudH, '--lobby-h': lobbyH, '--counter-h': counterH, '--board-h': boardH, '--tray-h': trayH,
        '--lobby-top': hudH, '--counter-top': hudH + lobbyH, '--board-top': hudH + lobbyH + counterH, '--tray-top': H - trayH,
      };
      for (const k in vars) stage.style.setProperty(k, vars[k] + 'px');
      FX.resize(W, H, scale);
      this.dims = { W, H, scale, hudH, lobbyH, boardTop: hudH + lobbyH + counterH, boardH };
      this.view.layout(this.dims);
    },

    playing() { return this.state === 'play'; },

    hitstop(ms) {
      if (!this._opts.hitstop) return;
      this.hitstopUntil = performance.now() + ms;
    },

    // ------------------------------------------------------------ Run
    startRun() {
      const d = SV.data, last = d.last;
      const daily = !!last.daily;
      const seed = daily ? U.hashStr('keyle:' + U.todayKey()) : (Math.random() * 4294967296) >>> 0;
      this.game = new K.Game({ seed, char: last.char, hotel: last.hotel, cls: last.cls, relicPool: SV.relicPool(), daily });
      this.game.on((t, dd) => this.onGame(t, dd));
      this.view.attach(this.game);
      K.eggs.attach(this.game);
      this.view.tutServed = 0;
      d.runs++;
      SV.save();
      K.eggs.runStarted(this);
      this.beginShift(1);
    },

    beginShift(n) {
      this.game.startShift(n);
      this.state = 'intro';
      A.muffle(true);
      K.screens.intro(this, this.game.s.cfg, () => {
        this.state = 'play';
        this.acc = 0;
        A.muffle(false);
      });
    },

    onGame(t, d) {
      if (t === 'shiftend') {
        setTimeout(() => {
          if (this.game && !this.game.run.over) K.screens.tally(this, d);
        }, 1000);
      } else if (t === 'gameover') {
        this.slowUntil = performance.now() + 1100;
        A.ring(false);
        A.sadTrombone();
        setTimeout(() => this.finishRun(), 1500);
      }
    },

    finishRun() {
      const G = this.game, run = G.run, d = SV.data;
      run.over = true;
      this.state = 'over';
      A.muffle(true);
      A.ring(false);
      const stars = G.stars();
      const newBest = run.score > d.best.score;
      d.stars += stars;
      d.starsTotal += stars;
      d.best.score = Math.max(d.best.score, run.score);
      d.best.shift = Math.max(d.best.shift, run.shift);
      d.best.chain = Math.max(d.best.chain, run.stats.bestChain);
      if (G.o.daily) {
        const k = U.todayKey();
        d.daily[k] = Math.max(d.daily[k] || 0, run.score);
      }
      SV.save();
      K.screens.over(this, { stars, newBest });
    },

    quitRun() {
      if (!this.game) return;
      K.eggs.found('g_quit');
      this.game.run.nerves = 0;
      this.game.run.over = true;
      this.finishRun();
    },

    pause() {
      if (this.state !== 'play') return;
      this.state = 'paused';
      K.eggs.pauseOpened();
      A.muffle(true);
      A.ring(false);
      K.screens.pause(this);
    },

    resume() {
      if (this.state !== 'paused') return;
      K.screens.close();
      this.state = 'play';
      this.acc = 0;
      A.muffle(false);
      if (this.game.s.phone.ringing) A.ring(true);
    },

    onKey(e) {
      if (document.getElementById('screens').firstChild && this.state !== 'play') {
        if (K.eggs.key(e)) return;
        if (K.screens.onKey) {
          if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') e.preventDefault();
          K.screens.onKey(e);
        }
        return;
      }
      if (this.state === 'play') {
        if (this.view.keydown(e)) { e.preventDefault(); return; }
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { e.preventDefault(); this.pause(); }
      }
    },

    // ------------------------------------------------------------ Schleife
    frame(t) {
      requestAnimationFrame((tt) => this.frame(tt));
      const now = t / 1000;
      let dt = this.last ? now - this.last : 0.016;
      this.last = now;
      dt = Math.min(dt, 0.1);
      const G = this.game;
      if (G && G.s && this.state === 'play' && t >= this.hitstopUntil) {
        const ts = t < this.slowUntil ? 0.25 : 1;
        this.acc += dt * ts;
        let n = 0;
        while (this.acc >= STEP && n < 12) {
          G.update(STEP);
          this.acc -= STEP;
          n++;
          if (this.state !== 'play') break;
        }
      } else if (G && G.run.over && t < this.slowUntil) {
        // Zeitlupe nach dem letzten Nerv
        this.acc += dt * 0.25;
        while (this.acc >= STEP) { this.acc -= STEP; }
      }
      if (G && G.s) this.view.frame(dt);
      K.eggs.frame(dt);
      FX.update(dt);
      FX.render();
      const [sx, sy] = FX.shakeOffset();
      this.view.el.shake.style.transform = sx || sy ? `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)` : '';
    },
  };

  window.addEventListener('DOMContentLoaded', () => App.init());
  K.app = App;
})(window.K);
