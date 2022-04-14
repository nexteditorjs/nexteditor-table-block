import {
  assert, BlockElement, createElement, getBlockTools, NextEditor,
  DocBlock, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { insertColumn } from '../../commands/insert-column';
import { getBlockTable } from '../table-dom';
import { TableCell, TableGrid } from '../table-grid';
import { createInsertColumnButton } from '../ui/insert-column-button';

const logger = getLogger('table-resize-gripper');

export const GRIPPER_SIZE = 7;
export const GRIPPER_SIZE_HALF = (GRIPPER_SIZE - 1) / 2;
export const CONTAINER_CELL_DELTA = 3;

export function getCellFromRightBorder(table: HTMLTableElement, x: number, y: number) {
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
  assert(logger, colIndex >= 0, `invalid column index: ${colIndex}`);
  const grid = TableGrid.fromTable(table);
  const cells = grid.getColumnRealCells(colIndex).filter((cell) => {
    const accept = cell.col + cell.colSpan === colIndex + 1;
    return accept;
  });
  return cells;
}

export function editorHasExistsResizeGripper(editor: NextEditor) {
  return !!editor.rootContainer.querySelector('.table-resize-gripper');
}

export function getExistsResizeGripper(block: BlockElement) {
  const tools = getBlockTools(block);
  const gripper = tools.querySelector('.table-resize-gripper') as HTMLDivElement;
  return gripper;
}

export function createResizeGripper(block: BlockElement) {
  const exists = getExistsResizeGripper(block);
  assert(logger, !exists, 'resize gripper has already exists');
  const tools = getBlockTools(block);
  const gripper = createElement('div', ['table-resize-gripper', 'table-indicator'], tools);
  createInsertColumnButton(gripper);
  createElement('div', ['table-resize-gripper-indicator'], gripper);
  return gripper;
}

export function updateResizeGripper(editor: NextEditor, block: BlockElement, cell: HTMLTableCellElement) {
  let gripper = getExistsResizeGripper(block);
  if (!gripper) {
    gripper = createResizeGripper(block);
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
  //
  const button = gripper.querySelector('.table-insert-column-button') as HTMLDivElement;
  assert(logger, button, 'button not found');
  button.onclick = (event) => {
    const grid = TableGrid.fromBlock(block);
    const cellData = grid.getCellByCellElement(cell);
    const colIndex = cellData.col;
    insertColumn(editor, block, colIndex + cellData.colSpan);
    event.preventDefault();
    event.stopPropagation();
  };
  //
  button.onmousedown = (event) => {
    event.stopPropagation();
  };
}

export function getEffectedCells(table: HTMLTableElement, cell: HTMLTableCellElement) {
  //
  const grid = TableGrid.fromTable(table);
  const cellData = grid.getCellByCellElement(cell);
  const cells = getCellsToColumn(table, cellData.col + cellData.colSpan - 1);
  return cells;
}

export function removeAllResizeGripper(editor: NextEditor) {
  editor.rootContainer.querySelectorAll('.table-resize-gripper').forEach((gripper) => {
    gripper.remove();
  });
}

export function changeContainerSize(editor: NextEditor, block: BlockElement, sizes: Map<string, number>) {
  const sizeEntries = Array.from(sizes.entries()).map(([containerId, width]) => [`${containerId}/width`, width]);
  const oldData = editor.getBlockData(block);
  const newData: DocBlock = {
    ...oldData,
    ...Object.fromEntries(sizeEntries),
  };
  //
  //
  editor.updateBlockData(block, newData);
  editor.selection.updateSelection(null);
}
