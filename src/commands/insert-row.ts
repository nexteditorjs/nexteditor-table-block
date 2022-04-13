import { assert, BlockElement, createEmptyContainer, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';
import { splitRowCells } from './split-cell';

const logger = getLogger('table-insert-row');

export function insertRow(editor: NextEditor, tableBlock: BlockElement, insertIndex: number) {
  //
  const table = getBlockTable(tableBlock);
  //
  let grid = TableGrid.fromTable(table);
  //
  const rowCount = grid.rowCount;
  assert(logger, insertIndex >= 0 && insertIndex <= rowCount, `insert index ${insertIndex} is out of range [0, ${rowCount}]`);
  if (insertIndex < rowCount) {
    splitRowCells(editor, tableBlock, insertIndex, { onlyVirtual: true });
    grid = TableGrid.fromTable(table);
  }
  //

  const oldBlockData = editor.getBlockData(tableBlock) as DocTableBlockData;
  //
  const virtualCells = grid.getVirtualCellContainersGrid(); // grid[row][col
  const rows = virtualCells.length;
  assert(logger, rows === grid.rowCount, 'virtual cells count is not equal to grid row count');
  //
  const row: string[] = [];
  const colCount = grid.colCount;
  for (let col = 0; col < colCount; col++) {
    const newContainerId = createEmptyContainer(editor.doc);
    row.push(newContainerId);
  }
  //
  virtualCells.splice(insertIndex, 0, row);

  const newChildren = TableGrid.virtualCellContainersGridToChildren(virtualCells);
  const newBlockData = {
    ...oldBlockData,
    rows: oldBlockData.rows + 1,
    children: newChildren,
  };
  //
  editor.updateBlockData(tableBlock, newBlockData);
}
