import { assert, BlockElement, createEmptyContainer, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DEFAULT_COLUMN_WIDTH, DocTableBlockData } from '../table-block/doc-table-data';
import { tableData2Grid } from '../table-block/table-data';
import { getBlockTable } from '../table-block/table-dom';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('table-insert-column');

export function insertColumn(editor: NextEditor, tableBlock: BlockElement, insertIndex: number) {
  //
  const table = getBlockTable(tableBlock);
  const grid = TableGrid.fromTable(table);
  const colCount = grid.colCount;
  assert(logger, insertIndex >= 0 && insertIndex <= colCount, `insert index ${insertIndex} is out of range [0, ${colCount}]`);
  //
  const cells = grid.map((cell) => cell.containerId);
  //
  const spannedContainerIds = new Set<string>();
  //
  for (let row = 0; row < cells.length; row++) {
    const rowData = cells[row];
    const left = rowData[insertIndex - 1];
    const right = rowData[insertIndex];

    if (insertIndex === 0 || insertIndex === rowData.length || left !== right) {
      //
      const newContainerId = createEmptyContainer(editor.doc);
      rowData.splice(insertIndex, 0, newContainerId);
      //
    } else {
      rowData.splice(insertIndex, 0, left);
      spannedContainerIds.add(left);
    }
  }
  //
  const oldBlockData = cloneDeep(editor.getBlockData(tableBlock)) as DocTableBlockData;
  //
  spannedContainerIds.forEach((containerId) => {
    const key = `${containerId}/colSpan`;
    const oldSpan = oldBlockData[key];
    assert(logger, typeof oldSpan === 'number' && oldSpan > 1, `no colSpan for containerId ${containerId}, ${oldSpan}`);
    oldBlockData[key] = oldSpan + 1;
  });
  //
  const widths = oldBlockData.widths.concat();
  widths.splice(insertIndex, 0, DEFAULT_COLUMN_WIDTH);
  //
  const newChildren = TableGrid.virtualCellContainersGridToChildren(cells);
  const newBlockData: DocTableBlockData = {
    ...oldBlockData,
    cols: oldBlockData.cols + 1,
    children: newChildren,
    widths,
  };
  //
  // verify
  tableData2Grid(newBlockData);
  //
  editor.updateBlockData(tableBlock, newBlockData);
}
