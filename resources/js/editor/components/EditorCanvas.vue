<script setup lang="ts">
/**
 * Centralna zona: Vue Flow canvas. Prevodi Vue Flow evente u Commande kroz
 * adapter (dragStopToCommands) i factory (createConnection) — nikad ne
 * mutira doc direktno (ADR-0002).
 *
 * CONTROLLED MODE (P3b): `:apply-default="false"` isključuje Vue Flow-ovo
 * automatsko primjenjivanje promjena na SVOJ interni store. `nodes`/`edges`
 * propovi ostaju STRIKTNO jednosmjerni (nema v-model) — jedini way da se
 * promjene: `syncProjection()` u editor-context.ts nakon Command dispatcha.
 *
 * I dalje ručno zovemo `applyNodeChanges`/`applyEdgeChanges` (store akcije
 * iz useVueFlow(), ne deprecated standalone utili iz '@vue-flow/core') na
 * SVAKU promjenu (@nodes-change/@edges-change) — ovo NIJE zaobilaženje
 * controlled moda, nego namjerna dva sloja: Vue Flow-ov interni store i
 * dalje daje glatku vizuelnu vrijednost tokom drag-a/selekcije (position,
 * dimensions, select promjene), ali NIKAD nije izvor istine — `doc` ostaje
 * jedini izvor istine, a `nodes`/`edges` propovi (izvedeni iz `doc` kroz
 * projectNodes/projectEdges) uvijek na kraju prevagnu kad se dispatcha
 * Command (syncProjection generiše nov niz koji Vue Flow ponovo pomiri sa
 * svojim internim stanjem). Provjereno u node_modules/@vue-flow/core/dist:
 * ovo je tačno isti mehanizam koji `applyDefault:true` radi automatski
 * (watch na state.applyDefault kači/skida isti handler) — razlika je što
 * SADA MI biramo šta se primjenjuje, umjesto da se to desi bez naše
 * kontrole.
 *
 * `delete-key-code="null"` gasi Vue Flow-ov vlastiti Backspace-delete
 * (postoji po defaultu, radi direktno na internom storeu mimo
 * CommandManagera) — brisanje ide ISKLJUČIVO kroz
 * createKeyboardShortcutHandler (keyboard-shortcuts.ts) → DeleteElementsCommand.
 *
 * SELEKCIJA (klik na node, klik na prazan canvas = deselect) je Vue
 * Flow-ova UGRAĐENA logika (handleNodeClick/onPaneClick u izvoru) — nije
 * gated iza apply-default, radi već "besplatno". Mi samo SINHRONIZUJEMO
 * ctx.selection (dijeljen s tipkovničkim prečacima) iz Vue Flow-ovog
 * getSelectedNodes, i node komponente čitaju props.selected za vizuelnu
 * oznaku (nema paralelnog selection sistema).
 */
import { Controls } from '@vue-flow/controls';
import '@vue-flow/controls/dist/style.css';
import { ConnectionMode, useVueFlow, VueFlow } from '@vue-flow/core';
import type {
    Connection,
    EdgeChange,
    NodeChange,
    NodeDragEvent,
} from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { inject, watch } from 'vue';
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context';
import { dragStopToCommands } from '../adapter/vueflow-adapter';
import { AddConnectionCommand } from '../commands/commands';
import UmlEdge from '../uml-use-case/edges/UmlEdge.vue';
import UmlEdgeMarkers from '../uml-use-case/edges/UmlEdgeMarkers.vue';
import { createConnection } from '../uml-use-case/factory';
import ActorNode from '../uml-use-case/nodes/ActorNode.vue';
import NoteNode from '../uml-use-case/nodes/NoteNode.vue';
import SystemBoundaryNode from '../uml-use-case/nodes/SystemBoundaryNode.vue';
import UseCaseNode from '../uml-use-case/nodes/UseCaseNode.vue';

const ctx = inject(EDITOR_CONTEXT_KEY)!;
const { nodes, edges, activeConnectionType } = ctx;

const { applyNodeChanges, applyEdgeChanges, getSelectedNodes } = useVueFlow(
    ctx.flowId,
);

// Vue Flow-ova selekcija je ugrađena (radi bez apply-default) — samo je
// ogledamo u ctx.selection da keyboard-shortcuts.ts ima na čemu raditi.
watch(getSelectedNodes, (selected) => {
    ctx.selection.value = selected.map((n) => n.id);
});

