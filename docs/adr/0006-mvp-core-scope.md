# ADR-0004: MVP Core / MVP Polish podjela opsega

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Odluka
**MVP Core:** auth, projekti, dijagrami, 4 UML elementa (actor, use case,
boundary, note), 4 veze (association, include, extend, generalization),
properties panel, move/resize/delete, undo/redo, zoom/pan, autosave,
optimistic locking, JSON Schema + osnovna UML validacija, JSON/SVG/PNG export,
ponovno učitavanje.

**MVP Polish (tek kad Core radi end-to-end):** copy/paste, duplicate,
multi-selection, alignment, z-index UI, grid konfiguracija, JSON import,
kontrolne točke linija, minimap, shortcut panel, thumbnaili, revisions UI,
templatei.

**Nakon MVP-a:** PDF, share linkovi, workspaces UI, komentari, real-time,
auto-layout, orthogonal routing, ostali UML dijagrami.

## Obrazloženje
JSON *export* je obavezan (korisnik može napustiti platformu s podacima);
JSON *import* nije potreban za dokazivanje vrijednosti prve javne verzije.
Workspace tablice postoje u bazi od početka (osobni workspace pri
registraciji), ali bez ikakvog UI-ja u MVP-u.
