<script setup lang="ts">
/**
 * Vue Flow prikaz uml.actor — stick figure geometrija čita ISTE omjere
 * (ACTOR_GEOMETRY) kao SVG exporter (export/svg-exporter.ts), samo
 * normalizirane na 0..100 viewBox jer node ne zna svoju pikselnu veličinu
 * unaprijed (ADR-0003: jedan izvor istine za geometriju).
 *
 * Stil (stroke/strokeWidth) je za sada uvijek defaultStyle iz registryja —
 * per-element style override dolazi s properties panelom (P4/P6).
 */
import type { NodeProps } from '@vue-flow/core';
import { ACTOR_GEOMETRY } from '../definitions';
import { umlUseCaseRegistry } from '../definitions';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ label: string; elementType: string }>>();

const def = umlUseCaseRegistry.nodes['uml.actor'];
const style = def.defaultStyle;

const g = ACTOR_GEOMETRY;
const figureH = 100 * g.figureHeightRatio;
const cx = 50;
const r = 100 * g.headRadiusRatio;
const headCy = figureH * g.headCenterY + r / 2;
const neckY = headCy + r;
const shoulderY = figureH * g.shoulderY;
const hipY = figureH * g.hipY;
const armHalf = (100 * g.armSpanRatio) / 2;
const legLeftX = 100 * 0.15;
const legRightX = 100 * 0.85;
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.actor"
    >
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
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
