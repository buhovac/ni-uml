# ADR-0005: Licenca projekta — MIT

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Kontekst
Primarni ciljevi projekta: javni portfolio, edukacijski sadržaj (building in
public), adopcija, kontribucije, self-hosting. Copyleft SaaS zaštita nije cilj.

## Odluka
**MIT licenca.** Razlozi: najjednostavnija za razumijevanje i kontribuciju,
usklađena s cijelim ekosistemom projekta (Vue Flow, Vue, Pinia, Ajv, Laravel —
svi MIT), bez trenja za korporativne i edukacijske korisnike.

Razmatrano: Apache-2.0 (eksplicitni patent grant) — odbačeno radi
jednostavnosti; AGPL-3.0 (zaštita od zatvorenih SaaS forkova) — odbačeno jer
je vrijednost projekta reputacijska i distribucijska, ne ekskluzivnost koda.

## Posljedice
+ Maksimalna adopcija; kontributori ne trebaju pravnu analizu.
+ Sve dependency licence kompatibilne bez posebnih obaveza.
− Komercijalni zatvoreni forkovi su dopušteni — svjesna i prihvaćena odluka.

Nositelj copyrighta: Nov Inicium SRL i kontributori (vidi LICENSE).
