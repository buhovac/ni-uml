/**
 * Vizuelna oznaka selektiranog elementa — dijele je sve 4 node komponente
 * (ActorNode/UseCaseNode/SystemBoundaryNode/NoteNode) da se ista boja/debljina
 * ne ponavlja 4 puta. Koristi Vue Flow-ov ugrađeni `selected` prop (vidi
 * EditorCanvas.vue), ne paralelni selection sistem.
 */
import type { ElementStyle } from '../../types/document';

export const SELECTED_STROKE_COLOR = '#2563eb';

export function strokeStyleFor(
    base: ElementStyle,
    selected: boolean,
): { stroke: string; strokeWidth: number } {
    if (!selected) {
        return { stroke: base.stroke, strokeWidth: base.strokeWidth };
    }

    return { stroke: SELECTED_STROKE_COLOR, strokeWidth: base.strokeWidth + 1 };
}
