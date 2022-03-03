import {
  assert, BlockElement, createElement, getBlockTools, NextEditor,
  DragDrop, DragDropOptions, registerDragDrop, getContainerMinWidth, setContainerWidth, getParentContainer, getContainerWidth,
} from '@nexteditorjs/nexteditor-core';
import { getBlockTable, getChildContainerInCell } from './table-dom';
import { TableCell, TableGrid } from './table-grid';

const GRIPPER_SIZE = 7;
const GRIPPER_SIZE_HALF = (GRIPPER_SIZE - 1) / 2;
const CONTAINER_CELL_DELTA = 3;

function getCellFromRightBorder(table: HTMLTableElement, x: number, y: number) {
  const { rows } = table;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    //
    const cells = Array.from(row.cells);
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const rect = cell.getBoundingClientRect();
      //
      const pos = Math.round(rect.right);
      if (Math.abs(x - pos) <= GRIPPER_SIZE_HALF && rect.top <= y && y <= rect.bottom) {
        return cell;
      }
    }
  }
  return null;
}

function getCellsToColumn(table: HTMLTableElement, colIndex: number): TableCell[] {
  assert(colIndex >= 0, `invalid column index: ${colIndex}`);
  const grid = TableGrid.fromTable(table);
  const cells = grid.getColumnRealCells(colIndex).filter((cell) => {
    const accept = cell.col + cell.colSpan === colIndex + 1;
    return accept;
  });
  return cells;
}

function editorHasExistsResizeGripper(editor: NextEditor) {
  return !!editor.rootContainer.querySelector('.table-resize-gripper');
}

function getExistsResizeGripper(block: BlockElement) {
  const tools = getBlockTools(block);
  const gripper = tools.querySelector('.table-resize-gripper') as HTMLDivElement;
  return gripper;
}

function createResizeGripper(block: BlockElement) {
  const exists = getExistsResizeGripper(block);
  assert(!exists, 'resize gripper has already exists');
  const tools = getBlockTools(block);
  const gripper = createElement('div', ['table-resize-gripper'], tools);
  createElement('div', ['table-resize-gripper-indicator'], gripper);
  return gripper;
}

function updateResizeGripper(block: BlockElement, cell: HTMLTableCellElement) {
  let gripper = getExistsResizeGripper(block);
  if (!gripper) {
    const tools = getBlockTools(block);
    gripper = createElement('div', ['table-resize-gripper'], tools);
    createElement('div', ['table-resize-gripper-indicator'], gripper);
  }
  //
  const blockRect = block.getBoundingClientRect();
  //
  const table = getBlockTable(block);
  const tableRect = table.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const top = tableRect.top - blockRect.top;
  const height = tableRect.height;
  const left = cellRect.right - blockRect.left;
  //
  gripper.style.left = `${left - GRIPPER_SIZE_HALF}px`;
  gripper.style.top = `${top}px`;
  gripper.style.height = `${height}px`;
  gripper.style.width = `${GRIPPER_SIZE}px`;
}

function getEffectedCells(table: HTMLTableElement, cell: HTMLTableCellElement) {
  //
  const grid = TableGrid.fromTable(table);
  const cellData = grid.getCellByCellElement(cell);
  const cells = getCellsToColumn(table, cellData.col + cellData.colSpan - 1);
  return cells;
}

function removeResizeGripper(block: BlockElement) {
  const tools = getBlockTools(block);
  const gripper = tools.querySelector('.table-resize-gripper') as HTMLDivElement;
  if (gripper) {
    gripper.remove();
  }
}

class TableResizeMouseHandler {
  static handlers = new WeakMap<BlockElement, TableResizeMouseHandler>();

  //
  private table: HTMLTableElement;

  private draggingRefCell: HTMLTableCellElement | null = null;

  constructor(
    private editor: NextEditor,
    private block: BlockElement,
  ) {
    this.table = getBlockTable(block);
  }

  private bindEvents() {
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  private unbindEvents() {
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  private updateGripper(x: number, y: number) {
    const draggingRefCell = getCellFromRightBorder(this.table, x, y);
    if (draggingRefCell) {
      const exists = getExistsResizeGripper(this.block);
      if (!exists) {
        if (editorHasExistsResizeGripper(this.editor)) {
          return;
        }
        const gripper = createResizeGripper(this.block);
        const dragDrop: DragDropOptions<HTMLTableCellElement> = {
          elem: gripper,
          data: draggingRefCell,
          onDragStart: this.handleResizeStart,
          onDragging: this.handleResizing,
          onDragEnd: this.handleResizeEnd,
          cursor: 'col-resize',
        };
        registerDragDrop(dragDrop);
      }
      updateResizeGripper(this.block, draggingRefCell);
    } else {
      removeResizeGripper(this.block);
    }
    //
    this.editor.selection.caret.update();
    //
  }

  private handleMouseMove = (event: MouseEvent) => {
    //
    if (this.draggingRefCell) {
      return;
    }
    //
    this.updateGripper(event.x, event.y);
  };

  private handleResizeStart = (drag: DragDrop<HTMLTableCellElement>, event: MouseEvent, elem: HTMLElement) => {
    this.draggingRefCell = drag.data;
  };

  // eslint-disable-next-line max-len
  private handleResizing = (drag: DragDrop<HTMLTableCellElement>, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number) => {
    const x = event.x - drag.dragOffsetX;
    //
    const cell = this.draggingRefCell;
    assert(cell);
    //
    const cells = getEffectedCells(this.table, cell);
    cells.forEach((cellData) => {
      const cell = cellData.cell;
      const cellRect = cell.getBoundingClientRect();
      let newWidth = x - cellRect.left + GRIPPER_SIZE_HALF - CONTAINER_CELL_DELTA;
      const container = getChildContainerInCell(cell);
      const minWidth = getContainerMinWidth(this.editor, container);
      if (minWidth) {
        if (newWidth < minWidth) {
          newWidth = minWidth;
        }
      }
      //
      const parentContainer = getParentContainer(this.block);
      const parentContainerWidth = getContainerWidth(parentContainer);
      if (parentContainerWidth) {
        // check width
        const currentWidth = container.getBoundingClientRect().width;
        const currentTableWidth = this.table.getBoundingClientRect().width;
        const newTableWidth = currentTableWidth + (newWidth - currentWidth);
        if (newTableWidth > parentContainerWidth) {
          newWidth = currentWidth;
        }
      }
      //
      setContainerWidth(container, newWidth);
    });
    //
    updateResizeGripper(this.block, cell);
  };

  private handleResizeEnd = (drag: unknown, event: MouseEvent, elem: HTMLElement, deltaX: number, deltaY: number) => {
    this.draggingRefCell = null;
    removeResizeGripper(this.block);
    this.updateGripper(event.x, event.y);
  };

  static register(editor: NextEditor, block: BlockElement) {
    const handler = new TableResizeMouseHandler(editor, block);
    handler.bindEvents();
    TableResizeMouseHandler.handlers.set(block, handler);
  }

  static unregister(editor: NextEditor, block: BlockElement) {
    const handler = TableResizeMouseHandler.handlers.get(block);
    if (handler) {
      handler.unbindEvents();
      TableResizeMouseHandler.handlers.delete(block);
    }
  }
}

export function bindTableResizeEvent(editor: NextEditor, block: BlockElement) {
  TableResizeMouseHandler.register(editor, block);
}

export function unbindTableResizeEvent(editor: NextEditor, block: BlockElement) {
  TableResizeMouseHandler.unregister(editor, block);
}
