import {
  BlockElement, NextEditor,
  registerDragDrop, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-dom';
import { TableResizeDragDrop } from './resize-drag-drop';
import {
  createResizeGripper, editorHasExistsResizeGripper, getCellFromRightBorder,
  getExistsResizeGripper, removeAllResizeGripper,
  updateResizeGripper,
} from './resize-gripper';
import { tableBlockFromPoint } from '../table-actions/table-from-point';

const logger = getLogger('table-resize');

class TableMouseEventHandler {
  constructor(private editor: NextEditor) {
    editor.domEvents.addEventListener(document, 'mousemove', this.handleMouseMove);
  }

  destroy() {
    this.editor.domEvents.removeEventListener(document, 'mousemove', this.handleMouseMove);
  }

  //
  private draggingRefCell: HTMLTableCellElement | null = null;

  private updateGripper(block: BlockElement, x: number, y: number) {
    const table = getBlockTable(block);
    const draggingRefCell = getCellFromRightBorder(table, x, y);
    if (draggingRefCell) {
      //
      const exists = getExistsResizeGripper(block);
      if (!exists) {
        if (editorHasExistsResizeGripper(this.editor)) {
          return;
        }
        const gripper = createResizeGripper(block);
        const data = {
          block,
          table,
          draggingRefCell,
        };
        registerDragDrop(new TableResizeDragDrop(this.editor, gripper, data, (event) => {
          this.updateGripper(block, event.x, event.y);
        }));
      }
      updateResizeGripper(this.editor, block, draggingRefCell);
    } else {
      removeAllResizeGripper(this.editor);
    }
  }

  private handleMouseMove = (editor: NextEditor, event: Event) => {
    //
    if (editor.readonly) {
      return;
    }
    //
    if (editor.selectionHandler.isSelecting() && !this.draggingRefCell) {
      return;
    }
    //
    if (this.draggingRefCell) {
      return;
    }
    //
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    //
    const indicator = target.closest('.table-indicator');
    if (indicator) {
      return;
    }
    //
    const ev = event as MouseEvent;
    const block = tableBlockFromPoint(editor, ev);
    if (!block) {
      removeAllResizeGripper(editor);
      return;
    }
    //
    this.updateGripper(block, ev.x, ev.y);
  };
}

export function handleTableResizeMouseEvent(editor: NextEditor) {
  editor.addCustom('table-mouse-event-handler', (editor) => new TableMouseEventHandler(editor));
}
