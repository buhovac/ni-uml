<script setup lang="ts">
/**
 * Centralna zona: Vue Flow canvas. Prevodi Vue Flow evente u Commande kroz
 * adapter (dragStopToCommand) i factory (createConnection) — nikad ne
 * mutira doc direktno (ADR-0002).
 *
 * Vue Flow je za sada u default (apply-default) modu za nodeove — puni
 * controlled mode (:apply-default="false") s NodeChange/EdgeChange
 * filtriranjem dolazi u P3b. Edge tipovi se trenutno crtaju kao Vue Flow
 * built-in 'straight' (bez markera/dash-a po UML tipu veze) — prava
 * per-tip vizualizacija veza (dashed include/extend, hollow triangle
 * generalization) nije dio P3a opsega, vidi sažetak sesije.
 */
import { Controls } from '@vue-flow/controls';
import '@vue-flow/controls/dist/style.css';
import { ConnectionMode, VueFlow } from '@vue-flow/core';
import type { Connection, NodeDragEvent } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { computed, inject } from 'vue';
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context';
import { dragStopToCommand } from '../adapter/vueflow-adapter';
import { AddConnectionCommand } from '../commands/commands';
import { createConnection } from '../uml-use-case/factory';
import ActorNode from '../uml-use-case/nodes/ActorNode.vue';
import NoteNode from '../uml-use-case/nodes/NoteNode.vue';
import SystemBoundaryNode from '../uml-use-case/nodes/SystemBoundaryNode.vue';
import UseCaseNode from '../uml-use-case/nodes/UseCaseNode.vue';

const ctx = inject(EDITOR_CONTEXT_KEY)!;
const { nodes, edges, activeConnectionType } = ctx;

/** Vue Flow ne zna za naše semantičke edge tipove (još nema custom edge komponenti) — crta ih kao 'straight'. */
const flowEdges = computed(() =>
    edges.value.map((e) => ({ ...e, type: 'straight' })),
);

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
            :edges="flowEdges"
            :connection-mode="ConnectionMode.Loose"
            class="h-full w-full"
            @node-drag-stop="onNodeDragStop"
            @connect="onConnect"
        >
            <Controls />

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
        </VueFlow>
    </section>
</template>
