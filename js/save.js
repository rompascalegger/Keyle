/* Keyle – Speicher (localStorage) für Sterne, Freischaltungen, Highscore, Optionen */
(function (K) {
  'use strict';

  const KEY = 'keyle.save.v1';

  function defaults() {
    return {
      v: 1,
      stars: 0,
      starsTotal: 0,
      relics: [],          // freigeschaltete (kostenpflichtige) Relikte
      chars: ['portier'],
      hotels: ['stadt'],
      best: { score: 0, shift: 0, chain: 0 },
      daily: {},           // datum -> bester Score
      runs: 0,
      options: { sfx: 0.8, music: 0.45, shake: true, flashes: true, hitstop: true },
      tutorialDone: false,
      eggs: {},
      eggStats: { saves: 0, chatter: 0, erase: 0, sigMet: [], chars: [], hotels: [] },
      tips: {},
      last: { char: 'portier', hotel: 'stadt', cls: 1, daily: false },
    };
  }

  const S = {
    data: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw);
          const base = defaults();
          S.data = Object.assign(base, d);
          S.data.options = Object.assign(base.options, d.options || {});
          S.data.best = Object.assign(base.best, d.best || {});
          S.data.last = Object.assign(base.last, d.last || {});
        }
      } catch (e) { S.data = defaults(); }
      return S.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e) { /* privat/gesperrt: Spiel läuft trotzdem */ }
    },
    reset() { S.data = defaults(); S.save(); },
    relicPool() {
      return K.data.RELICS.filter((r) => r.cost === 0 || S.data.relics.includes(r.id)).map((r) => r.id);
    },
  };

  K.save = S;
})(window.K);