function onNodesChange(changes: NodeChange[]): void {
    applyNodeChanges(changes);
}

function onEdgesChange(changes: EdgeChange[]): void {
    applyEdgeChanges(changes);
}

function onNodeDragStop(event: NodeDragEvent): void {
    const dragged = event.nodes.map((n) => ({
        id: n.id,
        position: { x: n.position.x, y: n.position.y },
    }));

    for (const cmd of dragStopToCommands(dragged, ctx.doc)) {
        ctx.commandManager.dispatch(cmd);
    }
}

function onConnect(connection: Connection): void {
    const conn = createConnection(
        activeConnectionType.value,
        {
            elementId: connection.source,
            anchorId: connection.sourceHandle ?? 'right',
        },
        {
            elementId: connection.target,
            anchorId: connection.targetHandle ?? 'left',
        },
    );

    ctx.commandManager.dispatch(new AddConnectionCommand(conn));
}
</script>

<template>
    <section data-testid="editor-canvas" class="relative h-full min-h-0 w-full">
        <VueFlow
            :id="ctx.flowId"
            :nodes="nodes"
            :edges="edges"
            :apply-default="false"
            :delete-key-code="null"
            :snap-to-grid="ctx.doc.canvas.snapToGrid"
            :snap-grid="[ctx.doc.canvas.gridSize, ctx.doc.canvas.gridSize]"
            :connection-mode="ConnectionMode.Loose"
            class="h-full w-full"
            @nodes-change="onNodesChange"
            @edges-change="onEdgesChange"
            @node-drag-stop="onNodeDragStop"
            @connect="onConnect"
        >
            <Controls />
            <UmlEdgeMarkers />

            <template #node-uml-actor="nodeProps">
                <ActorNode v-bind="nodeProps" />
            </template>
            <template #node-uml-use-case="nodeProps">
                <UseCaseNode v-bind="nodeProps" />
            </template>
            <template #node-uml-system-boundary="nodeProps">
                <SystemBoundaryNode v-bind="nodeProps" />
            </template>
            <template #node-uml-note="nodeProps">
                <NoteNode v-bind="nodeProps" />
            </template>

            <template #edge-uml-association="edgeProps">
                <UmlEdge v-bind="edgeProps" />
            </template>
            <template #edge-uml-include="edgeProps">
                <UmlEdge v-bind="edgeProps" />
            </template>
            <template #edge-uml-extend="edgeProps">
                <UmlEdge v-bind="edgeProps" />
            </template>
            <template #edge-uml-generalization="edgeProps">
                <UmlEdge v-bind="edgeProps" />
            </template>
        </VueFlow>
    </section>
</template>

<style>
/*
 * Vue Flow-ov edges SVG sloj (.vue-flow__edges) je po defaultu
 * position:static bez z-indexa. Svaki .vue-flow__node dobije inline
 * z-index (CSS pravilo: pozicionirani elementi sa z-indexom uvijek crtaju
 * IZNAD nepozicioniranih), pa veza prema elementu unutar system boundaryja
 * ispadne vizuelno sakrivena ispod boundaryjevog opaque filla — koordinate
 * su ispravne (Vue Flow ih već računa apsolutno preko computedPosition),
 * problem je čisto slojevni. svg-exporter.ts nema ovaj problem jer tamo se
 * SVE veze crtaju NAKON svih elemenata (uvijek na vrhu) — ovo je isti
 * vizuelni ishod za editor, samo kroz CSS umjesto redoslijeda crtanja.
 *
 * .vue-flow__edges je javna, dokumentirana klasa iz Vue Flow-ovog
 * isporučenog stylesheeta (namijenjena override-u — theme-default.css je
 * eksplicitno označen kao "optional" u njihovoj dokumentaciji), ne interni
 * API. Namjerno NIJE scoped (Vue Flow-ove DOM elemente ne renderira ovaj
 * template, scoped atribut ih ne bi pogodio — isto pravilo kao za CSS
 * importe u <script>, vidi Vue Flow README).
 */
.vue-flow .vue-flow__edges {
    position: absolute !important;
    inset: 0;
    z-index: 1000 !important;
}
</style>
