import { describe, expect, it } from 'vitest'
import { CommandManager } from '../commands/command'
import {
  AddConnectionCommand,
  AddElementCommand,
  DeleteElementsCommand,
  MoveElementsCommand,
} from '../commands/commands'
import {
  createEmptyDocument
  
  
  
} from '../types/document'
import type {ActorElement, DiagramConnection, UseCaseElement} from '../types/document';

const actor = (id: string): ActorElement => ({
  id,
  type: 'uml.actor',
  position: { x: 40, y: 40 },
  size: { width: 70, height: 110 },
  zIndex: 10,
  style: { fill: 'none', stroke: '#222', strokeWidth: 2, fontSize: 14 },
  data: { label: 'Korisnik' },
})

const useCase = (id: string): UseCaseElement => ({
  id,
  type: 'uml.use-case',
  position: { x: 300, y: 60 },
  size: { width: 170, height: 80 },
  zIndex: 10,
  style: { fill: '#fff', stroke: '#222', strokeWidth: 2, fontSize: 14 },
  data: { label: 'Rezervacija termina' },
})

const association = (
  id: string,
  from: string,
  to: string,
): DiagramConnection => ({
  id,
  type: 'uml.association',
  source: { elementId: from, anchorId: 'right' },
  target: { elementId: to, anchorId: 'left' },
  routing: { type: 'straight', points: [] },
  labels: [],
  style: { stroke: '#222', strokeWidth: 2, arrowEnd: 'none' },
})

describe('CommandManager', () => {
  it('add → move → undo → redo daje očekivana stanja', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)

    cm.dispatch(new AddElementCommand(actor('a1')))
    expect(doc.elements).toHaveLength(1)

    cm.dispatch(
      new MoveElementsCommand([
        { id: 'a1', from: { x: 40, y: 40 }, to: { x: 200, y: 120 } },
      ]),
    )
    expect(doc.elements[0].position).toEqual({ x: 200, y: 120 })

    cm.undo()
    expect(doc.elements[0].position).toEqual({ x: 40, y: 40 })

    cm.undo()
    expect(doc.elements).toHaveLength(0)

    cm.redo()
    cm.redo()
    expect(doc.elements[0].position).toEqual({ x: 200, y: 120 })
  })

  it('nova akcija nakon undo briše redo granu (US05)', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    cm.dispatch(new AddElementCommand(useCase('u1')))
    cm.undo()
    expect(cm.canRedo).toBe(true)
    cm.dispatch(new AddElementCommand(useCase('u2')))
    expect(cm.canRedo).toBe(false)
  })

  it('brisanje elementa uklanja njegove veze i undo ih vraća (BR05)', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    cm.dispatch(new AddElementCommand(useCase('u1')))
    cm.dispatch(new AddConnectionCommand(association('c1', 'a1', 'u1')))

    cm.dispatch(new DeleteElementsCommand(['a1']))
    expect(doc.elements.map((e) => e.id)).toEqual(['u1'])
    expect(doc.connections).toHaveLength(0)

    cm.undo()
    expect(doc.elements).toHaveLength(2)
    expect(doc.connections).toHaveLength(1)
    expect(doc.connections[0].id).toBe('c1')
  })

  it('brisanje boundaryja zadržava djecu s apsolutnom pozicijom', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(
      new AddElementCommand({
        id: 'b1',
        type: 'uml.system-boundary',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        zIndex: 1,
        style: { fill: '#fafafa', stroke: '#222', strokeWidth: 1.5, fontSize: 15 },
        data: { label: 'Sustav' },
      }),
    )
    const child = useCase('u1')
    child.parentId = 'b1'
    child.position = { x: 50, y: 60 } // relativno prema boundaryju
    cm.dispatch(new AddElementCommand(child))

    cm.dispatch(new DeleteElementsCommand(['b1']))
    const survivor = doc.elements.find((e) => e.id === 'u1')!
    expect(survivor.parentId).toBeUndefined()
    expect(survivor.position).toEqual({ x: 150, y: 160 })

    cm.undo()
    const restored = doc.elements.find((e) => e.id === 'u1')!
    expect(restored.parentId).toBe('b1')
    expect(restored.position).toEqual({ x: 50, y: 60 })
  })
})
