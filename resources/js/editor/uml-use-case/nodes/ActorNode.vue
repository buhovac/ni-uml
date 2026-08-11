<script setup lang="ts">
/**
 * Vue Flow prikaz uml.actor — stick figure geometrija čita ISTE omjere
 * (ACTOR_GEOMETRY) i istu formulu kao SVG exporter (export/svg-exporter.ts:
 * renderElement 'uml.actor'), samo s abs.x/abs.y=0 jer je ovo lokalni
 * koordinatni sistem node-a (ADR-0003: jedan izvor istine za geometriju).
 *
 * viewBox MORA odgovarati stvarnim pikselnim dimenzijama node-a
 * (props.dimensions), ne proizvoljnom 0..100 prostoru — kvadratni viewBox
 * razvučen preko nekvadratnog boxa (70×110 default) s
 * preserveAspectRatio="none" deformira krug (glavu) u elipsu. Dok
 * dimensions nije izmjeren (prvi frame prije Vue Flow-ovog
 * ResizeObservera), koristi se defaultSize iz registryja kao fallback da
 * se izbjegne trenutni r=0 flash.
 *
 * Stil (stroke/strokeWidth) je za sada uvijek defaultStyle iz registryja —
 * per-element style override dolazi s properties panelom (P4/P6).
 */
import type { NodeProps } from '@vue-flow/core';
import { computed } from 'vue';
import { ACTOR_GEOMETRY } from '../definitions';
import { umlUseCaseRegistry } from '../definitions';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ label: string; elementType: string }>>();

const def = umlUseCaseRegistry.nodes['uml.actor'];
const style = def.defaultStyle;
const g = ACTOR_GEOMETRY;

const width = computed(() => props.dimensions.width || def.defaultSize.width);
const height = computed(
    () => props.dimensions.height || def.defaultSize.height,
);

const figureH = computed(() => height.value * g.figureHeightRatio);
const cx = computed(() => width.value / 2);
const r = computed(() => width.value * g.headRadiusRatio);
const headCy = computed(() => figureH.value * g.headCenterY + r.value / 2);
const neckY = computed(() => headCy.value + r.value);
const shoulderY = computed(() => figureH.value * g.shoulderY);
const hipY = computed(() => figureH.value * g.hipY);
const armHalf = computed(() => (width.value * g.armSpanRatio) / 2);
const legLeftX = computed(() => width.value * 0.15);
const legRightX = computed(() => width.value * 0.85);
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.actor"
    >
        <svg
            :viewBox="`0 0 ${width} ${height}`"
            class="absolute inset-0 h-full w-full overflow-visible"
        >
            <circle
                :cx="cx"
                :cy="headCy"
                :r="r"
                fill="none"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
                stroke-linecap="round"
            />
            <line
                :x1="cx"
                :y1="neckY"
                :x2="cx"
                :y2="hipY"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
                stroke-linecap="round"
            />
            <line
                :x1="cx - armHalf"
                :y1="shoulderY"
                :x2="cx + armHalf"
                :y2="shoulderY"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
                stroke-linecap="round"
            />
            <line
                :x1="cx"
                :y1="hipY"
                :x2="legLeftX"
                :y2="figureH"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
                stroke-linecap="round"
            />
            <line
                :x1="cx"
                :y1="hipY"
                :x2="legRightX"
                :y2="figureH"
                :stroke="style.stroke"
                :stroke-width="style.strokeWidth"
                stroke-linecap="round"
            />
        </svg>
        <div
            class="absolute inset-x-0 flex justify-center text-center text-xs font-medium text-neutral-800"
            :style="{ top: `${g.figureHeightRatio * 100}%` }"
        >
            {{ props.data.label }}
        </div>
        <UmlNodeHandles :anchors="def.anchors" />
    </div>
</template>
