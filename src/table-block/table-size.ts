import { BlockElement, NextEditor, getContainerMinWidth, getContainerWidth } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from './table-grid';

const TABLE_CELL_MIN_WIDTH = 40;
const TABLE_COLUMN_MIN_WIDTH = TABLE_CELL_MIN_WIDTH; // add table border size

function getRowMinWidth(editor: NextEditor, grid: TableGrid, row: number) {
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
    let containerWidth = getContainerMinWidth(editor, cell.container) ?? (TABLE_COLUMN_MIN_WIDTH * cell.colSpan);
    //
    let containerStyleWidth = getContainerWidth(cell.container);
    if (containerStyleWidth) {
      containerStyleWidth += 3; // add border width
      if (containerStyleWidth > containerWidth) {
        containerWidth = containerStyleWidth;
      }
    }
    //
    minWidth += containerWidth;
  }
  //
  return minWidth;
}

export function getTableMinWidth(editor: NextEditor, tableBlock: BlockElement) {
  const grid = TableGrid.fromBlock(tableBlock);
  //
  let minWidth = 0;
  for (let row = 0; row < grid.rowCount; row++) {
    //
    minWidth = Math.max(minWidth, getRowMinWidth(editor, grid, row));
    //
  }
  return minWidth;
}
