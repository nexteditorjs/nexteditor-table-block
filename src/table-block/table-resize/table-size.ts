import { BlockElement, NextEditor, getContainerMinWidth, getContainerWidth, getLogger } from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-dom';
import { TableCell, TableGrid } from '../table-grid';

const logger = getLogger('table-size');

const TABLE_CELL_MIN_WIDTH = 40;
const TABLE_COLUMN_MIN_WIDTH = TABLE_CELL_MIN_WIDTH; // add table border size

export function getTableCellPadding(table: HTMLTableElement) {
  const cell = table.querySelector('td') as HTMLTableCellElement;
  if (!cell) return 0;
  const style = window.getComputedStyle(cell);
  const borderLeft = Number.parseInt(style.borderLeft, 10);
  const borderRight = Number.parseInt(style.borderRight, 10);
  return (borderLeft + borderRight) / 2;
}

function getCellContainerMinWidth(editor: NextEditor, table: HTMLTableElement, cell: TableCell) {
  const containerWidth = getContainerMinWidth(editor, cell.container);
  if (containerWidth !== undefined) {
    return containerWidth + getTableCellPadding(table);
  }
  return TABLE_COLUMN_MIN_WIDTH * cell.colSpan - getTableCellPadding(table);
}

function getRowMinWidth(editor: NextEditor, table: HTMLTableElement, grid: TableGrid, row: number) {
  //
  let minWidth = 0;
  //
  const colCount = grid.colCount;
  for (let i = 0; i < colCount; i++) {
    //
    const cell = grid.getRealCell({
      col: i,
      row,
    });
    //
    if (cell.virtual) {
      continue;
    }
    //
    let containerWidth = getCellContainerMinWidth(editor, table, cell);
    //
    const containerStyleWidth = getContainerWidth(cell.container, { withPadding: true });
    if (containerStyleWidth) {
      if (containerStyleWidth > containerWidth) {
        containerWidth = containerStyleWidth;
      }
    }
    //
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    minWidth += containerWidth + getTableCellPadding(table);
    if (row === 0) {
      // console.debug(`col min width: ${containerWidth} + 2 = ${minWidth}`);
    }
  }
  //
  return minWidth;
}

export function getTableMinWidth(editor: NextEditor, tableBlock: BlockElement) {
  const table = getBlockTable(tableBlock);
  const grid = TableGrid.fromTable(table);
  //
  let minWidth = 0;
  for (let row = 0; row < grid.rowCount; row++) {
    //
    minWidth = Math.max(minWidth, getRowMinWidth(editor, table, grid, row));
    //
  }
  //
  const padding = getTableCellPadding(table);
  minWidth += padding;
  //
  // console.debug(`table width: ${table.getBoundingClientRect().width}, min-width: ${minWidth}`);
  return minWidth;
}
