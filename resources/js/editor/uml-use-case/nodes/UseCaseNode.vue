<script setup lang="ts">
/**
 * Vue Flow prikaz uml.use-case — elipsa + centrirana labela.
 * Stil je uvijek defaultStyle iz registryja (vidi napomenu u ActorNode.vue).
 *
 * Resize (P3c): <NodeResizer> vidljiv samo kad je selektiran
 * (:is-visible="props.selected", ista oznaka kao stroke boja). min-width/
 * min-height iz def.minSize (registry — jedan izvor istine, ne magic
 * broj ovdje). dispatchResizeEnd (resize-handler.ts) dispatcha
 * ResizeElementCommand kroz CommandManager direktno iz ove komponente —
 * isti obrazac kao EditorToolbar.vue (inject + dispatch), ne mora ići
 * kroz EditorCanvas.vue.
 */
import type { NodeProps } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';
import type { OnResizeEnd } from '@vue-flow/node-resizer';
import { computed, inject } from 'vue';
import { EDITOR_CONTEXT_KEY } from '../../adapter/editor-context';
import { umlUseCaseRegistry } from '../definitions';
import { dispatchResizeEnd } from './resize-handler';
import { strokeStyleFor } from './selection-style';
import UmlNodeHandles from './UmlNodeHandles.vue';

const props = defineProps<NodeProps<{ label: string; elementType: string }>>();

const ctx = inject(EDITOR_CONTEXT_KEY)!;
const def = umlUseCaseRegistry.nodes['uml.use-case'];
const style = def.defaultStyle;
const strokeStyle = computed(() => strokeStyleFor(style, props.selected));

function onResizeEnd(event: OnResizeEnd): void {
    dispatchResizeEnd(props.id, event, ctx);
}
</script>

<template>
    <div
        class="relative h-full w-full select-none"
        :data-testid="`element-${props.id}`"
        data-element-type="uml.use-case"
    >
        <NodeResizer
            :node-id="props.id"
            :is-visible="props.selected"
            :min-width="def.minSize?.width"
            :min-height="def.minSize?.height"
            @resize-end="onResizeEnd"
        />
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
                :stroke="strokeStyle.stroke"
                :stroke-width="strokeStyle.strokeWidth"
            />
        </svg>
        <div
            class="absolute inset-0 flex items-center justify-center overflow-hidden text-center text-xs font-medium text-neutral-800"
            :style="{
                padding: `${def.textPadding.y}px ${def.textPadding.x}px`,
            }"
        >
            {{ props.data.label }}
        </div>
        <UmlNodeHandles :anchors="def.anchors" />
    </div>
</template>
