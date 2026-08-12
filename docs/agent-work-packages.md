# Raspored rada za agentne sesije

Ovaj dokument dijeli preostali `docs/plan.md` na pakete veličine "jedna agentna
sesija = jedan paket". Svaki paket ima jasan ulaz, izlaz i granicu opsega.
Redoslijed prati revidirani plan (0 → 1 → 2+3 → 4+5 → 6 → 7 → 8 → 9 → 10 → 11 →
12 → 14 → 13 → 15).

Pravilo: **ne pokrećeš paket N+1 dok paket N nije mergean na `main` i dok
njegov exit checklist nije potvrđen ručno.** Veći paketi (E4+5, E8, E13) su
unaprijed podijeljeni na potpakete jer bi "jedna sesija" za njih bila
prevelika da je pregledaš u jednom prolazu.

Status legenda: ✅ gotovo · 🔜 sljedeće · ⬜ čeka na red

---

## ✅ P0 — Etapa 0: Project foundation
Gotovo, na `main`.

## ✅ P1 — Etapa 1: Arhitektonski spike
**Napomena (P3a sesija, 2026-08-11):** ova stavka je bila označena gotovom,
ali `EditorSpike.vue` nikad nije postojao u historiji (ni lokalno ni na
`origin/main`) — dokument model, adapter i SVG exporter su isporučeni u
skeletonu, ali "dokaz u browseru" (Vue Flow wiring, custom node komponente)
nikad nije napravljen kao zaseban korak. Umjesto da se to radi retroaktivno
kao izgubljeni P1, taj rad je odrađen unutar P3a (vidi niže) jer je P3a
svejedno zahtijevao isti Vue Flow wiring da bi trajna stranica uopće mogla
postojati.

---

## ✅ P2 — Etapa 2+3 dovršetak: model, Ajv runtime, command sustav

**Ulaz:** stanje nakon P1. **Opseg:**
- Uključiti Ajv validaciju u stvarni tok (validacija pri `parseDocument` i prije
  spremanja), koristeći `schemas/diagram-document.v1.schema.json`.
- `UpdateConnectionCommand` (nedostaje iz seta commanda).
- Maksimalna veličina undo/redo historyja (npr. 100 koraka) u `CommandManager`.
- Tipkovnički prečaci vezani na `CommandManager`: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z,
  Delete/Backspace (samo kad postoji selekcija), Escape (prekid aktivne
  operacije — za sada samo skida selekciju).
- Dodatni edge-case unit testovi za JSON Schema (nepoznat tip elementa pada,
  veza prema nepostojećem elementu pada na domenskoj, ne-shema validaciji).

**Van opsega:** bilo šta iz Etape 4+5 (toolbar, properties panel UI).

**Izlaz:** `docs/plan.md` P2 označen gotovim; svi postojeći + novi testovi
zeleni.

---

## ✅ P3a — Etapa 4+5 dio 1: editor shell + registry-driven toolbar

**Ulaz:** P2 mergean. **Opseg:**
- Trajna editor stranica (zamjenjuje `EditorSpike.vue`, koji se briše).
- Layout: top bar (naziv, undo, redo, zoom, save status placeholder, export
  placeholder), lijevi toolbar **generiran iz `umlUseCaseRegistry`** (ne
  hardkodirane dugmadi), centar (Vue Flow canvas), desni panel (prazan
  placeholder — puni se u P4).
- Klik na toolbar dodaje element na zadanu poziciju (drag-from-toolbar je P3b).

**Van opsega:** properties panel sadržaj, multi-selection, alignment.

**Izlaz:** editor stranica dostupna na ruti (bez auth za sada), toolbar
pokriva sva 4 elementa iz registryja bez ijedne hardkodirane reference na tip.

**Odrađeno (2026-08-11):** `resources/js/pages/Editor.vue` na ruti `/editor`
(izvan auth grupe), 4 zone, toolbar generiran iz `umlUseCaseRegistry.nodes`.
Kako `factory.ts` i `editor-context.ts` nisu postojali (vidi napomenu kod P1),
napravljeni su u ovoj sesiji zajedno s Vue Flow custom node komponentama
(actor/use-case/system-boundary/note) — bez toga trajna stranica ne bi imala
šta zamijeniti. Custom edge vizualizacija po UML tipu veze (dashed include/
extend, hollow triangle generalization) NIJE rađena — Vue Flow trenutno crta
sve veze kao built-in `straight`; connect gesture ipak sprema ispravan
`DiagramConnection.type`/stil u model, pa je to samo pitanje dodavanja edge
komponenti kasnije, ne promjene modela.

