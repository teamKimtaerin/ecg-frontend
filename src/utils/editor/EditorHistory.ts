export interface EditorCommand {
  execute(): void
  undo(): void
  description: string
}

export class EditorHistory {
  private undoStack: EditorCommand[] = []
  private redoStack: EditorCommand[] = []
  private maxHistorySize: number

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize
  }

  executeCommand(command: EditorCommand): void {
    command.execute()

    this.undoStack.push(command)
    this.redoStack = []

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  undo(): boolean {
    if (!this.canUndo()) {
      return false
    }

    const command = this.undoStack.pop()!
    command.undo()
    this.redoStack.push(command)

    return true
  }

  redo(): boolean {
    if (!this.canRedo()) {
      return false
    }

    const command = this.redoStack.pop()!
    command.execute()
    this.undoStack.push(command)

    return true
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  getUndoDescription(): string {
    if (!this.canUndo()) {
      return ''
    }
    return this.undoStack[this.undoStack.length - 1].description
  }

  getRedoDescription(): string {
    if (!this.canRedo()) {
      return ''
    }
    return this.redoStack[this.redoStack.length - 1].description
  }
}
