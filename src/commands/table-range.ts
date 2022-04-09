import { assert, getBlockType, getLogger, SelectionRange } from '@nexteditorjs/nexteditor-core';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('table-range');

export function getRangeDetails(range: SelectionRange) {
  //
  assert(logger, !range.isSimple(), 'must be complex selection range');
  const { start, end } = range;
  assert(logger, !start.isSimple(), 'invalid start pos type');
  assert(logger, !end.isSimple(), 'invalid end pos type');
  //
  const editor = range.getEditor();
  assert(logger, start.blockId === end.blockId, 'invalid range, not same block');
  const block = editor.getBlockById(start.blockId);
  assert(logger, getBlockType(block) === 'table', 'invalid block type, not a table block');
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
