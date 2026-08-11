<script setup lang="ts">
/**
 * Kolabirajući "Debug" panel — sirovi JSON model dokumenta, koristan dok
 * ne postoji properties panel (P4). Zatvoren po defaultu da ne guli prostor
 * canvasu; kad je otvoren, ograničen na max-h s vlastitim scrollom.
 *
 * `mounted` guard: doc.metadata.createdAt/updatedAt su generirani s
 * `new Date()` pri kreiranju dokumenta (editor-context.ts), pa se SSR
 * prolaz i client hydration prolaz razlikuju u toj vrijednosti za isti
 * request (Inertia SSR je uključen — config/inertia.php). Bez ovog guarda
 * Vue prijavljuje hydration mismatch na svaki load jer se ta vrijednost
 * pojavljuje kao tekst unutar zatvorenog <details>. Server i prvi client
 * render prikazuju prazan panel; JSON se popunjava tek nakon mounta.
 */
import { computed, inject, onMounted, ref } from 'vue'
import { EDITOR_CONTEXT_KEY } from '../adapter/editor-context'
import { serializeDocument } from '../serialization/serializer'

const ctx = inject(EDITOR_CONTEXT_KEY)!
const json = computed(() => serializeDocument(ctx.doc))
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <details data-testid="debug-panel" class="shrink-0 border-t border-sidebar-border/70 dark:border-sidebar-border">
    <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-muted-foreground select-none">Debug: DiagramDocument JSON</summary>
    <pre v-if="mounted" data-testid="debug-panel-json" class="max-h-64 overflow-auto bg-muted/40 px-4 py-2 text-xs">{{ json }}</pre>
  </details>
</template>
