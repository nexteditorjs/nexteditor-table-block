import {
  assert, BlockElement, NextEditor,
  DragDrop, DragDropOptions, setContainerWidth, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { calCellNewSize, getTableResizeMinX } from './cal-size';
import {
  changeContainerSize, getEffectedCells, removeAllResizeGripper, updateResizeGripper,
} from './resize-gripper';

const logger = getLogger('table-resize-drag-drop');

export interface TableResizeDragDropData {
  draggingRefCell: HTMLTableCellElement;
  block: BlockElement;
  table: HTMLTableElement;
}

export class TableResizeDragDrop implements DragDropOptions<TableResizeDragDropData> {
  cursor = 'col-resize';

  constructor(private editor: NextEditor, public elem: HTMLDivElement, public data: TableResizeDragDropData, private onEnd: ((event: MouseEvent) => void) | null) {
  }

  onDragStart(drag: DragDrop<TableResizeDragDropData>, event: MouseEvent, elem: HTMLElement): void {
  }

  // eslint-disable-next-line max-len
  onDragging(drag: DragDrop<TableResizeDragDropData>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number): void {
    const draggingRefCell = drag.data.draggingRefCell;
    const x = getTableResizeMinX(this.editor, draggingRefCell, drag.data.table, event.x - drag.dragOffsetX);
    //
    assert(logger, draggingRefCell, 'no dragging cell');
    //
    const cells = getEffectedCells(drag.data.table, draggingRefCell);
    cells.forEach((cellData) => {
      const newWidth = calCellNewSize(this.editor, drag.data.block, drag.data.table, cellData, x);
      setContainerWidth(cellData.container, newWidth);
    });
    //
    updateResizeGripper(this.editor, drag.data.block, draggingRefCell);
    //
    this.editor.selection.caret.update();
  }

  onDragEnd(drag: DragDrop<TableResizeDragDropData>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number): void {
    const draggingRefCell = drag.data.draggingRefCell;
    const sizes = new Map<string, number>();
    const x = getTableResizeMinX(this.editor, drag.data.draggingRefCell, drag.data.table, event.x - drag.dragOffsetX);
    const cells = getEffectedCells(drag.data.table, draggingRefCell);
    cells.forEach((cellData) => {
      const newWidth = calCellNewSize(this.editor, drag.data.block, drag.data.table, cellData, x);
      if (newWidth) {
        sizes.set(cellData.containerId, newWidth);
      }
    });
    if (sizes.size > 0) {
      changeContainerSize(this.editor, drag.data.block, sizes);
    }
    //
    removeAllResizeGripper(this.editor);
    //
    if (this.onEnd) {
      this.onEnd(event);
      this.onEnd = null;
    }
  }
}
