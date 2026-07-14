# Analiza i koncepcija: open-source aplikacija za izradu UML dijagrama

> **Napomena o statusu (2026-07):** Ovaj dokument je izvorna analiza i koncepcija
> proizvoda. Neke rane arhitektonske dileme (npr. custom canvas engine vs. gotova
> biblioteka) razriješene su naknadno i formalizirane u
> [`docs/adr/`](adr/). Gdje se ovaj dokument i ADR-ovi razlikuju, **ADR-ovi imaju
> prednost**. Ključne finalizirane odluke:
> - Editor koristi **Vue Flow** kao interaction/rendering engine, ne custom canvas
>   engine (ADR-0001). Poglavlja 16.3–16.8 zato opisuju *konceptualne odgovornosti*,
>   a ne nužno zasebne implementacije — većinu preuzima Vue Flow.
> - `DiagramDocument` je izvor istine; Vue Flow je projekcija (ADR-0002).
> - SVG export je zaseban renderer koji dijeli definicije s editorom (ADR-0003).
> - Perzistencija: PostgreSQL + JSONB (ADR-0004).
> - Licenca: MIT (ADR-0005).
> - Opseg: MVP Core / MVP Polish podjela (ADR-0006).

---

## 1. Opći opis projekta

Cilj projekta je razviti besplatnu open-source web-aplikaciju za vizualno
modeliranje UML dijagrama.

Prva verzija aplikacije bit će usmjerena na izradu **UML Use Case dijagrama**, dok
će jezgra sustava biti dizajnirana kao **generički editor dijagrama** koji se
kasnije može proširiti podrškom za: class, activity, component, deployment,
state-machine, sequence, package i druge tehničke i poslovne dijagrame.

Aplikacija neće pokušavati odmah konkurirati Figmi, Lucidchartu ili draw.io po
opsegu funkcionalnosti. Fokus prve verzije mora biti na stabilnom modelu
dokumenta, pouzdanom editoru i ispravnoj UML semantici.

## 2. Problem koji aplikacija rješava

Postojeći alati za izradu dijagrama često imaju jedan ili više nedostataka:
napredne funkcionalnosti dostupne su samo kroz plaćenu pretplatu; besplatne
verzije imaju ograničen broj projekata ili dijagrama; alati su prekompleksni za
studente i manje projekte; korisničko sučelje nije usmjereno na UML; korisnik može
nacrtati vizualno ispravan dijagram koji je semantički pogrešan; projekti se
spremaju u vlasničke formate; self-hosting nije podržan; alat nije moguće
jednostavno proširiti vlastitim vrstama dijagrama i elemenata.

Predložena aplikacija treba omogućiti jednostavno crtanje UML dijagrama, potpunu
kontrolu nad podacima i arhitekturu koja podržava buduće proširenje.

### Pozicioniranje (finalizirano)

Projekt **nije** "besplatna alternativa draw.io" — to pozicioniranje je preslabo i
netočno (draw.io je već besplatan, open-source i self-hostable). Ispravno
pozicioniranje:

> Open-source **UML-first** editor koji kombinira slobodno vizualno modeliranje sa
> semantičkim UML pravilima, validacijom i otvorenim verzioniranim formatom
> dokumenta.

Diferencijacija: UML-aware elementi, kontekstualni properties panel, semantička
validacija, ispravni smjerovi veza, upozorenja za pogrešne odnose, verzionirani
JSON, self-hosting, proširiva plugin arhitektura.

## 3. Vizija proizvoda

Aplikacija treba postati modularna web-platforma za modeliranje dijagrama koja ima:
generičku jezgru za rad s čvorovima, vezama, tekstom i kontejnerima; posebne module
za svaku vrstu UML dijagrama; strukturirani i verzionirani format dokumenta;
mogućnost lokalnog hostanja; otvoreni izvorni kod; mogućnost izvoza i prijenosa
projekata bez vezivanja uz platformu.

**Ključna arhitektonska odluka:** aplikacija se ne smije graditi kao Use Case
editor s posebno kodiranim ovalima i akterima. Mora se graditi kao **generički
diagram engine** u kojem je Use Case dijagram prvi instalirani tip dijagrama.

## 4. Opseg prve verzije

### 4.1. MVP funkcionalnosti

