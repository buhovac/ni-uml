# ADR-0003: Zaseban SVG export renderer + zajedničke definicije

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Kontekst
Vue Flow nodeovi su HTML — SVG export ne može serijalizirati DOM.

## Odluka
SVG exporter čita isključivo `DiagramDocument` + `DiagramTypeRegistry`.
Editor komponente i exporter DIJELE: defaultSize, stilove, anchore,
textPadding, `ACTOR_GEOMETRY` omjere, `wrapText()` i font definicije.
Nijedan renderer ne smije sam odlučivati o geometriji elementa.

## Revidirani FR63
Izvezeni rezultat vjerno predstavlja sadržaj, geometriju, stilove i semantiku
dokumenta; dopuštene su manje razlike u renderiranju teksta između HTML i SVG
okruženja. Isti elementi, položaji, dimenzije, vrste linija, smjerovi strelica,
boje i tekst — bez obećanja pixel-perfect identičnosti.

## Determinizam mjerenja teksta
`TextMeasurer` interfejs ima dvije implementacije: canvas `measureText`
(editor, vizualno najtačniji) i `approximateMeasurer` (deterministički,
snapshot testovi i Node okruženje). Razlika među njima je tačno tolerancija
koju FR63 dopušta. Snapshot testovi SMIJU koristiti samo deterministički
measurer da CI bude stabilan preko OS-ova.
