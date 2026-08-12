import { describe, expect, it } from 'vitest'
import { createEditorContext } from '../adapter/editor-context'
import { resizeEndToCommand } from '../adapter/vueflow-adapter'
import { CommandManager } from '../commands/command'
import { AddElementCommand } from '../commands/commands'
import { createEmptyDocument } from '../types/document'
import type { UseCaseElement } from '../types/document'
import { dispatchResizeEnd } from '../uml-use-case/nodes/resize-handler'

const useCase = (id: string): UseCaseElement => ({
  id,
  type: 'uml.use-case',
  position: { x: 300, y: 60 },
  size: { width: 170, height: 80 },
  zIndex: 10,
  style: { fill: '#fff', stroke: '#222', strokeWidth: 2, fontSize: 14 },
  data: { label: 'Rezervacija termina' },
})

describe('resizeEndToCommand', () => {
  it('kreira ResizeElementCommand koji mijenja poziciju i veličinu, undo vraća prethodne', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(useCase('u1')))

    const cmd = resizeEndToCommand(
      'u1',
      { position: { x: 280, y: 40 }, size: { width: 220, height: 130 } },
      doc,
    )

    expect(cmd).not.toBeNull()
    cm.dispatch(cmd!)

    const el = doc.elements.find((e) => e.id === 'u1')!
    expect(el.position).toEqual({ x: 280, y: 40 })
    expect(el.size).toEqual({ width: 220, height: 130 })

    cm.undo()
    const restored = doc.elements.find((e) => e.id === 'u1')!
    expect(restored.position).toEqual({ x: 300, y: 60 })
    expect(restored.size).toEqual({ width: 170, height: 80 })
  })

  it('vraća null za nepostojeći element', () => {
    const doc = createEmptyDocument('Test')
    const cmd = resizeEndToCommand(
      'ne-postoji',
      { position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
      doc,
    )
    expect(cmd).toBeNull()
  })
})

describe('dispatchResizeEnd (resize-handler.ts, koristi ga UseCaseNode/SystemBoundaryNode/NoteNode)', () => {
  it('prevodi OnResizeEnd payload u ResizeElementCommand i dispatcha ga kroz ctx.commandManager', () => {
    const ctx = createEditorContext('Test')
    ctx.commandManager.dispatch(new AddElementCommand(useCase('u1')))

    dispatchResizeEnd(
      'u1',
      { event: {} as never, params: { x: 250, y: 50, width: 200, height: 120 } },
      ctx,
    )

    const el = ctx.doc.elements.find((e) => e.id === 'u1')!
    expect(el.position).toEqual({ x: 250, y: 50 })
    expect(el.size).toEqual({ width: 200, height: 120 })
    expect(ctx.commandManager.canUndo).toBe(true)

    ctx.commandManager.undo()
    const restored = ctx.doc.elements.find((e) => e.id === 'u1')!
    expect(restored.size).toEqual({ width: 170, height: 80 })
  })
})
