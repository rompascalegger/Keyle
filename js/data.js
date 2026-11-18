/* Keyle – Spieldaten: Regeln, Relikte, Gäste, Texte */
(function (K) {
  'use strict';

  const D = {};

  // ---------- Grundregeln (Startwerte aus dem Konzept) ----------
  D.THRESH = [0, 8, 18, 30, 50, 75];           // Wutstufen ab gefühlter Wartezeit r·x (s) – grosszügig, damit Zeit zum Merken bleibt
  D.LEVELS = ['Freundlich', 'Ungeduldig', 'Genervt', 'Verärgert', 'Wütend', 'Tobend'];
  D.RAGE_COLORS = ['#57cc99', '#b8d26a', '#f4c95d', '#f08a4b', '#e84a5f', '#b5179e'];
  D.B = 1000;          // Basis
  D.X_MIN = 1;         // Deckel
  D.CHAIN_WINDOW = 5;  // s
  D.CHAIN_CAP = 20;
  D.COMPLAINT_DELAY = 8;
  D.START_NERVES = 5;
  D.MAX_NERVES = 8;
  D.GOLDEN_AT = [10, 20, 30];
  D.GOLDEN_DUR = 3;
  D.EVENT_CHANCE = 0.05;
  D.PRICES = { coffee: 8, reroll: 3, common: 15, uncommon: 22, rare: 30 };

  D.levelFor = function (rage) {
    let l = 0;
    for (let i = 1; i < D.THRESH.length; i++) if (rage >= D.THRESH[i]) l = i;
    return l;
  };

  // Gäste (Personen) pro Schicht: 3, 4, 5 … Jeder gibt einmal ab und kommt einmal zurück.
  D.guestCount = (s) => s + 2;
  D.interval = (s) => Math.max(1.5, 6 * Math.pow(0.9, s - 1));
  D.shiftMult = (s) => 1 + 0.2 * (s - 1);

  D.stampFor = function (x) {
    if (x <= 2) return 'blitz';
    if (x <= 5) return 'flott';
    if (x <= 12) return 'ok';
    return 'zaeh';
  };
  D.STAMPS = {
    blitz: { label: 'BLITZ', color: '#ffd23f' },
    flott: { label: 'FLOTT', color: '#4cc9f0' },
    ok: { label: 'OK', color: '#9bd1a9' },
    zaeh: { label: 'ZÄH', color: '#c99a7c' },
  };

  // ---------- Gästetypen ----------
  D.TYPES = {
    normal:    { name: 'Normalgast',         r: 1,   badge: '',   from: 1,  w: 10 },
    relaxed:   { name: 'Entspannt',          r: 0.7, badge: '🍹', from: 2,  w: 3, tip: 0.5 },
    hurry:     { name: 'Eilig',              r: 1.5, badge: '⚡', from: 4,  w: 3, tip: 2 },
    tourist:   { name: 'Tourist',            r: 1,   badge: '📷', from: 4,  w: 2.2, kind: 'drop' },
    chatter:   { name: 'Plauderer',          r: 1,   badge: '💬', from: 6,  w: 1.4 },
    loser:     { name: 'Schlüsselverlierer', r: 1,   badge: '❓', from: 99, w: 0, kind: 'pick' },
    kid:       { name: 'Kind',               r: 1.2, badge: '🧸', from: 9,  w: 1.1 },
    celeb:     { name: 'Promi',              r: 0.5, badge: '⭐', from: 11, w: 1, kind: 'pick', errCost: 2 },
    group:     { name: 'Reisegruppe',        r: 1,   badge: '🚩', from: 99, w: 0 },
    band:      { name: 'Rockband',           r: 1.3, badge: '🎸', from: 99, w: 0 },
    complaint: { name: 'Reklamation',        r: 1,   badge: '😤', from: 99, w: 0 },
  };

  // ---------- Relikte ----------
  D.RELICS = [
    { id: 'glocke', name: 'Kleine Glocke', icon: '🔔', dir: 'Tempo', rarity: 'common', cost: 0,
      desc: 'Die Wartezeit zählt 1 s weniger (nie unter 1 s).' },
    { id: 'haende', name: 'Zwei Hände', icon: '🙌', dir: 'Tempo', rarity: 'uncommon', cost: 0,
      desc: 'Du trägst zwei Schlüssel gleichzeitig. Beim Ablegen greifst du automatisch den passenden.' },
    { id: 'kaffeemaschine', name: 'Kaffeemaschine', icon: '☕', dir: 'Wut bändigen', rarity: 'common', cost: 0,
      desc: 'Die Wut steigt 15 % langsamer.' },
    { id: 'notizblock', name: 'Notizblock', icon: '📒', dir: 'Sicherheit', rarity: 'common', cost: 0,
      desc: 'Der erste Fehlgriff jeder Schicht kostet keinen Nerv.' },
    { id: 'stammgast', name: 'Stammgast-Karte', icon: '🎫', dir: 'Gedächtnis', rarity: 'uncommon', cost: 0,
      desc: 'Wiederkehrende Gäste zeigen ihren Namen über dem Kopf. Das Gästebuch erledigt den Rest.' },
    { id: 'klingel', name: 'Dienstklingel', icon: '🛎️', dir: 'Notfall', rarity: 'uncommon', cost: 0, active: true,
      desc: 'Einmal pro Schicht: alle Gäste auf Wutstufe 0. Ihre Uhr läuft weiter.' },
    { id: 'trinkgeldglas', name: 'Trinkgeldglas', icon: '🏺', dir: 'Risiko', rarity: 'common', cost: 0,
      desc: 'Alle Münzen +50 %, dafür Basis B −10 %.' },
    { id: 'rotekarte', name: 'Rote Karte', icon: '🟥', dir: 'Kette · Risiko', rarity: 'uncommon', cost: 0,
      desc: 'Kettenfaktor doppelt so stark. Jeder Fehler setzt aber alle Wartenden 1 Wutstufe hoch.' },
    { id: 'blitzableiter', name: 'Blitzableiter', icon: '🌩️', dir: 'Wut nutzen', rarity: 'rare', cost: 0,
      desc: 'Eruptionen kosten keinen Nerv. Jede Eruption erhöht m_R um 0.2 bis Schichtende.' },
    { id: 'stoppuhr', name: 'Stoppuhr', icon: '⏱️', dir: 'Kette', rarity: 'common', cost: 0,
      desc: 'Die Kette hält bei Bedienungen bis 7 s statt 5 s.' },
    { id: 'fahrstuhlmusik', name: 'Fahrstuhlmusik', icon: '🎵', dir: 'Wut bändigen', rarity: 'common', cost: 0,
      desc: 'Wut steckt keine Nachbarn mehr an.' },
    { id: 'nachtzuschlag', name: 'Nachtzuschlag', icon: '🌙', dir: 'Punkte', rarity: 'rare', cost: 0,
      desc: 'Der Schichtfaktor m_S wächst doppelt so schnell.' },
    // freischaltbar im Hotel-Ausbau
    { id: 'visitenkarten', name: 'Visitenkarten', icon: '📇', dir: 'Gedächtnis', rarity: 'common', cost: 5,
      desc: 'Wer nur sein Gesicht zeigt, nennt zusätzlich seinen Namen.' },
    { id: 'polaroid', name: 'Sofortbildkamera', icon: '📸', dir: 'Gedächtnis', rarity: 'rare', cost: 16,
      desc: 'Jeder abgegebene Schlüssel bekommt automatisch ein Sofortbild am Haken.' },
    { id: 'messingschild', name: 'Messingschild', icon: '🏷️', dir: 'Gedächtnis', rarity: 'common', cost: 6,
      desc: 'Blinde Haken verblassen nicht.' },
    { id: 'charme', name: 'Charmeoffensive', icon: '🌹', dir: 'Wut nutzen', rarity: 'uncommon', cost: 6,
      desc: 'Besänftigte Gäste geben 5× statt 3× Trinkgeld und +50 % Punkte.' },
    { id: 'glueckskatze', name: 'Glückskatze', icon: '🐱', dir: 'Glück', rarity: 'uncommon', cost: 8,
      desc: 'Zufallsereignisse treten dreimal so häufig auf.' },
    { id: 'ohrstoepsel', name: 'Ohrstöpsel', icon: '🎧', dir: 'Wut bändigen', rarity: 'uncommon', cost: 8,
      desc: 'Wütende Gäste verdecken das Brett nicht mehr, und der Tresen wackelt nicht.' },
    { id: 'kristall', name: 'Kristallleuchter', icon: '💎', dir: 'Kette', rarity: 'rare', cost: 10,
      desc: 'Die Goldene Stunde dauert doppelt so lang.' },
    { id: 'espresso', name: 'Espresso doppio', icon: '🔋', dir: 'Risiko', rarity: 'uncommon', cost: 10,
      desc: '+2 Nerven (auch maximal), aber die Wut steigt 10 % schneller.' },
    { id: 'jackpot', name: 'Glücksspirale', icon: '🎰', dir: 'Glück', rarity: 'rare', cost: 12,
      desc: 'Zimmer 777 hängt immer am Brett. Der Jackpot zahlt ×5 statt ×3.' },
    { id: 'goldschluessel', name: 'Goldener Schlüssel', icon: '🗝️', dir: 'Kette', rarity: 'rare', cost: 14,
      desc: 'Langsame Gäste brechen die Kette nicht mehr. Nur Fehler tun das.' },
  ];
  D.relic = (id) => D.RELICS.find((r) => r.id === id);
  D.RARITY = { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten' };

  // ---------- Rezeptionist:innen ----------
  D.CHARS = [
    { id: 'portier', name: 'Nachtportier', cost: 0, desc: 'Der Klassiker. 5 Nerven, keine Allüren.',
      face: { seed: 11, hair: 'side', hairColor: '#3b2416', glasses: null, hat: null, beard: 'mustache', outfit: 'suit', tie: true, shirt: '#2b2d42', extras: [], pet: null, teeth: null } },
    { id: 'praktikantin', name: 'Praktikantin', cost: 5, desc: '6 Nerven. Dafür steigt die Wut 10 % schneller.',
      face: { seed: 22, hair: 'bun', hairColor: '#c4472d', glasses: 'round', hat: null, beard: null, outfit: 'sweater', tie: false, shirt: '#e9c46a', extras: ['freckles'], pet: null, teeth: null } },
    { id: 'croupier', name: 'Ex-Croupier', cost: 8, desc: 'Die Kette startet jede Schicht bei 3.',
      face: { seed: 33, hair: 'widow', hairColor: '#1b1b1f', glasses: null, hat: null, beard: 'handlebar', outfit: 'suit', tie: true, shirt: '#7a2e3a', extras: [], pet: null, teeth: null } },
    { id: 'archivarin', name: 'Archivarin', cost: 12, desc: 'Das Gästebuch bleibt als Seitenleiste offen.',
      face: { seed: 44, hair: 'bob', hairColor: '#9e9e9e', glasses: 'cateye', hat: null, beard: null, outfit: 'sweater', tie: false, shirt: '#2a9d8f', extras: [], pet: null, teeth: null } },
  ];

  // ---------- Hotels ----------
  D.HOTELS = [
    { id: 'stadt', name: 'Stadthotel', cost: 0, desc: 'Der Standard. Marmor, Messing, Mitternacht.', hooks: 1 },
    { id: 'berg', name: 'Berghütte', cost: 10, desc: 'Wenige Haken, viele Gruppen.', hooks: 0.6, groups: true },
    { id: 'kapsel', name: 'Kapselhotel', cost: 15, desc: 'Doppelt so viele Haken, dicht an dicht.', hooks: 2 },
    { id: 'schiff', name: 'Kreuzfahrtschiff', cost: 20, desc: 'Das Schlüsselbrett schaukelt.', hooks: 1, sway: true },
  ];

  // ---------- Hotelklasse (frei wählbare Schwierigkeit) ----------
  D.CLASSES = [
    { stars: 1, rage: 1.0, nerves: 0, reward: 1, note: 'Pension' },
    { stars: 2, rage: 1.1, nerves: 0, reward: 1.25, note: 'Wut +10 %' },
    { stars: 3, rage: 1.2, nerves: -1, reward: 1.5, note: 'Wut +20 %, −1 Nerv' },
    { stars: 4, rage: 1.3, nerves: -1, reward: 2, note: 'Wut +30 %, −1 Nerv' },
    { stars: 5, rage: 1.45, nerves: -2, reward: 3, note: 'Wut +45 %, −2 Nerven' },
  ];

  // ---------- Mutatoren ab Schicht 11 ----------
  D.MUTATORS = [
    { id: 'messe', name: 'Messe in der Stadt', icon: '🏢', desc: 'Gäste kommen 25 % dichter.' },
    { id: 'strom', name: 'Stromausfall', icon: '🕯️', desc: 'Das Brett ist nur im Lichtkegel sichtbar.' },
    { id: 'hochzeit', name: 'Hochzeitsgesellschaft', icon: '💒', desc: 'Gäste kommen in Dreiergruppen.' },
    { id: 'telefon', name: 'Telefon', icon: '☎️', desc: 'Es klingelt ständig. Solange es klingelt, steigt die Wut 20 % schneller.' },
    { id: 'kaffeepause', name: 'Kaffeepause', icon: '🥐', desc: 'Wut steigt 30 % langsamer, aber Gäste kommen 25 % dichter.' },
  ];

  // ---------- Schichtplan ----------
  D.baseHooks = (s) => (s <= 2 ? 8 : s <= 4 ? 12 : s <= 6 ? 16 : s <= 9 ? 24 : 32);
  D.AWAY_MIN = 9;   // so lange bleibt ein Gast mindestens draussen, bevor er zurückkommt (s)
  D.AWAY_MAX = 20;

  D.bossFor = function (s) {
    if (s % 5 !== 0) return null;
    const cycle = (s / 5 - 1) % 3;
    return ['group', 'inspector', 'band'][cycle];
  };

  D.shiftNews = function (s, cfg) {
    const news = {
      1: ['Willkommen zur Nachtschicht.', 'Wer seinen Schlüssel zurückwill, sagt weder Zimmer noch Namen. Er hat ihn vorher bei dir abgegeben: Merk dir die Gesichter!', '✏️ Bei der ersten Abgabe eines Gastes: Skizze antippen – die Zeit steht still, während du zeichnest.'],
      2: ['Entspannte Gäste 🍹 lassen sich Zeit (Wut ×0.7).'],
      3: ['Das Gästebuch kennt Namen und Zimmer – und deine Skizzen.', '12 Haken.'],
      4: ['Eilige Gäste ⚡ (Wut ×1.5, doppeltes Trinkgeld).', 'Touristen 📷 nennen ihr Zimmer in einer Fremdsprache.'],
      5: ['Reisegruppe 🚩: Die Wut des Schlimmsten gilt für alle.', '16 Haken.'],
      6: ['Plauderer 💬 blockieren den Tresen: wegwischen!'],
      7: ['Blinde Haken: Die Beschriftung verblasst.', 'Falsch Aufgehängtes bleibt jetzt hängen.', '24 Haken.'],
      8: ['Zwillinge und ähnliche Zimmernummern (213 und 231).'],
      9: ['Das Telefon klingelt. Abnehmen!', 'Kinder 🧸 vertauschen Schlüssel am Brett.'],
      10: ['Hotelinspektor 📓: Fehler kosten 2 Nerven.', '32 Haken.'],
      11: ['Promis ⭐ zeigen nur ihr Gesicht (Fehler kosten 2 Nerven).', 'Ab jetzt: jede Schicht ein Zufalls-Mutator.'],
    };
    let lines = (news[s] || []).slice();
    if (s > 11 && !cfg.boss) lines = ['Alle Gästetypen mischen sich frei.'];
    if (s > 10 && cfg.boss === 'group') lines = ['Reisegruppen 🚩: Die Wut des Schlimmsten gilt für alle.'];
    if (cfg.boss === 'band') lines = ['Rockband 🎸: laut, eilig, ansteckend.'];
    if (s > 10 && cfg.boss === 'inspector') lines = ['Hotelinspektor 📓: Fehler kosten 2 Nerven.'];
    if (cfg.inspector && cfg.boss !== 'inspector') lines.push('Der Hotelinspektor 📓 schaut zu.');
    return lines;
  };

  // ---------- Namen ----------
  D.FIRST = ['Ueli', 'Heidi', 'Beat', 'Vreni', 'Fritz', 'Trudi', 'Kurt', 'Erika', 'Hansruedi', 'Regula', 'Sepp',
    'Margrit', 'Ruedi', 'Doris', 'Urs', 'Silvia', 'Bruno', 'Gertrud', 'Kaspar', 'Lotti', 'Reto', 'Annelies',
    'Toni', 'Greti', 'Pierre', 'Giulia', 'Kenji', 'Olga', 'Dmitri', 'Lars', 'Fatima', 'Ingrid', 'Luigi', 'Yuki',
    'Mirko', 'Agathe', 'Balthasar', 'Edeltraud', 'Konrad', 'Philippa', 'Jolanda', 'Dragan', 'Aurelia', 'Theo',
    'Maja', 'Cyrill', 'Rosmarie', 'Emil', 'Otto', 'Hedwig'];
  D.LAST = ['Brunzli', 'Chäsli', 'Zwiebelmeier', 'Pfefferkorn', 'Gugelhupf', 'Nüssli', 'Rösti', 'Häfeli', 'Mürggli',
    'Tschudi', 'Zbinden', 'Bünzli', 'Grüebler', 'Wälti', 'Fonduerat', 'Spätzli', 'Knöpfli', 'Zwetschgi', 'Bircher',
    'Haberstroh', 'Lämmli', 'Rüebli', 'Schnäbeli', 'Gschwind', 'Bärtschi', 'Krümel', 'Zwirbel', 'Hüppi', 'Pfister',
    'Meringue', 'Sauerteig', 'Mutschli', 'Brätzel', 'Kafisatz', 'Schlummer', 'Nachtigall', 'Gähnli', 'Pantöffeli',
    'Kissenberg', 'Duvet', 'Schnarchenbach', 'Mondschein', 'Zimmerli', 'Schlüsseli', 'Portmann', 'Weckerle'];

  // ---------- Fremdsprachige Zimmernummern (Tourist) ----------
  const EN = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const ENT = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const FR = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze',
    'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt', 'vingt et un', 'vingt-deux',
    'vingt-trois', 'vingt-quatre', 'vingt-cinq', 'vingt-six', 'vingt-sept', 'vingt-huit', 'vingt-neuf', 'trente',
    'trente et un', 'trente-deux', 'trente-trois', 'trente-quatre', 'trente-cinq', 'trente-six', 'trente-sept',
    'trente-huit', 'trente-neuf'];
  const IT = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici',
    'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove', 'venti', 'ventuno',
    'ventidue', 'ventitré', 'ventiquattro', 'venticinque', 'ventisei', 'ventisette', 'ventotto', 'ventinove', 'trenta',
    'trentuno', 'trentadue', 'trentatré', 'trentaquattro', 'trentacinque', 'trentasei', 'trentasette', 'trentotto',
    'trentanove'];
  const ES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
    'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno',
    'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
    'treinta', 'treinta y uno', 'treinta y dos', 'treinta y tres', 'treinta y cuatro', 'treinta y cinco',
    'treinta y seis', 'treinta y siete', 'treinta y ocho', 'treinta y nueve'];
  const IT_H = ['', 'cento', 'duecento', 'trecento', 'quattrocento', 'cinquecento', 'seicento', 'settecento', 'ottocento', 'novecento'];
  const ES_H = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function enTwo(n) { return n < 20 ? EN[n] : ENT[Math.floor(n / 10)] + (n % 10 ? '-' + EN[n % 10] : ''); }
  function roman(n) {
    const m = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, r] of m) while (n >= v) { s += r; n -= v; }
    return s;
  }
  D.foreign = function (room, rng) {
    const h = Math.floor(room / 100), t = room % 100;
    const langs = [
      () => ({ lang: 'EN', text: EN[h] + (t === 0 ? ' hundred' : t < 10 ? '-oh-' + EN[t] : '-' + enTwo(t)) }),
      () => ({ lang: 'FR', text: (h === 1 ? 'cent' : FR[h] + ' cent') + (t ? ' ' + FR[t] : '') }),
      () => ({ lang: 'IT', text: IT_H[h] + (t ? IT[t] : '') }),
      () => ({ lang: 'ES', text: (h === 1 && t === 0 ? 'cien' : ES_H[h]) + (t ? ' ' + ES[t] : '') }),
      () => ({ lang: 'LAT', text: roman(room) }),
    ];
    if (t >= 40 || room > 999) return { lang: 'LAT', text: roman(room) };
    const r = rng.pick(langs)();
    return { lang: r.lang, text: r.text.charAt(0).toUpperCase() + r.text.slice(1) + (r.lang === 'LAT' ? '' : '!') };
  };

  // ---------- Texte ----------
  D.DROP_LINES = ['Bin kurz weg!', 'Ich geh raus.', 'Spaziergang!', 'Zigarette.', 'Nachtluft!', 'Bis später!', 'Kurz Mondschauen.', 'Ich such die Bar.'];
  D.FACE_LINES = ['Na?', 'Sie kennen mich!', 'Raten Sie!', 'Ich bin’s!', 'Na, wer wohl?'];
  D.MUTTER = ['', 'Hallo?', '*seufz*', 'Na?!', 'HALLO!!', '#@!%&'];
  D.RANTS = ['HALLO?!', 'Ich warte seit Ewigkeiten!', 'Unerhört!', 'Das gibt eine Bewertung!', 'Ich kenne den Direktor!',
    'MEIN SCHLÜSSEL!', 'Tick. Tack.', 'Ist hier jemand?!', 'Ich bin Stammgast!', 'Eine Frechheit!', 'Ich zähle mit!'];
  D.CHATTER = [
    '… und dann sagte meine Schwägerin, das Fondue sei zu flüssig, stellen Sie sich das vor, zu FLÜSSIG, und ich so …',
    '… wissen Sie, ich war ja früher auch Portier, in Interlaken, 1987, da hatten wir noch richtige Schlüssel, aus Eisen …',
    '… mein Hund heisst übrigens Herr Bünzli, so wie mein Ex-Mann, das ist kein Zufall, das ist Rache, sehen Sie …',
    '… haben Sie das Kissen in 204 schon mal angefasst? Das ist kein Kissen, das ist eine Wolke mit Anspruch …',
    '… ich sammle Hotelseifen. 4’312 Stück. Darf ich Ihnen meine Lieblingsseife beschreiben? Sie ist oval …',
  ];
  D.PHONE = [
    'Zimmer 312 fragt, ob das Kissen auch in weniger flauschig erhältlich ist.',
    'Jemand möchte wissen, ob der Mond im Preis inbegriffen ist.',
    'Zimmer 105 meldet: Der Wasserhahn singt. Leider schlecht.',
    'Falsch verbunden. Oder doch nicht? Aufgelegt.',
    'Eine Stimme flüstert: «Ich weiss, was in Zimmer 213 war.» Aufgelegt.',
    'Ihre Mutter. Sie sollen sich warm anziehen.',
    'Der Zimmerservice bestellt beim Zimmerservice.',
    'Zimmer 418 möchte das Schaf zurück, das er gezählt hat.',
  ];
  D.EVENTS = [
    { id: 'stammgast', text: 'Stammgast! +8 Münzen', w: 4 },
    { id: 'gross', text: 'Grosszügig! Punkte ×2', w: 4 },
    { id: 'pralinen', text: 'Pralinen für alle! Wut −1 Stufe', w: 3 },
    { id: 'kaffee', text: 'Ein Gast spendiert Kaffee! +1 Nerv', w: 1.2 },
  ];

  // ---------- Stammgäste: handgemachte Personas ----------
  // face: überschreibt den Zufallsgenerator; der Rest (Hautton usw.) bleibt zufällig
  D.PERSONAS = [
    { first: 'Kapitän Ahab', last: 'Brunzli', quirk: 'Sucht seit 40 Jahren einen Wal. Und seinen Schlüssel.', say: 'Arrr, danke!',
      face: { hair: 'mullet', hairColor: '#c4472d', hat: 'tricorn', beard: 'full', extras: ['eyepatch'], glasses: null, outfit: 'uniform', shirt: '#1d3557', pet: 'parrot', teeth: 'gold' } },
    { first: 'Gräfin Draculina', last: 'Nachtschatten', quirk: 'Checkt nur nachts aus. Logisch.', say: 'Bis heute Nacht …',
      face: { skin: '#ece6f2', hair: 'widow', hairColor: '#1b1b1f', outfit: 'cape', teeth: 'fangs', lip: '#9d0208', eyes: 'lashes', hat: null, glasses: null, beard: null, extras: [], pet: null } },
    { first: 'Madame', last: 'Zazou', quirk: 'Hellseherin. Wusste, dass Sie das lesen.', say: 'Ich sah das kommen!',
      face: { hair: 'wavy', hairColor: '#b388eb', glasses: 'star', ear: 'hoop', outfit: 'scarf', acc: '#8338ec', extras: ['star'], hat: null, beard: null } },
    { first: 'Professor', last: 'Zahnrad', quirk: 'Hat das Rad neu erfunden. Es ist eckig.', say: 'Eureka!',
      face: { hair: 'wild', hairColor: '#f2f2f2', glasses: 'goggles', beard: 'handlebar', outfit: 'labcoat', shirt: '#6d597a', hat: null, extras: ['plaster'] } },
    { first: 'Baronin', last: 'von Fönwelle', quirk: 'Ihre Frisur hat eine eigene Postleitzahl.', say: 'Entzückend!',
      face: { hair: 'beehive', hairColor: '#e06aa3', glasses: 'cateye', outfit: 'pearls', ear: 'pearl', extras: ['mole'], lip: '#c9184a', shirt: '#7a2e3a', hat: null, beard: null } },
    { first: 'Elvis', last: 'Brätzel', quirk: 'Verlässt das Gebäude nie ohne Ansage.', say: 'Thank you very much.',
      face: { hair: 'pompadour', hairColor: '#1b1b1f', beard: 'chops', glasses: 'aviator', outfit: 'leather', hat: null } },
    { first: 'Pippa', last: 'Zwirbel', quirk: 'Ist 34. Sagt aber 9.', say: 'Juhuu!',
      face: { hair: 'pigtails', hairColor: '#c4472d', hat: 'propeller', extras: ['freckles'], outfit: 'stripes', shirt: '#e63946', teeth: 'gap', eyes: 'big', beard: null, glasses: null } },
    { first: 'Sir Reginald', last: 'Teetasse', quirk: 'Seine Teetasse hat ein eigenes Zimmer.', say: 'Formidabel.',
      face: { hair: 'side', hairColor: '#9e9e9e', glasses: 'monocle', hat: 'bowler', hatColor: '#1d1d22', beard: 'handlebar', outfit: 'suit', tie: false, tieColor: '#7a2e3a', shirt: '#2b2d42' } },
    { first: 'Chefkoch', last: 'Gugelhupf', quirk: 'Kocht nur Suppe. Auch zum Frühstück.', say: 'Ein Gedicht!',
      face: { hair: 'crop', hat: 'chef', beard: 'handlebar', outfit: 'labcoat', shirt: '#f4f1ea', nose: 'round', extras: ['blush'], glasses: null } },
    { first: 'Brunhilde', last: 'Donnerschlag', quirk: 'Reist mit Schild. Und Handtasche.', say: 'Skål!',
      face: { hair: 'braids', hairColor: '#f0dc9a', hat: 'viking', outfit: 'fur', shirt: '#9c6644', extras: ['blush'], glasses: null, beard: null } },
    { first: 'Ziggy', last: 'Sternstaub', quirk: 'Rockstar. Behauptet er.', say: 'Rock on!',
      face: { hair: 'spikes', hairColor: '#40c4ff', extras: ['bolt', 'nosering'], outfit: 'leather', eyes: 'lashes', lip: '#7b2cbf', hat: null, glasses: null, beard: null } },
    { first: 'Monsieur', last: 'Pantomime', quirk: 'Spricht nie. Bestellt trotzdem Zimmerservice.', say: '…',
      face: { skin: '#f6f6f6', hair: 'buzz', hairColor: '#1b1b1f', hat: 'beret', hatColor: '#1d1d22', outfit: 'stripes', shirt: '#f4f1ea', extras: ['tear'], lip: '#d62828', beard: 'pencil', glasses: null } },
    { first: 'Oma', last: 'Strickliesel', quirk: 'Strickt dem Hotel einen Pullover.', say: 'Ach, Sie Lieber!',
      face: { hair: 'bun', hairColor: '#f2f2f2', glasses: 'halfmoon', outfit: 'sweater', shirt: '#b56576', ear: 'pearl', extras: ['blush'], hat: null, beard: null } },
    { first: 'Dr. Kuno', last: 'Kraulkopf', quirk: 'Forscht an Mäusen. Eine forscht zurück.', say: 'Faszinierend.',
      face: { hair: 'combover', hairColor: '#6b3f22', glasses: 'round', outfit: 'suit', tie: false, tieColor: '#e63946', pet: 'mouse', brows: 'bushy', hat: null } },
    { first: 'Lady', last: 'Gugu', quirk: 'Trägt heute ein Kleid aus Quittungen.', say: 'Mwah!',
      face: { hair: 'spacebuns', hairColor: '#7bd389', glasses: 'heart', outfit: 'fur', shirt: '#ff006e', lip: '#ff6b9a', extras: ['hearts'], hat: null, beard: null } },
    { first: 'Cowboy', last: 'Kurt', quirk: 'Parkiert sein Pferd im Lift.', say: 'Yeehaw!',
      face: { hair: 'crop', hat: 'cowboy', hatColor: '#9c6644', beard: 'chevron', outfit: 'scarf', acc: '#d62828', extras: ['scar'], glasses: null } },
    { first: 'Königin', last: 'Mutschli III.', quirk: 'Regiert über ein Schrebergärtchen.', say: 'Wir sind erfreut.',
      face: { hair: 'wavy', hairColor: '#f2f2f2', hat: 'crown', outfit: 'pearls', shirt: '#4b2c83', ear: 'pearl', lip: '#9d0208', glasses: null, beard: null } },
    { first: 'Hasso', last: 'Hoppel', quirk: 'Hat Ostern verpasst. Seit 2019.', say: 'Hopp, hopp!',
      face: { hair: 'bowl', hairColor: '#d8b26e', hat: 'bunny', teeth: 'buck', outfit: 'hoodie', shirt: '#ffb3c6', nose: 'button', glasses: null, beard: null } },
    { first: 'Desirée', last: 'Duvet', quirk: 'Schläft im Stehen. Gerade jetzt.', say: 'Gäääähn …',
      face: { hair: 'perm', hairColor: '#a0522d', eyes: 'sleepy', hat: 'headphones', hatColor: '#ff006e', outfit: 'kimono', shirt: '#e5989b', glasses: null, beard: null } },
    { first: 'Fridolin', last: 'Frosch', quirk: 'Hat einen Frosch dabei. Der Frosch hat auch Hunger.', say: 'Quak. Ich meine: danke.',
      face: { hair: 'bowl', hairColor: '#3b2416', outfit: 'sweater', shirt: '#55a630', pet: 'frog', eyes: 'big', hat: null, glasses: null } },
    { first: 'Gustav', last: 'Grummel', quirk: 'Lächelt nur in Schaltjahren.', say: 'Hmpf.',
      face: { hair: 'flattop', hairColor: '#1b1b1f', brows: 'uni', beard: 'stubble', outfit: 'tee', shirt: '#8d99ae', hat: null, glasses: null } },
    { first: 'Penelope', last: 'Pfauenfeder', quirk: 'Spricht mit Topfpflanzen. Sie antworten.', say: 'Blühen Sie auf!',
      face: { hair: 'long', hairColor: '#ff8c42', hat: 'flowers', extras: ['freckles'], outfit: 'dots', shirt: '#2a9d8f', glasses: null, beard: null } },
    { first: 'Toni', last: 'Teufelchen', quirk: 'Ist eigentlich sehr nett.', say: 'Höllisch gut!',
      face: { hair: 'mullet', hairColor: '#1b1b1f', hat: 'horns', teeth: 'gold', outfit: 'leather', beard: 'goatee', glasses: null } },
    { first: 'Hugo', last: 'Hupfdohle', quirk: 'Feiert, dass Dienstag ist.', say: 'Party!',
      face: { hair: 'afro', hairColor: '#1b1b1f', hat: 'party', teeth: 'gap', outfit: 'hawaii', shirt: '#ff006e', glasses: null } },
    { first: 'Merlin', last: 'Mürggli', quirk: 'Zaubert Schlüssel weg. Leider nur weg.', say: 'Simsalabim!',
      face: { hair: 'long', hairColor: '#f2f2f2', hat: 'wizard', beard: 'wizard', glasses: 'halfmoon', outfit: 'kimono', shirt: '#4b2c83' } },
    { first: 'Bella', last: 'Bürstenschnitt', quirk: 'Hat drei Katzen. Alle heissen Bella.', say: 'Ciao, Bella!',
      face: { hair: 'quiff', hairColor: '#b388eb', extras: ['browring', 'nosering'], outfit: 'turtle', shirt: '#1d1d22', ear: 'stud', hat: null, glasses: null, beard: null } },
    { first: 'Kapitänin', last: 'Kosmo', quirk: 'War nie im All. Fühlt sich aber so.', say: 'Over and out.',
      face: { hair: 'pixie', hairColor: '#f0dc9a', glasses: 'goggles', hat: 'headphones', hatColor: '#4361ee', outfit: 'uniform', shirt: '#4361ee', beard: null } },
    { first: 'Herr', last: 'Schneckenburger', quirk: 'Hat es nie eilig. Wirklich nie.', say: 'Gemach, gemach.',
      face: { hair: 'receding', hairColor: '#9e9e9e', pet: 'snail', glasses: 'square', outfit: 'sweater', shirt: '#9c6644', eyes: 'sleepy', hat: null } },
    { first: 'Frau', last: 'Ententeich', quirk: 'Reist nur per Tretboot.', say: 'Schnatter!',
      face: { hair: 'bob', hairColor: '#3b2416', hat: 'sailor', pet: 'duck', outfit: 'stripes', shirt: '#1d3557', beard: null, glasses: null } },
    { first: 'Dagobert', last: 'Dukatenwurm', quirk: 'Zahlt in Münzen. Einzeln. Langsam.', say: 'Zeit ist Geld!',
      face: { hair: 'side', hairColor: '#f2f2f2', hat: 'top', hatColor: '#1d1d22', glasses: 'monocle', outfit: 'suit', tie: true, tieColor: '#f4c430', teeth: 'gold', beard: null } },
  ];

  // ---------- Seltene Gäste (Easter Eggs) ----------
  D.RARE = [
    { id: 'ghost', first: 'Der Geist', last: 'von Zimmer 237', quirk: 'Checkt seit 1921 aus. Kommt immer wieder.', say: 'Buuuh … danke.', ghost: true,
      face: { skin: '#e9f1ff', hair: 'wavy', hairColor: '#dfe7ff', eyes: 'big', outfit: 'cape', shirt: '#cfd8ff', hat: null, glasses: null, beard: null, lip: '#9fb3ff' } },
    { id: 'director', first: 'Direktor H.', last: 'Bünzli', quirk: 'Unterschreibt Ihre Kündigung. Prüft heute inkognito.', say: 'Notiert.',
      face: { hair: 'receding', hairColor: '#9e9e9e', glasses: 'monocle', hat: 'top', hatColor: '#1d1d22', beard: 'handlebar', outfit: 'suit', tie: true, tieColor: '#7a2e3a', shirt: '#1d1d22', brows: 'bushy' } },
    { id: 'clown', first: 'Clown', last: 'Coco', quirk: 'Arbeitet im Zirkus. Wohnt im Koffer.', say: 'Tröööt!',
      face: { skin: '#fff3e6', hair: 'afro', hairColor: '#ff8c42', nose: 'clown', outfit: 'dots', shirt: '#3a86ff', extras: ['star', 'blush'], eyes: 'big', hat: null, glasses: null, beard: null, lip: '#d62828' } },
    { id: 'traveler', first: 'Zora', last: 'aus 2099', quirk: 'Zeitreisende. Weiss, wer morgen gewinnt. Sagt es nicht.', say: 'Bis gestern!',
      face: { hair: 'spikes', hairColor: '#40c4ff', glasses: '3d', outfit: 'uniform', shirt: '#6d597a', extras: ['bolt'], hat: null, beard: null } },
    { id: 'yeti', first: 'Der Yeti', last: 'vom Gotthard', quirk: 'Ist eigentlich nur sehr behaart. Und sehr gross.', say: 'Grrrmerci.',
      face: { skin: '#cfd8dc', hair: 'wild', hairColor: '#f2f2f2', beard: 'full', brows: 'bushy', outfit: 'fur', shirt: '#eceff1', hat: null, glasses: null, teeth: 'fangs' } },
    { id: 'santa', first: 'Herr', last: 'Klaus', quirk: 'Reist nur im Dezember. Mit Rentier im Parkhaus.', say: 'Ho ho ho!',
      face: { hair: 'curly', hairColor: '#f2f2f2', hat: 'santa', beard: 'full', outfit: 'fur', shirt: '#d62828', extras: ['blush'], glasses: 'halfmoon' } },
    { id: 'alien', first: 'Herr', last: 'Grün', quirk: 'Kommt von weit her. Findet Fondue faszinierend.', say: 'Nanu-nanu!',
      face: { skin: '#9be3a4', hair: 'bald', hat: 'antenna', eyes: 'big', outfit: 'turtle', shirt: '#2b2d42', glasses: null, beard: null, nose: 'button' } },
    { id: 'doppel', first: '', last: '', quirk: 'Moment mal … das bist ja du!', say: 'Gute Schicht, Kollege!', face: {} },
  ];

  D.QUIRKS = ['Sammelt Hotelseifen. 4\u2019312 Stück.', 'Hat Angst vor Teppichmustern.', 'Reist mit einem Goldfisch im Handgepäck.',
    'Isst Fondue mit Stäbchen.', 'Zählt Treppenstufen. Laut.', 'Trägt Socken in Sandalen. Mit Stolz.', 'Glaubt, das Hotel sei ein Schiff.',
    'Schläft nur mit Helm.', 'Spricht fliessend Delfin.', 'Bügelt Banknoten.', 'Hat einen Kaktus namens Rüdiger.',
    'Wohnt seit 1998 hier. Auf der Durchreise.', 'Bestellt Zimmerservice an die Rezeption.', 'Fotografiert jede Türklinke.',
    'Kennt alle Liftmusik-Stücke auswendig.', 'Reist mit sieben Koffern. Alle leer.', 'Testet jedes Kopfkissen der Stadt.',
    'Hält Tauben für Spione.', 'Pfeift beim Gehen. Nur Walzer.', 'Verwechselt links und rechts. Absichtlich.',
    'Schreibt Postkarten an sich selbst.', 'Sammelt Minibar-Fläschchen. Leere.', 'Hat Heimweh nach einem anderen Hotel.',
    'Joggt im Bademantel.', 'Grüsst Topfpflanzen persönlich.', 'Isst Brezeln nur von links.', 'Kann mit den Ohren wackeln. Zeigt es ungefragt.',
    'Sucht seit Tagen den Ausgang.', 'Führt Tagebuch über Wolken.', 'Trägt zwei Uhren. Beide falsch.', 'Hat eine Allergie gegen Montage.',
    'Erfindet täglich ein neues Wort.', 'Lässt das Licht an. Für die Motten.', 'Hat für jede Laune einen Hut.', 'Strickt im Lift.',
    'Bringt den eigenen Teppich mit.', 'Hört Hörbücher über Hörbücher.', 'Hat noch nie einen Schlüssel verloren. Fast nie.',
    'Übt heimlich Jodeln im Treppenhaus.', 'Benennt jede Stubenfliege.', 'Reist mit Gartenzwerg. Der Zwerg reist mit ihm.',
    'Trinkt Kaffee nur lauwarm. Aus Prinzip.', 'Bewertet Hotels nach dem Geruch der Lobby.', 'Ist Profi im Warten. Behauptet es zumindest.'];
  D.SAYS = ['Danke!', 'Merci vielmal!', 'Sie sind ein Schatz!', 'Endlich!', 'Wunderbar!', 'Bis später!', 'Tschüssi!', 'Grandios!', 'Na also!', 'Sehr freundlich!'];

  // ---------- Schlüssel: Anhänger-Formen, Metall und Glücksbringer ----------
  D.FOBS = ['pear', 'disc', 'diamond', 'tag', 'shield', 'hex', 'block'];
  D.CHARMS = ['🦆', '🎲', '⭐', '🐟', '🍒', '🌙', '🔔', '🎈', '🍀', '🐸', '🍄', '🎀', '🦄', '🐌', '🥨', '🧀', '🍕', '🐙', '🦔', '🌵', '🎩', '👑', '⚓', '🎸', '🔮', '🐝', '🍋', '🐞', '🥕', '🧦'];

  // ---------- Zeugnis ----------
  D.zeugnis = function (st, run) {
    const lines = [];
    const avg = st.served ? st.totalX / st.served : 99;
    if (st.served === 0) lines.push('Sie haben während Ihrer gesamten Anstellung keinen einzigen Gast bedient. Das ist auf seine Art beeindruckend.');
    else if (avg <= 3 && st.errors <= 1) lines.push('Sie waren schnell, präzise und beinahe unheimlich freundlich.');
    else if (avg <= 4 && st.errors >= 3) lines.push('Sie waren schnell, aber nicht immer richtig.');
    else if (avg > 8) lines.push('Sie waren freundlich, aber langsam.');
    else if (st.errors >= 4) lines.push('Sie haben Schlüssel mit grosser Leidenschaft verwechselt.');
    else lines.push('Sie haben sich stets bemüht.');

    if (st.bestChain >= 15) lines.push(`Ihre Kette von ${st.bestChain} Bedienungen wird im Personalraum noch lange besungen.`);
    else if (st.bestChain >= 8) lines.push(`Eine Kette von ${st.bestChain} – die Lobby hat kurz geschwiegen.`);
    if (st.eruptions >= 3) lines.push(`Sie haben ${st.eruptions} Eruptionen überlebt. Die Lobby nicht.`);
    else if (st.eruptions === 0 && st.served > 10) lines.push('Kein einziger Gast ist explodiert. Das Reinigungsteam dankt.');
    if (st.angriestRoom) lines.push(`Der Gast aus Zimmer ${st.angriestRoom} lässt ausrichten, er sei immer noch wütend.`);
    if (st.bookOpens >= 8) lines.push('Ihr Verhältnis zum Gästebuch war innig.');
    if (st.saves >= 2) lines.push(`${st.saves}× haben Sie Gäste in letzter Sekunde gerettet. Gerade noch!`);
    if (st.blitz >= 10) lines.push(`${st.blitz}× BLITZ. Man munkelt, Sie hätten keine Hände, sondern Haken.`);
    if (st.phone >= 3) lines.push('Am Telefon waren Sie stets geduldig mit Zimmern, die singen.');
    lines.push('Wir wünschen Ihnen für Ihre Zukunft alles Gute, idealerweise woanders.');

    // Schweizer Schulnote 1–6
    let g = 3 + Math.min(1.5, (run.shift - 1) * 0.25) + (avg < 4 ? 0.5 : avg < 7 ? 0.25 : 0) - Math.min(1.5, st.errors * 0.15) + Math.min(0.5, st.bestChain * 0.03);
    g = Math.round(Math.max(1, Math.min(6, g)) * 4) / 4;
    return { lines, grade: g };
  };

  K.data = D;
})(window.K);
