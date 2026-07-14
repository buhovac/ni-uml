import type {
  DiagramConnection,
  DiagramDocument,
  DiagramElement,
  Size,
  Vec2,
} from '../types/document'
import type { Command } from './command'

/* ------------------------------------------------------------------ */

export class AddElementCommand implements Command {
  readonly name = 'add-element'
  constructor(private readonly element: DiagramElement) {}

  execute(doc: DiagramDocument): void {
    doc.elements.push(this.element)
  }

  undo(doc: DiagramDocument): void {
    doc.elements = doc.elements.filter((e) => e.id !== this.element.id)
  }
}

/* ------------------------------------------------------------------ */

export interface ElementMove {
  id: string
  from: Vec2
  to: Vec2
}

/** Kreira se na pointer-up (drag stop), NE na svaki pointermove. */
export class MoveElementsCommand implements Command {
  readonly name = 'move-elements'
  constructor(private readonly moves: ElementMove[]) {}

  execute(doc: DiagramDocument): void {
    for (const m of this.moves) {
      const el = doc.elements.find((e) => e.id === m.id)

      if (el) {
el.position = { ...m.to }
}
    }
  }

  undo(doc: DiagramDocument): void {
    for (const m of this.moves) {
      const el = doc.elements.find((e) => e.id === m.id)

      if (el) {
el.position = { ...m.from }
}
    }
  }
}

/* ------------------------------------------------------------------ */

export interface BoxState {
  position: Vec2
  size: Size
}

export class ResizeElementCommand implements Command {
  readonly name = 'resize-element'
  constructor(
    private readonly id: string,
    private readonly from: BoxState,
    private readonly to: BoxState,
  ) {}

  execute(doc: DiagramDocument): void {
    this.apply(doc, this.to)
  }

  undo(doc: DiagramDocument): void {
    this.apply(doc, this.from)
  }

  private apply(doc: DiagramDocument, s: BoxState): void {
    const el = doc.elements.find((e) => e.id === this.id)

    if (!el) {
return
}

    el.position = { ...s.position }
    el.size = { ...s.size }
  }
}

/* ------------------------------------------------------------------ */

/** Generički patch za data/style — sprema prethodno stanje za undo. */
export class UpdateElementCommand implements Command {
  readonly name = 'update-element'
  private before?: { data: unknown; style: unknown }

  constructor(
    private readonly id: string,
    private readonly patch: {
      data?: Record<string, unknown>
      style?: Record<string, unknown>
    },
  ) {}

  execute(doc: DiagramDocument): void {
    const el = doc.elements.find((e) => e.id === this.id)

    if (!el) {
return
}

    this.before ??= {
      data: structuredClone(el.data),
      style: structuredClone(el.style),
    }

    if (this.patch.data) {
Object.assign(el.data as object, this.patch.data)
}

    if (this.patch.style) {
Object.assign(el.style, this.patch.style)
}
  }

  undo(doc: DiagramDocument): void {
    const el = doc.elements.find((e) => e.id === this.id)

    if (!el || !this.before) {
return
}

    el.data = structuredClone(this.before.data) as typeof el.data
    el.style = structuredClone(this.before.style) as typeof el.style
  }
}

/* ------------------------------------------------------------------ */

/**
 * Brisanje elemenata:
 *  - uklanja i sve veze koje ih referenciraju (BR05);
 *  - djeci obrisanog containera skida parentId i preračunava
 *    poziciju u apsolutnu (zadržavamo djecu — UX odluka za MVP).
 */
export class DeleteElementsCommand implements Command {
  readonly name = 'delete-elements'
  private removedElements: { element: DiagramElement; index: number }[] = []
  private removedConnections: {
    connection: DiagramConnection
    index: number
  }[] = []
  private reparented: { id: string; prevParentId: string; prevPosition: Vec2 }[] =
    []

  constructor(private readonly ids: string[]) {}

