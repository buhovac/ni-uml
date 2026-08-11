<script setup lang="ts">
/**
 * Centralna zona: Vue Flow canvas. Prevodi Vue Flow evente u Commande kroz
 * adapter (dragStopToCommand) i factory (createConnection) — nikad ne
 * mutira doc direktno (ADR-0002).
 *
 * Vue Flow je za sada u default (apply-default) modu za nodeove — puni
 * controlled mode (:apply-default="false") s NodeChange/EdgeChange
 * filtriranjem dolazi u P3b.
 *
 * Edge tipovi: adapter (vueflow-adapter.ts) već projektuje ispravan
 * `type`/`data.connectionType` po vezi — nije trebalo ništa mijenjati tamo,
 * samo prestati force-overridati ga na Vue Flow-ov built-in 'straight'
 * (kako je bilo u P3a) i registrirati UmlEdge komponentu po tipu.
 */
import { Controls } from '@vue-flow/controls';
import '@vue-flow/controls/dist/style.css';
import { ConnectionMode, VueFlow } from '@vue-flow/core';
import type { Connection, NodeDragEvent } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { inject } from 'vue';
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context';
import { dragStopToCommand } from '../adapter/vueflow-adapter';
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

function onNodeDragStop(event: NodeDragEvent): void {
    const dragged = event.nodes.map((n) => ({
        id: n.id,
        position: { x: n.position.x, y: n.position.y },
    }));
    const cmd = dragStopToCommand(dragged, ctx.doc);

    if (cmd) {
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
            v-model:nodes="nodes"
            :edges="edges"
            :connection-mode="ConnectionMode.Loose"
            class="h-full w-full"
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
