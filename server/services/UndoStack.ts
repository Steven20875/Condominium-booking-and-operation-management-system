/**
 * Simple LIFO UndoStack helper for reversible operations
 */
export class UndoStack<T> {
  private stack: T[] = [];

  push(item: T) {
    this.stack.push(item);
    return item;
  }

  pop(): T | undefined {
    return this.stack.pop();
  }

  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  size() {
    return this.stack.length;
  }

  clear() {
    this.stack = [];
  }
}

export const globalUndoStack = new UndoStack<any>();
