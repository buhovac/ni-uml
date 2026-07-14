# ADR-0002: Vlastiti DiagramDocument model kao izvor istine

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Odluka
`DiagramDocument` (schemaVersion, metadata, canvas, elements, connections) je
jedini izvor istine. Vue Flow nodes/edges su **projekcija** izvedena adapterom.
Tok: Vue Flow event → adapter → Command → mutacija dokumenta → inkrementalno
patchana projekcija (nepromijenjeni nodeovi zadržavaju referencu — bitno za
NFR performansi od 200 elemenata / 400 veza).

## Ključni detalj: relativne koordinate djece
Pozicija elementa s `parentId` sprema se **relativno prema parentu**, usklađeno
s Vue Flow `parentNode` semantikom. Apsolutne dokumentne koordinate razrješava
geometry sloj (`absolutePosition()`), koji koriste exporter i anchor izračuni.

## Posljedice
+ Rendering biblioteka je zamjenjiva; sequence dijagram kasnije može imati
  vlastiti renderer nad istom jezgrom.
+ Import/export, revizije, migracije i validacija rade nad stabilnim formatom.
− Adapter je dodatni sloj koji treba održavati i testirati.
