<script setup lang="ts">
/**
 * Renderira Vue Flow Handle za svaki anchor iz NodeDefinition.anchors —
 * dijele je sve uml-use-case node komponente da se STANDARD_ANCHORS
 * (definitions.ts) ne ponavlja u svakoj po četvrti put.
 *
 * connection-mode="loose" na <VueFlow> dopušta da svaki handle bude i
 * izvor i cilj veze, zato je type uvijek "source".
 */
import { Handle, Position } from '@vue-flow/core';
import type { AnchorDefinition } from '../../types/definitions';

defineProps<{ anchors: AnchorDefinition[] }>();

const POSITION_BY_ANCHOR_ID: Record<string, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};
</script>

<template>
    <Handle
        v-for="anchor in anchors"
        :id="anchor.id"
        :key="anchor.id"
        type="source"
        :position="POSITION_BY_ANCHOR_ID[anchor.id] ?? Position.Top"
    />
</template>
