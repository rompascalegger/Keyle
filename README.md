# Keyle – Der Nachtportier

Ein Browser-Roguelike mit Arcade-Puzzle-Kern. Du bist Nachtportier an einer Hotelrezeption:
Gäste geben ihren Schlüssel ab, wenn sie rausgehen, und wollen ihn zurück, wenn sie wiederkommen.
Jeder Gast ist sein eigener Timer – er wird mit jeder Sekunde wütender, läuft aber nie davon.

**Punkte pro Bedienung:** `P = ⌊ B · m_S · m_K · m_R ÷ max(x, 1 s) ⌋` mit `B = 1’000` und `x` = Wartezeit ab Eintritt in die Lobby.

## Spielen

Kein Build, kein Server nötig: `index.html` im Browser öffnen. Oder lokal ausliefern:

```bash
python -m http.server 5317
```

Dann <http://localhost:5317> öffnen. Läuft auf Handy (Hochformat) und Desktop.

**Steuerung**

- Ziehen: Schlüssel vom Gast an den Haken (Abgabe) oder vom Haken zum Gast (Rückgabe).
- Antippen: erst Schlüssel, dann Ziel.
- Tasten: `G` Gästebuch, `S` Skizze, `T` Telefon, `B` Dienstklingel, `Esc` Pause / Hand leeren, `Enter` in Menüs.

## Was drin ist

- **Gedächtnis:** Wer einen Schlüssel zurückverlangt, hat ihn vorher in derselben Schicht sichtbar abgegeben. Ab Schicht 2 zeigen viele Gäste nur ihr Gesicht. Das Gästebuch kennt Namen und Zimmer, aber keine Gesichter.
- **Skizzen:** Gäste beim Abgeben zeichnen (Knopf *Skizze*, Taste `S` oder Doppelklick). Die Skizze hängt als Notiz am Haken und im Gästebuch.
- **Personas:** 30 handgemachte Stammgäste mit Spleen und Spruch (Kapitän mit Papagei, Vampirgräfin, Baronin mit Turmfrisur, Pantomime …), dazu ein Generator mit 35 Frisuren, 27 Hüten, 11 Brillen, 10 Bärten, 18 Outfits, Haustieren auf der Schulter, Zahnlücken, Piercings und mehr.
- **Schlüssel:** sieben Anhänger-Formen, drei Metallsorten, 30 Glücksbringer. Bis zu 32 Haken (Kapselhotel 64).
- **Easter Eggs:** 131 Geheimnisse in 7 Kategorien (Geheimcodes, Dinge zum Antippen, Spielmomente, Atelier, Kalender, seltene Gäste, Hotelgeschichte). Jedes bringt einen Stern, die Sammlung steht im *Kuriositätenkabinett* (🥚 auf dem Titel).
- **Kernloop:** freie Wahl, wen du bedienst; Wut-Stufen 0–5 mit Schwellen 3 / 7 / 12 / 20 / 30 s, Ansteckung der Nachbarn, Eruptionen, Reklamationen nach Fehlgriffen.
- **Schichten:** `n_s = 10 + 3(s−1)` Gäste, Abstand `T_s = max(1.5, 6 · 0.9^(s−1))`. Neue Regeln pro Schicht laut Konzept (Namen, Gesichter, blinde Haken, Zwillinge, Telefon, Kinder …), Bosse alle 5 Schichten (Reisegruppe, Hotelinspektor, Rockband), ab Schicht 11 Zufalls-Mutatoren.
- **Gästetypen:** Normal, Entspannt, Eilig, Tourist (Zimmernummer in Fremdsprache), Plauderer, Schlüsselverlierer, Zwillinge, Kinder, Promi, Reklamation, Gruppen.
- **Roguelike:** 21 Relikte (12 im Start-Pool, 9 freischaltbar), Pausenraum mit Relikt-Walzen und Kiosk, Nerven als Kaffeetassen.
- **Meta:** Sterne nach jedem Run, Hotel-Ausbau (Relikte, Rezeptionist:innen, Hotels), Hotelklasse 1–5 als Schwierigkeit, Tages-Seed.
- **Dopamin:** Tempo-Stempel (BLITZ, FLOTT, OK, ZÄH), steigende Tonleiter in der Kette, Hit-Stop, Goldene Stunde, Jackpot-Zimmer 777, „Gerade noch!“, Konfetti-Erlösung, Arbeitszeugnis mit Schweizer Schulnote beim Rauswurf.
- **Technik:** reines HTML/CSS/JS ohne Abhängigkeiten. Gesichter prozedural als SVG, alle Töne und die Lounge-Musik per WebAudio, Partikel auf Canvas, Spielstand in `localStorage`, seedbarer Zufall pro Run.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `js/data.js` | Regeln, Schwellen, Relikte, Gästetypen, Texte – alle Startwerte zum Justieren an einem Ort |
| `js/game.js` | Spiellogik ohne DOM (fester Zeitschritt, Ereignisse) |
| `js/view.js` | Darstellung, Ziehen/Antippen, Effekte |
| `js/screens.js` | Titel, Intro, Auszählung, Pausenraum, Kündigung, Hotel-Ausbau, Optionen |
| `js/faces.js` | Prozedurale Gesichter |
| `js/eggs.js` | Easter Eggs, Fundmeldungen, Modi |
| `js/audio.js` | Synthetisierte Effekte und Musik |
| `js/fx.js` | Partikel und Wackeln |

Die Logik in `js/game.js` hängt nicht am DOM, ein Balancing-Bot kann also direkt `pick()` / `drop()` / `update()` aufrufen.
