# Plan razvoja po etapama

> **Revidirani redoslijed (2026-07).** Nakon izrade Etapa 0 skeletona, originalni
> plan je prilagođen. Ključne izmjene u odnosu na prvu verziju:
> - **Etape 2 i 3 su većim dijelom već isporučene** u skeletonu (tipovi, JSON Schema,
>   command sustav, undo/redo, pravila brisanja, unit testovi). Preostaje integracijski
>   i dopunski rad (~2–3 dana umjesto 9–13).
> - **Etape 4 i 5 se stapaju:** toolbar se od prvog dana generira iz plugin registryja,
>   da se izbjegne rework.
> - **Etapa 14 (dokaz proširivosti) ide PRIJE Etape 13 (polish)** — jeftin test
>   arhitekture prije nego se na nju nagomila najviše koda.
> - **M12 (MVP Core) je prva javna objava**, ne M15.
>
> Efektivni redoslijed: **0 → 1 → (2+3 skraćeno) → (4+5 registry-driven) → 6 → 7
> minimalno → 8 → 9 → 10 → 11 → 12 → 14 → 13 → 15.**
>
> Projekt se razvija kao niz zatvorenih, provjerljivih cjelina. Svaka etapa završava
> demonstrabilnim rezultatom. Ne prelazi se dalje dok kriteriji prihvaćanja nisu
> ispunjeni. **Pravilo prelaska (na kraju dokumenta) je nepovredivo.**

---

## Etapa 0 — Definicija projekta i arhitektonske odluke ✅

**Cilj:** ukloniti arhitektonske nejasnoće prije pisanja ozbiljnog koda.

**Implementirati:** javni GitHub repo; Laravel + Vue 3 + TypeScript + Inertia; Vue
Flow; Vitest, Pest, Playwright; ESLint, Prettier, Pint; struktura direktorija;
`README.md`; `docs/analysis.md`; ADR-ovi (0001 Vue Flow, 0002 vlastiti model, 0003
zaseban SVG exporter, 0004 PostgreSQL/JSONB, 0005 MIT licenca, 0006 MVP Core opseg).

**Ne implementirati:** autentifikaciju, projekte, bazu dijagrama, pravi editor,
kompleksne storeove.

**Kriterij završetka:** `composer install`, `npm install`, `php artisan migrate`,
`npm run build`, `npm run test:unit`, `php artisan test` — sve prolazi. CI izvršava
lint + frontend + backend testove.

**Procjena:** 2–4 dana.

---

## Etapa 1 — Arhitektonski spike: Vue Flow, vlastiti model i SVG export

**Cilj:** dokazati tri najrizičnije tehničke odluke prije razvoja proizvoda.

**Implementirati:** jednu privremenu editor stranicu s actor/use-case/boundary
nodeovima, association i include vezama, Vue Flow zoom/pan, pomicanjem, resizeom use
casea, connection handleovima, nested nodeom u boundaryju. Minimalni vlastiti model,
`DiagramDocument → Vue Flow` adapter, Vue Flow eventi koji ažuriraju model, privremeni
JSON prikaz, prvi SVG exporter (actor, elipsa, association, dashed include, arrowhead,
`<<include>>` labela).

> **Napomena:** Većina vlastitog modela, command sustava i SVG exportera već postoji
> u skeletonu (`resources/js/editor/`). Etapa 1 je prvenstveno **dokaz u browseru**:
> Vue Flow custom komponente + spajanje `dragStopToCommand`/`connect` eventa na
> `CommandManager`. Adapter već ima gotove funkcije za to.

**Kriterij završetka:** na jednoj stranici istovremeno rade (1) vlastiti dokument
model, (2) Vue Flow prikaz, (3) uređivanje, (4) SVG export iz modela. Ako bilo koji
ne radi, arhitektura se korigira prije nastavka.

**Procjena:** 5–7 dana.

---

## Etapa 2 — Stabilni model dokumenta ✅

**Cilj:** definirati format koji je temelj cijele aplikacije.

