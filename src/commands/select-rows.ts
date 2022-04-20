import { assert, BlockElement, createComplexBlockPosition, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { isTableBlock } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('table-select-columns');

export function selectRows(editor: NextEditor, tableBlock: BlockElement, from: number, count = 1) {
  assert(logger, isTableBlock(tableBlock), 'is not a table block');
  const grid = TableGrid.fromBlock(tableBlock);
  assert(logger, from >= 0 && from < grid.rowCount, 'invalid from');
  assert(logger, count > 0 && from + count <= grid.rowCount, 'invalid count');
  //
  const topLeft = grid.getCell({ row: from, col: 0 });
  const bottomRight = grid.getCell({ row: from + count - 1, col: grid.colCount - 1 });
  //
  const start = createComplexBlockPosition(tableBlock, topLeft.containerId, { rowIndex: from });
  const end = createComplexBlockPosition(tableBlock, bottomRight.containerId, { rowIndex: from + count - 1 });
  //
  editor.selection.setSelection(start, end);
}