---

## ✅ P3b — Etapa 4+5 dio 2: interakcije + reparent + Playwright happy path

**Ulaz:** P3a mergean. **Opseg:**
- Vue Flow u controlled modeu (`:apply-default="false"`), filtriranje
  NodeChange/EdgeChange kroz adapter → Command.
- Single selection, deselect klikom na canvas, delete selektiranog, Escape →
  vraća select alat, fit-view, snap-to-grid toggle.
- Reparent dragom (uvlačenje use casea u boundary mišem → `ChangeParentCommand`),
  ne samo dugmetom kao u spikeu.
- Jedan Playwright test: otvori editor → boundary → actor → use case → pomakni
  → selektiraj → obriši → undo vrati (iz `docs/plan.md` Etapa 4 specifikacije).

**Izlaz:** `docs/plan.md` P3 (4+5) označen gotovim; Playwright test zelen u CI.

**Odrađeno (2026-08-11):** sve stavke opsega implementirane i ručno
vizuelno provjerene u browseru (ne samo automatizirani testovi — vidi
sažetak sesije). Usput otkriveno i popravljeno: `extent:'parent'` iz P3a
(u `vueflow-adapter.ts`) je Vue Flow-ovim ugrađenim ograničenjem
KLAMPOVAO drag djeteta unutar granica roditelja, čineći reparent-IZVAN
boundaryja fizički nemogućim bez obzira na logiku u `dragStopToCommands`
— uklonjeno. Klik-selekcija je Vue Flow-ova UGRAĐENA logika (radi bez
apply-default), ne novo napisan kod — samo je sinhronizirana u
`ctx.selection`.

**Napomena — Etapa 4+5 NIJE u potpunosti završena ovim paketom:**
`docs/plan.md`-ov puni opis Etape 4+5 uključuje i **resize** (promjena
veličine elementa mišem/handle-ovima) kao dio "Editor" liste interakcija.
Resize UI (`NodeResizer` iz `@vue-flow/node-resizer`, već je dependency)
nije rađen ni u P3a ni u P3b — `ResizeElementCommand` i
`resizeEndToCommand` postoje u kodu od P2/P3a, ali ništa ih ne poziva.
Namjerno NE označavam milestone M4/M5 u `docs/plan.md` kao potpuno
gotov dok resize ne postoji — to je odluka za review, ne tiha
pretpostavka.

**Gap zatvoren u P3c** (vidi niže) — resize UI je sad rađen za
use-case/system-boundary/note (actor namjerno izuzet).

---

## ✅ P3c — Etapa 4+5 dovršetak: resize UI

**Ulaz:** P3b mergean. **Opseg:** `@vue-flow/node-resizer` (već
dependency od Etape 0) na `uml.use-case`/`uml.system-boundary`/`uml.note`
node komponentama, vidljiv samo kad je node selektiran; resize-end →
`resizeEndToCommand` → `ResizeElementCommand` kroz `CommandManager`; donja
granica veličine po tipu elementa (`NodeDefinition.minSize`, novo polje u
registryju). `uml.actor` namjerno BEZ resiza — `ACTOR_GEOMETRY` omjeri
pretpostavljaju fiksni omjer širina:visina stick-figure.

**Odrađeno (2026-08-12):** `resize-handler.ts` (dijeljena
`dispatchResizeEnd` funkcija) — svaka od 3 node komponente injecta
`EDITOR_CONTEXT_KEY` i dispatcha direktno (isti obrazac kao
`EditorToolbar.vue`, ne mora ići kroz `EditorCanvas.vue`). Dodano 3 nova
unit testa za `resizeEndToCommand`/`dispatchResizeEnd` — ovaj kod je
postojao od P2 ali nikad nije imao testove jer ga ništa nije pozivalo.

Ručno vizuelno provjereno u browseru (ne samo testovi): resize handleovi
0 prije selekcije / 8 nakon selekcije use casea / 0 za actora (potvrđuje
namjerno izuzeće); resize mijenja stvarnu veličinu u modelu (debug
panel/JSON); undo vraća tačnu prethodnu veličinu; min-size klampa radi
(note klampiran tačno na 60×50); tekst se čitljivo prelama na maloj
veličini bez preklapanja (ellipse label "Use Case" → dva reda pri
minSize 80×50, i dalje čitljivo). Regresija: drag+connect+resize
zajedno, pa 3× undo — sve se ispravno odmotava.

---

## ⬜ P4 — Etapa 6: Properties panel + uređivanje teksta