Registracija i prijava; kreiranje projekata; kreiranje Use Case dijagrama;
otvaranje i uređivanje postojećeg dijagrama; system boundary; akteri; use case
elementi; tekstualne labele i bilješke; povezivanje elemenata (association,
include, extend, generalization); anchor pointovi; povlačenje, skaliranje i
pozicioniranje; properties panel; zoom i pan; grid i snapping; odabir jednog ili
više elemenata; copy/paste/duplicate; undo i redo; promjena redoslijeda;
spremanje i autosave; izvoz u PNG, SVG i JSON; ponovno učitavanje; osnovna UML
validacija.

### 4.2. Funkcionalnosti nakon MVP-a

PDF izvoz; predlošci; read-only dijeljenje; real-time suradnja; komentari; povijest
revizija; javni/privatni projekti; timski workspaces; PlantUML/Mermaid
import/export; XMI; auto-layout; orthogonal routing; minimap; layers panel;
presentation mode; ostali UML dijagrami; plugin sustav.

### 4.3. Izvan početnog opsega

Kompleksna real-time kolaboracija; audio/video; AI generiranje; desktop app;
mobilni editor; kompleksna organizacijska prava; potpuna kompatibilnost sa svim UML
alatima; generiranje koda; reverse engineering; Git-style verzioniranje; beskonačno
velik canvas s tisućama elemenata.

## 5. Ciljne skupine

**Primarne:** studenti informatike, nastavnici, software developeri, business
analitičari, projektni menadžeri, UX/system dizajneri, manje razvojne ekipe,
open-source zajednice.

**Sekundarne:** edukacijske ustanove, škole i fakulteti, kompanije koje trebaju
self-hosted rješenje, treneri i predavači, osobe kojima treba jednostavan alat za
tehničku dokumentaciju.

## 6. Aktori sustava

- **Posjetitelj:** početna stranica, dokumentacija, javni dijagram, registracija,
  demo editor.
- **Registrirani korisnik:** upravljanje projektima, kreiranje/uređivanje/spremanje
  dijagrama, izvoz, predlošci, revizije, dijeljenje.
- **Suradnik** (kasnija faza): pregled, uređivanje uz dopuštenje, komentari, uvid u
  izmjene drugih.
- **Administrator:** upravljanje korisnicima, deaktivacija računa, statistike, javni
  predlošci, podržane vrste dijagrama, sistemske greške.
- **Vanjski sustavi:** autentifikacijski servis, object storage, mail, PDF
  generator, monitoring/logging.

## 7. Funkcionalni zahtjevi (sažetak)

Puni popis (FR01–FR70) organiziran je u kategorije: upravljanje korisnicima i
projektima (FR01–FR07); upravljanje dijagramima (FR08–FR15); elementi dijagrama
(FR16–FR28); veze (FR29–FR41); radna površina (FR42–FR51); povijest i spremanje
(FR52–FR57); izvoz i prijenos (FR58–FR63); UML validacija (FR64–FR70).

**Napomena (ADR-0003):** FR63 je revidiran. Umjesto "izvezeni rezultat mora
odgovarati prikazu u editoru", vrijedi: *izvezeni rezultat mora vjerno predstavljati
sadržaj, geometriju, stilove i semantiku dokumenta, uz dopuštene manje razlike u
renderiranju teksta između HTML i SVG okruženja.* Ne obećava se pixel-perfect
identičnost HTML nodeova i SVG izvoza.

## 8. Nefunkcionalni zahtjevi

- **Performanse:** fluidno povlačenje; bez backend zahtjeva po svakom mišjem
  događaju; rad s najmanje 200 elemenata i 400 veza bez značajnog usporavanja;
  debounce/batch spremanje; zoom i pan na klijentskoj strani.
- **Pouzdanost:** nikad djelomično nevažeći JSON; jasno prikazan neuspjeh
  spremanja; lokalna kopija nespremljenih promjena; eksplicitna potvrda brisanja;
  migracije starijih verzija formata.
- **Sigurnost:** vlasnik za svaki projekt; nema pristupa tuđim privatnim projektima;
  backend ponovno provjerava sva dopuštenja; sanitizacija teksta; bez proizvoljnog
  HTML/JS u modelu; ograničenja veličine JSON-a; zaštita od XSS, CSRF, IDOR;
  validacija sheme pri importu.
