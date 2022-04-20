import { assert, BlockElement, createComplexBlockPosition, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { isTableBlock } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('table-select-columns');

export function selectColumns(editor: NextEditor, tableBlock: BlockElement, from: number, count = 1) {
  assert(logger, isTableBlock(tableBlock), 'is not a table block');
  const grid = TableGrid.fromBlock(tableBlock);
  assert(logger, from >= 0 && from < grid.colCount, 'invalid from');
  assert(logger, count > 0 && from + count <= grid.colCount, 'invalid count');
  //
  const topLeft = grid.getCell({ row: 0, col: from });
  const bottomRight = grid.getCell({ row: grid.rowCount - 1, col: from + count - 1 });
  //
  const start = createComplexBlockPosition(tableBlock, topLeft.containerId, { colIndex: from });
  const end = createComplexBlockPosition(tableBlock, bottomRight.containerId, { colIndex: from + count - 1 });
  //
  editor.selection.setSelection(start, end);
}
