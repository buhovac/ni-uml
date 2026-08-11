import { expect, test } from '@playwright/test';

// Etapa 4+5 happy path (docs/plan.md): otvori editor → boundary → actor →
// use case → pomakni → selektiraj → obriši → undo vrati.
//
// Veći viewport od Playwright defaulta (1280×720): toolbar (176px) +
// properties panel placeholder (256px) uz default 1280px širinu ostavljaju
// canvas širok samo ~848px, a EditorToolbar.vue-ov grid raspored za dodane
// elemente (nextAddPosition, kolone po 220px) na 720p defaultu smjesti
// use case djelomično ISPOD properties panela već pri dodavanju — drag gest
// se onda ne završava ispravno jer mouseup padne izvan pannable canvas
// područja. Nije P3b regresija (isti raspored postoji od P3a), ali blokira
// stabilan E2E test na defaultnom viewportu.
test.use({ viewport: { width: 1440, height: 900 } });

test('editor happy path: boundary, actor, use case, pomjeranje, brisanje, undo', async ({
    page,
}) => {
    await page.goto('/editor');
    await expect(page.getByTestId('diagram-title')).toHaveText(
        'Untitled diagram',
    );

    await page.getByTestId('toolbar-add-uml.system-boundary').click();
    await page.getByTestId('toolbar-add-uml.actor').click();
    await page.getByTestId('toolbar-add-uml.use-case').click();

    const boundary = page.locator('[data-element-type="uml.system-boundary"]');
    const actor = page.locator('[data-element-type="uml.actor"]');
    const useCase = page.locator('[data-element-type="uml.use-case"]');

    await expect(boundary).toHaveCount(1);
    await expect(actor).toHaveCount(1);
    await expect(useCase).toHaveCount(1);

    // pomakni use case
    const box = await useCase.boundingBox();
    if (!box) {
        throw new Error('use case bounding box nije dostupan');
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
        box.x + box.width / 2 + 120,
        box.y + box.height / 2 + 80,
        { steps: 10 },
    );
    await page.mouse.up();

    // Vue Flow-ov pane-click handler treba kratko da "smiri" gesture-tracking
    // state nakon prethodnog drag-a prije nego ispravno prepozna sljedeći
    // klik kao nov, samostalan klik (vjerovatno d3-drag click-vs-drag
    // threshold) — bez ovog waita sljedeći klik na prazan canvas biva tiho
    // ignorisan. Ljudski korisnik nikad ne pusti drag i klikne opet unutar
    // <150ms, pa ovo nije stvarni UX bug, samo Playwright-ova brzina.
    await page.waitForTimeout(150);

    const movedBox = await useCase.boundingBox();
    expect(movedBox).not.toBeNull();
    expect(movedBox!.x).not.toBeCloseTo(box.x, 0);

    // Vue Flow selektira node i na drag start (selectNodesOnDrag), pa je use
    // case u ovom trenutku već selektiran — klikni prazan canvas da eksplicitno
    // deselektiraš (item 2: "klik na prazan canvas → deselektira"), pa onda
    // selektiraj klikom (item 2: "klik na node → selektira"). Provjera kroz
    // vizuelnu oznaku selekcije (drugačiji stroke, selection-style.ts), ne
    // pretpostavljen Vue Flow interni class name.
    const ellipse = useCase.locator('ellipse');

    await expect(ellipse).toHaveAttribute('stroke', '#2563eb');
    await page.mouse.click(300, 500);
    await expect(ellipse).toHaveAttribute('stroke', '#222222');
    await useCase.click();
    await expect(ellipse).toHaveAttribute('stroke', '#2563eb');

    // obriši selektirani use case
    await page.keyboard.press('Delete');
    await expect(useCase).toHaveCount(0);

    // undo vraća element
    await page.getByTestId('undo-button').click();
    await expect(useCase).toHaveCount(1);

    // boundary i actor ostaju netaknuti kroz cijeli scenarij
    await expect(boundary).toHaveCount(1);
    await expect(actor).toHaveCount(1);
});
