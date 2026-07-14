/**
 * Command pattern — svaka izmjena dokumenta ide kroz CommandManager
 * (zamka 37.4: undo se postavlja PRIJE svih operacija, ne poslije).
 *
 * Commandi mutiraju dokument in-place; dokument živi u Pinia
 * reactive stateu pa mutacija automatski pokreće re-render projekcije.
 */
import type { DiagramDocument } from '../types/document'

export interface Command {
  readonly name: string
  execute(doc: DiagramDocument): void
  undo(doc: DiagramDocument): void
}

export class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []

  constructor(
    private readonly doc: DiagramDocument,
    /** Poziva se nakon svake izmjene — npr. za dirty flag + debounced autosave. */
    private readonly onChange?: (cmd: Command) => void,
  ) {}

  dispatch(cmd: Command): void {
    cmd.execute(this.doc)
    this.undoStack.push(cmd)
    this.redoStack = [] // nova akcija briše redo granu (US05)
    this.touch(cmd)
  }

  undo(): boolean {
    const cmd = this.undoStack.pop()

    if (!cmd) {
return false
}

    cmd.undo(this.doc)
    this.redoStack.push(cmd)
    this.touch(cmd)

    return true
  }

  redo(): boolean {
    const cmd = this.redoStack.pop()

    if (!cmd) {
return false
}

    cmd.execute(this.doc)
    this.undoStack.push(cmd)
    this.touch(cmd)

    return true
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  private touch(cmd: Command): void {
    this.doc.metadata.updatedAt = new Date().toISOString()
    this.onChange?.(cmd)
  }
}