**Status:** TypeScript tipovi (`DiagramDocument`, metadata, canvas, element, connection,
position, size, stilovi, anchor reference), četiri elementa (`uml.actor`,
`uml.use-case`, `uml.system-boundary`, `uml.note`), četiri veze, stabilni UUID-evi,
`schemaVersion`, JSON Schema + Ajv (validacija sad i u stvarnom `parseDocument` toku,
ne samo ručna provjera), pravila brisanja (boundary zadržava djecu, uklanja
`parentId`; veze se brišu), migracijska infrastruktura, i zasebna referencijalna
provjera veza→elementi (`validateReferentialIntegrity`, izvan JSON sheme jer je
strukturno validna) — sve gotovo, s unit testovima za rubne slučajeve sheme.

**Kriterij završetka:** složeniji testni dokument može se kreirati u kodu, validirati,
serializirati, spremiti kao JSON, ponovno učitati i prikazati bez gubitka informacija.

**Procjena:** 1–2 dana (umjesto 4–6 — skeleton pokriva većinu).

---

## Etapa 3 — Command sustav i undo/redo (skoro gotovo)

**Cilj:** osigurati da sve izmjene prolaze kroz kontrolirani mehanizam.

**Status:** `Command` interface, `CommandManager` s undo/redo stackovima (ograničen
na 100 koraka — najstariji command se tiho izbacuje), čišćenjem redo grane, te
Add/Move/Resize/Update/Delete/AddConnection/DeleteConnection/ChangeParent/
`UpdateConnectionCommand` commandi, i tipkovnički prečaci (Cmd/Ctrl+Z,
Cmd/Ctrl+Shift+Z, Delete/Backspace, Escape) kao samostalan modul
(`commands/keyboard-shortcuts.ts`) — sve gotovo, s unit testovima.

**Preostaje:** grupiranje `pointermove` događaja u jedan move command (jedan drag =
jedna history stavka) i stvarno kačenje tipkovničkih prečaca na `@keydown` — oboje
zahtijeva pravu editor stranicu s Vue Flow interakcijom, pa se radi u Etapi 4+5 (P3a/b)
kad `EditorSpike.vue` bude zamijenjen trajnom stranicom.

**Kriterij završetka:** korisnik gradi mali dijagram, radi ≥10 operacija, vraća ih sve
unatrag i ponovno unaprijed bez oštećenja dokumenta.

**Procjena:** 2–3 dana (umjesto 5–7).

---

## Etapa 4+5 — Editor UX i UML Use Case plugin (registry-driven, stopljeno) ✅

**Cilj:** pretvoriti spike u upotrebljiv editor, odvojeno od UML-specifičnih elemenata.

> **Ključna izmjena:** toolbar se **od prvog dana generira iz plugin registryja**
> (`umlUseCaseRegistry`), pa nema rework između "hardkodiranog" toolbara i plugina.
> Etape 4 i 5 se izvode kao jedna cjelina.

**Layout:** top bar (naziv, undo, redo, zoom, save status, export); lijevi toolbar
(select + tipovi iz registryja); centar (Vue Flow canvas); desni properties panel.

**Editor:** aktivni alat; klik/drag za dodavanje; single selection; deselect; delete;
resize; zoom/pan; fit view; snap-to-grid; connection handles; vizualna selekcija; dirty
status. (Bez multi-selection, copy/paste, alignmenta, minimape — to je Polish.)

**Plugin registry:** `DiagramTypeDefinition` (nodeTypes, edgeTypes, toolbarItems,
validators). Svaki node: tip, naziv, ikona, zadana/min veličina, stil, properties,
anchori, Vue editor komponenta, SVG export renderer. Svaki edge: tip, stil, markeri,
labela, dopušteni source/target tipovi.

**UML elementi:** Actor (stick figure iz `ACTOR_GEOMETRY`), Use Case (elipsa, wrapping,
min dimenzije), System Boundary (container, labela gore), Note (folded corner). **Veze:**
Association, Include, Extend, Generalization — ispravni stilovi, markeri, smjerovi,
automatske labele.

