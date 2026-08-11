/**
 * Tipkovnički prečaci vezani na CommandManager i selection state.
 * Samostalan, testabilan modul — ne zna ništa o Vue Flow/EditorSpike;
 * stranica ga zakači na @keydown (ili window addEventListener).
 *
 * Puni selection UI (klik, marquee, shift-click...) dolazi u kasnijem paketu
 * (P3b) — ovdje selection state je namjerno minimalan: samo niz ID-eva.
 */
import type { Ref } from 'vue'
import type { CommandManager } from './command'
import { DeleteElementsCommand } from './commands'

export type SelectionState = Ref<string[]>

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA'])

/**
 * Ne obrađuje prečace dok korisnik tipka u polje (input/textarea/
 * contenteditable). Duck-typing umjesto `instanceof HTMLElement` da modul
 * ostane testabilan bez DOM-a (vitest environment ovog projekta je 'node').
 */
function isEditingText(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null

  if (!el) {
    return false
  }

  return (
    (typeof el.tagName === 'string' && EDITABLE_TAGS.has(el.tagName)) ||
    el.isContentEditable === true
  )
}

/**
 * Vraća handler koji se zakači na @keydown. Rukuje:
 *  - Cmd/Ctrl+Z → undo
 *  - Cmd/Ctrl+Shift+Z → redo
 *  - Delete/Backspace → briše selekciju (samo ako nije prazna)
 *  - Escape → prazni selekciju
 */
export function createKeyboardShortcutHandler(
  commandManager: CommandManager,
  selection: SelectionState,
): (event: KeyboardEvent) => void {
  return function handleKeydown(event: KeyboardEvent): void {
    if (isEditingText(event.target)) {
      return
    }

    const primaryModifier = event.metaKey || event.ctrlKey

    if (primaryModifier && !event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      commandManager.undo()

      return
    }

    if (primaryModifier && event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      commandManager.redo()

      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selection.value.length === 0) {
        return
      }

      event.preventDefault()
      commandManager.dispatch(new DeleteElementsCommand([...selection.value]))
      selection.value = []

      return
    }

    if (event.key === 'Escape') {
      selection.value = []
    }
  }
}
