import { getLogger } from '@nexteditorjs/nexteditor-core';
import { getTableCol } from '../table-dom';
import { TableGrid } from '../table-grid';

const logger = getLogger('column-width');

export function setColumnWidth(table: HTMLTableElement, colIndex: number, width: number) {
  getTableCol(table, colIndex).style.width = `${width}px`;
}

export function getTableColumnWidthsFromDom(table: HTMLTableElement) {
  const tableCols = Array.from((table.querySelector('colgroup') as HTMLElement).children) as HTMLTableColElement[];
  //
  const widths = tableCols.map((col) => col.getBoundingClientRect().width);
  if (widths[0] !== 0) {
    return widths;
  }
  //
  const grid = TableGrid.fromTable(table);
  const cellRightOffsets: number[] = Array(grid.colCount).fill(-1);
  //
  const left = table.getBoundingClientRect().left;
  //
  grid.toRealCells(grid.cells).forEach((cell) => {
    //
    const colIndex = cell.col + cell.colSpan - 1;
    if (cellRightOffsets[colIndex] === -1) {
      cellRightOffsets[colIndex] = cell.cell.getBoundingClientRect().right - left;
    }
    //
  });
  //
  logger.debug(`cellRightOffsets1: ${cellRightOffsets.join()}`);
  //
  //
  for (let col = 0; col < cellRightOffsets.length; col++) {
    //
    const offset = cellRightOffsets[col];
    if (offset === -1 || col === 0) {
      continue;
    }
    //
    let prevCol = col - 1;
    while (cellRightOffsets[prevCol] === -1) {
      prevCol--;
      if (prevCol === -1) {
        break;
      }
    }
    //
    const prevOffset = prevCol === -1 ? 0 : cellRightOffsets[prevCol];
    const totalWidth = offset - prevOffset;
    const averageWidth = totalWidth / (col - prevCol);
    for (let i = prevCol + 1; i < col; i++) {
      cellRightOffsets[i] = prevOffset + averageWidth * (i - prevCol);
    }
  }
  //
  logger.debug(`cellRightOffsets2: ${cellRightOffsets.join()}`);
  const result: number[] = [];
  let prev = 0;
  for (let col = 0; col < cellRightOffsets.length; col++) {
    const offset = cellRightOffsets[col];
    result.push(offset - prev);
    prev = offset;
  }
  logger.debug(`widths: ${result.join()}`);
  return result;
}

export function getTableColumnWidths(table: HTMLTableElement) {
  const tableCols = Array.from((table.querySelector('colgroup') as HTMLElement).children) as HTMLTableColElement[];
  //
  const widths = tableCols.map((col) => col.getBoundingClientRect().width || Number.parseInt(col.style.width, 10) || 100);
  //
  return widths;
}