- **Upotrebljivost:** najčešće operacije bez više dijaloga; jasan toolbar; properties
  panel po tipu elementa; vidljiv status spremanja; anchor pointovi samo kad su
  relevantni; greške uz element; tipkovnički prečaci.
- **Pristupačnost:** okolni UI zadovoljava WCAG AA; toolbar i properties panel
  dostupni tipkovnicom; tekstualni nazivi za screen readere; boja nije jedini
  indikator; vidljiv fokus; uređivanje položaja/veličine kroz panel. Potpuna
  pristupačnost vizualnog canvasa je dugoročni cilj, ne obećanje prve verzije.
- **Kompatibilnost:** aktualne verzije Chromea, Edgea, Firefoxa, Safarija;
  browser-neovisan dokument; izvoz s fallback fontovima.
- **Održivost:** odvojene odgovornosti frontenda i backenda; UML pravila izvan
  generičkog canvasa; svaki tip dijagrama zaseban modul; `schemaVersion` u formatu;
  novi tipovi elemenata bez prepisivanja jezgre.
- **Open-source:** jasna licenca (MIT); lokalni instalacijski koraci; neovisnost o
  jednom cloud provideru; pokretljivost lokalno; izvoz u otvorenom formatu.

## 9. Poslovna i domenska pravila (BR01–BR18)

Ključna: svaki dijagram pripada jednom projektu (BR01); svaki projekt ima vlasnika
(BR02); svaki element ima stabilan UUID (BR03); veza referencira postojeći početni i
završni element (BR04); brisanje elementa uklanja/obrađuje njegove veze (BR05); use
case mora imati naziv (BR06); system boundary sadrži druge elemente (BR07); actor je
najčešće izvan boundaryja (BR08); include usmjeren prema uključenom use caseu (BR10);
extend prema osnovnom use caseu (BR11); generalization koristi prazan trokut na
strani općenitijeg elementa (BR12); vizualni položaj ne određuje identitet (BR14);
dokument ima broj verzije (BR17); containment je dio modela, ne samo vizualni preklop
(BR18).

## 10–12. Use case katalog, detaljni use case-ovi, user stories

Katalog UC01–UC20 (registracija, prijava, kreiranje projekta/dijagrama, otvaranje,
dodavanje/uređivanje/premještanje elementa, povezivanje, promjena svojstava veze,
canvas, undo/redo, spremanje, izvoz, uvoz, validacija, brisanje, dijeljenje,
predlošci, administracija).

Detaljno razrađeni tokovi za UC04 (kreiranje dijagrama), UC06 (dodavanje elementa),
UC07 (uređivanje), UC09 (povezivanje), UC13 (spremanje), UC14 (izvoz), UC16
(validacija) — s glavnim i alternativnim tijekovima te pred/postuvjetima. User
stories US01–US06 s acceptance kriterijima.

## 13. Konceptualni model domene

Entiteti: **User, Workspace, WorkspaceMember, Project, Diagram, DiagramRevision,
Template, ShareLink.** (Puni popis atributa u izvornoj specifikaciji.)

## 14. Model samog dijagrama

**Hibridni model:** projekti, korisnici, dijagrami i revizije spremaju se
relacijski; sadržaj pojedinog dijagrama sprema se kao strukturirani JSON dokument
(agregat). Razlozi: svi elementi su jedan agregat; spremanje cijelog dokumenta
pojednostavljuje undo/import/export/revizije; različite vrste dijagrama imaju
različite strukture; novi tipovi elemenata ne zahtijevaju stalne migracije baze;
dokument je lako prenijeti između instalacija.

Struktura dokumenta (`DiagramDocument`): `schemaVersion`, `diagramType`, `metadata`,
`canvas`, `elements[]`, `connections[]`. Struktura elementa: `id`, `type`,
`parentId?`, `position`, `size`, `rotation`, `zIndex`, `data`, `style`. Struktura
veze: `id`, `type`, `source{elementId,anchorId}`, `target{...}`, `routing`,
`labels[]`, `style`. (Kanonske TypeScript definicije: `resources/js/editor/types/`.)

## 15. Hijerarhija elemenata

