# ADR-0004: PostgreSQL + JSONB za perzistenciju dokumenata

**Status:** prihvaćeno · **Datum:** 2026-07-13

## Kontekst
Sadržaj dijagrama je agregat (jedan dokument = jedna cjelina); elementi i veze
se NE normaliziraju u zasebne tablice. Relacijski se spremaju users,
workspaces, projects, diagrams, diagram_revisions.

## Odluka
PostgreSQL 16+, kolona `diagrams.document_json JSONB` (i u
`diagram_revisions`). Laravel migracije: `$table->jsonb('document_json')`.

## Obrazloženje
- JSONB je binarno pohranjen i efikasan za obradu; GIN indeksi kasnije
  omogućavaju pretragu po sadržaju dijagrama bez migracije sheme.
- Za open-source self-hosting Postgres je standardno očekivanje.
- Trošak prelaska s MySQL navika (Carnet): ~1 sat prilagodbe deploy skripti.

## Posljedice
+ Buduće funkcije (pretraga elemenata, statistika) bez restrukturiranja.
− Lokalni dev i CI trebaju Postgres servis (Docker / GitHub Actions service).
