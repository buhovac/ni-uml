<script setup lang="ts">
/**
 * Vue Flow prikaz uml.use-case — elipsa + centrirana labela.
 * Stil je uvijek defaultStyle iz registryja (vidi napomenu u ActorNode.vue).
 */
import type { NodeProps } from '@vue-flow/core';
import { umlUseCaseRegistry } from '../definitions';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ label: string; elementType: string }>>();

const def = umlUseCaseRegistry.nodes['uml.use-case'];
const style = def.defaultStyle;
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.use-case"
    >
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            class="absolute inset-0 h-full w-full"
        >
            <ellipse
                cx="50"
                cy="50"
                rx="50"
                ry="50"
                :fill="style.fill"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
            />
        </svg>
        <div
            class="absolute inset-0 flex items-center justify-center text-center text-xs font-medium text-neutral-800"
            :style="{
                padding: `${def.textPadding.y}px ${def.textPadding.x}px`,
            }"
        >
            {{ props.data.label }}
        </div>
        <UmlNodeHandles :anchors="def.anchors" />
    </div>
</template>