Generička jezgra poznaje apstrakcije: `DiagramElement → Node (ShapeNode, TextNode,
ImageNode, ContainerNode), Edge, Label, Group`. Use Case modul definira:
`UmlUseCaseNode`, `UmlActorNode`, `UmlSystemBoundary` (container), `UmlNoteNode`, te
`UmlAssociationEdge`, `UmlIncludeEdge`, `UmlExtendEdge`, `UmlGeneralizationEdge`. Ista
struktura implementirana je kompozicijom i TypeScript diskriminiranim union tipovima
(ne klasičnim nasljeđivanjem).

## 16. Arhitektura frontend editora (konceptualne odgovornosti)

> Uz Vue Flow (ADR-0001), dio ovih odgovornosti preuzima biblioteka. Popis ostaje
> koristan kao mapa odgovornosti: Editor Shell, Document Store, Renderer,
> Interaction Controller, Selection Manager, Connection Manager, Geometry Engine,
> Routing Engine, **Command Manager** (vlastiti — undo/redo), Serializer, UML
> Validator. Za MVP je SVG prikladniji od HTML canvasa za *export* jer omogućuje
> skalabilan izlaz, rad s tekstom i jednostavne arrowhead markere.

## 17. Plugin arhitektura

Svaka vrsta dijagrama registrira `DiagramTypeDefinition` (`nodeTypes`, `edgeTypes`,
`toolbarItems`, `validators`, `defaultCanvas`). Generički editor ne mora znati što
znači `uml.class` — mora znati kako prikazati node, pomicati ga, povezati i
serializirati. (Kanonski registry za Use Case: `resources/js/editor/uml-use-case/`.)

## 18–20. Koordinatni sustav, anchor pointovi, containeri

Koordinate se spremaju u **document coordinate** sustavu, ne screen. Razlikovati
screen/viewport/document/local. Zoom i pan ne mijenjaju stvarne x/y. Transformacija:
`screenPoint = documentPoint × zoom + viewportOffset`, inverz pri unosu.

Anchor pointovi su **relativni** (0..1) unutar elementa (lijevi centar `0,0.5`; desni
`1,0.5`; itd.) — ostaju ispravni nakon resizea, ne ovise o apsolutnoj veličini.

System boundary je **container** sa semantičkom ulogom: dijete ima `parentId`;
pomicanje boundaryja pomiče djecu; z-index ispod djece; brisanje nudi zadržavanje ili
brisanje djece (MVP: zadržava djecu, uklanja `parentId`). Priprema za buduće
packages, swimlanes, components, deployment nodes.

## 21–23. Properties panel i stanja

Properties panel se **generira iz definicije elementa** (zajednička, tekstualna,
vizualna svojstva; svojstva veze). Editor tools: select, pan, create-node,
create-edge, text, erase. Interaction state (idle, dragging, resizing,
drawing-connection, box-selecting, panning, editing-text). Document state (clean,
dirty, saving, saved, save-error, conflict, offline).

## 24–27. Backend, baza, API, concurrency

Backend: Laravel, Inertia za navigaciju i standardne stranice, **zasebni JSON API
endpointi za editor**, PostgreSQL. Editor radi klijentski; backend prima periodične
serializirane verzije. Tablice: users, workspaces, workspace_members, projects,
diagrams (s `document_json JSONB`, `version`, `schema_version`), diagram_revisions,
templates, share_links.

API: RESTful za projekte i dijagrame; `PUT /api/diagrams/{diagram}/document` za
spremanje s `{version, schemaVersion, document}`; `409 Conflict` pri neslaganju
verzija. **Optimistic concurrency:** dijagram ima `version`; server sprema samo ako se
verzije podudaraju, inače 409 — bitno i prije real-time kolaboracije (isti dijagram u
više tabova).

## 28–29. UML Use Case elementi i validacija

Elementi: Actor (stick figure), Use Case (elipsa), System Boundary (container), Note
(folded corner). Veze: Association (puna, bez arrowheada), Include (dashed, otvoreni
arrowhead, `<<include>>`), Extend (dashed, otvoreni arrowhead, `<<extend>>`),
Generalization (puna, prazan trokut).

Validacijska pravila (UCV001–UCV010): use case bez naziva; veza prema nepostojećem
elementu; smjer include/extend; association nekompatibilnih elemenata; actor unutar
boundaryja; boundary bez naziva; generalization nekompatibilnih tipova; nepostojeći
`parentId`; kružna container hijerarhija. **Razlika error vs. warning:** referenca na
nepostojeći element je greška; actor u boundaryju je upozorenje; prazna labela je
upozorenje. Alat pomaže korisniku, ne blokira svaki nestandardni prikaz.

