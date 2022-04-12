/* eslint-disable max-classes-per-file */
import {
  assert, BlockElement, NextEditor,
  DragDrop, DragDropOptions, registerDragDrop, setContainerWidth, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-dom';
import { calCellNewSize, getTableResizeMinX } from './cal-size';
import {
  changeContainerSize, createResizeGripper, editorHasExistsResizeGripper, getCellFromRightBorder,
  getEffectedCells, getExistsResizeGripper, removeResizeGripper, tableBlockFromPoint,
  updateResizeGripper,
} from './resize-gripper';

const logger = getLogger('table-resize');

interface DragDropData {
  draggingRefCell: HTMLTableCellElement;
  block: BlockElement;
  table: HTMLTableElement;
}

class TableResizeMouseHandler {
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
      const exists = getExistsResizeGripper(block);
      if (!exists) {
        if (editorHasExistsResizeGripper(this.editor)) {
          return;
        }
        const gripper = createResizeGripper(block);
        const data: DragDropData = {
          block,
          table,
          draggingRefCell,
        };
        const dragDrop: DragDropOptions<DragDropData> = {
          elem: gripper,
          data,
          onDragStart: this.handleResizeStart,
          onDragging: this.handleResizing,
          onDragEnd: this.handleResizeEnd,
          cursor: 'col-resize',
        };
        registerDragDrop(dragDrop);
      }
      updateResizeGripper(block, draggingRefCell);
    } else {
      removeResizeGripper(this.editor);
    }
  }

  private handleMouseMove = (editor: NextEditor, event: Event) => {
    if (editor.selectionHandler.isSelecting() && !this.draggingRefCell) {
      return;
    }
    //
    if (this.draggingRefCell) {
      return;
    }
    //
    const ev = event as MouseEvent;
    const block = tableBlockFromPoint(editor, ev);
    if (!block) {
      removeResizeGripper(editor);
      return;
    }
    //
    this.updateGripper(block, ev.x, ev.y);
  };

  private handleResizeStart = (drag: DragDrop<DragDropData>, event: MouseEvent, elem: HTMLElement) => {
    this.draggingRefCell = drag.data.draggingRefCell;
  };

  // eslint-disable-next-line max-len
  private handleResizing = (drag: DragDrop<DragDropData>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number) => {
    const x = getTableResizeMinX(this.editor, drag.data.draggingRefCell, drag.data.table, event.x - drag.dragOffsetX);
    //
    const cell = this.draggingRefCell;
    assert(logger, cell, 'no dragging cell');
    //
    const cells = getEffectedCells(drag.data.table, cell);
    cells.forEach((cellData) => {
      const newWidth = calCellNewSize(this.editor, drag.data.block, drag.data.table, cellData, x);
      setContainerWidth(cellData.container, newWidth);
    });
    //
    updateResizeGripper(drag.data.block, cell);
    //
    this.editor.selection.caret.update();
  };

  private handleResizeEnd = (drag: DragDrop<DragDropData>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number) => {
    if (this.draggingRefCell) {
      const sizes = new Map<string, number>();
      const x = getTableResizeMinX(this.editor, drag.data.draggingRefCell, drag.data.table, event.x - drag.dragOffsetX);
      const cells = getEffectedCells(drag.data.table, this.draggingRefCell);
      cells.forEach((cellData) => {
        const newWidth = calCellNewSize(this.editor, drag.data.block, drag.data.table, cellData, x);
        if (newWidth) {
          sizes.set(cellData.containerId, newWidth);
        }
      });
      if (sizes.size > 0) {
        changeContainerSize(this.editor, drag.data.block, sizes);
      }
    }
    this.draggingRefCell = null;
    removeResizeGripper(this.editor);
    this.updateGripper(drag.data.block, event.x, event.y);
    //
  };
}

export function bindTableResizeEvent(editor: NextEditor) {
  //
  editor.addCustom('table-resize-mouse-handler', (editor) => new TableResizeMouseHandler(editor));
}