**Playwright:** otvori editor → boundary → actor → use case → pomakni → selektiraj →
obriši → undo vrati.

**Kriterij završetka:** moguće je napraviti kompletan, semantički prepoznatljiv Use
Case dijagram samo kroz UI, bez konzole ili ručnog JSON-a, bez generičkih placeholdera.

**Procjena:** 2–3 tjedna (spojene etape).

> **Status: gotovo (P3a + P3b + P3c).** Resize dodan naknadno kao mikro-paket
> P3c nakon što je otkriven kao gap u P3a/P3b opsegu. Properties panel
> (placeholder u desnom panelu) namjerno nije dio ove etape — to je Etapa 6.

---

## Etapa 6 — Properties panel i uređivanje teksta

**Cilj:** kontrola nad sadržajem i osnovnim izgledom.

**Generirani properties panel** iz definicije tipa: zajednička svojstva (X, Y, width,
height, labela, font size, alignment, fill, stroke, stroke width) i posebna (stereotype
actora, naziv boundaryja, tip veze, routing, labela veze, source/target anchor, dash,
marker).

**Uređivanje teksta:** double click → HTML input/textarea iznad nodea; Enter potvrđuje;
Escape poništava; blur potvrđuje; jedan command; prazan naziv → validacijsko upozorenje.

**Text wrapping (MVP pravila):** jedan font stack; bez rich texta; fiksni line-height;
wrapping po riječima; max širina prema nodeu; **ista wrap funkcija dostupna SVG
exporteru** (već u skeletonu — `wrapText`).

**Kriterij završetka:** korisnik izrađuje dijagram s vlastitim nazivima i uređuje sva
osnovna svojstva bez izravnog rada s JSON-om.

**Procjena:** 1 tjedan.

---

## Etapa 7 — Lokalno spremanje i recovery (minimalno)

**Cilj:** stabilizirati editor prije backenda.

> **Oprez od scope creepa:** lokalno spremanje je **recovery snapshot** (zadnje stanje
> + dirty flag), NE punopravni sync engine. Pravi save target je backend (Etapa 8);
> lokalna kopija služi samo za recovery i offline (Etapa 9).

**Implementirati:** autosave u localStorage/IndexedDB; debounce 800–1500 ms; dirty/
saving/saved/save-error statusi; recovery nakon refresha; upozorenje pri zatvaranju sa
nespremljenim promjenama; ručni JSON export; ručni JSON import (samo za razvojnu
provjeru).

**Kriterij završetka:** editor radi kao samostalna lokalna aplikacija bez Laravela;
korisnik ne gubi dijagram pri refreshu ili kratkom rušenju stranice.

**Procjena:** 3 dana.

---

## Etapa 8 — Laravel: korisnici, workspaces, projekti, dijagrami

**Cilj:** povezati stabilni editor s pravom aplikacijom.

**Baza:** users, workspaces, workspace_members, projects, diagrams. Pri registraciji:
osobni workspace, korisnik postaje owner.

**Funkcije:** registracija/prijava/odjava; lista i CRUD projekata (soft delete); lista i
CRUD dijagrama; otvaranje editora. **Authorization:** Laravel policies za pregled/
uređivanje/brisanje projekta i dijagrama — bez oslanjanja na frontend.

**Spremanje:** `PUT /api/diagrams/{diagram}/document` s `{version, schemaVersion,
document}`.

**Kriterij završetka:** kompletan vertikalni tok od registracije do ponovnog učitavanja
spremljenog UML dijagrama radi u stvarnoj bazi (PostgreSQL).

**Procjena:** 1–2 tjedna.

---

## Etapa 9 — Autosave, optimistic locking, recovery konflikata

**Cilj:** pouzdano spremanje.

**Stanja:** clean, dirty, saving, saved, save-error, conflict, offline. **Autosave:**
nakon commanda, debounce, bez paralelnih requestova, sprema najnovije stanje na kraju.
**Optimistic locking:** `version` po dijagramu; server prihvaća samo pri podudaranju;
uspjeh povećava verziju; neslaganje → `409 Conflict`.

