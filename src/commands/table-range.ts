import { assert, getBlockType, SelectionRange } from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

export function getRangeDetails(range: SelectionRange) {
  //
  assert(!range.isSimple(), 'must be complex selection range');
  const { start, end } = range;
  assert(!start.isSimple(), 'invalid start pos type');
  assert(!end.isSimple(), 'invalid end pos type');
  //
  const editor = range.getEditor();
  assert(start.blockId === end.blockId, 'invalid range, not same block');
  const block = editor.getBlockById(start.blockId);
  assert(getBlockType(block) === 'table');
  //
  const table = getBlockTable(block);
  const grid = TableGrid.fromTable(table);
  const startCell = grid.getCellByContainerId(start.childContainerId);
  const endCell = grid.getCellByContainerId(end.childContainerId);
  //
  const { row: startRow, col: startCol } = startCell;
  const { row: endRow, col: endCol } = endCell;

  //
  return {
    editor,
    block,
    table,
    startCell,
    endCell,
    startRow,
    startCol,
    endRow,
    endCol,
  };
}
