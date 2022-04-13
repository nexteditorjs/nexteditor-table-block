import { assert, BlockElement, createEmptyContainer, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';
import { splitColCells } from './split-cell';

const logger = getLogger('table-insert-column');

export function insertColumn(editor: NextEditor, tableBlock: BlockElement, insertIndex: number) {
  //
  const table = getBlockTable(tableBlock);
  //
  let grid = TableGrid.fromTable(table);
  //
  const colCount = grid.colCount;
  assert(logger, insertIndex >= 0 && insertIndex <= colCount, `insert index ${insertIndex} is out of range [0, ${colCount}]`);
  //
  if (insertIndex < colCount) {
    splitColCells(editor, tableBlock, insertIndex, { onlyVirtual: true });
    grid = TableGrid.fromTable(table);
  }
  //
  const oldBlockData = editor.getBlockData(tableBlock) as DocTableBlockData;
  //
  const virtualCells = grid.getVirtualCellContainersGrid(); // grid[row][col
  const rows = virtualCells.length;
  assert(logger, rows === grid.rowCount, 'virtual cells count is not equal to grid row count');
  for (let row = 0; row < rows; row++) {
    const newContainerId = createEmptyContainer(editor.doc);
    const colContainerIds = virtualCells[row];
    colContainerIds.splice(insertIndex, 0, newContainerId);
  }
  //
  const newChildren = TableGrid.virtualCellContainersGridToChildren(virtualCells);
  const newBlockData = {
    ...oldBlockData,
    cols: oldBlockData.cols + 1,
    children: newChildren,
  };
  //
  editor.updateBlockData(tableBlock, newBlockData);
}
