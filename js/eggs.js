/* Keyle – Easter Eggs: über 130 Geheimnisse, Fundmeldungen und Sammlung.
   Jedes gefundene Ei bringt einen Stern für den Hotel-Ausbau. */
(function (K) {
  'use strict';
  const U = K.util, D = K.data, A = K.audio, FX = K.fx;

  const CATS = [
    { id: 'code', name: 'Geheimcodes', icon: '⌨️', hint: 'Tippe Wörter auf dem Titel- oder Pausenbildschirm.' },
    { id: 'click', name: 'Fingerspitzengefühl', icon: '👆', hint: 'Manches im Hotel reagiert, wenn man es oft genug antippt.' },
    { id: 'play', name: 'Nachtschicht-Momente', icon: '🌙', hint: 'Besondere Momente beim Spielen.' },
    { id: 'sketch', name: 'Atelier', icon: '✏️', hint: 'Rund ums Zeichnen.' },
    { id: 'date', name: 'Kalender', icon: '📅', hint: 'Spiel zur richtigen Zeit.' },
    { id: 'rare', name: 'Seltene Gäste', icon: '👻', hint: 'Manche Gäste checken nur selten ein.' },
    { id: 'meta', name: 'Hotelgeschichte', icon: '🏨', hint: 'Treue und Neugier werden belohnt.' },
  ];

  const E = [];
  const BY = {};
  const CODES = {};
  function def(cat, id, icon, name, desc, hint) { const e = { cat, id, icon, name, desc, hint }; E.push(e); BY[id] = e; return e; }
  function code(words, id, icon, name, desc, hint, run) { def('code', id, icon, name, desc, hint); [].concat(words).forEach((w) => { CODES[w] = { id, run }; }); }

  const Eg = { E, CATS, BY, modes: {}, theme: {}, buf: '', konami: [], taps: {}, queue: [], showing: false, romanUntil: 0 };
  const sv = () => K.save.data;
  const W = () => FX.w, H = () => FX.h;

  // ---------------------------------------------------------------- Hilfen für Effekte
  function toast(title, text, ms) {
    const v = K.app && K.app.view;
    if (v) v.toast(title, text, ms || 2400);
  }
  function flashColor(col) {
    const f = document.getElementById('flash');
    if (!f || !K.save.data.options.flashes) return;
    f.className = 'flash';
    f.style.background = col || '#fff';
    void f.offsetWidth;
    f.classList.add('go');
    setTimeout(() => { f.style.background = ''; }, 500);
  }
  function stageAnim(cls, ms) {
    const s = document.getElementById('shake');
    s.classList.remove(cls); void s.offsetWidth; s.classList.add(cls);
    setTimeout(() => s.classList.remove(cls), ms || 2600);
  }
  function toggleMode(m, on) {
    Eg.modes[m] = on != null ? on : !Eg.modes[m];
    document.body.classList.toggle('m-' + m, !!Eg.modes[m]);
    if (K.app && K.app.view && K.app.view.game && K.app.view.game.s) K.app.view.refreshFaces();
    toast('Modus', `${m.toUpperCase()} ${Eg.modes[m] ? 'an' : 'aus'}`, 1300);
    return Eg.modes[m];
  }
  function spinDoor(ms) {
    const d = document.getElementById('doorpanels');
    if (!d) return;
    d.classList.add('wild');
    setTimeout(() => d.classList.remove('wild'), ms || 2400);
  }

  // ---------------------------------------------------------------- Geheimcodes (Titel- und Pausenbildschirm)
  code('KEYLE', 'c_keyle', '🔑', 'Selbstverliebt', 'Das Logo tanzt. Wer den Namen des Spiels tippt, verdient Applaus.', 'Der Name des Spiels.', () => {
    const h = document.querySelector('.logo h1'); if (h) { h.classList.remove('rainbow'); void h.offsetWidth; h.classList.add('rainbow'); }
    FX.emojiRain(['🔑', '🗝️'], 30);
  });
  code('DISCO', 'c_disco', '🕺', 'Saturday Night Lobby', 'Discolicht im ganzen Hotel. Nochmal tippen schaltet es aus.', 'Tanzen unter der Kugel.', () => { toggleMode('disco'); FX.emojiRain(['🕺', '💃', '✨'], 26); });
  code('FONDUE', 'c_fondue', '🧀', 'Caquelon-Alarm', 'Es regnet Käse. Die Brezel-Fraktion ist empört.', 'Geschmolzener Käse im Topf.', () => FX.emojiRain(['🧀', '🥖'], 42));
  code('KAFFEE', 'c_kaffee', '☕', 'Koffeinspiegel', 'Kaffee für alle! Die Nerven danken es nicht.', 'Wovon deine Nerven leben.', () => { FX.emojiRain('☕', 32); A.sigh(); });
  code('777', 'c_777', '🎰', 'Glücksspirale', 'Die Walzen drehen durch. Leider ohne Auszahlung.', 'Die Jackpot-Nummer.', () => { FX.glyphRain(['7'], '#ffd700', 90); A.jackpot(); });
  code('KOPFSTAND', 'c_flip', '🙃', 'Kopfstand', 'Das ganze Hotel steht kurz kopf.', 'Eine Turnübung, Hotelversion.', () => stageAnim('flipit', 2600));
  code('SPIEGEL', 'c_mirror', '↔️', 'Spiegelkabinett', 'Alles kurz seitenverkehrt. Gut, dass die Schlüssel Nummern haben.', 'Hängt im Badezimmer.', () => stageAnim('mirrorit', 2600));
  code('SCHNEE', 'c_snow', '❄️', 'Winterzauber', 'Es schneit in der Lobby. Nochmal tippen: aus.', 'Weiss, kalt, fällt vom Himmel.', () => toggleMode('snow'));
  code('GEWITTER', 'c_storm', '⛈️', 'Unwetter', 'Donner über dem Grand Hotel. Der Strom hält. Diesmal.', 'Blitz und Donner.', () => { A.thunder(); flashColor('#ffffff'); FX.emojiRain(['💧'], 60, { g: 300 }); });
  code('HALLO', 'c_hallo', '👋', 'Höflichkeit', 'Das Hotel grüsst zurück: Grüezi!', 'Was ungeduldige Gäste rufen.', () => { FX.emojiRain('👋', 24); toast('Grüezi!', 'Das Hotel grüsst zurück.'); });
  code(['BUENZLI', 'BÜNZLI'], 'c_buenzli', '🎩', 'Der Direktor', 'H. Bünzli lässt ausrichten: «Weiterarbeiten.»', 'Wer unterschreibt die Kündigungen?', () => { toast('Direktion', '«Weiterarbeiten.» – H. Bünzli', 2600); A.slam(); });
  code('GEIST', 'c_ghost', '👻', 'Spukschloss', 'Ein Geist schwebt durchs Hotel. Buuuh.', 'Was in Zimmer 237 wohnt.', () => { FX.emojiFly('👻', H() * 0.3, 50, 150); A.boo(); });
  code('MIAU', 'c_cat', '🐈', 'Hotelkatze', 'Die Hotelkatze macht ihre Runde.', 'Was eine Katze sagt.', () => { FX.emojiFly('🐈', H() * 0.42, 42, 120, -1); A.meow(); });
  code('QUAK', 'c_duck', '🦆', 'Entenalarm', 'Gummienten von oben!', 'Was eine Ente sagt.', () => { FX.emojiRain('🦆', 36); A.quack(); });
  code('GOLD', 'c_gold', '🥇', 'Goldene Schlüssel', 'Alle Schlüssel glänzen golden. Nochmal tippen: aus.', 'Das edelste Metall.', () => toggleMode('gold'));
  code('BIGHEAD', 'c_bighead', '🎈', 'Grosskopf', 'Alle Gäste haben riesige Köpfe. Ein Klassiker. Nochmal: aus.', 'Ein Cheat aus alten Videospielen.', () => toggleMode('bighead'));
  code('MINI', 'c_mini', '🐜', 'Liliput', 'Winzige Gäste. Nochmal tippen: aus.', 'Das Gegenteil von gross.', () => toggleMode('mini'));
  code('MATRIX', 'c_matrix', '💊', 'Es gibt keinen Schlüssel', 'Grüner Zeichenregen. Rot oder blau?', 'Ein Film über Code und Löffel.', () => FX.glyphRain('ｱｲｳｴｵｶｷｸｹｺ0123456789'.split(''), '#39ff88', 130));
  code('LIEBE', 'c_love', '💘', 'Romantik', 'Herzen überall. Die Lobby errötet.', 'Was alle suchen.', () => FX.emojiRain(['❤️', '💖', '💘'], 40));
  code('ARRR', 'c_pirate', '☠️', 'Piratenhotel', 'Alle Gäste tragen Augenklappe. Nochmal: aus.', 'Was Piraten sagen.', () => toggleMode('pirate'));
  code('PARTY', 'c_party', '🎉', 'Partyzeit', 'Partyhüte für alle! Nochmal: aus.', 'Feiern auf Englisch.', () => { toggleMode('party'); FX.confetti(W() / 2, H() / 2, 100); });
  code('SCHWEIZ', 'c_swiss', '⛰️', 'Hopp Schwiiz', 'Fahnen und Alphorn. Das Hotel ist patriotisch.', 'Das Land der Schlüsselbretter.', () => { FX.swissRain(34); A.alphorn(); });
  code('JODEL', 'c_yodel', '🏔️', 'Holdrio', 'Ein Jodel hallt durchs Treppenhaus.', 'Alpiner Gesang.', () => { A.yodel(); toast('Treppenhaus', 'Holdrio-di-ri-di!', 2000); });
  code('IDDQD', 'c_iddqd', '😇', 'Gottmodus', 'Gottmodus? Nicht in diesem Hotel.', 'Ein uralter Code für Unverwundbarkeit.', () => toast('Rezeption', 'Gottmodus? Nicht in diesem Hotel.', 2400));
  code('XYZZY', 'c_xyzzy', '🕳️', 'Zauberwort', 'Nichts passiert. Oder doch?', 'Ein Zauberwort aus einer Höhle.', () => toast('…', 'Nichts passiert.', 1800));
  code('42', 'c_42', '🌌', 'Die Antwort', 'Die Antwort auf alles. Die Frage war: Welches Zimmer?', 'Die Antwort auf das Leben, das Universum …', () => toast('Deep Thought', 'Die Antwort ist 42. Die Frage war: Welches Zimmer?', 2600));
  code('SESAM', 'c_sesam', '🚪', 'Sesam, öffne dich', 'Die Drehtür dreht sich von selbst.', 'Was Ali Baba sagt.', () => { spinDoor(2400); FX.sparkle(W() / 2, H() * 0.18, 30); A.door(); });
  code('MOND', 'c_moon', '🌕', 'Mondsüchtig', 'Der Mond grüsst zurück.', 'Er scheint durchs Fenster.', () => FX.emojiRain(['🌙', '🌕', '⭐'], 30));
  code('HILFE', 'c_help', '🆘', 'Notruf', 'Ruhig atmen. Schlüssel an den Haken. Weitermachen.', 'Was man in Not ruft.', () => toast('Notruf', 'Ruhig atmen. Schlüssel an den Haken. Weitermachen.', 2600));
  code('PIZZA', 'c_pizza', '🍕', 'Zimmerservice', 'Pizza für die ganze Lobby.', 'Bestellt nachts jeder.', () => FX.emojiRain('🍕', 32));
  code('SCHLAF', 'c_sleep', '💤', 'Nachtruhe', 'Zzz … alle gähnen. Auch du.', 'Was Gäste nachts eigentlich tun sollten.', () => { FX.emojiRain('💤', 30); A.sigh(); });
  def('code', 'konami', '🎮', 'Hoch, hoch, runter, runter …', 'Retro-Modus! Nochmal eingeben: aus.', '↑ ↑ ↓ ↓ ← → ← → …');

  // ---------------------------------------------------------------- Klick-Geheimnisse
  def('click', 'k_moon', '🧀', 'Der Mond ist aus Käse', 'Siebenmal auf den Mond getippt. Er war tatsächlich aus Käse.', 'Am Nachthimmel im Fenster …');
  def('click', 'k_clock', '🐦', 'Kuckuck!', 'Die Lobby-Uhr ist eine Kuckucksuhr.', 'Die Uhr an der Wand.');
  def('click', 'k_plant_l', '🌵', 'Rüdiger', 'Die linke Pflanze ist ein Kaktus namens Rüdiger. Autsch.', 'Eine Topfpflanze, links.');
  def('click', 'k_plant_r', '🐈', 'Versteckspiel', 'In der rechten Pflanze wohnt eine Katze.', 'Eine Topfpflanze, rechts.');
  def('click', 'k_chandelier', '💎', 'Kristallregen', 'Der Kronleuchter klirrt und funkelt.', 'Hängt ganz oben.');
  def('click', 'k_sign', '🔤', 'Grand Hotel Kelye', 'Das Schild über der Tür hat einen Tippfehler bekommen.', 'Das Schild über der Tür.');
  def('click', 'k_window', '🌩️', 'Wetterfrosch', 'Ans Fenster geklopft: Es blitzt.', 'Die Fenster der Lobby.');
  def('click', 'k_door', '🌀', 'Drehwurm', 'Die Drehtür dreht durch.', 'Die Drehtür.');
  def('click', 'k_counter', '✋', 'Bitte nicht klopfen', 'Wer auf den Tresen klopft, wird zurechtgewiesen.', 'Der Tresen.');
  def('click', 'k_cups', '😋', 'Schlürf', 'Aus den Nerven-Tassen getrunken.', 'Die Kaffeetassen oben rechts.');
  def('click', 'k_score', '🏛️', 'Römische Zahlen', 'Der Punktestand spricht kurz Latein.', 'Der Punktestand.');
  def('click', 'k_coins', '🪙', 'Kopf oder Zahl', 'Eine Münze geworfen.', 'Deine Münzen.');
  def('click', 'k_logo_key', '🗝️', 'Schwerkraft', 'Der Titelschlüssel ist vom Haken gefallen.', 'Der Schlüssel im Titel.');
  def('click', 'k_neon', '💡', 'Wackelkontakt', 'Das Neon-«le» ist kaputt. Jetzt heisst das Spiel «Key».', 'Die pinke Leuchtschrift.');
  def('click', 'k_star', '🌠', 'Wunsch frei', 'Eine Sternschnuppe gefangen.', 'Am Himmel über dem Titel huscht manchmal etwas.');
  def('click', 'k_win_all', '🏙️', 'Alle Lichter an', 'Jedes Fenster der Stadt leuchtet.', 'Die Fenster der Stadt im Titel.');
  def('click', 'k_win_none', '🌑', 'Stromsparmodus', 'Die ganze Stadt schläft.', 'Die Fenster der Stadt im Titel – andersrum.');
  def('click', 'k_signature', '✍️', 'Autogramm', 'Die Unterschrift des Direktors. Wertlos, aber schön.', 'Im Arbeitszeugnis unten rechts.');
  def('click', 'k_grade', '⚖️', 'Einsprache', 'Einsprache gegen die Note. Abgelehnt.', 'Die Note im Arbeitszeugnis.');
  def('click', 'k_book', '📜', 'Geheime Seite', 'Im Gästebuch steht etwas über seltene Gäste.', 'Der Titel des Gästebuchs.');
  def('click', 'k_relic', '🗣️', 'Sprechendes Relikt', 'Relikte reden, wenn man sie oft genug antippt.', 'Deine Relikte in der Leiste.');
  def('click', 'k_pause', '⏸️', 'Pause von der Pause', 'Fünfmal hintereinander pausiert. Erholung pur.', 'Der Pausenknopf.');
  def('click', 'k_hand', '🎸', 'Luftgitarre', 'Die leere Hand spielt Luftgitarre.', 'Deine leere Hand.');
  def('click', 'k_inspector', '💼', 'Bestechung', 'Bestechung zwecklos. Der Inspektor notiert auch das.', 'Der Herr mit dem Notizbuch.');
  def('click', 'k_phone', '📞', 'Telefonstreich', 'Selbst angerufen. Der Zimmerservice ist beschäftigt.', 'Das Telefon, wenn es nicht klingelt.');
  def('click', 'k_board', '🔧', 'Schlüsseldienst', 'Auf das Brett geklopft. Der Schlüsseldienst kommt in 24 Stunden.', 'Das Holz des Schlüsselbretts.');
  def('click', 'k_ring', '😤', 'Nicht anfassen', 'Den Wut-Ring eines Gastes angestupst. Schlechte Idee.', 'Der kleine Ring neben einem Gast.');

  // ---------------------------------------------------------------- Spielmomente
  def('play', 'g_777', '🎰', 'Jackpot', 'Zimmer 777 bedient.', 'Eine besondere Zimmernummer.');
  def('play', 'g_chain42', '🔗', 'Kettenreaktion', 'Eine Kette von 42 Bedienungen.', 'Eine sehr lange Kette.');
  def('play', 'g_blitz7', '⚡', 'Blitzgewitter', 'Siebenmal BLITZ hintereinander.', 'Schnell, schneller, …');
  def('play', 'g_1000', '💯', 'Tausender', '1’000 Punkte mit einer einzigen Bedienung.', 'Viele Punkte auf einmal.');
  def('play', 'g_relief', '🎊', 'Erlösung', 'Einen tobenden Gast doch noch glücklich gemacht.', 'Wut auf Stufe 5 – und dann?');
  def('play', 'g_survive3', '🌋', 'Vulkanologe', 'Drei Eruptionen in einer Schicht überlebt.', 'Mehrere Ausbrüche überstehen.');
  def('play', 'g_perfect', '🏆', 'Perfekte Schicht', 'Mindestens 10 Gäste, kein Fehler, keine Eruption.', 'Eine fehlerlose Schicht.');
  def('play', 'g_flash', '🏎️', 'Lichtgeschwindigkeit', 'Einen Gast in unter einer Sekunde bedient.', 'Schneller als der Gast laufen kann.');
  def('play', 'g_patience', '🐢', 'Engelsgeduld', 'Ein Gast hat über eine Minute gewartet – und ist trotzdem noch da.', 'Sehr lange warten lassen.');
  def('play', 'g_parrot_duck', '🦜', 'Papagei trifft Ente', 'Kapitän Brunzli und Frau Ententeich gleichzeitig in der Lobby.', 'Zwei Haustiere, eine Lobby.');
  def('play', 'g_vampire', '🧛', 'Nachtaktiv', 'Gräfin Draculina zwischen Mitternacht und 4 Uhr bedient (echte Uhrzeit).', 'Eine Gräfin, die nur nachts …');
  def('play', 'g_twins', '👯', 'Doppelt hält besser', 'Beide Zwillinge einer Schicht richtig bedient.', 'Zwei fast gleiche Gesichter.');
  def('play', 'g_elvis', '🎙️', 'Elvis has left the building', 'Elvis Brätzel hat seinen Schlüssel abgegeben.', 'Ein Sänger mit Tolle.');
  def('play', 'g_mime', '🤐', 'Stumme Reklamation', 'Monsieur Pantomime hat reklamiert. Wortlos.', 'Ein Gast, der nie spricht – und sich beschwert.');
  def('play', 'g_celeb', '🕶️', 'Paparazzo', 'Einen Promi auf Anhieb erkannt.', 'Sonnenbrille, Pelz, Allüren.');
  def('play', 'g_phone10', '☎️', 'Telefonistin', 'Zehnmal in einem Run das Telefon abgenommen.', 'Ring ring.');
  def('play', 'g_kidfix', '🧸', 'Kindersicherung', 'Von Kindern vertauschte Schlüssel wieder richtig gehängt.', 'Kinder machen Unordnung am Brett.');
  def('play', 'g_golden3', '🌅', 'Goldrausch', 'Dreimal Goldene Stunde in einer Schicht.', 'Goldene Stunden sammeln.');
  def('play', 'g_shift10', '🔟', 'Zweistellig', 'Schicht 10 erreicht.', 'Lange durchhalten.');
  def('play', 'g_shift20', '🏅', 'Nachtwächter-Legende', 'Schicht 20 erreicht.', 'Sehr, sehr lange durchhalten.');
  def('play', 'g_norelic', '🧘', 'Asket', 'Schicht 5 ohne ein einziges Relikt geschafft.', 'Verzicht als Stärke.');
  def('play', 'g_fired1', '🚀', 'Rekordkündigung', 'In Schicht 1 gekündigt worden.', 'Sehr schnell scheitern.');
  def('play', 'g_quit', '🚪', 'Ich kündige!', 'Selbst gekündigt. Mit Würde.', 'Im Pausenmenü gibt es eine Tür.');
  def('play', 'g_grade6', '🎓', 'Bestnote', 'Eine 6 im Arbeitszeugnis.', 'Die beste Schweizer Note.');
  def('play', 'g_grade1', '📉', 'Tiefpunkt', 'Eine 1 im Arbeitszeugnis.', 'Die schlechteste Schweizer Note.');
  def('play', 'g_rich', '💰', 'Trinkgeldkönig', '100 Münzen auf einmal besessen.', 'Viel Trinkgeld sparen.');
  def('play', 'g_bell', '🛎️', 'Ruhe bitte!', 'Mit der Dienstklingel vier wütende Gäste auf einmal beruhigt.', 'Ein Relikt, das klingelt.');
  def('play', 'g_latin', '🏛️', 'Latinum', 'Einen Touristen mit römischer Zimmernummer bedient.', 'CCIV ist auch eine Zahl.');
  def('play', 'g_spare', '🔑', 'Zweitschlüssel', 'Einem Schlüsselverlierer den richtigen Zweitschlüssel gegeben.', 'Jemand hat seinen Schlüssel verloren …');
  def('play', 'g_wrongtwin', '🔀', 'Falscher Zwilling', 'Den Schlüssel des falschen Zwillings herausgegeben.', 'Zwillinge verwechseln.');
  def('play', 'g_saves5', '😅', 'Gerade noch!', 'Fünfmal einen Gast in letzter Sekunde gerettet.', 'Knapp vor der Eruption …');
  def('play', 'g_magic', '🔮', 'Magie trifft Wissenschaft', 'Merlin Mürggli und Professor Zahnrad gleichzeitig in der Lobby.', 'Ein Zauberer und ein Erfinder.');
  def('play', 'g_sig10', '📒', 'Stammgast-Sammler', '10 verschiedene Stammgäste in einem Run getroffen.', 'Viele bekannte Gesichter.');
  def('play', 'g_allsig', '👑', 'Gästebuch-Legende', 'Alle Stammgäste mindestens einmal getroffen.', 'Jeden Stammgast einmal sehen.');
  def('play', 'g_chatter', '🧹', 'Plauderbremse', '10 Plauderer weggewischt.', 'Lange Monologe wegwischen.');
  def('play', 'g_bookworm', '📚', 'Bücherwurm', 'Das Gästebuch 10-mal in einer Schicht geöffnet.', 'Viel nachschlagen.');

  // ---------------------------------------------------------------- Skizzen
  def('sketch', 's_first', '🖍️', 'Erste Skizze', 'Die erste Skizze angeheftet.', 'Zeichne einen Gast.');
  def('sketch', 's_rainbow', '🌈', 'Regenbogen', 'Eine Skizze mit allen sieben Farben.', 'Alle Farben benutzen.');
  def('sketch', 's_dot', '⏺️', 'Minimalismus', 'Eine Skizze aus genau einem Punkt.', 'Weniger ist mehr.');
  def('sketch', 's_master', '🖼️', 'Meisterwerk', 'Eine Skizze mit sehr vielen Strichen.', 'Sich richtig Mühe geben.');
  def('sketch', 's_helped', '🧠', 'Fotografisches Gedächtnis', 'Einen Gast am Gesicht erkannt, für den eine Skizze hing.', 'Skizzen helfen beim Erkennen.');
  def('sketch', 's_ten', '🎨', 'Atelier Keyle', '10 Skizzen in einer Schicht.', 'Fleissig zeichnen.');
  def('sketch', 's_prophet', '🔭', 'Hellseher', 'Eine Skizze an einem Haken, bevor der Gast überhaupt da war.', 'Zeichnen, bevor jemand kommt.');
  def('sketch', 's_erase', '🧽', 'Selbstkritik', 'Fünfmal eine Skizze komplett gelöscht.', 'Der Papierkorb im Skizzenblock.');

  // ---------------------------------------------------------------- Kalender
  def('date', 'd_midnight', '🕛', 'Geisterstunde', 'Zwischen Mitternacht und 1 Uhr gespielt.', 'Um Mitternacht spielen.');
  def('date', 'd_f13', '🐈', 'Freitag, der 13.', 'An einem Freitag, dem 13., gespielt.', 'Ein Unglückstag.');
  def('date', 'd_xmas', '🎄', 'Weihnachtsschicht', 'An Weihnachten gespielt. Die Gäste tragen Mützen.', 'Ende Dezember.');
  def('date', 'd_newyear', '🎆', 'Prosit Neujahr', 'An Silvester oder Neujahr gespielt.', 'Der Jahreswechsel.');
  def('date', 'd_april', '🐟', 'April, April!', 'Am 1. April gespielt.', 'Ein Tag für Scherze.');
  def('date', 'd_halloween', '🎃', 'Halloween', 'Am 31. Oktober gespielt. Kürbisse überall.', 'Ende Oktober.');
  def('date', 'd_swiss', '🇨🇭', 'Nationalfeiertag', 'Am 1. August gespielt. Hopp Schwiiz!', 'Der Schweizer Nationalfeiertag.');
  def('date', 'd_valentine', '💌', 'Valentinstag', 'Am 14. Februar gespielt.', 'Der Tag der Verliebten.');
  def('date', 'd_monday', '😩', 'Montag', 'An einem Montag gespielt. Natürlich.', 'Der unbeliebteste Wochentag.');
  def('date', 'd_early', '🌄', 'Frühschicht', 'Zwischen 5 und 7 Uhr morgens gespielt.', 'Sehr früh am Morgen.');

  // ---------------------------------------------------------------- Seltene Gäste
  def('rare', 'r_ghost', '👻', 'Der Geist von Zimmer 237', 'Er checkt seit 1921 aus. Immer wieder.', 'Ein durchsichtiger Gast.');
  def('rare', 'r_director', '🎩', 'Direktor H. Bünzli', 'Der Chef höchstpersönlich, inkognito.', 'Wer unterschreibt eigentlich die Zeugnisse?');
  def('rare', 'r_clown', '🤡', 'Clown Coco', 'Tröööt!', 'Rote Nase, bunte Haare.');
  def('rare', 'r_traveler', '⏳', 'Zora aus 2099', 'Eine Zeitreisende. Weiss mehr, als sie sagt.', 'Ein Gast aus der Zukunft.');
  def('rare', 'r_yeti', '🦍', 'Der Yeti vom Gotthard', 'Sehr behaart. Sehr höflich.', 'Gross, weiss, haarig.');
  def('rare', 'r_santa', '🎅', 'Herr Klaus', 'Ho ho ho! Das Rentier steht im Parkhaus.', 'Ein bärtiger Herr in Rot.');
  def('rare', 'r_alien', '👽', 'Herr Grün', 'Von weit her. Findet Fondue faszinierend.', 'Ein Gast mit Antennen.');
  def('rare', 'r_doppel', '🪞', 'Doppelgänger', 'Moment … der Gast sieht aus wie du!', 'Ein sehr vertrautes Gesicht.');

  // ---------------------------------------------------------------- Hotelgeschichte
  def('meta', 'm_runs10', '🔁', 'Stammpersonal', '10 Runs gespielt.', 'Oft spielen.');
  def('meta', 'm_runs50', '🏨', 'Inventar', '50 Runs gespielt.', 'Sehr oft spielen.');
  def('meta', 'm_chars', '👥', 'Ganzes Team', 'Mit allen Rezeptionist:innen gespielt.', 'Alle Charaktere ausprobieren.');
  def('meta', 'm_hotels', '🗺️', 'Hotelkette', 'In allen Hotels gespielt.', 'Alle Hotels ausprobieren.');
  def('meta', 'm_class5', '⭐', 'Fünf Sterne', 'Mit Hotelklasse 5 Schicht 5 erreicht.', 'Die höchste Klasse wählen und durchhalten.');
  def('meta', 'm_daily', '📆', 'Tagesgast', 'Einen Tages-Seed gespielt.', 'Ein Schalter auf dem Titel.');
  def('meta', 'm_silence', '🤫', 'Stille Nacht', 'Die Musik ganz ausgeschaltet.', 'In den Optionen.');
  def('meta', 'm_wipe', '😮‍💨', 'Puh.', 'Den Spielstand fast gelöscht – und es dir anders überlegt.', 'Ein gefährlicher Knopf in den Optionen.');
  def('meta', 'm_howto', '📖', 'Leseratte', 'Die Anleitung bis ganz unten gelesen.', 'So geht’s …');
  def('meta', 'm_all', '🥚', 'Das goldene Ei', 'Alle Easter Eggs gefunden. Das Grand Hotel Keyle gehört jetzt dir.', 'Finde alle anderen.');

  // ---------------------------------------------------------------- Fund
  Eg.isFound = (id) => !!(sv().eggs && sv().eggs[id]);
  Eg.count = () => E.filter((e) => Eg.isFound(e.id)).length;

  Eg.found = function (id) {
    const e = BY[id];
    if (!e) return false;
    const d = sv();
    d.eggs = d.eggs || {};
    if (d.eggs[id]) return false;
    d.eggs[id] = Date.now();
    d.stars += 1;
    d.starsTotal = (d.starsTotal || 0) + 1;
    K.save.save();
    Eg.queue.push(e);
    if (!Eg.showing) Eg.showNext();
    if (id !== 'm_all' && Eg.count() >= E.length - 1) setTimeout(() => Eg.found('m_all'), 3600);
    if (id === 'm_all') document.body.classList.add('m-golden');
    return true;
  };

  Eg.showNext = function () {
    const e = Eg.queue.shift();
    if (!e) { Eg.showing = false; return; }
    Eg.showing = true;
    let el = document.getElementById('eggtoast');
    if (!el) { el = U.el('div', 'eggtoast'); el.id = 'eggtoast'; document.getElementById('shake').appendChild(el); }
    const cat = CATS.find((c) => c.id === e.cat);
    el.innerHTML = `<div class="egg-ic"><svg viewBox="0 0 40 50"><defs><linearGradient id="eggG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#f4c430"/><stop offset="1" stop-color="#a8740f"/></linearGradient></defs><path d="M20 2 C9 2 2 20 2 31 C2 42 10 48 20 48 C30 48 38 42 38 31 C38 20 31 2 20 2Z" fill="url(#eggG)"/><path class="crack" d="M5 26 L11 22 L15 28 L20 21 L25 28 L29 22 L35 26" stroke="#7a5418" stroke-width="1.6" fill="none"/><ellipse cx="13" cy="14" rx="4" ry="7" fill="#fff" opacity=".45" transform="rotate(20 13 14)"/></svg><span class="emo">${e.icon}</span></div>
      <div class="tx"><div class="k">Easter Egg · ${Eg.count()} / ${E.length} · ${cat ? cat.name : ''}</div><div class="n">${U.esc(e.name)}</div><div class="d">${U.esc(e.desc)}</div></div><div class="st">+1 ★</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    A.egg();
    const r = el.getBoundingClientRect();
    if (K.app && K.app.view && K.app.view.rect) {
      const [x, y] = K.app.view.toStage(r.left + 34, r.top + 34);
      FX.sparkle(x, y, 30, '#ffe08a', 1.4);
      FX.emojiBurst(['✨', '🥚', '⭐'], x, y, 10, 16);
    }
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => Eg.showNext(), 380); }, 3400);
  };

  // ---------------------------------------------------------------- Tastatur: Codes
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  Eg.key = function (e) {
    Eg.konami.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (Eg.konami.length > KONAMI.length) Eg.konami.shift();
    if (Eg.konami.join(',') === KONAMI.join(',')) {
      Eg.konami = [];
      toggleMode('retro');
      A.coin(6);
      Eg.found('konami');
      return true;
    }
    if (e.key.length !== 1) return false;
    const ch = e.key.toUpperCase();
    if (!/[A-ZÄÖÜ0-9]/.test(ch)) { Eg.buf = ''; return false; }
    Eg.buf = (Eg.buf + ch).slice(-12);
    for (const w in CODES) {
      if (Eg.buf.endsWith(w)) {
        Eg.buf = '';
        const c = CODES[w];
        try { c.run(); } catch (err) { /* Effekt darf nie das Spiel stoppen */ }
        Eg.found(c.id);
        return true;
      }
    }
    return false;
  };

  // ---------------------------------------------------------------- Klicks
  function taps(key, need, ms) {
    const now = performance.now();
    const t = (Eg.taps[key] || []).filter((x) => now - x < (ms || 4000));
    t.push(now);
    Eg.taps[key] = t;
    if (t.length >= need) { Eg.taps[key] = []; return true; }
    return false;
  }
  const RELIC_QUOTES = {
    glocke: 'Bimm. Bimm. Ich bin klein, aber pünktlich.', haende: 'Zwei Hände, null Pausen.', kaffeemaschine: 'Brrrzzzz … Gern geschehen.',
    notizblock: 'Ich habe alles aufgeschrieben. Alles.', stammgast: 'Ich kenne jeden hier. Jeden.', klingel: 'DING! Ruhe im Saal!',
    trinkgeldglas: 'Klimper klimper.', rotekarte: 'Ich bin nicht wütend. Nur rot.', blitzableiter: 'Wut ist auch nur Energie.',
    stoppuhr: 'Tick. Tack. Tick.', fahrstuhlmusik: 'Dü-dü-düdü …', nachtzuschlag: 'Nachts zählt doppelt.', visitenkarten: 'Darf ich mich vorstellen?',
    polaroid: 'Bitte lächeln!', messingschild: 'Ich verblasse nie.', charme: 'Rosen wirken immer.', glueckskatze: 'Miau. Glück gehabt.',
    ohrstoepsel: 'Was? Ich höre nichts.', kristall: 'Ich funkle, also bin ich.', espresso: 'ICH BIN WACH!', jackpot: '7 … 7 … 7!', goldschluessel: 'Ich öffne alles. Fast.',
  };

  function onClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const app = K.app;
    const inGame = app && app.game && app.game.s && app.state === 'play';
    let m;
    if ((m = t.closest('.lobby-bg .moon'))) { if (taps('moon', 7)) { m.classList.toggle('cheese'); Eg.found('k_moon'); } return; }
    if ((m = t.closest('.lobby-bg .clock'))) { if (taps('clock', 2)) { A.cuckoo(); const r = app.view.srect(m); FX.emojiBurst('🐦', r.cx, r.cy, 3, 22); Eg.found('k_clock'); } return; }
    if ((m = t.closest('.pl-left'))) { if (taps('pl', 5)) { m.classList.add('wiggle'); setTimeout(() => m.classList.remove('wiggle'), 700); toast('Rüdiger', 'Autsch! Ich bin ein Kaktus.', 1800); Eg.found('k_plant_l'); } return; }
    if ((m = t.closest('.pl-right'))) { if (taps('pr', 3)) { const r = app.view.srect(m); FX.emojiBurst('🐈', r.cx, r.y, 1, 34); A.meow(); Eg.found('k_plant_r'); } return; }
    if ((m = t.closest('.chandelier'))) { if (taps('ch', 5)) { const r = app.view.srect(m); FX.sparkle(r.cx, r.cy + 10, 50, '#e0f7ff', 1.6); FX.emojiRain('💎', 14, { size: 14 }); A.golden(); Eg.found('k_chandelier'); } return; }
    if ((m = t.closest('.door-sign'))) { if (taps('sign', 3)) { const old = m.textContent; m.textContent = 'Grand Hotel Kelye'; setTimeout(() => { m.textContent = old; }, 3000); Eg.found('k_sign'); } return; }
    if ((m = t.closest('.lobby-bg .window'))) { if (taps('win', 3)) { A.thunder(); flashColor('#dfe9ff'); Eg.found('k_window'); } return; }
    if ((m = t.closest('.door-glass'))) { if (taps('door', 5)) { spinDoor(2000); Eg.found('k_door'); } return; }
    if ((m = t.closest('.counter-top, .counter-front'))) { if (taps('counter', 5)) { A.clack(); toast('Rezeption', 'Bitte nicht auf den Tresen klopfen.', 1800); Eg.found('k_counter'); } return; }
    if ((m = t.closest('#nerves'))) { if (taps('cups', 3)) { A.sigh(); toast('Schlürf', 'Aaah. Kaffee.', 1400); Eg.found('k_cups'); } return; }
    if ((m = t.closest('#score'))) { if (taps('score', 10, 5000)) { Eg.romanUntil = performance.now() + 5000; Eg.found('k_score'); } return; }
    if ((m = t.closest('.hud-right .coins'))) { if (taps('coins', 3)) { A.coin(2); toast('Münzwurf', Math.random() < 0.5 ? 'Kopf!' : 'Zahl!', 1400); Eg.found('k_coins'); } return; }
    if ((m = t.closest('.logo .bigkey'))) { if (taps('logo', 10, 6000)) { m.classList.add('fall'); A.bounce(); Eg.found('k_logo_key'); } else { m.classList.remove('spin'); void m.offsetWidth; m.classList.add('spin'); A.tick(); } return; }
    if ((m = t.closest('.logo .le'))) { if (taps('neon', 5)) { m.classList.add('broken'); A.buzz(); Eg.found('k_neon'); } return; }
    if ((m = t.closest('.shooting'))) { m.remove(); A.golden(); toast('Sternschnuppe', 'Wunsch frei! (Nicht verraten.)', 1800); Eg.found('k_star'); return; }
    if ((m = t.closest('.facade .win'))) {
      m.classList.toggle('lit'); A.tick();
      const all = U.$$('.facade .win');
      if (all.length && all.every((w) => w.classList.contains('lit'))) Eg.found('k_win_all');
      if (all.length && all.every((w) => !w.classList.contains('lit'))) Eg.found('k_win_none');
      return;
    }
    if ((m = t.closest('.letter .scr'))) { if (taps('sig', 2)) { m.classList.add('autograph'); toast('Autogramm', 'H. Bünzli. Wertlos, aber schön.', 1800); Eg.found('k_signature'); } return; }
    if ((m = t.closest('.letter .grade'))) { if (taps('grade', 2)) { toast('Direktion', 'Einsprache gegen die Note: abgelehnt.', 2000); A.slam(); Eg.found('k_grade'); } return; }
    if ((m = t.closest('.book header h3'))) { if (taps('book', 3)) { toast('Geheime Seite', 'Gesichtet: ein Geist, ein Yeti, ein Herr Grün … und jemand, der aussieht wie du.', 3200); Eg.found('k_book'); } return; }
    if ((m = t.closest('.ric'))) { const id = m.dataset.relic || ''; if (taps('relic' + id, 10, 6000)) { toast('Relikt', RELIC_QUOTES[id] || '…', 2200); Eg.found('k_relic'); } return; }
    if ((m = t.closest('.hand .hslot:not(.full)'))) { if (taps('hand', 5)) { A.guitar(); FX.emojiBurst(['🎸', '🎵'], 150, (app.dims ? app.dims.H : 880) - 50, 6, 18); Eg.found('k_hand'); } return; }
    if ((m = t.closest('#inspector'))) { toast('Hotelinspektor', 'Bestechung zwecklos. Wird notiert.', 1800); Eg.found('k_inspector'); return; }
    if ((m = t.closest('#phone')) && inGame && !app.game.s.phone.ringing) {
      if (taps('phone', 3)) { const calls = ['Sie rufen den Zimmerservice an. Er ist beschäftigt.', 'Sie rufen sich selbst an. Besetzt.', 'Die Zeitansage: Es ist Nachtschicht.']; toast('Telefon', calls[Math.floor(Math.random() * calls.length)], 2400); Eg.found('k_phone'); }
      return;
    }
    if (t.id === 'board' && taps('board', 5)) { A.clack(); toast('Schlüsseldienst', 'Wir kommen in 24 bis 72 Stunden.', 2000); Eg.found('k_board'); return; }
    if ((m = t.closest('.g-ring'))) { if (taps('ring', 2)) { A.buzz(); toast('Gast', 'Bitte nicht anfassen. Ich bin schon wütend genug.', 1800); Eg.found('k_ring'); } }
  }

  Eg.pauseOpened = function () { if (taps('pause', 5, 20000)) Eg.found('k_pause'); };

  // ---------------------------------------------------------------- Spielereignisse
  Eg.attach = function (game) {
    const run = { sig: new Set(), phone: 0, blitz: 0 };
    let sh = {};
    const present = () => new Set(game.s.guests.filter((g) => g.state === 'enter' || g.state === 'wait').map((g) => g.res.last));
    game.on((t, d) => {
      const S = game.s;
      const st = sv();
      st.eggStats = st.eggStats || { saves: 0, chatter: 0, erase: 0, sigMet: [], chars: [], hotels: [] };
      const es = st.eggStats;
      switch (t) {
        case 'shiftstart':
          sh = { erupt: 0, golden: 0, sketches: 0, twins: new Set(), book0: game.run.stats.bookOpens };
          if (d.cfg.s === 10) Eg.found('g_shift10');
          if (d.cfg.s === 20) Eg.found('g_shift20');
          if (d.cfg.s === 5 && game.cls.stars === 5) Eg.found('m_class5');
          Eg.themeShift();
          break;
        case 'enter': {
          const g = d.g, r = g.res;
          if (r.rare) Eg.found('r_' + r.rare);
          if (r.sig) {
            run.sig.add(r.last);
            if (!es.sigMet.includes(r.last)) { es.sigMet.push(r.last); K.save.save(); }
            if (run.sig.size >= 10) Eg.found('g_sig10');
            if (es.sigMet.length >= D.PERSONAS.length) Eg.found('g_allsig');
          }
          const p = present();
          if (p.has('Brunzli') && p.has('Ententeich')) Eg.found('g_parrot_duck');
          if (p.has('Mürggli') && p.has('Zahnrad')) Eg.found('g_magic');
          break;
        }
        case 'return': if (d.g.res.last === 'Pantomime') Eg.found('g_mime'); break;
        case 'serve': {
          const g = d.g;
          if (d.jackpot) Eg.found('g_777');
          if (d.chain >= 42) Eg.found('g_chain42');
          run.blitz = d.stamp === 'blitz' ? run.blitz + 1 : 0;
          if (run.blitz >= 7) Eg.found('g_blitz7');
          if (d.pts >= 1000) Eg.found('g_1000');
          if (d.relief) Eg.found('g_relief');
          if (d.x < 1) Eg.found('g_flash');
          if (d.x >= 60) Eg.found('g_patience');
          if (g.res.last === 'Brätzel' && g.kind === 'drop') Eg.found('g_elvis');
          if (g.res.last === 'Nachtschatten') { const h = new Date().getHours(); if (h < 4) Eg.found('g_vampire'); }
          if (g.type === 'celeb') Eg.found('g_celeb');
          if (g.foreign && g.foreign.lang === 'LAT') Eg.found('g_latin');
          if (g.type === 'loser') Eg.found('g_spare');
          if (d.near) { es.saves++; K.save.save(); if (es.saves >= 5) Eg.found('g_saves5'); }
          if (g.res.twin && g.kind === 'pick') { sh.twins.add(g.room); if (sh.twins.size >= 2) Eg.found('g_twins'); }
          if (g.kind === 'pick' && g.reveal === 'face' && S.sketches && S.sketches[g.room]) Eg.found('s_helped');
          if (game.run.coins >= 100) Eg.found('g_rich');
          if (Eg.theme.valentine) FX.emojiBurst(['❤️', '💖'], W() / 2, H() * 0.3, 6, 18);
          if (Eg.theme.newyear && d.chain > 0 && d.chain % 5 === 0) FX.firework(80 + Math.random() * (W() - 160), H() * 0.2);
          break;
        }
        case 'miss': {
          const other = S.residents[d.key.room];
          if (other && other.twin && d.g.res.twin && other.last === d.g.res.last) Eg.found('g_wrongtwin');
          run.blitz = 0;
          break;
        }
        case 'eruption': sh.erupt++; break;
        case 'golden': sh.golden++; if (sh.golden >= 3) Eg.found('g_golden3'); break;
        case 'phone': if (!d.on && d.quip) { run.phone++; if (run.phone >= 10) Eg.found('g_phone10'); } break;
        case 'swap': if (d.fixed && S.kidSwapped) Eg.found('g_kidfix'); break;
        case 'bell': if (d.calmed >= 4) Eg.found('g_bell'); break;
        case 'chatend': if (d.dismissed) { es.chatter++; K.save.save(); if (es.chatter >= 10) Eg.found('g_chatter'); } break;
        case 'shiftend': {
          const s = d.stats;
          if (s.served >= 10 && s.errors === 0 && s.eruptions === 0) Eg.found('g_perfect');
          if (sh.erupt >= 3) Eg.found('g_survive3');
          if (d.n >= 5 && game.run.relics.length === 0) Eg.found('g_norelic');
          if (game.run.stats.bookOpens - (sh.book0 || 0) >= 10) Eg.found('g_bookworm');
          break;
        }
        case 'gameover': if (game.run.shift === 1) Eg.found('g_fired1'); break;
      }
    });
    Eg.game = game;
    Eg.sh = () => sh;
  };

  // Skizzen
  Eg.sketchSaved = function (room, strokes) {
    if (!strokes || !strokes.length) return;
    const G = Eg.game, S = G && G.s;
    Eg.found('s_first');
    const cols = new Set(strokes.map((s) => s.c));
    if (cols.size >= 7) Eg.found('s_rainbow');
    if (strokes.length === 1 && strokes[0].p.length === 1) Eg.found('s_dot');
    if (strokes.reduce((a, s) => a + s.p.length, 0) >= 300) Eg.found('s_master');
    if (S) {
      const res = S.residents[room], key = res && S.keys[res.keyId];
      if (res && !res.seenDrop && key && key.loc === 'room') Eg.found('s_prophet');
      const sh = Eg.sh ? Eg.sh() : null;
      if (sh) { sh.sketches = (sh.sketches || 0) + 1; if (sh.sketches >= 10) Eg.found('s_ten'); }
    }
  };
  Eg.sketchCleared = function () {
    const es = sv().eggStats || (sv().eggStats = { saves: 0, chatter: 0, erase: 0, sigMet: [], chars: [], hotels: [] });
    es.erase++;
    K.save.save();
    if (es.erase >= 5) Eg.found('s_erase');
  };
  Eg.grade = function (g) { if (g >= 6) Eg.found('g_grade6'); if (g <= 1) Eg.found('g_grade1'); };

  // Run-Start: Meta und Kalender
  Eg.runStarted = function (app) {
    const d = sv();
    const es = d.eggStats || (d.eggStats = { saves: 0, chatter: 0, erase: 0, sigMet: [], chars: [], hotels: [] });
    if (d.runs >= 10) Eg.found('m_runs10');
    if (d.runs >= 50) Eg.found('m_runs50');
    if (!es.chars.includes(d.last.char)) es.chars.push(d.last.char);
    if (!es.hotels.includes(d.last.hotel)) es.hotels.push(d.last.hotel);
    K.save.save();
    if (D.CHARS.every((c) => es.chars.includes(c.id))) Eg.found('m_chars');
    if (D.HOTELS.every((h) => es.hotels.includes(h.id))) Eg.found('m_hotels');
    if (d.last.daily) Eg.found('m_daily');
    Eg.checkDates(true);
  };

  Eg.checkDates = function (award) {
    const n = new Date(), mo = n.getMonth() + 1, da = n.getDate(), wd = n.getDay(), h = n.getHours();
    const th = Eg.theme = {};
    if (h === 0) th.midnight = true;
    if (wd === 5 && da === 13) th.f13 = true;
    if (mo === 12 && da >= 24 && da <= 26) th.xmas = true;
    if ((mo === 12 && da === 31) || (mo === 1 && da === 1)) th.newyear = true;
    if (mo === 4 && da === 1) th.april = true;
    if (mo === 10 && da === 31) th.halloween = true;
    if (mo === 8 && da === 1) th.swiss = true;
    if (mo === 2 && da === 14) th.valentine = true;
    if (wd === 1) th.monday = true;
    if (h >= 5 && h < 7) th.early = true;
    if (award) {
      const map = { midnight: 'd_midnight', f13: 'd_f13', xmas: 'd_xmas', newyear: 'd_newyear', april: 'd_april', halloween: 'd_halloween', swiss: 'd_swiss', valentine: 'd_valentine', monday: 'd_monday', early: 'd_early' };
      for (const k in th) if (map[k]) Eg.found(map[k]);
    }
    document.body.classList.toggle('t-xmas', !!th.xmas);
    document.body.classList.toggle('t-halloween', !!th.halloween);
  };

  // Themen-Effekte zu Schichtbeginn
  Eg.themeShift = function () {
    const th = Eg.theme;
    setTimeout(() => {
      if (th.midnight) { FX.emojiFly('👻', H() * 0.25, 44, 130); A.boo(); }
      if (th.f13) FX.emojiFly('🐈', H() * 0.44, 36, 110, -1);
      if (th.halloween) { FX.emojiFly('🦇', H() * 0.15, 30, 200); FX.emojiFly('🦇', H() * 0.22, 26, 170, -1); }
      if (th.swiss) FX.swissRain(18);
      if (th.newyear) for (let i = 0; i < 4; i++) setTimeout(() => FX.firework(60 + Math.random() * (W() - 120), H() * (0.12 + Math.random() * 0.2)), i * 400);
      if (th.april && K.app && K.app.view) K.app.view.toast('Direktion', 'Ab heute zählen alle Zimmernummern rückwärts. … April, April!', 3200);
    }, 900);
  };

  // Gesichts-Veränderungen durch Modi und Feiertage
  Eg.faceMod = function (g, f) {
    let m = null;
    const set = (o) => { m = Object.assign(m || {}, o); };
    if (Eg.theme.xmas && g.id % 2 === 0) set({ hat: 'santa', hatColor: '#d62828' });
    if (Eg.theme.halloween && g.id % 3 === 0) set({ hat: 'pumpkin' });
    if (Eg.modes.party) set({ hat: 'party' });
    if (Eg.modes.pirate) set({ extras: (f.extras || []).filter((x) => x !== 'eyepatch').concat('eyepatch'), glasses: null });
    return m;
  };

  Eg.fmtScore = function (n) {
    if (performance.now() > Eg.romanUntil) return null;
    n = Math.floor(n);
    if (n <= 0) return 'NIHIL';
    if (n > 39999) return 'MULTUM';
    const M = [[10000, 'ↂ'], [5000, 'ↁ'], [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, r] of M) while (n >= v) { s += r; n -= v; }
    return s;
  };

  // Pro Frame: Schnee, Sternschnuppen auf dem Titel
  let snowT = 0, starT = 6;
  Eg.frame = function (dt) {
    if (Eg.modes.snow || Eg.theme.xmas) { snowT += dt; if (snowT > 0.05) { snowT = 0; FX.snow(1); } }
    const app = K.app;
    if (app && app.state === 'title') {
      starT -= dt;
      if (starT <= 0) {
        starT = 8 + Math.random() * 8;
        const scr = document.querySelector('.title-screen');
        if (scr) {
          const s = U.el('div', 'shooting');
          s.style.top = (20 + Math.random() * 120) + 'px';
          s.style.left = (40 + Math.random() * 200) + 'px';
          scr.appendChild(s);
          setTimeout(() => s.remove(), 1700);
        }
      }
    }
  };

  Eg.init = function () {
    document.addEventListener('click', onClick, true);
    Eg.checkDates(false);
    if (Eg.isFound('m_all')) document.body.classList.add('m-golden');
  };

  K.eggs = Eg;
})(window.K);
