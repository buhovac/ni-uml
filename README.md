# <Ime projekta>

Open-source **UML-first** editor dijagrama: slobodno vizualno modeliranje +
semantička UML pravila, validacija i otvoren, verzioniran format dokumenta.

> Nije "još jedan draw.io klon": elementi razumiju UML (smjer `<<include>>`
> veze, actor izvan system boundaryja, generalization kompatibilnost...),
> validator upozorava umjesto da blokira, a dokument je čitljiv JSON sa
> `schemaVersion` — tvoji podaci nisu zaključani u alat.

## Status
🚧 U razvoju — Etapa 0 (project foundation). Plan: [`docs/plan.md`](docs/plan.md)
· Arhitektura: [`docs/adr/`](docs/adr/)

## Stack
Laravel · Vue 3 + TypeScript · Inertia · Vue Flow (editor engine) ·
PostgreSQL/JSONB · Pinia · Ajv · Vitest · Pest · Playwright

## Arhitektura u jednoj slici
```text
DiagramDocument (izvor istine, verzioniran JSON)
 ├── Command Manager (undo/redo)
 ├── UML Validator
 ├── Serializer / Migrator
 ├── Vue Flow Adapter → editor (interakcije)
 └── SVG Export Renderer (dijeli definicije s editorom)
```

## Lokalno pokretanje
```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
# PostgreSQL: vidi docs/ (docker run ... postgres:16)
php artisan migrate
composer run dev
```

## Testovi
```bash
npm run test:unit   # Vitest — editor jezgra
php artisan test    # Pest — backend
npm run test:e2e    # Playwright
```

## Licenca
Vidi [LICENSE](LICENSE) i [ADR-0005](docs/adr/0005-project-license.md).
