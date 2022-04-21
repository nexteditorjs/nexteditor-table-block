import { NextEditor, BlockElement, SelectionRange, ComplexBlockPosition } from '@nexteditorjs/nexteditor-core';
import { getTableColumnWidths } from './border-bar/column-width';
import { getTableRowHeights } from './border-bar/row-height';
import { getTableSelectionRange } from './selection-range';
import { getBlockTable } from './table-dom';

export function getClientRects(editor: NextEditor, block: BlockElement, range: SelectionRange): DOMRect[] {
  if (range.isSimple()) {
    return [getBlockTable(block).getBoundingClientRect()];
  }
  //
  const table = getBlockTable(block);
  const tableRect = table.getBoundingClientRect();
  //
  const { fromCol, fromRow, toCol, toRow } = getTableSelectionRange(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  //
  const widths = getTableColumnWidths(table);
  const left = widths.slice(0, fromCol).reduce((a, b) => a + b, 0);
  const right = left + widths.slice(fromCol, toCol + 1).reduce((a, b) => a + b, 0);
  //
  const heights = getTableRowHeights(table);
  const top = heights.slice(0, fromRow).reduce((a, b) => a + b, 0);
  const bottom = top + heights.slice(fromRow, toRow + 1).reduce((a, b) => a + b, 0);

  return [new DOMRect(tableRect.left + left, tableRect.top + top, right - left, bottom - top)];
}
