import { BlockElement, SelectionRange } from '@nexteditorjs/nexteditor-core';
import { DocTableCellIndex } from '../table-block/doc-table-grid';
import { getRangeDetails } from './table-range';

export function splitCells(block: BlockElement, cells: DocTableCellIndex[]) {

}

export function splitRangeCells(range: SelectionRange) {
  //
  const { block, startRow, startCol, endRow, endCol } = getRangeDetails(range);
  if (startRow === endRow && startCol === endCol) {
    return false;
  }
  //
  const indexes: DocTableCellIndex[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      indexes.push({ row, col });
    }
  }
  //
  splitCells(block, indexes);
  return true;
}
