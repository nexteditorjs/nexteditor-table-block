import { assert, getLogger } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from '../table-grid';

const logger = getLogger('row-height');

export function getTableRowHeights(table: HTMLTableElement) {
  const grid = TableGrid.fromTable(table);
  //
  const rows = table.rows;
  assert(logger, rows.length === grid.rowCount, 'row count mismatch');
  //
  const heights: number[] = Array(grid.rowCount).fill(0);
  //
  for (let i = 0; i < rows.length;) {
    //
    let spanCount = 1;
    const row = rows[i];
    let totalHeight = row.getBoundingClientRect().height;
    let next = i + 1;
    while (next < rows.length) {
      const nextRow = rows[next];
      if (nextRow.cells.length !== 0) {
        break;
      }
      spanCount++;
      next++;
      totalHeight += nextRow.getBoundingClientRect().height;
    }
    //
    for (let j = 0; j < spanCount; j++) {
      heights[i + j] = totalHeight / spanCount;
    }
    //
    i = next;
  }
  //
  logger.debug('heights', heights.join(', '));
  return heights;
}
