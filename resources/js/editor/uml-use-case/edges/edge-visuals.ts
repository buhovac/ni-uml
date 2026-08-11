/**
 * Čista funkcija: uml.* connection type → vizuelni atributi za crtanje
 * (stroke/dash/marker/labela). Izdvojena iz UmlEdge.vue da bude testabilna
 * bez DOM-a (vitest environment ovog projekta je 'node', vidi
 * keyboard-shortcuts.ts). Marker URL-ovi upućuju na <marker> ID-eve
 * definirane u UmlEdgeMarkers.vue.
 */
import type { ArrowEnd, ConnectionType } from '../../types/document';
import { umlUseCaseRegistry } from '../definitions';

export interface EdgeVisual {
    stroke: string;
    strokeWidth: number;
    dashArray?: string;
    markerEnd?: string;
    label?: string;
}

const MARKER_URL_BY_ARROW_END: Partial<Record<ArrowEnd, string>> = {
    open: 'url(#uml-edge-arrow-open)',
    'triangle-hollow': 'url(#uml-edge-arrow-triangle-hollow)',
};

export function edgeVisualFor(type: ConnectionType): EdgeVisual {
    const def = umlUseCaseRegistry.edges[type];
    const style = def.defaultStyle;

    return {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        dashArray: style.dash?.join(' '),
        markerEnd: MARKER_URL_BY_ARROW_END[style.arrowEnd],
        label: def.umlLabel,
    };
}
