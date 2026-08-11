<script setup lang="ts">
/**
 * Top bar: naziv (statičan za sada — pravi naziv dolazi s backendom u P6c),
 * undo/redo, zoom prikaz, fit view, snap-to-grid toggle, save status
 * placeholder (P5/P7), export, i dropdown za tip veze koji se koristi za
 * sljedeći connect gesture na canvasu (generiran iz
 * umlUseCaseRegistry.edges, ne hardkodiran).
 *
 * Snap-to-grid toggle mutira ctx.doc.canvas.snapToGrid DIREKTNO (ne kroz
 * Command) — ADR-0002 zabranjuje direktnu mutaciju doc.elements/
 * doc.connections iz UI koda, ali canvas.snapToGrid je postavka platna, ne
 * element/veza, pa ne nosi undo/redo semantiku (kao ni zoom nivo). Blago
 * je siva zona jer je ipak dio istog reactive doc objekta — ako se ovo
 * pokaže pogrešnim (npr. treba undo za snap toggle), lako je kasnije
 * prebaciti na Command.
 */
import { useVueFlow } from '@vue-flow/core';
import { computed, inject } from 'vue';
import { Button } from '@/components/ui/button';
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context';
import { exportToSvg } from '../export/svg-exporter';
import { umlUseCaseRegistry } from '../uml-use-case/definitions';

const ctx = inject(EDITOR_CONTEXT_KEY)!;
const { canUndo, canRedo, activeConnectionType } = ctx;

const { viewport, fitView } = useVueFlow(ctx.flowId);
const zoomPercent = computed(() => Math.round(viewport.value.zoom * 100));
const connectionTypes = Object.values(umlUseCaseRegistry.edges);

function handleUndo(): void {
    ctx.commandManager.undo();
}

function handleRedo(): void {
    ctx.commandManager.redo();
}

function handleFitView(): void {
    void fitView();
}

function handleExport(): void {
    const svg = exportToSvg(ctx.doc, umlUseCaseRegistry, {
        background: '#ffffff',
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
}
</script>

<template>
    <header
        data-testid="editor-topbar"
        class="flex h-14 shrink-0 items-center gap-4 border-b border-sidebar-border/70 px-4 dark:border-sidebar-border"
    >
        <span data-testid="diagram-title" class="text-sm font-semibold"
            >Untitled diagram</span
        >

        <div class="flex items-center gap-1">
            <Button
                data-testid="undo-button"
                variant="outline"
                size="sm"
                :disabled="!canUndo"
                @click="handleUndo"
                >Undo</Button
            >
            <Button
                data-testid="redo-button"
                variant="outline"
                size="sm"
                :disabled="!canRedo"
                @click="handleRedo"
                >Redo</Button
            >
        </div>

        <label class="flex items-center gap-1 text-sm text-muted-foreground">
            Connection type
            <select
                v-model="activeConnectionType"
                data-testid="connection-type-select"
                class="rounded-md border bg-background px-2 py-1 text-sm"
            >
                <option
                    v-for="edgeDef in connectionTypes"
                    :key="edgeDef.type"
                    :value="edgeDef.type"
                >
                    {{ edgeDef.label }}
                </option>
            </select>
        </label>

        <span data-testid="zoom-level" class="text-sm text-muted-foreground"
            >{{ zoomPercent }}%</span
        >

        <Button
            data-testid="fit-view-button"
            variant="outline"
            size="sm"
            @click="handleFitView"
            >Fit View</Button
        >

        <label class="flex items-center gap-1 text-sm text-muted-foreground">
            <input
                v-model="ctx.doc.canvas.snapToGrid"
                type="checkbox"
                data-testid="snap-to-grid-toggle"
            />
            Snap to grid
        </label>

        <div class="ml-auto flex items-center gap-4">
            <span
                data-testid="save-status"
                class="text-sm text-muted-foreground"
                >Local only</span
            >
            <Button
                data-testid="export-button"
                variant="outline"
                size="sm"
                @click="handleExport"
                >Export SVG</Button
            >
        </div>
    </header>
</template>
