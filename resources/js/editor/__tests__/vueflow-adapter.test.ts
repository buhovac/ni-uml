import { describe, expect, it } from 'vitest';
import { dragStopToCommands } from '../adapter/vueflow-adapter';
import { CommandManager } from '../commands/command';
import { AddElementCommand } from '../commands/commands';
import { createEmptyDocument } from '../types/document';
import type { SystemBoundaryElement, UseCaseElement } from '../types/document';

const boundary = (id: string): SystemBoundaryElement => ({
    id,
    type: 'uml.system-boundary',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 0,
    style: { fill: '#fafafa', stroke: '#222', strokeWidth: 1.5, fontSize: 15 },
    data: { label: 'Sustav' },
});

const useCase = (
    id: string,
    position = { x: 700, y: 100 },
): UseCaseElement => ({
    id,
    type: 'uml.use-case',
    position,
    size: { width: 170, height: 80 },
    zIndex: 1,
    style: { fill: '#fff', stroke: '#222', strokeWidth: 2, fontSize: 14 },
    data: { label: 'Rezervacija termina' },
});

describe('dragStopToCommands', () => {
    it('obična pomjeranja bez preklapanja s boundaryjem daju MoveElementsCommand', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(useCase('u1')));

        const cmds = dragStopToCommands(
            [{ id: 'u1', position: { x: 750, y: 150 } }],
            doc,
        );
        expect(cmds).toHaveLength(1);
        expect(cmds[0].name).toBe('move-elements');

        cm.dispatch(cmds[0]);
        expect(doc.elements[0].position).toEqual({ x: 750, y: 150 });
        expect(doc.elements[0].parentId).toBeUndefined();
    });

    it('drag centra elementa u boundary daje ChangeParentCommand s relativnom pozicijom', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(boundary('b1')));
        cm.dispatch(new AddElementCommand(useCase('u1', { x: 700, y: 100 })));

        // boundary je na (100,100)-(500,400) apsolutno; ciljamo centar use casea na (250,220)
        const cmds = dragStopToCommands(
            [{ id: 'u1', position: { x: 165, y: 180 } }],
            doc,
        );
        expect(cmds).toHaveLength(1);
        expect(cmds[0].name).toBe('change-parent');

        cm.dispatch(cmds[0]);
        const el = doc.elements.find((e) => e.id === 'u1')!;
        expect(el.parentId).toBe('b1');
        // apsolutna (165,180) - boundary abs (100,100) = relativna (65,80)
        expect(el.position).toEqual({ x: 65, y: 80 });

        cm.undo();
        const restored = doc.elements.find((e) => e.id === 'u1')!;
        expect(restored.parentId).toBeUndefined();
        expect(restored.position).toEqual({ x: 700, y: 100 });
    });

    it('drag elementa iz boundaryja van daje ChangeParentCommand s undefined parentom i apsolutnom pozicijom', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(boundary('b1')));
        const child = useCase('u1', { x: 50, y: 60 });
        child.parentId = 'b1';
        cm.dispatch(new AddElementCommand(child));

        // izvuci ga daleko od boundaryja (boundary je 100,100 - 500,400)
        const cmds = dragStopToCommands(
            [{ id: 'u1', position: { x: 900, y: 900 } }],
            doc,
        );
        expect(cmds).toHaveLength(1);
        expect(cmds[0].name).toBe('change-parent');

        cm.dispatch(cmds[0]);
        const el = doc.elements.find((e) => e.id === 'u1')!;
        expect(el.parentId).toBeUndefined();
        // apsolutna pozicija = boundary abs (100,100) + relativna drag pozicija (900,900)
        expect(el.position).toEqual({ x: 1000, y: 1000 });
    });

    it('drag unutar ISTOG boundaryja (i dalje unutar) ostaje MoveElementsCommand, ne reparenta ponovo', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(boundary('b1')));
        const child = useCase('u1', { x: 50, y: 60 });
        child.parentId = 'b1';
        cm.dispatch(new AddElementCommand(child));

        // pomjeri unutar istog boundaryja (i dalje relativno unutar 0..400 x 0..300)
        const cmds = dragStopToCommands(
            [{ id: 'u1', position: { x: 80, y: 90 } }],
            doc,
        );
        expect(cmds).toHaveLength(1);
        expect(cmds[0].name).toBe('move-elements');

        cm.dispatch(cmds[0]);
        const el = doc.elements.find((e) => e.id === 'u1')!;
        expect(el.parentId).toBe('b1');
        expect(el.position).toEqual({ x: 80, y: 90 });
    });

    it('system-boundary elementi se nikad ne reparentaju (nema ugniježđenih boundaryja)', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(boundary('outer')));
        cm.dispatch(new AddElementCommand(boundary('inner')));

        const cmds = dragStopToCommands(
            [{ id: 'inner', position: { x: 150, y: 150 } }],
            doc,
        );
        expect(cmds).toHaveLength(1);
        expect(cmds[0].name).toBe('move-elements');
    });

    it('drag bez stvarne promjene pozicije i bez promjene parenta ne daje nijedan command', () => {
        const doc = createEmptyDocument('Test');
        const cm = new CommandManager(doc);
        cm.dispatch(new AddElementCommand(useCase('u1', { x: 700, y: 100 })));

        const cmds = dragStopToCommands(
            [{ id: 'u1', position: { x: 700, y: 100 } }],
            doc,
        );
        expect(cmds).toHaveLength(0);
    });
});