**Opseg:** generirani properties panel iz `NodeDefinition`/`EdgeDefinition`
(zajednička + posebna svojstva); double-click text editing s HTML
input/textarea overlay-em; Enter potvrđuje, Escape poništava, blur potvrđuje,
jedan Command po izmjeni; prazan naziv → validacijsko upozorenje (vizualno, ne
blokira).

**Izlaz:** korisnik uređuje sva osnovna svojstva bez JSON-a.

---

## ⬜ P5 — Etapa 7: Lokalno spremanje (minimalno)

**Opseg:** autosave u localStorage s debounceom 800–1500ms; dirty/saving/
saved/save-error status u top baru; recovery nakon refresha; upozorenje pri
zatvaranju sa nespremljenim promjenama. **Eksplicitno NE:** sync engine,
verzioniranje, bilo šta što priprema backend — to je P6+.

**Izlaz:** editor preživljava refresh i kratkotrajno rušenje taba.

---

## ⬜ P6a — Etapa 8 dio 1: baza, modeli, policies

**Opseg:** migracije (`users` dopuna, `workspaces`, `workspace_members`,
`projects`, `diagrams`), Eloquent modeli, factories, Laravel policies
(pregled/uređivanje/brisanje projekta i dijagrama), osobni workspace pri
registraciji. Backend testovi (Pest): vlasništvo, izolacija tuđih projekata.

**Van opsega:** UI, editor wiring — to je P6b/P6c.

## ⬜ P6b — Etapa 8 dio 2: CRUD stranice (Inertia)

**Opseg:** lista/kreiranje/preimenovanje/soft-delete projekata i dijagrama kroz
Inertia stranice, autorizacija kroz policies iz P6a.

## ⬜ P6c — Etapa 8 dio 3: spajanje editora na backend

**Opseg:** `PUT /api/diagrams/{diagram}/document`; editor sprema/učitava
stvarni dijagram umjesto praznog dokumenta; `EditorSpike` ruta se briše u
korist prave editor rute unutar projekta/dijagrama. E2E tok: registracija →
projekt → dijagram → editor → spremi → logout → login → ponovno otvaranje.

---

## ⬜ P7 — Etapa 9: Autosave, optimistic locking, konflikti

**Opseg:** `version` polje, `409 Conflict` handling, conflict UI (bez
auto-mergea — prikaz + izbor reload/spremi-kao-kopiju), offline status +
retry.

## ⬜ P8 — Etapa 10: UML validacija

**Opseg:** validation engine (pravila iz `docs/analysis.md` §29 / UCV001–010),
validation panel s klikom → selekcija elementa.

## ⬜ P9 — Etapa 11: Produkcijski export

**Opseg:** PNG iz SVG-a (1×/2×/3×), snapshot testovi za sve elemente/veze,
JSON export s formatiranjem i stabilnim nazivom fajla.

## ⬜ P10 — Etapa 12: MVP Core stabilizacija (🚀 prva javna objava)

**Napomena:** ovo je veći paket — vjerojatno se dijeli na P10a (error/empty
stateovi, sanitizacija, rate limiting) i P10b (performance provjera na
20/100/200 elemenata, WCAG AA shell checklist) kad dođemo do njega, prema
tada aktuelnom stanju.

## ⬜ P11 — Etapa 14: Dokaz proširivosti (prije P12/Polish)

**Opseg:** minimalni `basic-flow` plugin (rectangle, diamond, directed edge)
koji koristi postojeći document model/command sustav/adapter/export bez
`if diagramType === 'uml-use-case'` uvjeta u coreu.

## ⬜ P12 — Etapa 13: MVP Polish

Niz malih nezavisnih paketa (multi-selection, copy/paste, alignment,
minimap, JSON import, revisions...) — svaki dovoljno malen za samostalnu
sesiju; raspoređuje se po prioritetu iz `docs/plan.md` kad se dođe do ove
faze.

## ⬜ P13 — Etapa 15: Open-source i production izdanje

Dokumentacija, DX, production deployment, sigurnosna provjera — detaljan
raspored radi se kad prethodno bude gotovo.

---

## Kako pratiti napredak

- Svaki paket = jedan GitHub issue (naslov npr. "P2 — Etapa 2+3 dovršetak") +
  jedan branch + jedan PR koji ga zatvara.
- Milestone na GitHubu prati etapu (M2, M3, M4...); paket se zatvara kad je PR
  mergean I checklist ručno proveden.
- `docs/plan.md` je izvor istine o tome gdje se projekt trenutno nalazi —
  ažurira se pri svakom mergeu.
