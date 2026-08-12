/**
 * Dijeljeno stanje editor stranice: dokument (jedini izvor istine),
 * CommandManager, Vue Flow projekcija (nodes/edges) i minimalni selection
 * state. Izloženo kroz provide/inject da EditorTopBar/EditorToolbar/
 * EditorCanvas/PropertiesPanel ne moraju prop-drillati svaki komad zasebno.
 *
 * `selection` (P3b): jedan ili nula ID-eva (single selection). Populira ga
 * EditorCanvas.vue tako što ogleda Vue Flow-ovu UGRAĐENU selekciju
 * (getSelectedNodes iz useVueFlow — klik na node/pane je Vue Flow-ova
 * vlastita logika, ne paralelni sistem), da tipkovnički prečaci
 * (keyboard-shortcuts.ts: Delete/Backspace/Escape) i node komponente
 * (vizuelna oznaka preko props.selected) dijele isto stanje.
 */
import type { InjectionKey, Ref } from 'vue';
import { reactive, ref } from 'vue';
import { CommandManager } from '../commands/command';
import type { ConnectionType, DiagramDocument } from '../types/document';
import { createEmptyDocument } from '../types/document';
import { projectEdges, projectNodes } from './vueflow-adapter';
import type { VfEdge, VfNode } from './vueflow-adapter';

export interface EditorContext {
    /** Id proslijeđen na <VueFlow :id="flowId">, da useVueFlow(flowId) radi iz drugih komponenti. */
    flowId: string;
    doc: DiagramDocument;
    commandManager: CommandManager;
    nodes: Ref<VfNode[]>;
    edges: Ref<VfEdge[]>;
    selection: Ref<string[]>;
    activeConnectionType: Ref<ConnectionType>;
    canUndo: Ref<boolean>;
    canRedo: Ref<boolean>;
    syncProjection: () => void;
}

export const EDITOR_CONTEXT_KEY: InjectionKey<EditorContext> =
    Symbol('editor-context');

export function createEditorContext(documentTitle: string): EditorContext {
    const doc = reactive(createEmptyDocument(documentTitle)) as DiagramDocument;
    const nodes = ref<VfNode[]>([]) as Ref<VfNode[]>;
    const edges = ref<VfEdge[]>([]) as Ref<VfEdge[]>;
    const canUndo = ref(false);
    const canRedo = ref(false);

    function syncProjection(): void {
        nodes.value = projectNodes(doc, nodes.value);
        edges.value = projectEdges(doc, edges.value);
    }

    const commandManager = new CommandManager(doc, () => {
        syncProjection();
        canUndo.value = commandManager.canUndo;
        canRedo.value = commandManager.canRedo;
    });

    syncProjection();

    return {
        flowId: 'editor-flow',
        doc,
        commandManager,
        nodes,
        edges,
        selection: ref<string[]>([]),
        activeConnectionType: ref<ConnectionType>('uml.association'),
        canUndo,
        canRedo,
        syncProjection,
    };
}
