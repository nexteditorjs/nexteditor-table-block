import { assert, BlockElement, ComplexBlockPosition, createBlockSimpleRange, createEmptyContainer, getBlockType, getLogger, NextEditor, SelectionRange } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { deleteContainerData } from '../table-block/pick-container-data';
import { getTableSelectionRange } from '../table-block/selection-range';
import { tableData2Grid } from '../table-block/table-data';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('delete-rows');

export function canDeleteRows(editor: NextEditor, block: BlockElement, range: SelectionRange): boolean {
  const { start, end } = range;
  if (start.blockId !== end.blockId) {
    return false;
  }
  if (range.isSimple()) {
    return false;
  }
  const testBlock = editor.getBlockById(start.blockId);
  if (testBlock !== block) return false;
  //
  if (getBlockType(block) !== 'table') return false;
  //
  const { fromCol, toCol } = getTableSelectionRange(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);

  const grid = TableGrid.fromBlock(block);
  return fromCol === 0 && toCol === grid.colCount - 1;
}

export function deleteRows(range: SelectionRange) {
  const editor = range.getEditor();
  const block = editor.getBlockById(range.start.blockId);
  if (!canDeleteRows(editor, block, range)) {
    return;
  }
  //
  if (range.isSimple()) {
    editor.deleteBlock(block);
    return;
  }
  //
  const { fromRow: startRow, toRow: endRow } = getTableSelectionRange(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  const grid = TableGrid.fromBlock(block);
  if (startRow === 0 && endRow === grid.rowCount - 1) {
    editor.deleteBlock(block);
    return;
  }
  //
  const effectedCells = new Set<string>();
  //
  const cells = grid.map((cell) => cell.containerId);
  for (let rowIndex = endRow; rowIndex >= startRow; rowIndex--) {
    const row = cells[rowIndex];
    row.forEach((cell) => effectedCells.add(cell));
    cells.splice(rowIndex, 1);
  }
  //
  const existsContainerIds = new Set(cells.flat());
  const deletedContainerIds = new Set(Array.from(effectedCells).filter((containerId) => !existsContainerIds.has(containerId)));
  //
  const deleteCount = endRow - startRow + 1;
  const modifiedRowSpan = new Map<string, number>();
  const replacedContainerData = new Map<string, { newContainerId: string, rowSpan: number }>();
  //
  effectedCells.forEach((containerId) => {
    if (deletedContainerIds.has(containerId)) {
      // entirely deleted
      return;
    }
    //
    const real = grid.getCellByContainerId(containerId);
    assert(logger, real.rowSpan > 1, 'invalid effected cell, rowSpan === 1');
    if (real.row < startRow) {
      assert(logger, existsContainerIds.has(containerId), 'invalid effected cell, not exists');
      //
      let toRow = real.row + real.rowSpan - 1;
      if (toRow > endRow) {
        toRow = endRow;
      }
      const removedRowSpan = toRow - startRow + 1;
      const newSpanned = real.rowSpan - removedRowSpan;
      modifiedRowSpan.set(containerId, newSpanned);
      return;
    }
    //
    assert(logger, real.row <= endRow, 'invalid effected cell, col > endCol');
    //
    const from = real.row;
    const to = real.row + real.rowSpan - 1;
    const newSpanned = to - from + 1 - deleteCount;
    assert(logger, newSpanned > 0, 'invalid effected cell, newSpanned <= 0');
    const newContainerId = createEmptyContainer(editor.doc);
    replacedContainerData.set(containerId, { newContainerId, rowSpan: newSpanned });
    //
  });
  //
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i];
    for (let j = startRow; j < row.length; j++) {
      const containerId = row[j];
      const newContainer = replacedContainerData.get(containerId);
      if (newContainer) {
        row[j] = newContainer.newContainerId;
      }
    }
  }
  //
  const oldBlockData = cloneDeep(editor.getBlockData(block)) as DocTableBlockData;
  //
  deletedContainerIds.forEach((containerId) => {
    deleteContainerData(oldBlockData, containerId);
  });
  //
  modifiedRowSpan.forEach((rowSpan, containerId) => {
    assert(logger, rowSpan >= 1, 'invalid modified rowSpan, rowSpan < 1');
    if (rowSpan === 1) {
      delete oldBlockData[`${containerId}/rowSpan`];
    } else {
      oldBlockData[`${containerId}/rowSpan`] = rowSpan;
    }
  });
  //
  replacedContainerData.forEach((data, oldContainerId) => {
    deleteContainerData(oldBlockData, oldContainerId);
    const { newContainerId, rowSpan } = data;
    assert(logger, rowSpan >= 1, 'invalid newContainerData, rowSpan < 1');
    if (rowSpan > 1) {
      oldBlockData[`${newContainerId}/rowSpan`] = rowSpan;
    }
    const colSpan = grid.getCellByContainerId(oldContainerId).colSpan;
    if (colSpan > 1) {
      oldBlockData[`${newContainerId}/colSpan`] = colSpan;
    }
  });
  //
  const focusedContainerId = cells[startRow] ? cells[startRow][0] : cells[startRow - 1][0];
  const focusedBlock = editor.getChildContainerData(focusedContainerId)[0];
  //
  const children = TableGrid.virtualCellContainersGridToChildren(cells);
  const newBlockData = {
    ...oldBlockData,
    rows: oldBlockData.rows - deleteCount,
    children,
  };
  // verify
  tableData2Grid(newBlockData);
  //
  editor.updateBlockData(block, newBlockData, createBlockSimpleRange(editor, focusedBlock.id, 0));
  editor.deleteChildContainers(Array.from(deletedContainerIds));
  editor.deleteChildContainers(Array.from(replacedContainerData.keys()));
}