  execute(doc: DiagramDocument): void {
    this.removedElements = []
    this.removedConnections = []
    this.reparented = []
    const idSet = new Set(this.ids)

    // 1) veze prema obrisanim elementima
    for (let i = doc.connections.length - 1; i >= 0; i--) {
      const c = doc.connections[i]

      if (idSet.has(c.source.elementId) || idSet.has(c.target.elementId)) {
        this.removedConnections.push({ connection: c, index: i })
        doc.connections.splice(i, 1)
      }
    }

    // 2) djeca obrisanih containera → root, apsolutna pozicija
    for (const el of doc.elements) {
      if (el.parentId && idSet.has(el.parentId) && !idSet.has(el.id)) {
        const parent = doc.elements.find((p) => p.id === el.parentId)
        this.reparented.push({
          id: el.id,
          prevParentId: el.parentId,
          prevPosition: { ...el.position },
        })

        if (parent) {
          el.position = {
            x: el.position.x + parent.position.x,
            y: el.position.y + parent.position.y,
          }
        }

        el.parentId = undefined
      }
    }

    // 3) sami elementi
    for (let i = doc.elements.length - 1; i >= 0; i--) {
      if (idSet.has(doc.elements[i].id)) {
        this.removedElements.push({ element: doc.elements[i], index: i })
        doc.elements.splice(i, 1)
      }
    }
  }

  undo(doc: DiagramDocument): void {
    for (const r of [...this.removedElements].sort((a, b) => a.index - b.index)) {
      doc.elements.splice(r.index, 0, r.element)
    }

    for (const r of this.reparented) {
      const el = doc.elements.find((e) => e.id === r.id)

      if (el) {
        el.parentId = r.prevParentId
        el.position = { ...r.prevPosition }
      }
    }

    for (const r of [...this.removedConnections].sort(
      (a, b) => a.index - b.index,
    )) {
      doc.connections.splice(r.index, 0, r.connection)
    }
  }
}

/* ------------------------------------------------------------------ */

export class AddConnectionCommand implements Command {
  readonly name = 'add-connection'
  constructor(private readonly connection: DiagramConnection) {}

  execute(doc: DiagramDocument): void {
    doc.connections.push(this.connection)
  }

  undo(doc: DiagramDocument): void {
    doc.connections = doc.connections.filter(
      (c) => c.id !== this.connection.id,
    )
  }
}

export class DeleteConnectionCommand implements Command {
  readonly name = 'delete-connection'
  private removed?: { connection: DiagramConnection; index: number }

  constructor(private readonly id: string) {}

  execute(doc: DiagramDocument): void {
    const index = doc.connections.findIndex((c) => c.id === this.id)

    if (index === -1) {
return
}

    this.removed = { connection: doc.connections[index], index }
    doc.connections.splice(index, 1)
  }

  undo(doc: DiagramDocument): void {
    if (this.removed) {
      doc.connections.splice(this.removed.index, 0, this.removed.connection)
    }
  }
}

/* ------------------------------------------------------------------ */

/** Drop u/iz system boundaryja (UC06 alternativni tijek). */
export class ChangeParentCommand implements Command {
  readonly name = 'change-parent'
  private prev?: { parentId?: string; position: Vec2 }

  constructor(
    private readonly id: string,
    private readonly newParentId: string | undefined,
    /** Nova pozicija, relativna prema novom parentu (ili apsolutna za root). */
    private readonly newPosition: Vec2,
  ) {}

  execute(doc: DiagramDocument): void {
    const el = doc.elements.find((e) => e.id === this.id)

    if (!el) {
return
}

    this.prev ??= { parentId: el.parentId, position: { ...el.position } }
    el.parentId = this.newParentId
    el.position = { ...this.newPosition }
  }

  undo(doc: DiagramDocument): void {
    const el = doc.elements.find((e) => e.id === this.id)

    if (!el || !this.prev) {
return
}

    el.parentId = this.prev.parentId
    el.position = { ...this.prev.position }
  }
}
