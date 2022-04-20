import {
  assert, BlockElement, createElement, getBlockTools, NextEditor,
  DocBlock, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-dom';

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
}

export function removeAllResizeGripper(editor: NextEditor) {
  editor.rootContainer.querySelectorAll('.table-resize-gripper').forEach((gripper) => {
    gripper.remove();
  });
}

export function setTableColumnWidths(editor: NextEditor, block: BlockElement, widths: number[]) {
  const oldData = editor.getBlockData(block);
  const newData: DocBlock = {
    ...oldData,
    widths,
  };
  //
  //
  editor.updateBlockData(block, newData);
  editor.selection.updateSelection(null);
}
