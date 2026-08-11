<script setup lang="ts">
/**
 * Lijevi toolbar — GENERIRAN iz umlUseCaseRegistry.nodes. Nema hardkodiranih
 * dugmadi po tipu: novi element u registryju automatski dobije dugme ovdje
 * bez izmjene ove komponente (CLAUDE.md).
 *
 * Klik dodaje element na determinističku "kaskadnu" poziciju (drag-from-
 * toolbar je P3b). Boundary ide na poziciju 0,0 tako da odmah ima prostora
 * da se u nju drag-uju drugi elementi.
 */
import { inject } from 'vue';
import { Button } from '@/components/ui/button';
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context';
import { AddElementCommand } from '../commands/commands';
import type { ElementType } from '../types/document';
import { umlUseCaseRegistry } from '../uml-use-case/definitions';
import { createElement } from '../uml-use-case/factory';

const ctx = inject(EDITOR_CONTEXT_KEY)!;

const nodeDefinitions = Object.values(umlUseCaseRegistry.nodes);

function nextAddPosition(type: ElementType): { x: number; y: number } {
    if (umlUseCaseRegistry.nodes[type].isContainer) {
        return { x: 60, y: 60 };
    }

    const nonContainerCount = ctx.doc.elements.filter(
        (el) => !umlUseCaseRegistry.nodes[el.type].isContainer,
    ).length;
    const column = nonContainerCount % 4;
    const row = Math.floor(nonContainerCount / 4) % 4;

    return { x: 560 + column * 220, y: 100 + row * 180 };
}

function handleAdd(type: ElementType): void {
    const element = createElement(type, nextAddPosition(type), ctx.doc);
    ctx.commandManager.dispatch(new AddElementCommand(element));
}
</script>

<template>
    <aside
        data-testid="editor-toolbar"
        class="flex w-44 shrink-0 flex-col gap-2 overflow-y-auto border-r border-sidebar-border/70 p-3 dark:border-sidebar-border"
    >
        <Button
            v-for="def in nodeDefinitions"
            :key="def.type"
            :data-testid="`toolbar-add-${def.type}`"
            variant="outline"
            class="justify-start"
            @click="handleAdd(def.type)"
        >
            {{ def.label }}
        </Button>
    </aside>
</template>