**Conflict UI (MVP):** bez auto-merge; prikaz da postoji novija serverska verzija;
ponuda pregleda lokalne/serverske; opcije reload serverske ili spremanje lokalne kao
kopije. **Offline:** lokalna recovery kopija, offline status, retry, "saved" tek nakon
potvrde backenda.

**Kriterij završetka:** nijedan simulirani network error ili version conflict ne smije
tiho izgubiti korisnički rad.

**Procjena:** 1 tjedan.

---

## Etapa 10 — UML validacija (glavna diferencijacija)

**Cilj:** implementirati glavnu diferencijaciju proizvoda.

**Engine:** `DiagramValidationResult { ruleId, severity: error|warning|info, message,
elementIds }`. **Pravila:** use case/actor/boundary bez naziva; veza/`parentId` prema
nepostojećem; kružna hijerarhija; actor u boundaryju; nekompatibilne association/
include/extend/generalization; duplicirana veza; nedopušten self-connection.

**Validation panel:** broj grešaka/upozorenja; lista; klik → selekcija elementa;
vizualni indikator; samo strukturne greške blokiraju spremanje/import, UML upozorenja ne.

**Kriterij završetka:** namjerno pogrešan dijagram daje razumljiva upozorenja; klik na
upozorenje vodi do elementa.

**Procjena:** 5–7 dana.

---

## Etapa 11 — Produkcijski SVG, PNG i JSON export

**Cilj:** prijenos i korištenje dijagrama izvan aplikacije.

**JSON:** puni `DiagramDocument` (schema version, type, metadata, formatiran, stabilan
naziv). **SVG:** exporter čita samo model; svi elementi i edge tipovi; markeri, dashed,
labele, wrapping, bounding box, margine, puna/transparentna pozadina. **PNG:** iz SVG-a,
1×/2×/3×, bez grida/handleova/controls.

**Shared definicije** (editor i exporter): stilovi, dimenzije, geometry konstante, font
stack, wrapping, markeri, padding. **Snapshot testovi** za svaki element/vezu/wrapped
tekst/mali dijagram. Ručno: SVG u browseru/Inkscapeu, PNG transparentnost, HR/FR znakovi,
veći dijagrami, ekstremne koordinate.

**Kriterij završetka:** izvoz se može staviti u PDF ili prezentaciju bez ručnog
popravljanja.

**Procjena:** 1–2 tjedna.

---

## Etapa 12 — MVP Core stabilizacija (🚀 prva javna objava)

**Cilj:** zatvoriti prvu stvarno upotrebljivu verziju.

**Implementirati:** loading/error/empty stateove; confirm dijaloge; shortcut pomoć;
osnovni onboarding; responsive desktop shell; browser compatibility; ograničenje
veličine dokumenta; sanitizaciju teksta; backend rate limiting; centralizirani error
handling; structured logging.

**Performance:** 20/30, 100/200, 200/400 nodeova/veza — vrijeme otvaranja, drag
fluidnost, autosave serializacija, undo/redo, SVG export. **Pristupačnost (WCAG AA
shell):** toolbar/panel tipkovnicom; vidljiv fokus; semantičke labele; kontrast; boja
nije jedini indikator; input labele; live region za save status.

**Kriterij završetka:** cijeli MVP Core checklist radi bez poznatih bugova koji uzrokuju
gubitak podataka. **Prva javna objava projekta.**

**Procjena:** 1–2 tjedna.

---

## Etapa 14 — Dokaz proširivosti (PRIJE polisha)

**Cilj:** dokazati da aplikacija nije hardkodirani Use Case editor.

> **Pomjereno prije Etape 13:** test arhitekture je jeftin i vrijedan odmah nakon
> M12, dok je polish siguran posao koji može čekati.

