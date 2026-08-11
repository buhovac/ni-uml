import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { CommandManager } from '../commands/command'
import { AddElementCommand } from '../commands/commands'
import { createKeyboardShortcutHandler } from '../commands/keyboard-shortcuts'
import { createEmptyDocument } from '../types/document'
import type { ActorElement } from '../types/document'

const actor = (id: string): ActorElement => ({
  id,
  type: 'uml.actor',
  position: { x: 40, y: 40 },
  size: { width: 70, height: 110 },
  zIndex: 10,
  style: { fill: 'none', stroke: '#222', strokeWidth: 2, fontSize: 14 },
  data: { label: 'Korisnik' },
})

/**
 * vitest environment ovog projekta je 'node' (bez jsdom), pa se KeyboardEvent
 * ne može konstruirati stvarnim DOM API-jem — gradimo minimalni plain-object
 * koji zadovoljava oblik koji handler koristi.
 */
function makeEvent(init: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  target?: { tagName?: string; isContentEditable?: boolean } | null
}): KeyboardEvent {
  return {
    key: init.key,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    target: init.target ?? null,
    preventDefault: () => {},
  } as unknown as KeyboardEvent
}

describe('createKeyboardShortcutHandler', () => {
  it('Ctrl/Cmd+Z poziva undo', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    const selection = ref<string[]>([])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'z', ctrlKey: true }))

    expect(doc.elements).toHaveLength(0)
  })

  it('Ctrl/Cmd+Shift+Z poziva redo', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    cm.undo()
    const selection = ref<string[]>([])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'z', ctrlKey: true, shiftKey: true }))

    expect(doc.elements).toHaveLength(1)
  })

  it('Delete briše selektirane elemente kad selekcija nije prazna', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    const selection = ref<string[]>(['a1'])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'Delete' }))

    expect(doc.elements).toHaveLength(0)
    expect(selection.value).toEqual([])
  })

  it('Delete ne radi ništa kad je selekcija prazna', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    const selection = ref<string[]>([])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'Backspace' }))

    expect(doc.elements).toHaveLength(1)
  })

  it('Escape prazni selekciju', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    const selection = ref<string[]>(['a1', 'a2'])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'Escape' }))

    expect(selection.value).toEqual([])
  })

  it('ignorira prečace dok korisnik tipka u input polje', () => {
    const doc = createEmptyDocument('Test')
    const cm = new CommandManager(doc)
    cm.dispatch(new AddElementCommand(actor('a1')))
    const selection = ref<string[]>(['a1'])
    const handle = createKeyboardShortcutHandler(cm, selection)

    handle(makeEvent({ key: 'Delete', target: { tagName: 'INPUT' } }))

    expect(doc.elements).toHaveLength(1)
    expect(selection.value).toEqual(['a1'])
  })
})
