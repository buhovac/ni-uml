# CLAUDE.md — upute za agenta koji radi u ovom repozitoriju

Ovaj fajl vrijedi za svaku agentnu sesiju (Claude Code i slično) koja dobije
pristup ovom folderu. Pravila su namjerno strožija nego što bi bila za ljudskog
kontributora, jer agent radi bez nadzora u realnom vremenu.

## Šta je ovaj projekt

Open-source UML-first editor dijagrama. Laravel + Vue 3 + TypeScript + Inertia +
Vue Flow + PostgreSQL/JSONB. Puni kontekst:

- `docs/analysis.md` — proizvodna analiza i domenski model
- `docs/plan.md` — plan po etapama (trenutni napredak i redoslijed)
- `docs/agent-work-packages.md` — podjela plana na pakete veličine "jedna
  agentna sesija"
- `docs/adr/` — arhitektonske odluke; **ovo je izvor istine za arhitekturu**

Ako bilo šta u ovom fajlu proturječi ADR-u, ADR pobjeđuje — javi to u sažetku
umjesto da tiho odlučiš koje pravilo vrijedi.

## Hijerarhija izvora istine

1. `docs/adr/*.md` — arhitektonske odluke, ne mijenjati bez izričitog dopuštenja
2. `docs/plan.md` i `docs/agent-work-packages.md` — koji je paket trenutno na
   redu i šta mu pripada
3. Prompt trenutne sesije — tačan opseg ovog zadatka
4. Ovaj fajl — procesna pravila

## Neprikosnovena arhitektonska pravila

- **`DiagramDocument`** (`resources/js/editor/types/document.ts`) je jedini
  izvor istine. Vue Flow stanje je projekcija, nikad obrnuto (ADR-0002). Nikad
  ne mutiraj `doc.elements` / `doc.connections` direktno iz UI koda — uvijek
  kroz Command.
- Svaka izmjena dokumenta ide kroz **Command** (`resources/js/editor/commands/`).
  Ako dodaješ novu vrstu izmjene, dodaj novi Command s `execute()`/`undo()`, ne
  proširuj postojeći UI handler da mutira stanje mimo CommandManagera.
- Editor render i SVG export **dijele** geometrijske i stilske konstante iz
  `resources/js/editor/uml-use-case/definitions.ts`. Nikad ne hardkodiraj istu
  dimenziju/boju na dva mjesta (ADR-0003). Ako ti treba nova konstanta, dodaj je
  u `definitions.ts` i referenciraj je s oba mjesta.
- Elementi/veze koje UI kreira idu kroz `resources/js/editor/uml-use-case/
  factory.ts` (`createElement`/`createConnection`), ne kroz ručno sastavljanje
  objekata u komponentama — factory je jedino mjesto koje dodjeljuje UUID-eve
  i defaulte iz registryja.
- Toolbar i slične liste elemenata/veza generiraju se iz `umlUseCaseRegistry`
  (`resources/js/editor/uml-use-case/definitions.ts`), nikad kao hardkodirana
  dugmad s tvrdo upisanim tipovima — novi tip u registryju mora se automatski
  pojaviti u UI-ju bez izmjene komponente.
- `schemaVersion` i migracijski lanac (`serializer.ts` → `migrate()`) moraju
  ostati konzistentni pri svakoj izmjeni oblika dokumenta.
- Licenca je **MIT** (ADR-0005). Ne dodavati kod ili dependency s copyleft
  licencom (GPL/AGPL) bez izričitog upozorenja u sažetku.
- PostgreSQL + JSONB za perzistenciju dijagrama (ADR-0004) — ne uvoditi
  paralelnu normalizaciju elemenata/veza u zasebne tablice.

## Disciplina opsega

- Radi **isključivo** na paketu opisanom u trenutnom promptu. Plan po etapama
  je u `docs/plan.md` i `docs/agent-work-packages.md` — ako primijetiš da bi
  nešto iz kasnijeg paketa bilo zgodno odraditi "dok si već tu", **nemoj**.
  Zapiši to u sažetku pod "izvan opsega, odgođeno" i nastavi na dodijeljenom
  zadatku.
- Kod nejasnoće: odaberi najkonzervativnije tumačenje usklađeno s
  `docs/plan.md` i `docs/adr/`, eksplicitno navedi pretpostavku u sažetku, i
  nastavi. Ako je nejasnoća arhitektonska (zahtijevala bi novi ADR ili mijenja
  postojeći), **stani i pitaj** umjesto da nagađaš.
- Ne "popravljaj" stil ili strukturu izvan onoga što zadatak traži (npr. ne
  refaktoriraj nepovezane fajlove usput). Manji diff je uvijek bolji od većeg.
- Privremene/spike stranice (npr. `EditorSpike.vue`) ne proširuj dalje ako
  prompt kaže da se zamjenjuju trajnim rješenjem — obriši ih kad je zamjena
  gotova, ne ostavljaj oba postojeći.

## Git workflow (strogo)

- Nikad ne commituj direktno na `main`. Uvijek radi na branchu imenovanom
  `etapa-N-<kratki-slug>` prema paketu iz prompta.
- Nikad ne radi force-push i ne prepisuj dijeljenu historiju.
- Commituj u manjim, logički odvojenim commitovima s jasnim porukama — ne jedan
  ogroman commit na kraju.
