# CLAUDE.md — upute za agenta koji radi u ovom repozitoriju

Ovaj fajl vrijedi za svaku agentnu sesiju (Claude Code i slično) koja dobije
pristup ovom folderu. Pravila su namjerno strožija nego što bi bila za ljudskog
kontributora, jer agent radi bez nadzora u realnom vremenu.

## Šta je ovaj projekt

Open-source UML-first editor dijagrama. Laravel + Vue 3 + TypeScript + Inertia +
Vue Flow + PostgreSQL/JSONB. Puni kontekst:

- `docs/analysis.md` — proizvodna analiza i domenski model
- `docs/plan.md` — plan po etapama (trenutni napredak i redoslijed)
- `docs/adr/` — arhitektonske odluke; **ovo je izvor istine za arhitekturu**

Ako bilo šta u ovom fajlu proturječi ADR-u, ADR pobjeđuje — javi to u sažetku
umjesto da tiho odlučiš koje pravilo vrijedi.

## Hijerarhija izvora istine

1. `docs/adr/*.md` — arhitektonske odluke, ne mijenjati bez izričitog dopuštenja
2. `docs/plan.md` — koji je paket trenutno na redu i šta mu pripada
3. Prompt trenutne sesije — tačan opseg ovog zadatka
4. Ovaj fajl — procesna pravila

## Neprikosnovena arhitektonska pravila

- **`DiagramDocument`** (`resources/js/editor/types/document.ts`) je jedini izvor
  istine. Vue Flow stanje je projekcija, nikad obrnuto (ADR-0002). Nikad ne mutiraj
  `doc.elements` / `doc.connections` direktno iz UI koda — uvijek kroz Command.
- Svaka izmjena dokumenta ide kroz **Command** (`resources/js/editor/commands/`).
  Ako dodaješ novu vrstu izmjene, dodaj novi Command s `execute()`/`undo()`, ne
  proširuj postojeći UI handler da mutira stanje mimo CommandManagera.
- Editor render i SVG export **dijele** geometrijske i stilske konstante iz
  `resources/js/editor/uml-use-case/definitions.ts`. Nikad ne hardkodiraj istu
  dimenziju/boju na dva mjesta (ADR-0003). Ako ti treba nova konstanta, dodaj je
  u `definitions.ts` i referenciraj je s oba mjesta.
- `schemaVersion` i migracijski lanac (`serializer.ts` → `migrate()`) moraju
  ostati konzistentni pri svakoj izmjeni oblika dokumenta.
- Licenca je **MIT** (ADR-0005). Ne dodavati kod ili dependency s copyleft
  licencom (GPL/AGPL) bez izričitog upozorenja u sažetku.
- PostgreSQL + JSONB za perzistenciju dijagrama (ADR-0004) — ne uvoditi
  paralelnu normalizaciju elemenata/veza u zasebne tablice.

## Disciplina opsega

- Radi **isključivo** na paketu opisanom u trenutnom promptu. Plan po etapama je
  u `docs/plan.md` — ako primijetiš da bi nešto iz kasnije etape bilo zgodno
  odraditi "dok si već tu", **nemoj**. Zapiši to u sažetku pod "izvan opsega,
  odgođeno" i nastavi na dodijeljenom zadatku.
- Kod nejasnoće: odaberi najkonzervativnije tumačenje usklađeno s
  `docs/plan.md` i `docs/adr/`, eksplicitno navedi pretpostavku u sažetku, i
  nastavi. Ako je nejasnoća arhitektonska (zahtijevala bi novi ADR ili mijenja
  postojeći), **stani i pitaj** umjesto da nagađaš.
- Ne "popravljaj" stil ili strukturu izvan onoga što zadatak traži (npr. ne
  refaktoriraj nepovezane fajlove usput). Manji diff je uvijek bolji od većeg.

## Git workflow (strogo)

- Nikad ne commituj direktno na `main`. Uvijek radi na branchu imenovanom
  `etapa-N-<kratki-slug>` prema paketu iz prompta.
- Nikad ne radi force-push i ne prepisuj dijeljenu historiju.
- Commituj u manjim, logički odvojenim commitovima s jasnim porukama — ne jedan
  ogroman commit na kraju.
- **Ne otvaraj PR i ne merge-aj.** Push branch i stani — merge radi čovjek nakon
  review-a.
- Ne diraj `docs/adr/*.md` sadržajno. Ako si tokom rada donio arhitektonsku
  odluku koja zaslužuje ADR, predloži novi ADR fajl (npr.
  `docs/adr/000X-naziv.md` sa statusom "predloženo") i to jasno istakni u
  sažetku — nikad tiho ne redefiniraj postojeći ADR.

## Definicija gotovog (za svaki paket)

Prije nego proglasiš paket završenim, MORAŠ:

1. Pokrenuti i proći: `npm run test:unit`, `npm run types:check`,
   `npm run lint:check`, i `php artisan test` ako je backend diran.
2. Dodati/ažurirati automatizirane testove za svaku novu logiku (unit testovi za
   commande/model/geometriju; Playwright samo za happy-path eksplicitno naveden
   u promptu).
3. **Ne smanjivati** postojeće pokrivenost testovima niti brisati/oslabljivati
   testove da bi CI prošao.
4. Ažurirati status paketa u `docs/plan.md` (checkbox/status liniju) ako je
   primjenjivo.

## Šta NIKAD raditi bez izričitog dopuštenja

- Mijenjati `schemas/diagram-document.v1.schema.json` na način koji nije
  aditivan/migracijski.
- Mijenjati licencu (`LICENSE`, ADR-0005).
- Dodavati nove npm/composer dependencyje koji nisu izričito navedeni u
  promptu — ako procijeniš da ti treba dependency, navedi ga u sažetku za
  odobrenje umjesto da ga instaliraš.
- Brisati ili slabiti postojeće testove da bi "CI prošao".
- Dirati `.github/workflows/` osim ako prompt to eksplicitno traži.
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
