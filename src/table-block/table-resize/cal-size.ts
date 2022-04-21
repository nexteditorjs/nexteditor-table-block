import { getContainerMinWidth, NextEditor } from '@nexteditorjs/nexteditor-core';
import { getTableColumnWidths } from '../border-bar/column-width';
import { MIN_COLUMN_WIDTH } from '../doc-table-data';
import { DocTableCellData } from '../doc-table-grid';
import { getChildContainerInCell } from '../table-dom';
import { TableGrid } from '../table-grid';
import { CONTAINER_CELL_DELTA, GRIPPER_SIZE_HALF } from './resize-gripper';

export function getTableResizeMinX(editor: NextEditor, draggingRefCell: HTMLTableCellElement, table: HTMLTableElement, x: number) {
  //
  const cell = draggingRefCell;
  const grid = TableGrid.fromTable(table);
  const cellData = grid.getCellByCellElement(cell);
  const colIndex = cellData.col + cellData.colSpan - 1;
  const widths = getTableColumnWidths(table);
  //
  let minX = x;
  //
  const getRightWidth = (cellData: DocTableCellData, colIndex: number) => {
    const from = colIndex + 1;
    const to = cellData.col + cellData.colSpan;
    const width = widths.slice(from, to).reduce((a, b) => a + b, 0);
    return width;
  };
  //
  const cells = new Set<HTMLTableCellElement>();
  //
  for (let row = 0; row < grid.rowCount; row++) {
    const cellData = grid.getCell({ row, col: colIndex });
    if (cells.has(cellData.cell)) {
      continue;
    }
    cells.add(cellData.cell);
    //
    const cell = cellData.cell;
    const cellRect = cell.getBoundingClientRect();
    let newWidth = x - cellRect.left + GRIPPER_SIZE_HALF - CONTAINER_CELL_DELTA;
    const container = getChildContainerInCell(cell);
    const totalWidth = getContainerMinWidth(editor, container) || (MIN_COLUMN_WIDTH * cellData.colSpan);
    const rightWidth = getRightWidth(cellData, colIndex);
    const minWidth = totalWidth - rightWidth;
    // console.debug(`container min-width: ${minWidth}`);
    if (newWidth < minWidth) {
      newWidth = minWidth;
    }
    //
    const newX = cellRect.left + newWidth;
    minX = Math.max(minX, newX);
    //
  }
  //
  return minX;
}
