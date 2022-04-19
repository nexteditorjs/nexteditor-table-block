import { BlockElement, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from '../table-grid';

const logger = getLogger('column-width');

function calculateColumnWidth(grid: TableGrid, widths: number[], colIndex: number): number {
  //
  const calculateWidth = (totalWidth: number, colIndex: number, from: number, to: number) => {
    //
    let otherWidth = 0;
    //
    for (let col = from; col <= to; col++) {
      if (col === colIndex) {
        continue;
      }
      const width = widths[col];
      if (width === 0) {
        return 0;
      }
      //
      otherWidth += width;
    }
    //
    const width = totalWidth - otherWidth;
    logger.debug(`total width: ${totalWidth}, other width: ${otherWidth}, width: ${width}`);
    return width;
  };
  //
  for (let rowIndex = 0; rowIndex < grid.rowCount; rowIndex++) {
    const cellData = grid.getCell({ row: rowIndex, col: colIndex });
    if (cellData.cell.colSpan !== 1) {
      const realCell = grid.getRealCell({ col: colIndex, row: rowIndex });
      const startCol = realCell.col;
      const endCol = startCol + realCell.colSpan - 1;
      const spannedWidth = cellData.cell.getBoundingClientRect().width;
      const otherWidth = calculateWidth(spannedWidth, colIndex, startCol, endCol);
      logger.debug(`spanned width: ${spannedWidth}, ${otherWidth}`);
      if (otherWidth > 0) {
        return otherWidth;
      }
    }
  }
  return 0;
}

function debugWidth(widths: number[]) {
  logger.log(widths.map(Math.round).join());
}
//

export function getColumnWidth(editor: NextEditor, tableBlock: BlockElement) {
  const grid = TableGrid.fromBlock(tableBlock);

  //
  const widths: number[] = [];
  for (let colIndex = 0; colIndex < grid.colCount; colIndex++) {
    widths.push(0);
  }
  //
  const fillWidths = () => {
    for (let colIndex = 0; colIndex < grid.colCount; colIndex++) {
      for (let rowIndex = 0; rowIndex < grid.rowCount; rowIndex++) {
        const cellData = grid.getCell({ row: rowIndex, col: colIndex });
        if (cellData.colSpan === 1) {
          widths[colIndex] = cellData.cell.getBoundingClientRect().width;
        }
      }
    }
  };
  //

  fillWidths();
  //
  debugWidth(widths);
  //
  for (;;) {
    //
    let changed = false;
    //
    for (let colIndex = 0; colIndex < grid.colCount; colIndex++) {
      if (widths[colIndex] > 0) {
        continue;
      }
      const width = calculateColumnWidth(grid, widths, colIndex);
      if (width > 0) {
        widths[colIndex] = width;
        changed = true;
      }
    }
    //
    if (!changed) {
      break;
    }
    //
    debugWidth(widths);
  }
  //
}
