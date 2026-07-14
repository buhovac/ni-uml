# ADR-0001: Vue Flow kao interaction/rendering engine editora

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Kontekst
Prvotna specifikacija opisivala je vlastiti SVG canvas engine (Interaction
Controller, Connection Manager, Geometry Engine kao kompletne implementacije).
Procjena: 3–6 mjeseci rada na infrastrukturi koju korisnik ne percipira kao
vrijednost, uz ograničeno raspoloživo vrijeme (contracting + studij).

## Odluka
Vue Flow (MIT, Vue 3, TypeScript) preuzima: zoom/pan, drag, selection,
connection handles, reconnect, nested nodes, resize (@vue-flow/node-resizer),
viewport i pointer logiku. Vue Flow se koristi u **controlled modeu**
(`:apply-default="false"`); svi eventi se prevode u commande.

Poglavlja 16.3–16.8 originalne analize redefiniraju se kao tanki UML-specifični
slojevi iznad Vue Flowa, ne kao kompletne implementacije.

## Posljedice
+ Mjeseci ušteđenog rada na canvas interakcijama.
+ MIT licenca kompatibilna s našom distribucijom.
− Editor nodeovi su HTML/DOM → SVG export mora biti zaseban renderer (ADR-0003).
− Ovisnost o vanjskoj biblioteci → ublaženo adapterom (ADR-0002).
