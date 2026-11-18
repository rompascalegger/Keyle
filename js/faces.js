/* Keyle – prozedurale Gesichter (SVG).
   Viele Frisuren, Hüte, Brillen, Bärte, Accessoires, Outfits und Schulter-Haustiere.
   Wut ist an Mimik und Form erkennbar, nicht nur an Farbe. */
(function (K) {
  'use strict';

  const SKIN = ['#fde0c8', '#f9d7c0', '#f1c27d', '#e0ac69', '#c68642', '#a86b3c', '#8d5524', '#6b4226', '#5c3a21', '#ffdbac'];
  const HAIRC = ['#1b1b1f', '#3b2416', '#6b3f22', '#a0522d', '#d8b26e', '#f0dc9a', '#9e9e9e', '#f2f2f2', '#c4472d', '#e06aa3', '#5b6ee1', '#7bd389', '#b388eb', '#ff8c42', '#40c4ff'];
  const HAIRW = [5, 5, 4, 3, 3, 1.5, 2.5, 1.5, 2.2, 0.7, 0.7, 0.5, 0.6, 0.5, 0.5];
  const SHIRT = ['#2f4858', '#7a2e3a', '#33658a', '#86bbd8', '#f6ae2d', '#f26419', '#55a630', '#6d597a', '#b56576', '#264653', '#e9c46a', '#8d99ae', '#3d5a80', '#9c6644', '#e5989b', '#2a9d8f', '#d62828', '#4361ee'];
  const HATC = ['#1d1d22', '#7a2e3a', '#2a9d8f', '#e9c46a', '#264653', '#bc4749', '#6d597a', '#f4f1de', '#3a86ff', '#ff006e'];
  const ACC = ['#e63946', '#ffb703', '#3a86ff', '#8338ec', '#06d6a0', '#ff006e', '#fb8500'];
  const INK = '#1d1a22';
  let UID = 0;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
    return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  const P = (d, c, x) => `<path d="${d}" fill="${c}" ${x || ''}/>`;

  // ------------------------------------------------------------------ Frisuren
  const FRINGE = 'M24 50 Q21 16 50 16 Q79 16 76 50 Q74 33 66 29 Q56 36 40 29 Q28 33 24 50Z';
  const CENTER = 'M25 46 Q24 17 50 17 Q76 17 75 46 Q72 28 52 26 L50 31 L48 26 Q28 28 25 46Z';
  const CROP = 'M25 42 Q24 17 50 16 Q76 17 75 42 Q70 29 50 27 Q30 29 25 42Z';
  const LONGBACK = 'M24 40 Q20 84 30 96 L70 96 Q80 84 76 40 Q74 16 50 15 Q26 16 24 40Z';

  const HAIR = {
    bald: { w: 3, front: () => `<ellipse cx="41" cy="27" rx="7" ry="3.5" fill="#fff" opacity=".28" transform="rotate(-20 41 27)"/>` },
    crop: { w: 6, front: (c) => P(CROP, c) },
    side: { w: 6, front: (c) => P('M25 44 Q21 15 52 15 Q79 17 75 40 Q66 25 46 30 Q38 32 33 38 Q28 40 25 44Z', c) },
    bob: { w: 5, back: (c) => P('M23 44 Q21 74 31 76 L69 76 Q79 74 77 44 Q76 17 50 16 Q24 17 23 44Z', c), front: (c) => P(FRINGE, c) },
    long: { w: 5, back: (c) => P(LONGBACK, c), front: (c) => P(FRINGE, c) },
    bun: { w: 4, back: (c) => `<circle cx="50" cy="12" r="10" fill="${c}"/><path d="M42 18 Q50 22 58 18" stroke="${shade(c, -0.3)}" stroke-width="1.6" fill="none"/>`, front: (c) => P(CROP, c) },
    afro: { w: 4, tall: true, back: (c) => `<ellipse cx="50" cy="38" rx="35" ry="29" fill="${c}"/>`, front: (c) => P('M25 40 Q26 20 50 20 Q74 20 75 40 Q64 30 50 30 Q36 30 25 40Z', c) },
    mohawk: { w: 2, tall: true, front: (c, f) => P('M27 44 Q26 26 34 22 L34 44Z M73 44 Q74 26 66 22 L66 44Z', shade(c, -0.1), 'opacity=".35"') + P('M44 32 Q42 4 50 0 Q58 4 56 32Z', c) },
    curly: {
      w: 4, front: (c) => {
        let s = '';
        for (let i = 0; i < 7; i++) {
          const x = 27 + i * 7.6, y = 25 - Math.sin((i / 6) * Math.PI) * 7;
          s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.2" fill="${c}"/>`;
        }
        return s;
      },
    },
    receding: { w: 3, front: (c) => P('M24 50 Q23 34 30 29 L32 45Z M76 50 Q77 34 70 29 L68 45Z', c) + `<ellipse cx="43" cy="26" rx="6" ry="3" fill="#fff" opacity=".25"/>` },
    pigtails: { w: 3, back: (c) => P('M24 44 Q8 44 7 62 Q8 72 15 70 Q12 58 24 54Z M76 44 Q92 44 93 62 Q92 72 85 70 Q88 58 76 54Z', c) + `<circle cx="23" cy="46" r="3" fill="#e63946"/><circle cx="77" cy="46" r="3" fill="#e63946"/>`, front: (c) => P(CENTER, c) },
    spacebuns: { w: 2, back: (c) => `<circle cx="29" cy="17" r="10" fill="${c}"/><circle cx="71" cy="17" r="10" fill="${c}"/><path d="M23 13 Q29 9 35 13 M65 13 Q71 9 77 13" stroke="${shade(c, -0.3)}" stroke-width="1.4" fill="none"/>`, front: (c) => P(CENTER, c) },
    beehive: { w: 2, tall: true, back: (c) => `<ellipse cx="50" cy="5" rx="21" ry="25" fill="${c}"/><path d="M34 0 Q50 -8 66 0 M32 10 Q50 2 68 10 M34 -10 Q50 -16 64 -10" stroke="${shade(c, -0.25)}" stroke-width="1.4" fill="none"/>`, front: (c) => P('M25 44 Q22 18 50 14 Q78 18 75 44 Q70 26 50 24 Q30 26 25 44Z', c) },
    pompadour: { w: 2, tall: true, front: (c) => P('M26 40 Q21 12 44 5 Q66 0 77 16 Q79 26 75 40 Q70 24 54 22 Q38 22 26 40Z', c) + `<path d="M36 12 Q50 4 66 10" stroke="#fff" stroke-width="2" opacity=".3" fill="none"/>` },
    mullet: { w: 2, back: (c) => P('M25 44 Q22 72 30 88 L70 88 Q78 72 75 44Z', c), front: (c) => P('M25 42 Q24 17 50 16 Q76 17 75 42 L70 33 L64 38 L58 29 L50 36 L42 29 L36 38 L30 33Z', c) },
    bowl: { w: 3, front: (c) => P('M23 42 Q22 13 50 13 Q78 13 77 42Z', c) + `<path d="M24 41 L76 41" stroke="${shade(c, -0.3)}" stroke-width="1.5"/>` },
    spikes: { w: 2, tall: true, front: (c) => P('M26 40 L19 8 L34 26 L35 -1 L45 22 L50 -5 L55 22 L65 -1 L66 26 L81 8 L74 40 Q62 29 50 29 Q38 29 26 40Z', c) },
    dreads: {
      w: 2, back: (c) => [22, 29, 36, 64, 71, 78].map((x, i) => `<rect x="${x - 3}" y="30" width="6.5" height="${54 + (i % 3) * 9}" rx="3.2" fill="${c}"/><path d="M${x - 3} ${50 + i * 3} h6.5 M${x - 3} ${66 + i * 2} h6.5" stroke="${shade(c, -0.3)}" stroke-width="1"/>`).join(''),
      front: (c) => P(CROP, c) + `<path d="M34 34 Q36 24 42 20 M46 32 Q48 22 52 18 M58 32 Q60 24 64 21" stroke="${shade(c, -0.3)}" stroke-width="1.3" fill="none"/>`,
    },
    braids: {
      w: 3, back: (c) => {
        let s = '';
        for (let i = 0; i < 6; i++) s += `<ellipse cx="20" cy="${52 + i * 8}" rx="5.4" ry="5" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width=".8"/><ellipse cx="80" cy="${52 + i * 8}" rx="5.4" ry="5" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width=".8"/>`;
        return s + `<circle cx="20" cy="100" r="3" fill="#e63946"/><circle cx="80" cy="100" r="3" fill="#e63946"/>`;
      },
      front: (c) => P(CENTER, c),
    },
    ponytail: { w: 3, back: (c) => P('M68 26 Q95 28 91 62 Q88 80 80 93 Q85 66 72 40Z', c) + `<circle cx="74" cy="28" r="3.2" fill="#ffb703"/>`, front: (c) => P('M25 44 Q24 17 50 16 Q76 17 75 40 Q60 26 25 44Z', c) },
    combover: { w: 2, front: (c) => P('M26 40 Q36 21 73 28 Q56 26 30 40Z', c) + `<path d="M27 37 Q40 20 70 24 M29 34 Q44 22 66 22" stroke="${c}" stroke-width="1.3" fill="none"/>` },
    curtain: { w: 3, back: (c) => P(LONGBACK, c), front: (c) => P('M24 54 Q21 16 50 16 Q79 16 76 54 Q73 30 53 26 L50 33 L47 26 Q27 30 24 54Z', c) },
    emo: { w: 2, back: (c) => P('M23 44 Q21 74 31 76 L69 76 Q79 74 77 44 Q76 17 50 16 Q24 17 23 44Z', c), front: (c) => P('M24 58 Q19 15 55 14 Q80 17 76 42 Q66 28 57 31 Q51 40 47 52 Q41 59 33 59 Q27 59 24 58Z', c) },
    puffs: { w: 2, back: (c) => `<circle cx="22" cy="22" r="14" fill="${c}"/><circle cx="78" cy="22" r="14" fill="${c}"/>`, front: (c) => P(CENTER, c) },
    topknot: { w: 2, back: (c) => `<circle cx="50" cy="10" r="7.5" fill="${c}"/><rect x="45" y="15" width="10" height="3" rx="1.5" fill="${shade(c, -0.4)}"/>`, front: (c) => P('M25 42 Q24 17 50 16 Q76 17 75 42 Q72 26 50 24 Q28 26 25 42Z', c) },
    wild: { w: 2, tall: true, back: (c) => P('M22 54 L9 46 L17 39 L5 29 L20 26 L13 12 L28 18 L29 3 L40 14 L48 0 L55 14 L64 3 L68 18 L84 12 L79 26 L94 29 L82 39 L91 46 L78 54Z', c), front: (c) => P('M24 50 Q23 34 30 29 L32 45Z M76 50 Q77 34 70 29 L68 45Z', c) },
    widow: { w: 2, front: (c) => P('M25 46 Q23 15 50 14 Q77 15 75 46 Q73 28 62 26 L50 37 L38 26 Q27 28 25 46Z', c) + `<path d="M34 20 Q50 14 66 20" stroke="#fff" stroke-width="1.6" opacity=".3" fill="none"/>` },
    quiff: { w: 2, front: (c, f) => P('M25 46 Q25 30 30 30 L30 46Z M75 46 Q75 30 70 30 L70 46Z', c, 'opacity=".4"') + P('M29 34 Q27 9 52 7 Q77 7 73 30 Q63 21 46 23 Q35 25 29 34Z', c) },
    perm: {
      w: 2, back: (c) => {
        let s = '';
        for (let a = -205; a <= 25; a += 17) {
          const r = (a * Math.PI) / 180;
          s += `<circle cx="${(50 + 30 * Math.cos(r)).toFixed(1)}" cy="${(46 + 30 * Math.sin(r)).toFixed(1)}" r="9.5" fill="${c}"/>`;
        }
        return s;
      },
      front: (c) => [30, 40, 50, 60, 70].map((x, i) => `<circle cx="${x}" cy="${24 - (i === 2 ? 3 : i % 2 ? 2 : 0)}" r="6.5" fill="${c}"/>`).join(''),
    },
    cornrows: { w: 2, front: (c) => P(CROP, c) + `<path d="M31 38 Q33 23 40 18 M41 33 Q43 20 47 17 M53 33 Q55 20 58 17 M63 36 Q66 23 69 20" stroke="${shade(c, 0.5)}" stroke-width="1.1" fill="none" opacity=".6"/>` },
    wavy: { w: 3, back: (c) => P('M24 40 Q17 58 24 70 Q17 84 26 97 L74 97 Q83 84 76 70 Q83 58 76 40 Q74 16 50 15 Q26 16 24 40Z', c), front: (c) => P(FRINGE, c) },
    buzz: { w: 3, front: (c) => P('M26 40 Q25 19 50 18 Q75 19 74 40 Q70 30 50 29 Q30 30 26 40Z', c, 'opacity=".55"') },
    flattop: { w: 2, tall: true, front: (c) => P('M25 40 L26 10 L74 10 L75 40 Q70 30 50 29 Q30 30 25 40Z', c) },
    cleo: { w: 2, back: (c) => P('M22 30 Q22 13 50 13 Q78 13 78 30 L79 80 L21 80Z', c), front: (c) => P('M24 42 Q24 14 50 14 Q76 14 76 42Z', c) },
    pixie: { w: 3, front: (c) => P('M25 46 Q21 15 50 15 Q78 16 75 38 Q63 30 51 34 Q40 38 30 46Z', c) },
  };
  const HAIR_IDS = Object.keys(HAIR);

  // ------------------------------------------------------------------ Hüte
  const HATS = {
    top: (c, d, l) => `<rect x="34" y="-3" width="32" height="25" rx="2" fill="${c}"/><rect x="34" y="15" width="32" height="5" fill="${l}"/><rect x="23" y="20" width="54" height="5" rx="2.5" fill="${d}"/>`,
    bowler: (c, d) => `<path d="M30 25 Q30 6 50 6 Q70 6 70 25Z" fill="${c}"/><ellipse cx="50" cy="25" rx="28" ry="4.5" fill="${d}"/>`,
    beanie: (c, d, l) => `<path d="M25 33 Q25 8 50 8 Q75 8 75 33Z" fill="${c}"/><rect x="24" y="28" width="52" height="8" rx="4" fill="${d}"/><circle cx="50" cy="7" r="5.5" fill="${l}"/>`,
    cap: (c, d) => `<path d="M27 31 Q27 10 50 10 Q73 10 73 31Z" fill="${c}"/><path d="M52 28 Q80 25 88 32 Q72 35 52 32Z" fill="${d}"/><circle cx="50" cy="11" r="2" fill="${d}"/>`,
    fez: () => `<path d="M37 25 L40 6 L60 6 L63 25Z" fill="#b5281f"/><ellipse cx="50" cy="6" rx="10" ry="2" fill="#8a1d16"/><path d="M50 6 Q58 8 60 18" stroke="#111" stroke-width="1.6" fill="none"/><circle cx="60" cy="19" r="2" fill="#111"/>`,
    beret: (c, d) => `<g transform="rotate(-10 48 20)"><ellipse cx="48" cy="21" rx="27" ry="9" fill="${c}"/><circle cx="48" cy="11" r="2.5" fill="${d}"/></g>`,
    sunhat: (c, d, l) => `<path d="M34 25 Q34 6 50 6 Q66 6 66 25Z" fill="${l}"/><rect x="34" y="18" width="32" height="5" fill="${c}"/><ellipse cx="50" cy="25" rx="38" ry="7" fill="${shade(l, -0.08)}"/>`,
    cowboy: (c, d, l) => `<path d="M34 24 Q33 3 44 6 Q50 10 56 6 Q67 3 66 24Z" fill="${c}"/><rect x="34" y="18" width="32" height="4" fill="${d}"/><path d="M10 18 Q18 28 50 28 Q82 28 90 18 Q86 32 50 33 Q14 32 10 18Z" fill="${shade(c, -0.12)}"/>`,
    crown: () => `<path d="M31 25 L31 7 L40 16 L50 3 L60 16 L69 7 L69 25Z" fill="#f4c430" stroke="#b8860b" stroke-width="1.2"/><circle cx="40" cy="21" r="2.4" fill="#e63946"/><circle cx="50" cy="21" r="2.6" fill="#3a86ff"/><circle cx="60" cy="21" r="2.4" fill="#06d6a0"/><circle cx="50" cy="3" r="2" fill="#fff"/>`,
    tricorn: () => `<path d="M15 25 Q28 4 50 9 Q72 4 85 25 Q67 17 50 22 Q33 17 15 25Z" fill="#1d1d22"/><path d="M17 24 Q34 16 50 21 Q66 16 83 24" stroke="#e9c46a" stroke-width="1.5" fill="none"/><circle cx="50" cy="15" r="3" fill="#f4f1de"/><path d="M48 14 h4 M49 16.5 h2" stroke="#1d1d22" stroke-width=".8"/>`,
    wizard: () => `<path d="M29 26 L57 -16 L72 26Z" fill="#4b2c83"/><ellipse cx="50" cy="26" rx="30" ry="5" fill="#3a2168"/><path d="M48 6 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4z M60 16 l1 2 2 .3 -1.5 1.4 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.4 2 -.3z" fill="#ffd166"/>`,
    chef: () => `<rect x="32" y="15" width="36" height="12" rx="2" fill="#fff" stroke="#ddd" stroke-width="1"/><path d="M30 18 Q20 4 35 1 Q41 -10 54 -4 Q67 -9 71 5 Q82 10 70 18Z" fill="#fff" stroke="#ddd" stroke-width="1"/>`,
    turban: (c, d) => `<path d="M23 35 Q21 5 50 3 Q79 5 77 35 Q64 26 50 26 Q36 26 23 35Z" fill="${c}"/><path d="M26 28 Q50 8 74 26 M28 20 Q52 2 72 18" stroke="${d}" stroke-width="2" fill="none"/><circle cx="50" cy="20" r="3.2" fill="#ffd166" stroke="#b8860b"/>`,
    sombrero: () => `<ellipse cx="50" cy="25" rx="47" ry="8.5" fill="#d4a24c"/><path d="M38 25 Q37 1 50 1 Q63 1 62 25Z" fill="#e2b768"/><path d="M38 19 L42 16 L46 19 L50 16 L54 19 L58 16 L62 19" stroke="#e63946" stroke-width="1.6" fill="none"/><path d="M6 26 Q50 38 94 26" stroke="#e63946" stroke-width="1.6" fill="none"/>`,
    propeller: () => `<path d="M25 32 Q25 8 50 8 Q75 8 75 32Z" fill="#e63946"/><path d="M37 11 Q38 22 38 32 M50 8 L50 32 M63 11 Q62 22 62 32" stroke="#ffd166" stroke-width="4"/><path d="M25 32 Q25 8 50 8 Q75 8 75 32" stroke="#3a86ff" stroke-width="0" fill="none"/><rect x="48.5" y="0" width="3" height="9" fill="#555"/><ellipse cx="41" cy="0" rx="9" ry="2.6" fill="#3a86ff"/><ellipse cx="59" cy="0" rx="9" ry="2.6" fill="#06d6a0"/>`,
    flowers: () => [[24, 34, '#ff006e'], [31, 25, '#ffd166'], [40, 19, '#8338ec'], [50, 17, '#ff8fab'], [60, 19, '#06d6a0'], [69, 25, '#ffd166'], [76, 34, '#ff006e']].map(([x, y, col]) => `<g transform="translate(${x} ${y})"><circle r="4.2" fill="${col}"/><circle r="1.7" fill="#fff6c2"/></g>`).join('') + '<path d="M28 30 Q50 14 72 30" stroke="#3c8a64" stroke-width="2" fill="none"/>',
    bunny: () => `<g transform="rotate(-12 38 10)"><ellipse cx="38" cy="0" rx="7" ry="20" fill="#f4f1f0"/><ellipse cx="38" cy="0" rx="3.5" ry="15" fill="#ffb3c6"/></g><g transform="rotate(14 62 10)"><ellipse cx="62" cy="0" rx="7" ry="20" fill="#f4f1f0"/><ellipse cx="62" cy="0" rx="3.5" ry="15" fill="#ffb3c6"/></g><path d="M24 34 Q50 4 76 34" stroke="#f4f1f0" stroke-width="3.5" fill="none"/>`,
    horns: () => `<path d="M33 22 Q26 10 30 2 Q34 12 40 18Z M67 22 Q74 10 70 2 Q66 12 60 18Z" fill="#d62828"/><path d="M24 34 Q50 4 76 34" stroke="#1d1d22" stroke-width="3" fill="none"/>`,
    headphones: (c) => `<path d="M21 46 Q20 10 50 10 Q80 10 79 46" stroke="#2b2d42" stroke-width="5" fill="none"/><rect x="15" y="40" width="11" height="18" rx="5" fill="${c}"/><rect x="74" y="40" width="11" height="18" rx="5" fill="${c}"/>`,
    bandana: (c, d) => `<path d="M24 37 Q23 13 50 13 Q77 13 76 37 Q50 30 24 37Z" fill="${c}"/><path d="M75 33 L88 40 L80 44 Z M75 35 L86 48 L78 47Z" fill="${d}"/><g fill="#fff" opacity=".85"><circle cx="38" cy="22" r="1.6"/><circle cx="50" cy="19" r="1.6"/><circle cx="62" cy="22" r="1.6"/><circle cx="44" cy="29" r="1.4"/><circle cx="57" cy="29" r="1.4"/></g>`,
    viking: () => `<path d="M26 31 Q26 8 50 8 Q74 8 74 31Z" fill="#9aa5b1"/><rect x="25" y="27" width="50" height="6" rx="2" fill="#6c757d"/><g fill="#e5e5e5"><circle cx="34" cy="30" r="1.2"/><circle cx="50" cy="30" r="1.2"/><circle cx="66" cy="30" r="1.2"/></g><path d="M27 22 Q12 18 12 2 Q20 14 30 15Z M73 22 Q88 18 88 2 Q80 14 70 15Z" fill="#f4f1de" stroke="#cbbf9a" stroke-width="1"/>`,
    party: () => `<path d="M38 22 L50 -12 L62 22Z" fill="#8338ec"/><path d="M42 12 L58 12 M45 3 L55 3 M40 18 L60 18" stroke="#ffd166" stroke-width="2.4"/><circle cx="50" cy="-12" r="3.5" fill="#ff006e"/>`,
    sailor: () => `<path d="M28 27 Q28 13 50 13 Q72 13 72 27Z" fill="#fff" stroke="#ddd" stroke-width="1"/><rect x="27" y="23" width="46" height="6" rx="2" fill="#1d3557"/><ellipse cx="50" cy="29" rx="24" ry="3" fill="#111"/><circle cx="50" cy="19" r="2.4" fill="#e9c46a"/>`,
    santa: () => `<path d="M26 28 Q32 4 58 4 Q74 6 80 22 L72 22 Q66 12 56 12 Q42 14 40 28Z" fill="#d62828"/><circle cx="80" cy="24" r="5" fill="#fff"/><rect x="24" y="24" width="52" height="8" rx="4" fill="#fff"/>`,
    antenna: () => `<path d="M30 30 Q50 6 70 30" stroke="#2b2d42" stroke-width="3" fill="none"/><path d="M40 16 L34 2 M60 16 L66 2" stroke="#2b2d42" stroke-width="2"/><circle cx="34" cy="2" r="4" fill="#7bd389"/><circle cx="66" cy="2" r="4" fill="#ff006e"/>`,
    pumpkin: () => `<ellipse cx="50" cy="12" rx="22" ry="15" fill="#f77f00"/><path d="M38 0 Q36 12 38 26 M50 -3 L50 27 M62 0 Q64 12 62 26" stroke="#d65a00" stroke-width="1.5" fill="none"/><rect x="48" y="-8" width="4" height="7" rx="1" fill="#3c8a64"/><path d="M42 12 l4 -4 4 4z M54 12 l4 -4 4 4z" fill="#3a1500"/>`,
    tiara: () => `<path d="M30 26 Q50 14 70 26 L66 22 L60 14 L55 20 L50 10 L45 20 L40 14 L34 22Z" fill="#dfe7ef" stroke="#9fb3c8" stroke-width=".9"/><circle cx="50" cy="13" r="2" fill="#ff006e"/><circle cx="40" cy="17" r="1.3" fill="#3a86ff"/><circle cx="60" cy="17" r="1.3" fill="#3a86ff"/>`,
  };
  const HAT_IDS = Object.keys(HATS);
  const HAT_W = { top: 2, bowler: 2, beanie: 3, cap: 3, fez: 1, beret: 2, sunhat: 1.5, cowboy: 1.2, crown: 0.5, tricorn: 0.6, wizard: 0.5, chef: 0.5, turban: 0.8, sombrero: 0.5, propeller: 0.6, flowers: 1, bunny: 0.6, horns: 0.6, headphones: 1.4, bandana: 1, viking: 0.5, party: 0.7, sailor: 0.8, tiara: 0.6 };
  // Hüte, die auch auf hoher Frisur funktionieren
  const HAT_TALL_OK = new Set(['headphones', 'flowers', 'bunny', 'horns', 'tiara', 'party', 'crown']);

  // ------------------------------------------------------------------ Brillen
  const GLASSES = {
    round: () => `<circle cx="40" cy="47" r="7.5" stroke="${INK}" stroke-width="1.8" fill="rgba(255,255,255,.12)"/><circle cx="60" cy="47" r="7.5" stroke="${INK}" stroke-width="1.8" fill="rgba(255,255,255,.12)"/><path d="M47.5 46 Q50 44 52.5 46 M32.5 46 L26 44 M67.5 46 L74 44" stroke="${INK}" stroke-width="1.6" fill="none"/>`,
    square: () => `<rect x="31.5" y="41" width="16" height="12" rx="2.5" stroke="${INK}" stroke-width="1.8" fill="rgba(255,255,255,.12)"/><rect x="52.5" y="41" width="16" height="12" rx="2.5" stroke="${INK}" stroke-width="1.8" fill="rgba(255,255,255,.12)"/><path d="M47.5 46 L52.5 46 M31.5 45 L26 44 M68.5 45 L74 44" stroke="${INK}" stroke-width="1.6"/>`,
    cateye: () => `<path d="M30 42 Q40 38 48 44 Q47 53 40 53 Q32 52 30 42Z M70 42 Q60 38 52 44 Q53 53 60 53 Q68 52 70 42Z" stroke="#7a2e3a" stroke-width="2.2" fill="rgba(255,255,255,.12)"/><path d="M48 45 Q50 43.5 52 45" stroke="#7a2e3a" stroke-width="1.6" fill="none"/><circle cx="30" cy="42" r="1.2" fill="#ffd166"/><circle cx="70" cy="42" r="1.2" fill="#ffd166"/>`,
    monocle: () => `<circle cx="60" cy="47" r="7.5" stroke="#c9a227" stroke-width="2" fill="rgba(255,255,255,.15)"/><path d="M66 51 Q70 66 64 82" stroke="#c9a227" stroke-width="1" fill="none"/>`,
    shades: () => `<path d="M29 42 H71 V45 Q71 54 62 54 Q53 54 52.5 46 H47.5 Q47 54 38 54 Q29 54 29 45Z" fill="#141018"/><path d="M33 45 L38 45 M56 45 L61 45" stroke="#fff" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`,
    aviator: () => `<path d="M31 42 Q40 40 47 43 Q47 55 39 55 Q31 53 31 42Z M69 42 Q60 40 53 43 Q53 55 61 55 Q69 53 69 42Z" fill="#3b2f2f" opacity=".92" stroke="#c9a227" stroke-width="1.2"/><path d="M31 41 L69 41 M47 43 Q50 41 53 43" stroke="#c9a227" stroke-width="1.2" fill="none"/><path d="M34 45 L39 44" stroke="#fff" stroke-width="1.4" opacity=".5"/>`,
    heart: () => `<path d="M40 54 L32 46 Q29 41 34 39 Q38 38 40 42 Q42 38 46 39 Q51 41 48 46Z M60 54 L52 46 Q49 41 54 39 Q58 38 60 42 Q62 38 66 39 Q71 41 68 46Z" fill="#ff4d8d" opacity=".85" stroke="#c9184a" stroke-width="1.2"/><path d="M48 45 L52 45" stroke="#c9184a" stroke-width="1.4"/>`,
    goggles: () => `<path d="M24 44 Q50 38 76 44" stroke="#5c3d1e" stroke-width="4" fill="none"/><circle cx="39" cy="47" r="8" fill="rgba(120,220,160,.35)" stroke="#b8862e" stroke-width="3"/><circle cx="61" cy="47" r="8" fill="rgba(120,220,160,.35)" stroke="#b8862e" stroke-width="3"/><circle cx="36" cy="44" r="1.5" fill="#fff" opacity=".7"/><circle cx="58" cy="44" r="1.5" fill="#fff" opacity=".7"/>`,
    '3d': () => `<rect x="30" y="41" width="18" height="12" rx="2" fill="rgba(230,57,70,.55)" stroke="#f4f1de" stroke-width="2"/><rect x="52" y="41" width="18" height="12" rx="2" fill="rgba(58,134,255,.55)" stroke="#f4f1de" stroke-width="2"/><path d="M48 46 L52 46" stroke="#f4f1de" stroke-width="2"/>`,
    halfmoon: () => `<path d="M33 51 Q40 57 47 51 Z M53 51 Q60 57 67 51 Z" fill="rgba(255,255,255,.18)" stroke="#8a6420" stroke-width="1.6"/><path d="M47 51 Q50 49 53 51" stroke="#8a6420" stroke-width="1.4" fill="none"/>`,
    star: () => `<path d="M40 38 l2.6 5.3 5.9 .9 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.9z M60 38 l2.6 5.3 5.9 .9 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.9z" fill="rgba(255,209,102,.55)" stroke="#f77f00" stroke-width="1.4"/><path d="M47 46 L53 46" stroke="#f77f00" stroke-width="1.4"/>`,
  };
  const GLASS_IDS = Object.keys(GLASSES);
  const GLASS_W = { round: 3, square: 3, cateye: 1.5, monocle: 1, shades: 1, aviator: 1, heart: 0.6, goggles: 0.7, '3d': 0.5, halfmoon: 1, star: 0.5 };
  const HIDES_EYES = new Set(['shades', 'aviator']);

  // ------------------------------------------------------------------ Bärte
  const BEARDS = {
    mustache: (c) => P('M40 60 Q45 55.5 50 58.5 Q55 55.5 60 60 Q55 62 50 60.5 Q45 62 40 60Z', c),
    handlebar: (c) => P('M36 57 Q39 62 44 59 Q48 56 50 58 Q52 56 56 59 Q61 62 64 57 Q63 64 56 62.5 Q52 61 50 60.5 Q48 61 44 62.5 Q37 64 36 57Z', c) + `<path d="M36 57 Q33 54 35 51 M64 57 Q67 54 65 51" stroke="${c}" stroke-width="1.5" fill="none"/>`,
    full: (c) => P('M26 52 Q27 81 50 85 Q73 81 74 52 Q70 70 60 70 Q55 67 50 68 Q45 67 40 70 Q30 70 26 52Z', c),
    goatee: (c) => P('M44 70 Q50 83 56 70 Q50 73 44 70Z', c),
    chevron: (c) => P('M38 61 Q44 54 50 58 Q56 54 62 61 L58 62 Q50 59 42 62Z', c),
    pencil: (c) => `<path d="M42 59.5 Q50 57.5 58 59.5" stroke="${c}" stroke-width="1.5" fill="none"/>`,
    chops: (c) => P('M25 44 Q24 64 35 68 Q37 60 31 46Z M75 44 Q76 64 65 68 Q63 60 69 46Z', c),
    wizard: (c) => P('M27 54 Q28 88 50 114 Q72 88 73 54 Q67 70 58 70 Q54 66 50 67 Q46 66 42 70 Q33 70 27 54Z', c) + P('M40 60 Q45 56 50 59 Q55 56 60 60 Q55 63 50 61 Q45 63 40 60Z', c) + `<path d="M44 80 Q50 92 48 102 M56 80 Q52 94 54 104" stroke="${shade(c, -0.15)}" stroke-width="1.2" fill="none"/>`,
    soul: (c) => P('M48 69 L52 69 L50 74Z', c),
    stubble: (c) => P('M28 56 Q30 78 50 81 Q70 78 72 56 Q66 70 50 71 Q34 70 28 56Z', c, 'opacity=".28"'),
  };
  const BEARD_IDS = Object.keys(BEARDS);
  const BEARD_W = { mustache: 3, handlebar: 1.5, full: 2.5, goatee: 2, chevron: 1.5, pencil: 1, chops: 1, wizard: 0.4, soul: 1, stubble: 2 };

  // ------------------------------------------------------------------ Outfits
  const OUTFITS = ['suit', 'sweater', 'tee', 'hawaii', 'fur', 'leather', 'inspector', 'stripes', 'labcoat', 'cape', 'uniform', 'turtle', 'dots', 'scarf', 'overalls', 'kimono', 'hoodie', 'pearls'];
  const OUTFIT_W = { suit: 4, sweater: 3, tee: 3, hawaii: 1.2, fur: 0.4, leather: 0.8, inspector: 0, stripes: 1.2, labcoat: 0.7, cape: 0.4, uniform: 0.6, turtle: 1.5, dots: 1.2, scarf: 1.3, overalls: 1, kimono: 0.8, hoodie: 1.5, pearls: 1.2 };
  const PETS = ['parrot', 'cat', 'mouse', 'frog', 'snail', 'duck'];
  const EYES = ['happy', 'dots', 'big', 'lashes', 'sleepy', 'hetero'];
  const EYE_W = [4, 4, 2, 2, 1, 0.5];
  const BROWS = ['normal', 'thick', 'uni', 'thin', 'bushy'];
  const BROW_W = [5, 2, 0.6, 1.5, 0.8];
  const NOSES = ['curve', 'round', 'long', 'button', 'clown', 'pointy', 'hook'];
  const NOSE_W = [4, 3, 2, 3, 0.25, 0.5, 1];
  const TEETH = [null, 'buck', 'gap', 'gold', 'braces', 'fangs'];
  const TEETH_W = [20, 1.2, 1.2, 0.8, 1, 0.3];
  const EARS = [null, 'stud', 'hoop', 'pearl'];
  const EAR_W = [10, 1.5, 1.5, 1];
  const EXTRA_W = { freckles: 0.14, mole: 0.12, scar: 0.05, plaster: 0.06, star: 0.05, tear: 0.03, bindi: 0.04, nosering: 0.06, hearts: 0.04, bolt: 0.03, browring: 0.05, eyepatch: 0.03, blush: 0.1 };

  function pickW(rng, ids, w) {
    return rng.weighted(ids, (id) => (Array.isArray(w) ? w[ids.indexOf(id)] : w[id] == null ? 1 : w[id]));
  }

  function gen(rng, opts) {
    opts = opts || {};
    const hairColor = rng.weighted(HAIRC, (c) => HAIRW[HAIRC.indexOf(c)]);
    const hair = pickW(rng, HAIR_IDS, Object.fromEntries(HAIR_IDS.map((k) => [k, HAIR[k].w])));
    let hat = rng.chance(0.3) ? pickW(rng, HAT_IDS, HAT_W) : null;
    if (hat && HAIR[hair].tall && !HAT_TALL_OK.has(hat)) hat = rng.chance(0.5) ? 'headphones' : null;
    const extras = Object.keys(EXTRA_W).filter((k) => rng.chance(EXTRA_W[k]));
    if (extras.includes('eyepatch') && extras.length > 2) extras.splice(extras.indexOf('eyepatch'), 1);
    const f = {
      skin: rng.pick(SKIN),
      head: rng.int(0, 5),
      hair, hairColor,
      hat, hatColor: rng.pick(HATC),
      glasses: rng.chance(0.3) ? pickW(rng, GLASS_IDS, GLASS_W) : null,
      beard: rng.chance(0.3) ? pickW(rng, BEARD_IDS, BEARD_W) : null,
      eyes: pickW(rng, EYES, EYE_W),
      brows: pickW(rng, BROWS, BROW_W),
      nose: pickW(rng, NOSES, NOSE_W),
      teeth: pickW(rng, TEETH, TEETH_W),
      lip: rng.chance(0.14) ? rng.pick(['#c9184a', '#9d0208', '#7b2cbf', '#ff6b9a']) : null,
      ear: pickW(rng, EARS, EAR_W),
      extras,
      shirt: rng.pick(SHIRT),
      outfit: pickW(rng, OUTFITS, OUTFIT_W),
      tie: rng.chance(0.45),
      tieColor: rng.pick(ACC),
      acc: rng.pick(ACC),
      pet: rng.chance(0.07) ? rng.pick(PETS) : null,
      kid: !!opts.kid,
      celeb: !!opts.celeb,
    };
    if (f.celeb) { f.glasses = rng.pick(['shades', 'aviator']); f.outfit = 'fur'; if (f.hat && !HAT_TALL_OK.has(f.hat)) f.hat = null; }
    if (f.kid) {
      f.beard = null; f.tie = false; f.teeth = rng.chance(0.3) ? 'gap' : null; f.lip = null;
      if (f.hairColor === '#9e9e9e' || f.hairColor === '#f2f2f2') f.hairColor = '#d8b26e';
      if (f.hair === 'receding' || f.hair === 'combover' || f.hair === 'bald') f.hair = 'bowl';
    }
    if (f.extras.includes('eyepatch') && f.glasses && f.glasses !== 'monocle') f.glasses = null;
    return f;
  }

  // Zwilling: identisch bis auf ein sichtbares Detail
  function twin(f, rng) {
    const t = Object.assign({}, f, { extras: f.extras.slice() });
    const flip = (x) => { const i = t.extras.indexOf(x); if (i >= 0) t.extras.splice(i, 1); else t.extras.push(x); };
    const d = rng.int(0, 5);
    if (d === 0) flip('mole');
    else if (d === 1) t.ear = f.ear ? null : 'hoop';
    else if (d === 2) t.glasses = f.glasses ? null : 'round';
    else if (d === 3) t.tie = !f.tie;
    else if (d === 4) flip('freckles');
    else t.brows = f.brows === 'uni' ? 'normal' : 'uni';
    return t;
  }

  function headShape(f, attrs) {
    switch (f.head) {
      case 1: return `<ellipse cx="50" cy="48" rx="22" ry="29" ${attrs}/>`;
      case 2: return `<rect x="26" y="20" width="48" height="56" rx="17" ${attrs}/>`;
      case 3: return `<path d="M50 20 C36 20 30 30 30 42 C26 56 27 74 50 77 C73 74 74 56 70 42 C70 30 64 20 50 20Z" ${attrs}/>`;
      case 4: return `<path d="M50 19 C30 19 24 36 26 50 C28 66 40 77 50 77 C60 77 72 66 74 50 C76 36 70 19 50 19Z" ${attrs}/>`;
      case 5: return `<ellipse cx="50" cy="49" rx="27.5" ry="26" ${attrs}/>`;
      default: return `<ellipse cx="50" cy="48" rx="25" ry="28" ${attrs}/>`;
    }
  }

  // ------------------------------------------------------------------ Augen, Brauen, Mund, Nase
  function eyes(f, lvl, look) {
    if (f.glasses && HIDES_EYES.has(f.glasses)) return '';
    const st = f.eyes;
    const big = (f.kid ? 1.22 : 1) * (st === 'big' ? 1.2 : 1);
    const out = [];
    const L = 40, R = 60, Y = 47;
    const off = look || (lvl === 1 ? 2.2 : 0);
    const iris = (x) => (st === 'hetero' ? `<circle cx="${x + off}" cy="${Y + 0.3}" r="${3.3 * big}" fill="${x === L ? '#3a86ff' : '#2ec4b6'}"/>` : '');
    const shine = (x, r) => `<circle cx="${x + off + r * 0.4}" cy="${Y - r * 0.45}" r="${r * 0.38}" fill="#fff"/>`;
    if (lvl === 0) {
      if (st === 'happy') {
        out.push(`<path d="M35.5 48.5 Q40 43.5 44.5 48.5 M55.5 48.5 Q60 43.5 64.5 48.5" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
      } else if (st === 'sleepy') {
        out.push(`<path d="M35 47 Q40 50.5 45 47 M55 47 Q60 50.5 65 47" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
      } else if (st === 'big' || st === 'hetero') {
        out.push(`<ellipse cx="${L}" cy="${Y}" rx="${5.2 * big}" ry="${5.6 * big}" fill="#fff"/><ellipse cx="${R}" cy="${Y}" rx="${5.2 * big}" ry="${5.6 * big}" fill="#fff"/>`);
        out.push(iris(L) + iris(R));
        out.push(`<circle cx="${L}" cy="${Y + 0.6}" r="${2.6 * big}" fill="${INK}"/><circle cx="${R}" cy="${Y + 0.6}" r="${2.6 * big}" fill="${INK}"/>` + shine(L, 3 * big) + shine(R, 3 * big));
      } else {
        out.push(`<circle cx="${L}" cy="${Y}" r="${3 * big}" fill="${INK}"/><circle cx="${R}" cy="${Y}" r="${3 * big}" fill="${INK}"/>`);
        out.push(`<circle cx="${L + 1}" cy="${Y - 1.2}" r="1" fill="#fff"/><circle cx="${R + 1}" cy="${Y - 1.2}" r="1" fill="#fff"/>`);
      }
    } else if (lvl <= 3) {
      const ry = (lvl === 3 ? 3 : 4) * (st === 'big' ? 1.2 : 1);
      out.push(`<ellipse cx="${L}" cy="${Y}" rx="${5 * big}" ry="${ry * big}" fill="#fff"/><ellipse cx="${R}" cy="${Y}" rx="${5 * big}" ry="${ry * big}" fill="#fff"/>`);
      out.push(iris(L) + iris(R));
      out.push(`<circle cx="${L + off}" cy="${Y + 0.3}" r="${2.5 * big}" fill="${INK}"/><circle cx="${R + off}" cy="${Y + 0.3}" r="${2.5 * big}" fill="${INK}"/>`);
      if (lvl === 2 || st === 'sleepy') {
        out.push(`<path d="M34.5 46.5 Q40 41.5 45.5 46.5 Z M54.5 46.5 Q60 41.5 65.5 46.5 Z" fill="${f.skin}"/><path d="M34.5 46.5 L45.5 46.5 M54.5 46.5 L65.5 46.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`);
      }
      if (lvl === 3) out.push(`<path d="M35 50 Q40 51.5 45 50 M55 50 Q60 51.5 65 50" stroke="${INK}" stroke-width="1.3" fill="none" opacity=".7"/>`);
    } else if (lvl === 4) {
      out.push(`<ellipse cx="${L}" cy="${Y}" rx="5.2" ry="4.2" fill="#fff"/><ellipse cx="${R}" cy="${Y}" rx="5.2" ry="4.2" fill="#fff"/>`);
      out.push(`<circle cx="${L}" cy="${Y}" r="1.7" fill="${INK}"/><circle cx="${R}" cy="${Y}" r="1.7" fill="${INK}"/>`);
      out.push(`<path d="M34 44 L46 47.5 M66 44 L54 47.5" stroke="${f.skin}" stroke-width="3"/>`);
    } else {
      out.push(`<path d="M35 43.5 L44 47.5 L35 51.5 M65 43.5 L56 47.5 L65 51.5" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    if (st === 'lashes' && lvl < 5) out.push(`<path d="M34 43 L32 40.5 M37 41.5 L36 38.5 M66 43 L68 40.5 M63 41.5 L64 38.5" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`);
    return out.join('');
  }

  function brows(f, lvl) {
    const c = f.hair === 'bald' || f.hair === 'receding' ? shade(f.skin, -0.45) : f.hairColor === '#f2f2f2' ? '#bdbdbd' : shade(f.hairColor, -0.1);
    const mult = { normal: 1, thick: 1.7, uni: 1.4, thin: 0.6, bushy: 2 }[f.brows] || 1;
    const w = [2.2, 2.2, 2.4, 2.8, 3.3, 3.8][lvl] * mult;
    const y = f.glasses && HIDES_EYES.has(f.glasses) ? -2 : f.glasses === 'goggles' ? -4 : 0;
    const Pd = [
      `M34 ${39 + y} Q40 ${34.5 + y} 46 ${38 + y} M54 ${38 + y} Q60 ${34.5 + y} 66 ${39 + y}`,
      `M34 ${38 + y} L46 ${38 + y} M54 ${38 + y} L66 ${38 + y}`,
      `M34 ${38.5 + y} L46 ${39.5 + y} M54 ${37 + y} Q60 ${33.5 + y} 66 ${36.5 + y}`,
      `M34 ${35.5 + y} L46 ${40 + y} M54 ${40 + y} L66 ${35.5 + y}`,
      `M33 ${34 + y} L46 ${41 + y} M54 ${41 + y} L67 ${34 + y}`,
      `M32 ${32.5 + y} L47 ${42 + y} M53 ${42 + y} L68 ${32.5 + y}`,
    ];
    let s = `<path d="${Pd[lvl]}" stroke="${c}" stroke-width="${w.toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    if (f.brows === 'uni') s += `<path d="M45 ${38.5 + y + (lvl >= 3 ? 2 : 0)} L55 ${38.5 + y + (lvl >= 3 ? 2 : 0)}" stroke="${c}" stroke-width="${(w * 0.8).toFixed(1)}" stroke-linecap="round"/>`;
    if (f.brows === 'bushy') s += `<path d="M35 ${36 + y} l-2 -3 M39 ${35 + y} l-1 -3 M61 ${35 + y} l1 -3 M65 ${36 + y} l2 -3" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`;
    return s;
  }

  function teeth(f, lvl) {
    if (!f.teeth || lvl >= 4) return f.teeth === 'fangs' ? `<path d="M44.5 62 L46 66 L47.5 62Z M52.5 62 L54 66 L55.5 62Z" fill="#fff"/>` : '';
    const y = lvl === 0 ? 62.5 : 63;
    switch (f.teeth) {
      case 'buck': return `<rect x="46.6" y="${y}" width="3.2" height="4.4" rx=".8" fill="#fff" stroke="#999" stroke-width=".4"/><rect x="50.2" y="${y}" width="3.2" height="4.4" rx=".8" fill="#fff" stroke="#999" stroke-width=".4"/>`;
      case 'gap': return `<rect x="45" y="${y}" width="4" height="3.6" rx=".8" fill="#fff" stroke="#999" stroke-width=".4"/><rect x="51" y="${y}" width="4" height="3.6" rx=".8" fill="#fff" stroke="#999" stroke-width=".4"/>`;
      case 'gold': return `<rect x="51" y="${y}" width="3.4" height="3.6" rx=".8" fill="#f4c430" stroke="#b8860b" stroke-width=".5"/>`;
      case 'braces': return `<rect x="44" y="${y}" width="12" height="3.4" rx="1" fill="#fff" stroke="#999" stroke-width=".4"/><path d="M44 ${y + 1.7} H56" stroke="#8d99ae" stroke-width="1"/>`;
      case 'fangs': return `<path d="M44.5 ${y - 0.5} L46 ${y + 3.5} L47.5 ${y - 0.5}Z M52.5 ${y - 0.5} L54 ${y + 3.5} L55.5 ${y - 0.5}Z" fill="#fff"/>`;
      default: return '';
    }
  }

  function mouth(f, lvl) {
    const col = f.lip || INK;
    const lw = f.lip ? 3.2 : 2.4;
    switch (lvl) {
      case 0: return f.eyes === 'happy' || f.teeth === 'gap'
        ? `<path d="M41 60 Q50 71 59 60 Z" fill="${f.lip || '#7a1f2b'}"/><path d="M43 61 Q50 64 57 61" stroke="#fff" stroke-width="2" fill="none"/>`
        : `<path d="M41 61 Q50 69 59 61" stroke="${col}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>`;
      case 1: return `<path d="M43 63 Q50 65.5 57 63" stroke="${col}" stroke-width="${lw - 0.2}" fill="none" stroke-linecap="round"/>`;
      case 2: return `<path d="M42 64 L58 63" stroke="${col}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>`;
      case 3: return `<path d="M42 66.5 Q50 59 58 66.5" stroke="${col}" stroke-width="${lw + 0.2}" fill="none" stroke-linecap="round"/>`;
      case 4: return `<rect x="40.5" y="59.5" width="19" height="8" rx="3" fill="#fff" stroke="${col}" stroke-width="1.8"/><path d="M45 59.5 V67.5 M50 59.5 V67.5 M55 59.5 V67.5 M40.5 63.5 H59.5" stroke="${INK}" stroke-width="1"/>`;
      default: return `<ellipse cx="50" cy="64" rx="8.5" ry="8" fill="#3a0d12"/><ellipse cx="50" cy="68.5" rx="5" ry="3" fill="#e05a6b"/><rect x="44" y="56.5" width="12" height="3" rx="1.2" fill="#fff"/>`;
    }
  }

  function nose(f) {
    const c = shade(f.skin, -0.22);
    switch (f.nose) {
      case 'round': return `<path d="M46.5 55 Q50 60 53.5 55" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      case 'long': return `<path d="M50 45 L46.5 57 L52 57" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'button': return `<ellipse cx="50" cy="55" rx="4" ry="3" fill="${c}"/>`;
      case 'clown': return `<circle cx="50" cy="55" r="5.2" fill="#e63946"/><circle cx="48.4" cy="53.3" r="1.5" fill="#fff" opacity=".7"/>`;
      case 'pointy': return `<path d="M49 46 L41 59 L51 57.5Z" fill="${shade(f.skin, -0.06)}" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"/>`;
      case 'hook': return `<path d="M49 45 Q58 52 53 58 Q49.5 59.5 47 57" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      default: return `<path d="M50 49 Q46.5 56 51 57" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
  }

  function extrasFace(f) {
    const ex = f.extras || [];
    let s = '';
    const dk = shade(f.skin, -0.35);
    if (ex.includes('freckles')) s += `<g fill="${dk}" opacity=".7"><circle cx="34" cy="53" r=".9"/><circle cx="37" cy="55" r=".9"/><circle cx="33" cy="56" r=".9"/><circle cx="66" cy="53" r=".9"/><circle cx="63" cy="55" r=".9"/><circle cx="67" cy="56" r=".9"/></g>`;
    if (ex.includes('blush')) s += `<ellipse cx="34" cy="56" rx="5" ry="3" fill="#ff7096" opacity=".45"/><ellipse cx="66" cy="56" rx="5" ry="3" fill="#ff7096" opacity=".45"/>`;
    if (ex.includes('hearts')) s += `<path d="M33 58 l-2.6 -2.6 a1.5 1.5 0 0 1 2.6 -1.6 a1.5 1.5 0 0 1 2.6 1.6z M67 58 l-2.6 -2.6 a1.5 1.5 0 0 1 2.6 -1.6 a1.5 1.5 0 0 1 2.6 1.6z" fill="#ff4d8d"/>`;
    if (ex.includes('mole')) s += `<circle cx="62" cy="61" r="1.4" fill="#4a2a1a"/>`;
    if (ex.includes('scar')) s += `<path d="M33 50 L39 61" stroke="#b5655d" stroke-width="1.5"/><path d="M34 53 l3 -1 M35.5 56 l3 -1 M37 59 l3 -1" stroke="#b5655d" stroke-width="1"/>`;
    if (ex.includes('plaster')) s += `<g transform="rotate(-25 66 34)"><rect x="59" y="31" width="14" height="5.5" rx="2" fill="#f2d0a4" stroke="#d4a373" stroke-width=".6"/><path d="M64.5 32 v3.6 M67.5 32 v3.6" stroke="#d4a373" stroke-width=".6"/></g>`;
    if (ex.includes('star')) s += `<path d="M66 56 l1 2 2.2 .3 -1.6 1.5 .4 2.2 -2 -1 -2 1 .4 -2.2 -1.6 -1.5 2.2 -.3z" fill="#3a86ff"/>`;
    if (ex.includes('tear')) s += `<path d="M62 54 q-1.4 2.4 0 3.3 q1.4 -.9 0 -3.3z" fill="#1d3557"/>`;
    if (ex.includes('bindi')) s += `<circle cx="50" cy="38" r="1.7" fill="#d62828"/>`;
    if (ex.includes('bolt')) s += `<path d="M37 34 L42 43 L38 43 L44 55 L35 44 L39 44Z" fill="#ffd166" stroke="#e85d04" stroke-width=".7" opacity=".9"/>`;
    if (ex.includes('browring')) s += `<circle cx="66" cy="38" r="1.8" stroke="#c0c0c0" stroke-width="1.1" fill="none"/>`;
    return s;
  }

  function extrasTop(f) {
    const ex = f.extras || [];
    let s = '';
    if (ex.includes('nosering')) s += `<path d="M52.5 56 a2.3 2.3 0 1 0 1 3" stroke="#d4af37" stroke-width="1.2" fill="none"/>`;
    if (ex.includes('eyepatch')) s += `<path d="M24 38 Q40 35 54 42 M66 47 L76 52" stroke="#111" stroke-width="1.5" fill="none"/><ellipse cx="60" cy="47" rx="7.5" ry="6.6" fill="#111"/>`;
    return s;
  }

  function earring(f, ex) {
    switch (f.ear) {
      case 'stud': return `<circle cx="${ex - 0.5}" cy="57" r="1.7" fill="#7bdff2" stroke="#fff" stroke-width=".5"/><circle cx="${100 - ex + 0.5}" cy="57" r="1.7" fill="#7bdff2" stroke="#fff" stroke-width=".5"/>`;
      case 'hoop': return `<circle cx="${ex - 1}" cy="61" r="4" fill="none" stroke="#f2c94c" stroke-width="1.5"/><circle cx="${100 - ex + 1}" cy="61" r="4" fill="none" stroke="#f2c94c" stroke-width="1.5"/>`;
      case 'pearl': return `<path d="M${ex - 0.5} 56 v3 M${100 - ex + 0.5} 56 v3" stroke="#ccc" stroke-width=".8"/><circle cx="${ex - 0.5}" cy="61" r="2.4" fill="#fbf8f0" stroke="#ddd" stroke-width=".5"/><circle cx="${100 - ex + 0.5}" cy="61" r="2.4" fill="#fbf8f0" stroke="#ddd" stroke-width=".5"/>`;
      default: return '';
    }
  }

  // ------------------------------------------------------------------ Körper, Outfits, Haustiere
  function body(f, o) {
    const s = o.shirt || f.shirt;
    const dark = shade(s, -0.3), light = shade(s, 0.35);
    const skinD = shade(f.skin, -0.12);
    const outfit = o.outfit || f.outfit;
    const id = 'kb' + (++UID);
    const BODY = 'M10 112 Q12 88 36 83 Q50 91 64 83 Q88 88 90 112Z';
    let out = `<defs><clipPath id="${id}"><path d="${BODY}"/></clipPath></defs>`;
    if (outfit === 'hoodie') out += `<path d="M30 86 Q28 66 50 64 Q72 66 70 86Z" fill="${dark}"/>`;
    if (outfit === 'cape') out += `<path d="M16 112 L20 70 Q50 60 80 70 L84 112Z" fill="#1d1d22"/><path d="M26 86 L18 58 L38 80Z M74 86 L82 58 L62 80Z" fill="#9d0208"/>`;
    out += `<path d="M43 68 L43 85 Q50 91 57 85 L57 68Z" fill="${skinD}"/>`;
    out += `<path d="${BODY}" fill="${outfit === 'labcoat' ? '#f4f6f8' : outfit === 'stripes' ? '#f4f1ea' : outfit === 'leather' ? '#1d1d22' : s}"/>`;
    switch (outfit) {
      case 'suit':
        out += `<path d="M41 84 L50 101 L59 84 Q50 90 41 84Z" fill="#f4f1ea"/><path d="M36 83 L50 106 L43 112 L28 112 Q30 92 36 83Z M64 83 L50 106 L57 112 L72 112 Q70 92 64 83Z" fill="${dark}" opacity=".55"/>`;
        if (f.tie) out += `<path d="M48.3 88 L51.7 88 L53.5 103 L50 108 L46.5 103Z" fill="${f.tieColor}"/>`;
        else out += `<path d="M45 87 L50 89.5 L55 87 L55 92 L50 89.5 L45 92Z" fill="${f.tieColor}"/>`;
        break;
      case 'sweater': out += `<path d="M38 84 Q50 93 62 84" stroke="${dark}" stroke-width="4" fill="none"/><path d="M14 104 Q50 100 86 104" stroke="${dark}" stroke-width="3" fill="none" opacity=".5"/>`; break;
      case 'tee': out += `<path d="M41 84 Q50 91 59 84" stroke="${dark}" stroke-width="2.4" fill="none"/>`; break;
      case 'hawaii':
        out += `<g fill="#fff" opacity=".75"><circle cx="24" cy="100" r="3"/><circle cx="34" cy="94" r="2.4"/><circle cx="70" cy="98" r="3"/><circle cx="78" cy="106" r="2.4"/><circle cx="60" cy="106" r="2"/><circle cx="30" cy="108" r="2.2"/></g><g fill="#ffd166"><circle cx="24" cy="100" r="1.2"/><circle cx="70" cy="98" r="1.2"/></g><path d="M41 84 L50 96 L59 84" stroke="${dark}" stroke-width="2.2" fill="none"/>`;
        break;
      case 'fur':
        out += `<g fill="#f7e7ff">${[16, 26, 36, 64, 74, 84].map((x, i) => `<circle cx="${x}" cy="${90 + (i % 3) * 3 + (x > 50 ? 0 : 2)}" r="7"/>`).join('')}</g><path d="M44 95 l2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5z" fill="#ffd700"/>`;
        break;
      case 'leather': out += `<path d="M36 83 L50 104 L64 83" stroke="#555" stroke-width="2" fill="none"/><path d="M50 104 V112" stroke="#999" stroke-width="1.2"/><g fill="#cfcfcf">${[22, 30, 70, 78].map((x) => `<circle cx="${x}" cy="98" r="1.5"/>`).join('')}</g>`; break;
      case 'inspector':
        out += `<path d="M41 84 L50 99 L59 84 Q50 90 41 84Z" fill="#f4f1ea"/><path d="M44 87 L50 89.5 L56 87 L56 93 L50 90.5 L44 93Z" fill="#7a2e3a"/><rect x="58" y="92" width="20" height="18" rx="2" fill="#2b2d42" transform="rotate(-8 68 101)"/><rect x="60" y="94" width="16" height="14" fill="#f2e8cf" transform="rotate(-8 68 101)"/>`;
        break;
      case 'stripes': out += `<g clip-path="url(#${id})" stroke="${s === '#f4f1ea' ? '#1d3557' : s}" stroke-width="3.2">${[89, 96, 103, 110].map((y) => `<path d="M0 ${y} H100"/>`).join('')}</g><path d="M41 84 Q50 91 59 84" stroke="#1d3557" stroke-width="2" fill="none"/>`; break;
      case 'labcoat': out += `<path d="M38 83 L50 106 L62 83" stroke="#cfd8dc" stroke-width="2" fill="none"/><path d="M41 84 L50 97 L59 84 Q50 90 41 84Z" fill="${s}"/><rect x="64" y="96" width="12" height="9" rx="1" fill="none" stroke="#cfd8dc" stroke-width="1.2"/><path d="M67 94 v6 M70 93 v7" stroke="#3a86ff" stroke-width="1.4"/><path d="M73 94 v6" stroke="#e63946" stroke-width="1.4"/>`; break;
      case 'cape': out += `<path d="M41 84 L50 99 L59 84 Q50 90 41 84Z" fill="#f4f1ea"/><circle cx="50" cy="96" r="2.4" fill="#9d0208"/>`; break;
      case 'uniform': out += `<rect x="17" y="86" width="16" height="4" rx="2" fill="#f4c430"/><rect x="67" y="86" width="16" height="4" rx="2" fill="#f4c430"/><path d="M41 84 L50 95 L59 84" stroke="${dark}" stroke-width="2" fill="none"/><g fill="#f4c430"><circle cx="50" cy="100" r="1.4"/><circle cx="50" cy="106" r="1.4"/></g><rect x="30" y="96" width="4" height="6" fill="#e63946"/><rect x="35" y="96" width="4" height="6" fill="#3a86ff"/><circle cx="32" cy="104" r="2" fill="#f4c430"/><circle cx="37" cy="104" r="2" fill="#f4c430"/>`; break;
      case 'turtle': out += `<path d="M40 70 Q50 75 60 70 L61 86 Q50 91 39 86Z" fill="${s}"/><path d="M41 74 H59 M41 78 H59 M41 82 H59" stroke="${dark}" stroke-width="1" opacity=".6"/>`; break;
      case 'dots': out += `<g clip-path="url(#${id})" fill="${light}">${[[20, 98], [32, 92], [44, 104], [56, 96], [68, 104], [80, 98], [28, 108], [62, 110], [74, 90], [38, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g><path d="M40 84 Q50 92 60 84" stroke="${dark}" stroke-width="2" fill="none"/>`; break;
      case 'scarf': out += `<path d="M36 80 Q50 92 64 80 L66 88 Q50 98 34 88Z" fill="${f.acc}"/><path d="M56 88 L60 112 L52 112 L50 92Z" fill="${shade(f.acc, -0.15)}"/><path d="M53 108 h6 M52 104 h6" stroke="#fff" stroke-width="1" opacity=".6"/>`; break;
      case 'overalls': out += `<rect x="34" y="96" width="32" height="18" rx="3" fill="#3a5a98"/><path d="M36 97 L32 84 M64 97 L68 84" stroke="#3a5a98" stroke-width="4"/><circle cx="38" cy="99" r="1.6" fill="#f4c430"/><circle cx="62" cy="99" r="1.6" fill="#f4c430"/><path d="M40 84 Q50 90 60 84" stroke="${dark}" stroke-width="2" fill="none"/>`; break;
      case 'kimono': out += `<path d="M38 83 L58 112 L66 112 L44 84Z" fill="${light}"/><path d="M62 83 L50 100" stroke="${dark}" stroke-width="2"/><rect x="12" y="102" width="76" height="8" fill="${f.acc}"/><g fill="#fff" opacity=".5"><circle cx="24" cy="94" r="2"/><circle cx="76" cy="92" r="2"/></g>`; break;
      case 'hoodie': out += `<path d="M38 84 Q50 94 62 84" stroke="${dark}" stroke-width="3" fill="none"/><path d="M45 88 L44 100 M55 88 L56 100" stroke="#f4f1ea" stroke-width="1.6"/><circle cx="44" cy="101" r="1.4" fill="#f4f1ea"/><circle cx="56" cy="101" r="1.4" fill="#f4f1ea"/>`; break;
      case 'pearls': out += `<path d="M38 83 Q50 98 62 83" fill="${shade(f.skin, -0.05)}"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const t = i / 8; const x = 39 + t * 22; const y = 86 + Math.sin(t * Math.PI) * 9; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.9" fill="#fbf8f0" stroke="#d8d2c4" stroke-width=".5"/>`; }).join(''); break;
      case 'band': out += `<path d="M36 83 L50 104 L64 83" stroke="#555" stroke-width="2" fill="none"/>`; break;
    }
    if (o.flag) out += `<path d="M86 112 L86 40" stroke="#6b4a2b" stroke-width="2.4"/><path d="M86 40 L104 46 L86 53Z" fill="${o.flag}"/>`;
    return out;
  }

  function pet(f) {
    switch (f.pet) {
      case 'parrot': return `<g transform="translate(76 70)"><path d="M0 22 Q-6 10 2 2 Q10 -4 14 6 Q16 16 8 24Z" fill="#2a9d8f"/><path d="M4 22 L0 34 L6 26 L8 34 L10 24Z" fill="#e63946"/><circle cx="8" cy="5" r="5.5" fill="#e63946"/><circle cx="9.5" cy="4" r="1.2" fill="#111"/><path d="M13 5 Q18 6 14 10Z" fill="#ffd166"/><path d="M2 12 Q6 18 4 24" stroke="#1f7a6f" stroke-width="2" fill="none"/></g>`;
      case 'cat': return `<g transform="translate(70 76)"><path d="M2 6 L4 -4 L9 3 Z M20 6 L18 -4 L13 3Z" fill="#f4a261"/><ellipse cx="11" cy="9" rx="10" ry="8" fill="#f4a261"/><circle cx="7.5" cy="8" r="1.3" fill="#111"/><circle cx="14.5" cy="8" r="1.3" fill="#111"/><path d="M10 11 L12 11 L11 12.5Z" fill="#e76f51"/><path d="M2 11 h-5 M2 13 h-5 M20 11 h5 M20 13 h5" stroke="#6d4c41" stroke-width=".6"/></g>`;
      case 'mouse': return `<g transform="translate(76 78)"><circle cx="3" cy="2" r="4" fill="#bfc0c0"/><circle cx="13" cy="2" r="4" fill="#bfc0c0"/><circle cx="3" cy="2" r="2.2" fill="#ffb3c6"/><circle cx="13" cy="2" r="2.2" fill="#ffb3c6"/><ellipse cx="8" cy="8" rx="6.5" ry="5.5" fill="#d3d3d3"/><circle cx="6" cy="7" r="1" fill="#111"/><circle cx="10" cy="7" r="1" fill="#111"/><circle cx="8" cy="10" r="1.2" fill="#ff8fab"/></g>`;
      case 'frog': return `<g transform="translate(72 78)"><ellipse cx="10" cy="9" rx="11" ry="7" fill="#52b788"/><circle cx="4" cy="3" r="4" fill="#52b788"/><circle cx="16" cy="3" r="4" fill="#52b788"/><circle cx="4" cy="3" r="2" fill="#fff"/><circle cx="16" cy="3" r="2" fill="#fff"/><circle cx="4.5" cy="3" r="1" fill="#111"/><circle cx="16.5" cy="3" r="1" fill="#111"/><path d="M5 11 Q10 14 15 11" stroke="#1b4332" stroke-width="1" fill="none"/></g>`;
      case 'snail': return `<g transform="translate(72 80)"><path d="M0 12 Q8 14 22 12 L22 9 Q12 11 2 9Z" fill="#c9ada7"/><circle cx="12" cy="6" r="7" fill="#e09f3e"/><path d="M12 6 m-4 0 a4 4 0 1 0 4 -4 a2.5 2.5 0 1 0 1 3" stroke="#9e2a2b" stroke-width="1.2" fill="none"/><path d="M2 9 L0 2 M4 9 L4 2" stroke="#c9ada7" stroke-width="1.3"/><circle cx="0" cy="2" r="1" fill="#111"/><circle cx="4" cy="2" r="1" fill="#111"/></g>`;
      case 'duck': return `<g transform="translate(74 78)"><ellipse cx="10" cy="10" rx="9" ry="6.5" fill="#ffd60a"/><circle cx="5" cy="3" r="5" fill="#ffd60a"/><path d="M0 3 L-5 4 L0 6Z" fill="#fb8500"/><circle cx="4" cy="2" r="1" fill="#111"/></g>`;
      default: return '';
    }
  }

  /**
   * Rendert ein Gesicht als SVG-String.
   * @param f    Gesichtsparameter
   * @param lvl  Wutstufe 0–5
   * @param o    { mini, shirt, outfit, flag, hatOverride, look }
   */
  function render(f, lvl, o) {
    o = o || {};
    lvl = lvl | 0;
    if (o.mod) f = Object.assign({}, f, o.mod);
    const skinD = shade(f.skin, -0.12);
    const vb = o.mini ? '12 -4 76 92' : '0 -8 100 120';
    const H = HAIR[f.hair] || HAIR.crop;
    const parts = [];
    parts.push(`<svg class="face lvl${lvl}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`);
    if (!o.mini) parts.push(body(f, o));
    const kidT = f.kid ? 'transform="translate(10 12) scale(.8)"' : '';
    parts.push(`<g class="hd"><g ${kidT}>`);
    if (H.back) parts.push(H.back(f.hairColor, f));
    const ex = f.head === 1 ? 28.5 : f.head === 5 ? 23 : 25.5;
    parts.push(`<ellipse cx="${ex}" cy="50" rx="4.2" ry="6.2" fill="${skinD}"/><ellipse cx="${100 - ex}" cy="50" rx="4.2" ry="6.2" fill="${skinD}"/>`);
    parts.push(earring(f, ex));
    parts.push(headShape(f, `fill="${f.skin}" stroke="rgba(0,0,0,.22)" stroke-width="1.2"`));
    const blush = [0.14, 0.14, 0.2, 0.36, 0.55, 0.75][lvl];
    parts.push(`<ellipse cx="35" cy="57" rx="6" ry="3.6" fill="#ff5a5a" opacity="${blush}"/><ellipse cx="65" cy="57" rx="6" ry="3.6" fill="#ff5a5a" opacity="${blush}"/>`);
    if (lvl >= 4) parts.push(headShape(f, `fill="#ff2a2a" opacity="${lvl === 4 ? 0.16 : 0.3}"`));
    parts.push(extrasFace(f));
    parts.push(H.front ? H.front(f.hairColor, f) : '');
    parts.push(eyes(f, lvl, o.look));
    parts.push(f.glasses && GLASSES[f.glasses] ? GLASSES[f.glasses]() : '');
    parts.push(brows(f, lvl));
    parts.push(nose(f));
    if (f.beard && BEARDS[f.beard] && f.beard !== 'wizard') parts.push(BEARDS[f.beard](f.hairColor === '#f2f2f2' ? '#e6e6e6' : f.hairColor));
    parts.push(mouth(f, lvl));
    parts.push(teeth(f, lvl));
    if (f.beard === 'wizard') parts.push(BEARDS.wizard(f.hairColor === '#f2f2f2' ? '#e6e6e6' : f.hairColor));
    parts.push(extrasTop(f));
    const hf = o.hatOverride ? Object.assign({}, f, o.hatOverride) : f;
    if (hf.hat && HATS[hf.hat]) parts.push(HATS[hf.hat](hf.hatColor, shade(hf.hatColor, -0.35), shade(hf.hatColor, 0.35)));
    if (lvl >= 3) {
      const sc = lvl === 3 ? 1 : 1.35;
      parts.push(`<g class="vein" transform="translate(67 27) scale(${sc})" stroke="#e01e37" stroke-width="2" fill="none" stroke-linecap="round"><path d="M-4 -1 Q-1 -1 -1 -4"/><path d="M4 -1 Q1 -1 1 -4"/><path d="M-4 1 Q-1 1 -1 4"/><path d="M4 1 Q1 1 1 4"/></g>`);
    }
    if (lvl >= 5) parts.push(`<g class="steam-puffs" fill="#fff"><circle cx="18" cy="44" r="5"/><circle cx="12" cy="36" r="6.5"/><circle cx="82" cy="44" r="5"/><circle cx="88" cy="36" r="6.5"/></g>`);
    parts.push('</g></g>');
    if (!o.mini && f.pet) parts.push(pet(f));
    parts.push('</svg>');
    return parts.join('');
  }

  K.faces = { gen, twin, render, shade, SHIRT, HAIR_IDS, HAT_IDS, GLASS_IDS, BEARD_IDS, OUTFITS, PETS };
})(window.K);
