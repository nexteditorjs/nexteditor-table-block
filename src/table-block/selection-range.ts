import { BlockElement, ComplexBlockPosition } from '@nexteditorjs/nexteditor-core';
import { SelectTableCustom } from './doc-table-data';
import { TableGrid } from './table-grid';

export function getTableSelectionRange(tableBlock: BlockElement, start: ComplexBlockPosition, end: ComplexBlockPosition) {
  const grid = TableGrid.fromBlock(tableBlock);
  const from = start;
  const to = end;
  const fromCell = grid.getCellByContainerId(from.childContainerId);
  const toCell = grid.getCellByContainerId(to.childContainerId);

  const fromCustom = from.custom as SelectTableCustom;
  const toCustom = to.custom as SelectTableCustom;
  //
  const fromRowTemp = fromCustom?.rowIndex ?? fromCell.row;
  const fromColTemp = fromCustom?.colIndex ?? fromCell.col;
  const toRowTemp = toCustom?.rowIndex ?? (toCell.row + toCell.rowSpan - 1);
  const toColTemp = toCustom?.colIndex ?? (toCell.col + toCell.colSpan - 1);
  const fromRow = Math.min(fromRowTemp, toRowTemp);
  const toRow = Math.max(fromRowTemp, toRowTemp);
  const fromCol = Math.min(fromColTemp, toColTemp);
  const toCol = Math.max(fromColTemp, toColTemp);

  return {
    fromRow,
    toRow,
    fromCol,
    toCol,
  };
}
