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
import type {BoxState, ElementMove} from '../commands/commands';
import { absolutePosition, elementsById } from '../geometry/geometry'
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
    // NEMA extent:'parent' (bilo u P3a) — reparent-dragom (P3b) zahtijeva
    // da dijete MOŽE biti odvučeno IZVAN roditeljskog boundaryja (to je
    // signal za dragStopToCommands da ga vrati na root). Vue Flow-ov
    // extent:'parent' bi to spriječio klampanjem drag-a na roditeljev
    // bounding box.
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

/**
 * Boundary čiji apsolutni bounding box sadrži zadanu apsolutnu tačku
 * (za reparent-dragom, P3b). System-boundary elementi se međusobno ne
 * mogu ugnijezditi u ovom paketu (nema nested boundaryja).
 */
function findBoundaryContaining(
  point: Vec2,
  doc: DiagramDocument,
  excludeId: string,
  byId: Map<string, DiagramElement>,
): DiagramElement | undefined {
  return doc.elements.find((el) => {
    if (el.id === excludeId || el.type !== 'uml.system-boundary') {
      return false
    }

    const abs = absolutePosition(el, byId)

    return (
      point.x >= abs.x &&
      point.x <= abs.x + el.size.width &&
      point.y >= abs.y &&
      point.y <= abs.y + el.size.height
    )
  })
}

/**
 * @node-drag-stop → jedan Command po pomjerenom elementu (u praksi uvijek
 * tačno jedan, jer editor trenutno podržava samo single selection — vidi
 * editor-context.ts).
 *
 * Za system-boundary elemente uvijek MoveElementsCommand (nema ugniježđenih
 * boundaryja u ovom paketu). Za ostale tipove: ako je centar elementa NAKON
 * drag-a unutar bounding boxa nekog boundaryja koji trenutno nije njegov
 * parent → ChangeParentCommand s apsolutnom pozicijom preračunatom u
 * relativnu prema tom boundaryju. Ako je element ranije imao parenta a
 * centar mu više nije ni u jednom boundaryju → ChangeParentCommand s
 * parentId: undefined i apsolutnom pozicijom. Inače (parent se ne mijenja)
 * → MoveElementsCommand kao dosad.
 */
export function dragStopToCommands(
  dragged: { id: string; position: Vec2 }[],
  doc: DiagramDocument,
): Command[] {
  const byId = elementsById(doc)
  const plainMoves: ElementMove[] = []
  const commands: Command[] = []

  for (const d of dragged) {
    const el = doc.elements.find((e) => e.id === d.id)

    if (!el) {
continue
}

    const unchanged = el.position.x === d.position.x && el.position.y === d.position.y

    if (el.type === 'uml.system-boundary') {
      if (!unchanged) {
        plainMoves.push({ id: d.id, from: { ...el.position }, to: { ...d.position } })
      }

      continue
    }

    const parent = el.parentId ? byId.get(el.parentId) : undefined
    const parentAbs = parent ? absolutePosition(parent, byId) : { x: 0, y: 0 }
    const newAbsolute = { x: parentAbs.x + d.position.x, y: parentAbs.y + d.position.y }
    const center = {
      x: newAbsolute.x + el.size.width / 2,
      y: newAbsolute.y + el.size.height / 2,
    }
    const targetBoundary = findBoundaryContaining(center, doc, el.id, byId)

    if (targetBoundary && targetBoundary.id !== el.parentId) {
      const boundaryAbs = absolutePosition(targetBoundary, byId)

      commands.push(
        new ChangeParentCommand(el.id, targetBoundary.id, {
          x: newAbsolute.x - boundaryAbs.x,
          y: newAbsolute.y - boundaryAbs.y,
        }),
      )
    } else if (!targetBoundary && el.parentId) {
      commands.push(new ChangeParentCommand(el.id, undefined, newAbsolute))
    } else if (!unchanged) {
      plainMoves.push({ id: d.id, from: { ...el.position }, to: { ...d.position } })
    }
  }

  if (plainMoves.length > 0) {
    commands.push(new MoveElementsCommand(plainMoves))
  }

  return commands
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
