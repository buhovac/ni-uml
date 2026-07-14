/**
 * Adapter: DiagramDocument ↔ Vue Flow projekcija.
 *
 * Pravila (ADR-0001, ADR-0002):
 *  1. Vue Flow NIJE izvor istine — projekcija se izvodi iz modela.
 *  2. Vue Flow eventi se prevode u COMMANDS, nikad u direktne mutacije.
 *  3. Projekcija se patcha INKREMENTALNO: nepromijenjeni nodeovi
 *     zadržavaju referencu, inače Vue Flow re-rendera sve pri svakom
 *     pomaku i NFR 8.1 (200 elemenata / 400 veza) pada.
 *
 * Tipovi ispod su strukturalni podskup Vue Flow tipova da adapter
 * ostane testabilan bez @vue-flow/core dependencyja u unit testovima.
 * U aplikaciji su kompatibilni s Node/Edge iz @vue-flow/core.
 */
import type { Command } from '../commands/command'
import {
  ChangeParentCommand,
  MoveElementsCommand,
  ResizeElementCommand
  
} from '../commands/commands'
import type {BoxState} from '../commands/commands';
import type {
  DiagramConnection,
  DiagramDocument,
  DiagramElement,
  Vec2,
} from '../types/document'

/* ------------------------ projekcijski tipovi --------------------- */

export interface VfNode {
  id: string
  /** Ključ registrirane Vue komponente, npr. 'uml-actor'. */
  type: string
  position: Vec2
  parentNode?: string
  extent?: 'parent'
  zIndex: number
  width: number
  height: number
  data: Record<string, unknown>
}

export interface VfEdge {
  id: string
  type: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  data: { connectionType: DiagramConnection['type'] }
}

/** 'uml.use-case' → 'uml-use-case' (Vue Flow node type ključ). */
export const toVfType = (t: string): string => t.replace(/\./g, '-')

/* --------------------------- projekcija --------------------------- */

export function elementToVfNode(el: DiagramElement): VfNode {
  return {
    id: el.id,
    type: toVfType(el.type),
    position: { ...el.position },
    parentNode: el.parentId,
    extent: el.parentId ? 'parent' : undefined,
    zIndex: el.zIndex,
    width: el.size.width,
    height: el.size.height,
    data: { ...el.data, elementType: el.type },
  }
}

export function connectionToVfEdge(conn: DiagramConnection): VfEdge {
  return {
    id: conn.id,
    type: toVfType(conn.type),
    source: conn.source.elementId,
    target: conn.target.elementId,
    sourceHandle: conn.source.anchorId,
    targetHandle: conn.target.anchorId,
    data: { connectionType: conn.type },
  }
}

/**
 * Inkrementalni patch: vraća NOVI niz, ali čuva reference
 * nepromijenjenih nodeova (shallow-equal provjera po poljima
 * koja Vue Flow prati). Vue tada preskače njihov re-render.
 */
export function projectNodes(
  doc: DiagramDocument,
  previous: VfNode[] = [],
): VfNode[] {
  const prevById = new Map(previous.map((n) => [n.id, n]))

  return doc.elements.map((el) => {
    const prev = prevById.get(el.id)
    const next = elementToVfNode(el)

    if (prev && nodesEqual(prev, next)) {
return prev
}

    return next
  })
}

export function projectEdges(
  doc: DiagramDocument,
  previous: VfEdge[] = [],
): VfEdge[] {
  const prevById = new Map(previous.map((e) => [e.id, e]))

  return doc.connections.map((conn) => {
    const prev = prevById.get(conn.id)
    const next = connectionToVfEdge(conn)

    if (prev && edgesEqual(prev, next)) {
return prev
}

    return next
  })
}

function nodesEqual(a: VfNode, b: VfNode): boolean {
  return (
    a.type === b.type &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.parentNode === b.parentNode &&
    a.zIndex === b.zIndex &&
    a.width === b.width &&
    a.height === b.height &&
    JSON.stringify(a.data) === JSON.stringify(b.data)
  )
}

function edgesEqual(a: VfEdge, b: VfEdge): boolean {
  return (
    a.type === b.type &&
    a.source === b.source &&
    a.target === b.target &&
    a.sourceHandle === b.sourceHandle &&
    a.targetHandle === b.targetHandle
  )
}

/* ----------------------- eventi → commandi ------------------------ */
/*
 * Editor stranica koristi Vue Flow u CONTROLLED modeu:
 *   :apply-default="false"
 * i sluša @node-drag-stop, @nodes-change, @connect itd.
 * Handleri NE mutiraju dokument — vraćaju Command koji
 * stranica šalje u CommandManager.dispatch().
 */

/** @node-drag-stop → MoveElementsCommand (jedan command za cijeli drag). */
export function dragStopToCommand(
  dragged: { id: string; position: Vec2 }[],
  doc: DiagramDocument,
): Command | null {
  const moves = dragged
    .map((d) => {
      const el = doc.elements.find((e) => e.id === d.id)

      if (!el) {
return null
}

      if (el.position.x === d.position.x && el.position.y === d.position.y) {
return null
}

      return { id: d.id, from: { ...el.position }, to: { ...d.position } }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  return moves.length > 0 ? new MoveElementsCommand(moves) : null
}

/** Node-resizer resize-end → ResizeElementCommand. */
export function resizeEndToCommand(
  id: string,
  next: BoxState,
  doc: DiagramDocument,
): Command | null {
  const el = doc.elements.find((e) => e.id === id)

  if (!el) {
return null
}

  return new ResizeElementCommand(
    id,
    { position: { ...el.position }, size: { ...el.size } },
    next,
  )
}

/** Drop u/iz system boundaryja → ChangeParentCommand. */
export function reparentToCommand(
  id: string,
  newParentId: string | undefined,
  newRelativePosition: Vec2,
): Command {
  return new ChangeParentCommand(id, newParentId, newRelativePosition)
}