- **Svaka git komanda koja bi mogla otvoriti interaktivni editor (merge bez
  `-m`, rebase, amend bez `-m`, itd.) MORA se izbjeći eksplicitnim flagom.**
  Npr. `git merge main -m "poruka"`, nikad goli `git merge main`. Isto važi za
  `git commit` — uvijek `-m "poruka"` u samoj komandi, nikad se ne oslanjaj na
  to da će se otvoriti editor za poruku.
- **Ne otvaraj PR i ne merge-aj.** Push branch i stani — merge radi čovjek
  nakon review-a.
- Ne diraj `docs/adr/*.md` sadržajno. Ako si tokom rada donio arhitektonsku
  odluku koja zaslužuje ADR, predloži novi ADR fajl (npr.
  `docs/adr/000X-naziv.md` sa statusom "predloženo") i to jasno istakni u
  sažetku — nikad tiho ne redefiniraj postojeći ADR.
  - **Ne push-aj branch, ne otvaraj PR, ne merge-aj.** Commituj lokalno na svoj
  branch i stani — push i sve dalje radi čovjek nakon review-a. Ovo je
  namjerno: tvoj proces nema pouzdan pristup git credentialima koje ima
  interaktivni terminal, i push je zadnja linija ljudske provjere prije nego
  bilo šta napusti lokalnu mašinu.
- **Nikad ne diraj branch main lokalno** — ne radi checkout main, reset,
  merge u main, cherry-pick na main, niti bilo koju sinhronizaciju
  main-a s originom. Ako primijetiš da je main divergirao od origin/main ili
  da nešto s tvojim branchom to zahtijeva, STANI i prijavi to u sažetku kao
  blokirano — ne pokušavaj to sam popraviti, čak ni uz backup.

## Interaktivni prompti i credentials

Ako komanda (git commit/merge, npm, composer, itd.) zatraži passphrase,
lozinku, token, ili bilo koji interaktivni unos koji ti nije eksplicitno dat u
ovom fajlu ili u promptu — **nikad ne pokušavaj pogađati ili slati proizvoljne
vrijednosti**, i nikad ne ponavljaj pokušaj u petlji. Odmah prekini komandu i
prijavi u sažetku: "Blokiran na interaktivnom promptu: <opis, tačna komanda
koja je to izazvala>". Stani i čekaj uputu. Ovo uključuje GPG/SSH signing
promptove — ako se pojave, ne pokušavaj ih zaobići, prijavi ih.

## Definicija gotovog (za svaki paket)

Prije nego proglasiš paket završenim, MORAŠ:

1. Pokrenuti i proći: `npm run test:unit`, `npm run types:check`,
   `npm run lint:check`, i `php artisan test` ako je backend diran.
2. Dodati/ažurirati automatizirane testove za svaku novu logiku (unit testovi
   za commande/model/geometriju; Playwright samo za happy-path eksplicitno
   naveden u promptu).
3. **Ne smanjivati** postojeće pokrivenost testovima niti brisati/oslabljivati
   testove da bi CI prošao.
4. Ažurirati status paketa u `docs/plan.md` (checkbox/status liniju) ako je
   primjenjivo.

## Šta NIKAD raditi bez izričitog dopuštenja

- Mijenjati `schemas/diagram-document.v1.schema.json` na način koji nije
  aditivan/migracijski.
- Mijenjati licencu (`LICENSE`, ADR-0005).
- Dodavati nove npm/composer dependencyje koji nisu izričito navedeni u
  promptu — ako procijeniš da ti treba dependency, prvo provjeri postoji li
  već u `package.json`/`composer.json` (npr. `ajv` je već tu od Etape 0); ako
  stvarno treba nov, navedi ga u sažetku za odobrenje umjesto da ga instaliraš
  bez najave.
- Brisati ili slabiti postojeće testove da bi "CI prošao".
- Dirati `.github/workflows/` osim ako prompt to eksplicitno traži (uključujući
  promjene PHP/Node verzija u CI matricama — to je infrastrukturna odluka koju
  donosi čovjek).
- Push-ati na `main`, merge-ati PR-ove, brisati branch-eve.

## Kad si blokiran

Jasno napiši šta si pokušao, zašto je blokirano, i stani. Ne preskači tiho
zahtjev i ne nastavljaj na sljedećem dijelu kao da je riješeno.

## Format sažetka na kraju svake sesije

Završi svaku sesiju ovim (doslovno ova struktura, radi lakšeg pregleda):

```
## Sažetak
- Branch: ...
- Izmijenjeni/dodani fajlovi: ...
- Kako je layout/logika organizovana (ako je relevantno): ...

## Verifikacija
- [ ] npm run test:unit — PROŠLO/PALO (zalijepi zadnjih par linija outputa)
- [ ] npm run types:check — PROŠLO/PALO
- [ ] npm run lint:check — PROŠLO/PALO
- [ ] php artisan test — PROŠLO/PALO/N-A

## Izvan opsega / odgođeno
- ...

## Pretpostavke koje sam napravio
- ...

## Otvorena pitanja za review
- ...
```

Ne proglašavaj sesiju uspješnom ako bilo koja stavka u Verifikaciji nije PROŠLO.
