<script setup lang="ts">
/**
 * JEDNA parametrizirana edge komponenta za sve uml.* tipove veza, umjesto
 * 4 gotovo identične komponente — association/include/extend/generalization
 * se razlikuju SAMO po podacima (stroke/dash/arrowEnd/umlLabel), koji već
 * postoje u umlUseCaseRegistry.edges (isto načelo kao svg-exporter.ts:
 * jedan renderConnection() koji čita registry, ne 4 zasebne funkcije).
 * Registrirana je pod 4 Vue Flow edge slota (#edge-uml-association itd.)
 * u EditorCanvas.vue jer Vue Flow rutira po točnom imenu slota, ali sve
 * vode na ISTU komponentu — vidi sažetak sesije za obrazloženje izbora.
 *
 * Ravna linija (bez <BaseEdge>) jer routing.type je uvijek 'straight'
 * (ADR-driven model), pa nema potrebe za Vue Flow-ovim bezier/step path
 * helperima — isti pristup kao svg-exporter.ts (M x y L x y).
 *
 * stroke/dash/marker/labela računaju se u edge-visuals.ts (čista funkcija,
 * unit testirana) umjesto inline u komponenti.
 *
 * PRIPREMA za P4 (ne puna implementacija, vidi P3b prompt): nevidljiva šira
 * putanja paralelno uz vidljivu liniju, standardni Vue Flow obrazac za
 * interaction hit-area (isto rade Vue Flow-ove ugrađene edge komponente
 * preko <BaseEdge>-ovog interactionWidth, samo ručno jer ne koristimo
 * BaseEdge — vidi napomenu gore). `.vue-flow__edges` ima
 * pointer-events:none (base stylesheet), pa vidljiva linija ostaje
 * neklikabilna; hit-area putanja eksplicitno dobije
 * pointer-events:stroke da NJU bude moguće pogoditi mišem. Namjerno NEMA
 * @click/@dblclick handlera — klik-select/delete za veze dolazi u P4
 * zajedno s properties panelom (treba odluka o kombinovanom element/edge
 * selection stateu).
 */
import type { EdgeProps } from '@vue-flow/core';
import { computed } from 'vue';
import type { ConnectionType } from '../../types/document';
import { edgeVisualFor } from './edge-visuals';

const props = defineProps<EdgeProps<{ connectionType: ConnectionType }>>();

const visual = computed(() => edgeVisualFor(props.data.connectionType));

const pathD = computed(
    () =>
        `M ${props.sourceX} ${props.sourceY} L ${props.targetX} ${props.targetY}`,
);

/** Automatska UML labela (npr. '<<include>>') na sredini linije — isto pravilo kao svg-exporter.ts renderConnection(). */
const labelPosition = computed(() => ({
    x: props.sourceX + (props.targetX - props.sourceX) * 0.5,
    y: props.sourceY + (props.targetY - props.sourceY) * 0.5 - 6,
}));
</script>

<template>
    <path
        :d="pathD"
        fill="none"
        stroke="transparent"
        stroke-width="16"
        style="pointer-events: stroke"
        :data-testid="`connection-hit-area-${id}`"
    />
    <path
        :d="pathD"
        fill="none"
        :stroke="visual.stroke"
        :stroke-width="visual.strokeWidth"
        :stroke-dasharray="visual.dashArray"
        :marker-end="visual.markerEnd"
        :data-testid="`connection-${id}`"
        :data-connection-type="data.connectionType"
    />
    <text
        v-if="visual.label"
        :x="labelPosition.x"
        :y="labelPosition.y"
        text-anchor="middle"
        font-size="11"
        font-style="italic"
        fill="#222222"
    >
        {{ visual.label }}
    </text>
</template>
