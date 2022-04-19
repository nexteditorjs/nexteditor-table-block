import { assert, BlockElement, ComplexBlockPosition, createComplexBlockPosition, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { DocTableCellIndex } from '../doc-table-grid';
import { TableGrid } from '../table-grid';

const logger = getLogger('adjust-selection-pos');

interface CellRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

function isAllRealTop(cells: string[][], rect: CellRect) {
  if (rect.top === 0) {
    return true;
  }
  for (let col = rect.left; col <= rect.right; col++) {
    if (cells[rect.top - 1][col] === cells[rect.top][col]) {
      return false;
    }
  }
  return true;
}

function isAllRealLeft(cells: string[][], rect: CellRect) {
  if (rect.left === 0) {
    return true;
  }
  for (let row = rect.top; row <= rect.bottom; row++) {
    if (cells[row][rect.left - 1] === cells[row][rect.left]) {
      return false;
    }
  }
  return true;
}

function isAllRealBottom(cells: string[][], rect: CellRect) {
  if (rect.bottom === cells.length - 1) {
    return true;
  }
  //
  for (let col = rect.left; col <= rect.right; col++) {
    if (cells[rect.bottom][col] === cells[rect.bottom + 1][col]) {
      return false;
    }
  }
  return true;
}

function isAllRealRight(cells: string[][], rect: CellRect) {
  if (rect.right === cells[0].length - 1) {
    return true;
  }
  //
  for (let row = rect.top; row <= rect.bottom; row++) {
    if (cells[row][rect.right] === cells[row][rect.right + 1]) {
      return false;
    }
  }
  return true;
}

function expandTopLeft(cells: string[][], from: DocTableCellIndex, to: DocTableCellIndex): CellRect {
  //
  const left = from.col;
  const top = from.row;
  const right = to.col;
  const bottom = to.row;
  //
  const rect = { left, top, right, bottom };
  //
  let changed = false;
  do {
    //
    changed = false;
    if (!isAllRealTop(cells, rect)) {
      rect.top--;
      changed = true;
      continue;
    }
    //
    if (!isAllRealLeft(cells, rect)) {
      rect.left--;
      changed = true;
      continue;
    }
    //
    if (!isAllRealBottom(cells, rect)) {
      rect.bottom++;
      changed = true;
      continue;
    }
    if (!isAllRealRight(cells, rect)) {
      rect.right++;
      changed = true;
      continue;
    }
  } while (changed);
  //
  console.debug('expandTopLeft', rect);
  return rect;
}

export function adjustSelectionPos(editor: NextEditor, tableBlock: BlockElement, start: ComplexBlockPosition, end: ComplexBlockPosition): { start: ComplexBlockPosition, end: ComplexBlockPosition } {
  //
  if (start.custom !== undefined || end.custom !== undefined) {
    return {
      start,
      end,
    };
  }
  //
  const grid = TableGrid.fromBlock(tableBlock);
  const cells: string[][] = [];
  for (let row = 0; row < grid.rowCount; row++) {
    const rowData: string[] = [];
    for (let col = 0; col < grid.colCount; col++) {
      rowData.push(grid.getCell({ row, col }).containerId);
    }
    cells.push(rowData);
  }
  //
  //

  const startCell = grid.getCellByContainerId(start.childContainerId);
  const endCell = grid.getCellByContainerId(end.childContainerId);
  //
  const startRow = Math.min(startCell.row, endCell.row);
  const endRow = Math.max(startCell.row, endCell.row);
  const startCol = Math.min(startCell.col, endCell.col);
  const endCol = Math.max(startCell.col, endCell.col);
  //
  const rect = expandTopLeft(cells, { row: startRow, col: startCol }, { row: endRow, col: endCol });
  const topLeft = grid.getCell({ row: rect.top, col: rect.left });
  const bottomRight = grid.getCell({ row: rect.bottom, col: rect.right });
  return {
    start: createComplexBlockPosition(tableBlock, topLeft.containerId),
    end: createComplexBlockPosition(tableBlock, bottomRight.containerId),
  };
  //
}
