<script setup lang="ts">
/**
 * Vue Flow prikaz uml.note — presavijeni ugao (folded corner), isti oblik
 * kao SVG exporter (renderElement 'uml.note'), normaliziran na 0..100.
 */
import type { NodeProps } from '@vue-flow/core';
import { computed } from 'vue';
import { umlUseCaseRegistry } from '../definitions';
import { strokeStyleFor } from './selection-style';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ text: string; elementType: string }>>();

const def = umlUseCaseRegistry.nodes['uml.note'];
const style = def.defaultStyle;
const strokeStyle = computed(() => strokeStyleFor(style, props.selected));
const fold = 16;
const bodyPath = `M 0 0 H ${100 - fold} L 100 ${fold} V 100 H 0 Z`;
const cornerPath = `M ${100 - fold} 0 V ${fold} H 100`;
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.note"
    >
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            class="absolute inset-0 h-full w-full"
        >
            <path
                :d="bodyPath"
                :fill="style.fill"
                :stroke="strokeStyle.stroke"
                :stroke-width="strokeStyle.strokeWidth"
            />
            <path
                :d="cornerPath"
                fill="none"
                :stroke="strokeStyle.stroke"
                :stroke-width="strokeStyle.strokeWidth"
            />
        </svg>
        <div
            class="absolute inset-0 overflow-hidden text-left text-xs whitespace-pre-wrap text-neutral-800"
            :style="{
                padding: `${def.textPadding.y}px ${def.textPadding.x}px`,
            }"
        >
            {{ props.data.text }}
        </div>
        <UmlNodeHandles :anchors="def.anchors" />
    </div>
</template>
