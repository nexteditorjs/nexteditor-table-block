import { assert, BlockElement, createEmptyContainer, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('table-insert-row');

export function insertRow(editor: NextEditor, tableBlock: BlockElement, insertIndex: number) {
  //
  const table = getBlockTable(tableBlock);
  const grid = TableGrid.fromTable(table);
  const rowCount = grid.rowCount;
  assert(logger, insertIndex >= 0 && insertIndex <= rowCount, `insert index ${insertIndex} is out of range [0, ${rowCount}]`);
  //
  const cells = grid.map((cell) => cell.containerId);
  //
  const spannedContainerIds = new Set<string>();
  //
  const rowData: string[] = [];
  for (let col = 0; col < grid.colCount; col++) {
    // const rowData = cells[row];
    const top = insertIndex > 0 && cells[insertIndex - 1][col];
    const bottom = insertIndex < grid.rowCount && cells[insertIndex][col];
    assert(logger, top || bottom, 'no top and bottom cell');

    if (insertIndex === 0 || insertIndex === grid.rowCount || top !== bottom) {
      const newContainerId = createEmptyContainer(editor.doc);
      rowData.push(newContainerId);
    } else {
      assert(logger, top, 'no top cell');
      rowData.push(top);
      spannedContainerIds.add(top);
    }
    //
  }
  //
  cells.splice(insertIndex, 0, rowData);
  //

  const oldBlockData = cloneDeep(editor.getBlockData(tableBlock)) as DocTableBlockData;
  //
  spannedContainerIds.forEach((containerId) => {
    const key = `${containerId}/rowSpan`;
    const oldSpan = oldBlockData[key];
    assert(logger, typeof oldSpan === 'number' && oldSpan > 1, `no rowSpan for containerId ${containerId}, ${oldSpan}`);
    oldBlockData[key] = oldSpan + 1;
  });

  const newChildren = TableGrid.virtualCellContainersGridToChildren(cells);
  const newBlockData = {
    ...oldBlockData,
    rows: oldBlockData.rows + 1,
    children: newChildren,
  };
  //
  editor.updateBlockData(tableBlock, newBlockData);
}
