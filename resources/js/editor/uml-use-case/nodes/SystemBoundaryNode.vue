<script setup lang="ts">
/**
 * Vue Flow prikaz uml.system-boundary — container pravokutnik s labelom
 * gore (isto kao SVG exporter). isContainer:true u registryju znači niži
 * zIndex pri kreiranju (factory.ts), tako da djeca uvijek crtaju iznad.
 */
import type { NodeProps } from '@vue-flow/core';
import { umlUseCaseRegistry } from '../definitions';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ label: string; elementType: string }>>();

const def = umlUseCaseRegistry.nodes['uml.system-boundary'];
const style = def.defaultStyle;
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.system-boundary"
    >
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            class="absolute inset-0 h-full w-full"
        >
            <rect
                x="0"
                y="0"
                width="100"
                height="100"
                :fill="style.fill"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
            />
        </svg>
        <div
            class="pointer-events-none absolute inset-x-0 top-0 text-center text-xs font-semibold text-neutral-800"
            :style="{
                padding: `${def.textPadding.y}px ${def.textPadding.x}px`,
            }"
        >
            {{ props.data.label }}
        </div>
        <UmlNodeHandles :anchors="def.anchors" />
    </div>
</template>
