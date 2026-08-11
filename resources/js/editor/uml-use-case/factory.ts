/**
 * Jedino mjesto koje sastavlja nove elemente/veze za UML Use Case plugin.
 * UI kod NIKAD ne smije ručno sastaviti DiagramElement/DiagramConnection —
 * uvijek kroz createElement/createConnection, da UUID-evi i defaulti iz
 * registryja ostanu na jednom mjestu (vidi CLAUDE.md).
 */
import { v4 as uuidv4 } from 'uuid';
import type {
    ConnectionEndpoint,
    ConnectionType,
    DiagramConnection,
    DiagramDocument,
    DiagramElement,
    ElementType,
    Vec2,
} from '../types/document';
import { umlUseCaseRegistry } from './definitions';

/** Containeri (boundary) crtaju se ispod ostalih elemenata (BR pravilo). */
function nextZIndex(doc: DiagramDocument, isContainer: boolean): number {
    if (isContainer) {
        return 0;
    }

    const maxZIndex = doc.elements.reduce(
        (max, el) => Math.max(max, el.zIndex),
        0,
    );

    return maxZIndex + 1;
}

export function createElement(
    type: ElementType,
    position: Vec2,
    doc: DiagramDocument,
): DiagramElement {
    const def = umlUseCaseRegistry.nodes[type];
    const base = {
        id: uuidv4(),
        position: { ...position },
        size: { ...def.defaultSize },
        zIndex: nextZIndex(doc, Boolean(def.isContainer)),
        style: { ...def.defaultStyle },
    };

    switch (type) {
        case 'uml.actor':
            return { ...base, type, data: { label: def.label } };
        case 'uml.use-case':
            return { ...base, type, data: { label: def.label } };
        case 'uml.system-boundary':
            return { ...base, type, data: { label: def.label } };
        case 'uml.note':
            return { ...base, type, data: { text: '' } };
        default: {
            const exhaustive: never = type;

            throw new Error(`Nepoznat tip elementa: ${String(exhaustive)}`);
        }
    }
}

export function createConnection(
    type: ConnectionType,
    source: ConnectionEndpoint,
    target: ConnectionEndpoint,
): DiagramConnection {
    const def = umlUseCaseRegistry.edges[type];

    return {
        id: uuidv4(),
        type,
        source,
        target,
        routing: { type: 'straight', points: [] },
        labels: [],
        style: { ...def.defaultStyle },
    };
}
