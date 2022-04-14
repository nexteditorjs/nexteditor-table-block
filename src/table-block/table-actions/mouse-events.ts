import {
  BlockElement, NextEditor,
  registerDragDrop, getLogger, isChildNode,
} from '@nexteditorjs/nexteditor-core';
import { removeAllInsertColumnIndicators, removeInsertColumnIndicator, updateInsertColumnIndicator } from '../insert-column/insert-column-indicator';
import { getBlockTable } from '../table-dom';
import { TableResizeDragDrop } from '../table-resize/resize-drag-drop';
import {
  createResizeGripper, editorHasExistsResizeGripper, getCellFromRightBorder,
  getExistsResizeGripper, GRIPPER_SIZE_HALF, removeAllResizeGripper,
  updateResizeGripper,
} from '../table-resize/resize-gripper';
import { removeAllIndicators } from './indicators';
import { tableBlockFromPoint } from './table-from-point';

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
      removeAllInsertColumnIndicators(this.editor);
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

  private updateFirstColumnInsertIndicator(block: BlockElement, x: number, y: number) {
    const table = getBlockTable(block);

    const rect = table.getBoundingClientRect();
    if (x < rect.left - GRIPPER_SIZE_HALF || x > rect.left + GRIPPER_SIZE_HALF) {
      removeInsertColumnIndicator(block);
      return;
    }
    updateInsertColumnIndicator(this.editor, block);
  }

  private handleMouseMove = (editor: NextEditor, event: Event) => {
    //
    if (editor.readonly) {
      return;
    }
    //
    if (editor.selectionHandler.isSelecting() && !this.draggingRefCell) {
      removeAllInsertColumnIndicators(this.editor);
      return;
    }
    //
    if (this.draggingRefCell) {
      removeAllInsertColumnIndicators(this.editor);
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
      removeAllIndicators(editor);
      return;
    }
    //
    this.updateGripper(block, ev.x, ev.y);
    this.updateFirstColumnInsertIndicator(block, ev.x, ev.y);
  };
}

export function handleTableMouseEvent(editor: NextEditor) {
  editor.addCustom('table-mouse-event-handler', (editor) => new TableMouseEventHandler(editor));
}