Minimalni eksperimentalni plugin (`basic-flow`: rectangle, diamond, directed edge — ili
početak Activity dijagrama). Mora koristiti postojeće: document model, command sustav,
Vue Flow adapter, properties panel, validaciju, export, persistence.

**Kriterij završetka:** novi diagram type se registrira bez izmjene editor corea;
toolbar se generira iz plugina; nodeovi se spremaju/učitavaju; exporter koristi nove
definicije; **nema `if diagramType === 'uml-use-case'` uvjeta razbacanih kroz core.** Ako
tri nova elementa traže izmjenu mnogo core datoteka — plugin arhitektura nije dovoljno
dobra.

**Procjena:** 1 tjedan.

---

## Etapa 13 — MVP Polish (nakon dokaza proširivosti)

**Cilj:** produktivnost bez promjene arhitekture.

**Po prioritetu, svaka kao zaseban mali milestone:** multi-selection; selection
rectangle; copy/paste; duplicate; bring forward/send backward; alignment (left/center/
right/top/middle/bottom); distribucija razmaka; configurable grid; snap toggle; bolji
shortcuti; context menu; minimap; fit selected; JSON import; thumbnail projekta;
duplicate diagram; osnovne revizije.

**Testiranje:** svaka funkcija — unit (ako mijenja model), undo/redo test, ≥1 E2E happy
path, provjera save/reload.

**Kriterij završetka:** korisnik učinkovito radi na srednje velikom dijagramu bez
stalnog ručnog ponavljanja.

**Procjena:** 2–4 tjedna.

---

## Etapa 15 — Open-source i production izdanje

**Cilj:** omogućiti drugima korištenje, instalaciju i doprinos.

**Dokumentacija:** README, problem/diferencijacija, screenshots, lokalna/production
instalacija, arhitektura, format `DiagramDocument`, plugin dokumentacija, contribution
guide, code of conduct, security policy, changelog, roadmap, licenca, API docs, backup/
restore.

**Developer experience:** `.env.example`, seed podaci, demo korisnik, sample dijagram,
jedna naredba za dev okruženje, Docker Compose (opcionalno), issue/PR templates, CI,
release tag, dependency automation.

**Production:** Hetzner, Nginx, PHP-FPM, PostgreSQL, queue worker (ako treba), HTTPS,
backup, log rotation, health endpoint, monitoring, error tracking, deploy skripta,
rollback.

**Sigurnost:** authorization testovi, CSRF, XSS, IDOR, upload/import limit, JSON depth/
size limit, rate limiting, dependency audit, sigurni HTTP headeri.

**Kriterij završetka:** nova osoba može klonirati repo, pratiti README, pokrenuti,
prijaviti se, otvoriti sample dijagram, napraviti izmjenu, pokrenuti testove. Production
instanca se ponovno instalira iz dokumentirane procedure.

**Procjena:** 1–2 tjedna.

---

## Milestoneovi

```text
M0  Project foundation          ✅
M1  Architecture proven
M2  Stable document model
M3  Undoable editor core
M4  Usable editor UI            (M4+M5 registry-driven)
M5  Complete Use Case plugin
M6  Editable properties and text
M7  Local persistence
M8  Laravel persistence
M9  Reliable autosave
M10 UML validation
M11 Export engine
M12 MVP Core release            🚀 prva javna objava
M14 Extensibility proven        (prije M13)
M13 MVP Polish
M15 Open-source production release
```

## Pravilo prelaska između etapa (nepovredivo)

Svaka etapa završava s četiri obavezna rezultata:

1. **demonstracija** — funkcionalnost se može ručno pokazati;
2. **automatizirani testovi** — kritična logika ima testove;
3. **dokumentacija** — odluke i poznata ograničenja su zapisana;
4. **exit checklist** — nema otvorenog problema koji može srušiti sljedeću etapu.

Ne započinjati dashboard, autentifikaciju i production infrastrukturu prije nego Etapa 1
dokaže vlastiti model, Vue Flow adapter i SVG export. Ne započinjati polish prije nego
cijeli MVP Core radi end-to-end.