## 30–35. Sekvence i strukturni dijagrami

Sekvence dodavanja elementa, povezivanja i spremanja (svaka izmjena → Command →
Document Store → Renderer → debounced autosave). Package, component i deployment
dijagram aplikacije dokumentirani u izvornoj specifikaciji.

## 36–37. Testiranje i tehničke zamke

Testiranje: unit (koordinate, anchori, snapping, bounding box, serializer, migracije,
UML validatori, commandi), component, integracijski, E2E, performance, export.

**Najveće zamke** (i kako ih izbjegavamo): prerano vezivanje uz rendering biblioteku
(→ vlastiti model, ADR-0002); spremanje SVG/HTML kao izvora (→ JSON izvor istine);
pogrešan koordinatni sustav; **undo prekasno** (→ command pattern od početka);
veze koje pamte samo koordinate (→ ID elemenata i anchori); container kao običan
pravokutnik; text editing; routing linija; prerana real-time kolaboracija; nepostojanje
`schemaVersion`; **nedeterministički export** (→ editor i export dijele geometriju i
stilove, ADR-0003); prevelika sloboda/strogost UML editora.

## 38. Faze razvoja

Vidi [`docs/plan.md`](plan.md) za detaljan, revidirani plan po etapama (Etapa 0–15,
milestoneovi M0–M15).

## 39. MVP kriteriji prihvaćanja

MVP je završen kada korisnik može: registrirati se i prijaviti; kreirati projekt i
Use Case dijagram; dodati system boundary, aktere, use case elemente; unositi nazive;
pomicati/skalirati; povezivati (association, include, extend, generalization);
mijenjati svojstva; koristiti anchore, zoom/pan, undo/redo; spremiti i ponovno
učitati identičan dijagram; izvesti PNG/SVG/JSON; uvesti JSON; pokrenuti osnovnu UML
validaciju; napraviti dijagram približne složenosti primjeru.

## 40. Traceability matrica

Povezuje FR → use case → komponentu → test (npr. FR08→UC04→Diagram Management→E2E;
FR29→UC09→Connection Manager→Connection E2E; FR52→UC12→Command Manager→undo test;
FR59→UC14→Export Engine→SVG structure test). Puna matrica u izvornoj specifikaciji.

## 41. Buduća podrška za druge UML dijagrame

Class (strukturirane sekcije, atributi, metode, aggregation/composition,
multiplicity); Activity (action, decision, fork/join, swimlane, control flow);
Component (interface, portovi, dependency); Deployment (nested nodes, artifacts,
devices); Sequence (poseban plugin s vlastitim layout pravilima — vertikalna
vremenska os, lifeline, activation, poruke, fragmenti). Svi dijele selection,
commands, properties, serialization i export.

## 42. Preporučene ključne tehničke odluke

SVG za export; Vue + TypeScript; Laravel za auth/projekte/persistence; **JSON
document kao izvor istine**; relacijska baza za metadata i ownership; **command
pattern od početka**; plugin registry; stabilni UUID; versioned JSON schema;
optimistic locking; generirani properties panel; odvojeni geometry i routing; UML
validacija kao poseban sloj; bez real-time i naprednog auto-layouta u MVP-u.

## 43. Predložena struktura projekta

```text
app/Domain,Http,Models,Policies,Services
resources/js/editor/{core,commands,geometry,interactions,routing,
                     serialization,validation,state,types}
resources/js/renderers/svg
resources/js/diagram-types/uml-use-case
resources/js/components/{toolbar,properties,canvas,validation}
resources/js/pages/{projects,diagrams}
```

## 44. Temeljni zaključak

Najveća vrijednost projekta neće biti sam oval, actor ili linija — nego **generička
jezgra** koja pouzdano upravlja dokumentom, koordinatama, elementima, containerima,
vezama, anchor pointovima, selekcijom, transformacijama, undo/redo, serializacijom,
validacijom, migracijama i izvozom. Use Case dijagram je prva konkretna implementacija
iznad te jezgre — struktura koja omogućava da aplikacija kasnije postane širi UML alat
bez prepisivanja osnovnog editora.
