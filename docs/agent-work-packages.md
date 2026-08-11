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
Gotovo, na `main`. `EditorSpike.vue` je privremen — brisat će se u P3.

---

## 🔜 P2 — Etapa 2+3 dovršetak: model, Ajv runtime, command sustav

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

## ⬜ P3a — Etapa 4+5 dio 1: editor shell + registry-driven toolbar

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

---

## ⬜ P3b — Etapa 4+5 dio 2: interakcije + reparent + Playwright happy path

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
