# Etapa 0 — Exit checklist

## Demonstracija
- [ ] `php artisan serve` + otvorena stranica rendera Vue (Inertia) komponentu
- [ ] Javni GitHub repo postoji, `main` zaštićen CI provjerom

## Automatizirani testovi
- [ ] `npm run test:unit` — prolazi (min. editor skeleton testovi, 11 kom)
- [ ] `php artisan test` — prolazi (min. starter primjer)
- [ ] `npx playwright test` — smoke test prolazi lokalno
- [ ] CI (frontend + backend job) zeleno na pushu

## Build i kvaliteta
- [ ] `npm run build` bez grešaka
- [ ] `npm run typecheck` bez grešaka
- [ ] `npm run lint` bez grešaka
- [ ] `vendor/bin/pint --test` bez grešaka
- [ ] `php artisan migrate` prolazi na PostgreSQL-u

## Dokumentacija
- [ ] README s pozicioniranjem i uputama za lokalno pokretanje
- [ ] `docs/analysis.md` (originalna analiza) u repou
- [ ] `docs/plan.md` (etape razvoja) u repou
- [ ] ADR 0001–0006 u `docs/adr/` — NIJEDAN sa statusom "predloženo"
- [ ] LICENSE fajl u rootu

## Eksplicitno NE raditi u ovoj etapi
- autentifikacija, projekti, baza dijagrama, pravi editor, kompleksni storeovi
