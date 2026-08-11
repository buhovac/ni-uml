<script setup lang="ts">
/**
 * Trajna editor stranica (zamjenjuje bivši EditorSpike.vue — vidi CLAUDE.md
 * disciplinu opsega: privremene spike stranice se ne dograđuju, nego
 * zamjenjuju). Sama je tanka: sastavlja EditorContext i četiri zone,
 * cijela logika izmjene dokumenta živi u Command sustavu i adapteru.
 */
import { Head } from '@inertiajs/vue3';
import { onMounted, onUnmounted, provide } from 'vue';
import {
    createEditorContext,
    EDITOR_CONTEXT_KEY,
} from '@/editor/adapter/editor-context';
import { createKeyboardShortcutHandler } from '@/editor/commands/keyboard-shortcuts';
import EditorCanvas from '@/editor/components/EditorCanvas.vue';
import EditorDebugPanel from '@/editor/components/EditorDebugPanel.vue';
import EditorToolbar from '@/editor/components/EditorToolbar.vue';
import EditorTopBar from '@/editor/components/EditorTopBar.vue';
import PropertiesPanelPlaceholder from '@/editor/components/PropertiesPanelPlaceholder.vue';

const ctx = createEditorContext('Untitled diagram');
provide(EDITOR_CONTEXT_KEY, ctx);

const handleKeydown = createKeyboardShortcutHandler(
    ctx.commandManager,
    ctx.selection,
);

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
    <Head title="Editor" />

    <div data-testid="editor-page" class="flex h-screen flex-col">
        <EditorTopBar />

        <div class="flex min-h-0 flex-1">
            <EditorToolbar />
            <EditorCanvas />
            <PropertiesPanelPlaceholder />
        </div>

        <EditorDebugPanel />
    </div>
</template>
