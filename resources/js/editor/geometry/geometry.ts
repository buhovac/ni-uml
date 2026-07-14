/**
 * Geometry sloj — dijele ga adapter i SVG exporter.
 * Ovdje se razrješavaju relativne (parent) pozicije u apsolutne
 * dokumentne koordinate.
 */
import type { DiagramTypeRegistry } from '../types/definitions'
import type {
  DiagramDocument,
  DiagramElement,
  Vec2,
} from '../types/document'

export function elementsById(
  doc: DiagramDocument,
): Map<string, DiagramElement> {
  const map = new Map<string, DiagramElement>()

  for (const el of doc.elements) {
map.set(el.id, el)
}

  return map
}

/** Apsolutna dokumentna pozicija — šetnja kroz parent lanac. */
export function absolutePosition(
  el: DiagramElement,
  byId: Map<string, DiagramElement>,
): Vec2 {
  let x = el.position.x
  let y = el.position.y
  let parent = el.parentId ? byId.get(el.parentId) : undefined
  let guard = 0

  while (parent) {
    x += parent.position.x
    y += parent.position.y
    parent = parent.parentId ? byId.get(parent.parentId) : undefined

    if (++guard > 100) {
throw new Error('Kružna parent hijerarhija (UCV010)')
}
  }

  return { x, y }
}

/** Apsolutna točka anchora na elementu. */
export function anchorPoint(
  el: DiagramElement,
  anchorId: string,
  byId: Map<string, DiagramElement>,
  registry: DiagramTypeRegistry,
): Vec2 {
  const def = registry.nodes[el.type]
  const anchor =
    def?.anchors.find((a) => a.id === anchorId) ??
    ({ id: 'center', position: { x: 0.5, y: 0.5 } } as const)
  const abs = absolutePosition(el, byId)

  return {
    x: abs.x + anchor.position.x * el.size.width,
    y: abs.y + anchor.position.y * el.size.height,
  }
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Bounding box svog sadržaja — koristi export "crop to content". */
export function contentBounds(
  doc: DiagramDocument,
  byId: Map<string, DiagramElement>,
): Bounds {
  if (doc.elements.length === 0) {
    return { x: 0, y: 0, width: doc.canvas.width, height: doc.canvas.height }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of doc.elements) {
    const abs = absolutePosition(el, byId)
    minX = Math.min(minX, abs.x)
    minY = Math.min(minY, abs.y)
    maxX = Math.max(maxX, abs.x + el.size.width)
    maxY = Math.max(maxY, abs.y + el.size.height)
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}
