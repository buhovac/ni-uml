<script setup lang="ts">
/**
 * SVG <marker> definicije za edge arrowheads — renderirane JEDNOM (ne po
 * edgeu) jer su ID-evi globalni u dokumentu. Geometrija namjerno vizuelno
 * odgovara export/svg-exporter.ts (markerDefs()), ali kod nije dijeljen:
 * ADR-0003 traži isti VIZUELNI identitet, ne bit-identičan markup, a
 * svg-exporter.ts je izvan opsega ovog paketa (ne dira se). ID-evi su
 * prefiksirani 'uml-edge-' da se ne sudare s Vue Flow-ovim internim
 * defaultnim markerima.
 */
</script>

<template>
    <svg width="0" height="0" aria-hidden="true" class="absolute">
        <defs>
            <marker
                id="uml-edge-arrow-open"
                viewBox="0 0 12 12"
                refX="11"
                refY="6"
                markerWidth="10"
                markerHeight="10"
                orient="auto-start-reverse"
            >
                <path
                    d="M 1 1 L 11 6 L 1 11"
                    fill="none"
                    stroke="#222222"
                    stroke-width="1.6"
                />
            </marker>
            <marker
                id="uml-edge-arrow-triangle-hollow"
                viewBox="0 0 14 14"
                refX="13"
                refY="7"
                markerWidth="12"
                markerHeight="12"
                orient="auto-start-reverse"
            >
                <path
                    d="M 1 1 L 13 7 L 1 13 Z"
                    fill="#ffffff"
                    stroke="#222222"
                    stroke-width="1.4"
                />
            </marker>
        </defs>
    </svg>
</template>
