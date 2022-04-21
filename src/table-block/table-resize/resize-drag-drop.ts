import {
  assert, BlockElement, NextEditor,
  DragDrop, DragDropOptions, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { getTableColumnWidths, setColumnWidth } from '../border-bar/column-width';
import { TableGrid } from '../table-grid';
import { getTableResizeMinX } from './cal-size';
import {
  removeAllResizeGripper, setTableColumnWidths, updateResizeGripper,
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
    const { table, block, draggingRefCell } = drag.data;
    const x = getTableResizeMinX(this.editor, draggingRefCell, table, event.x - drag.dragOffsetX);
    const totalWidth = x - table.getBoundingClientRect().left;
    //
    assert(logger, draggingRefCell, 'no dragging cell');
    const grid = TableGrid.fromTable(table);
    const cellData = grid.getCellByCellElement(draggingRefCell);
    const colIndex = cellData.col + cellData.colSpan - 1;
    //
    const widths = getTableColumnWidths(table);
    const leftWidths = widths.slice(0, colIndex).reduce((a, b) => a + b, 0);
    const colWidth = totalWidth - leftWidths;
    setColumnWidth(table, colIndex, colWidth);
    //
    this.editor.emit('blockNotify', this.editor, block, 'resize', []);
    //
    updateResizeGripper(this.editor, block, draggingRefCell);
    this.editor.selection.caret.update();
  }

  onDragEnd(drag: DragDrop<TableResizeDragDropData>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number): void {
    const widths = getTableColumnWidths(drag.data.table);
    setTableColumnWidths(this.editor, drag.data.block, widths);
    //
    removeAllResizeGripper(this.editor);
    //
    if (this.onEnd) {
      this.onEnd(event);
      this.onEnd = null;
    }
  }
}
