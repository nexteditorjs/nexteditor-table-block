import { assert, BlockElement, ComplexBlockPosition, createBlockSimpleRange, createEmptyContainer, getBlockType, getLogger, NextEditor, SelectionRange } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { deleteContainerData } from '../table-block/pick-container-data';
import { getTableSelectionRange } from '../table-block/selection-range';
import { tableData2Grid } from '../table-block/table-data';
import { TableGrid } from '../table-block/table-grid';

const logger = getLogger('delete-columns');

export function canDeleteColumns(editor: NextEditor, block: BlockElement, range: SelectionRange): boolean {
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
  const { fromRow, toRow } = getTableSelectionRange(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);

  const grid = TableGrid.fromBlock(block);
  return fromRow === 0 && toRow === grid.rowCount - 1;
}

export function deleteColumns(range: SelectionRange) {
  const editor = range.getEditor();
  const block = editor.getBlockById(range.start.blockId);
  if (!canDeleteColumns(editor, block, range)) {
    return;
  }
  //
  if (range.isSimple()) {
    editor.deleteBlock(block);
    return;
  }
  //
  const { fromCol: startCol, toCol: endCol } = getTableSelectionRange(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  const grid = TableGrid.fromBlock(block);
  if (startCol === 0 && endCol === grid.colCount - 1) {
    editor.deleteBlock(block);
    return;
  }
  //
  const effectedCells = new Set<string>();
  //
  const cells = grid.map((cell) => cell.containerId);
  for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
    const row = cells[rowIndex];
    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      const containerId = row[colIndex];
      effectedCells.add(containerId);
    }
    row.splice(startCol, endCol - startCol + 1);
  }
  //
  const existsContainerIds = new Set(cells.flat());
  const deletedContainerIds = new Set(Array.from(effectedCells).filter((containerId) => !existsContainerIds.has(containerId)));
  //
  const deleteCount = endCol - startCol + 1;
  const modifiedColSpan = new Map<string, number>();
  const replacedContainerData = new Map<string, { newContainerId: string, colSpan: number }>();
  //
  effectedCells.forEach((containerId) => {
    if (deletedContainerIds.has(containerId)) {
      // entirely deleted
      return;
    }
    //
    const real = grid.getCellByContainerId(containerId);
    assert(logger, real.colSpan > 1, 'invalid effected cell, colSpan === 1');
    if (real.col < startCol) {
      assert(logger, existsContainerIds.has(containerId), 'invalid effected cell, not exists');
      //
      let toColumn = real.col + real.colSpan - 1;
      if (toColumn > endCol) {
        toColumn = endCol;
      }
      const removedColSpan = toColumn - startCol + 1;
      const newSpanned = real.colSpan - removedColSpan;
      modifiedColSpan.set(containerId, newSpanned);
      return;
    }
    //
    assert(logger, real.col <= endCol, 'invalid effected cell, col > endCol');
    //
    const from = real.col;
    const to = real.col + real.colSpan - 1;
    const newSpanned = to - from + 1 - deleteCount;
    assert(logger, newSpanned > 0, 'invalid effected cell, newSpanned <= 0');
    const newContainerId = createEmptyContainer(editor.doc);
    replacedContainerData.set(containerId, { newContainerId, colSpan: newSpanned });
    //
  });
  //
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i];
    for (let j = startCol; j < row.length; j++) {
      const containerId = row[j];
      const newContainer = replacedContainerData.get(containerId);
      if (newContainer) {
        row[j] = newContainer.newContainerId;
      }
    }
  }
  //
  const oldBlockData = cloneDeep(editor.getBlockData(block)) as DocTableBlockData;
  const widths = oldBlockData.widths;
  widths.splice(startCol, endCol - startCol + 1);
  //
  deletedContainerIds.forEach((containerId) => {
    deleteContainerData(oldBlockData, containerId);
  });
  //
  modifiedColSpan.forEach((colSpan, containerId) => {
    assert(logger, colSpan >= 1, 'invalid modified colSpan, colSpan < 1');
    if (colSpan === 1) {
      delete oldBlockData[`${containerId}/colSpan`];
    } else {
      oldBlockData[`${containerId}/colSpan`] = colSpan;
    }
  });
  //
  replacedContainerData.forEach((data, oldContainerId) => {
    deleteContainerData(oldBlockData, oldContainerId);
    const { newContainerId, colSpan } = data;
    assert(logger, colSpan >= 1, 'invalid newContainerData, colSpan < 1');
    if (colSpan > 1) {
      oldBlockData[`${newContainerId}/colSpan`] = colSpan;
    }
    const rowSpan = grid.getCellByContainerId(oldContainerId).rowSpan;
    if (rowSpan > 1) {
      oldBlockData[`${newContainerId}/rowSpan`] = rowSpan;
    }
  });
  //
  const focusedContainerId = cells[0][startCol] ?? cells[0][startCol - 1];
  const focusedBlock = editor.getChildContainerData(focusedContainerId)[0];
  //
  const children = TableGrid.virtualCellContainersGridToChildren(cells);
  const newBlockData = {
    ...oldBlockData,
    cols: oldBlockData.cols - deleteCount,
    children,
  };
  // verify
  tableData2Grid(newBlockData);

  editor.updateBlockData(block, newBlockData, createBlockSimpleRange(editor, focusedBlock.id, 0));
  editor.deleteChildContainers(Array.from(deletedContainerIds));
  editor.deleteChildContainers(Array.from(replacedContainerData.keys()));
}
