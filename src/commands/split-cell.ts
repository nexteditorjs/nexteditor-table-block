import { assert, BlockElement, createEmptyContainer, DocBlockAttributes, getBlockType, NextEditor, SelectionRange } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DocTableCellIndex } from '../table-block/doc-table-grid';
import { TableGrid } from '../table-block/table-grid';
import { getRangeDetails } from './table-range';

export function splitCell(editor: NextEditor, block: BlockElement, index: DocTableCellIndex) {
  //
  const grid = TableGrid.fromBlock(block);
  const cellData = grid.getRealCell(index);
  assert(!cellData.virtual, 'should not split virtual cell');
  assert(cellData.colSpan > 1 || cellData.rowSpan > 1, 'cell does not has span data');
  //
  const virtualCellContainers: string[][] = [];
  for (let row = 0; row < grid.rowCount; row++) {
    const rowContainerIds = [];
    for (let col = 0; col < grid.colCount; col++) {
      const cell = grid.getCell({ row, col });
      rowContainerIds.push(cell.containerId);
    }
    virtualCellContainers.push(rowContainerIds);
  }
  //
  for (let y = 0; y < cellData.rowSpan; y++) {
    for (let x = 0; x < cellData.colSpan; x++) {
      //
      if (y === 0 && x === 0) {
        continue;
      }
      const rowIndex = y + cellData.row;
      const colIndex = x + cellData.col;
      //
      const newContainerId = createEmptyContainer(editor.doc);
      virtualCellContainers[rowIndex][colIndex] = newContainerId;
    }
  }
  //
  const oldData = editor.getBlockData(block);
  const newData = cloneDeep(oldData) as DocBlockAttributes;
  //
  delete newData.id;
  delete newData.type;
  //
  delete newData[`${cellData.containerId}_colSpan`];
  delete newData[`${cellData.containerId}_rowSpan`];
  //
  const virtualCellContainersToChildren = (containerIds: string[][]) => {
    const ret: string[] = [];
    containerIds.forEach((rowContainerIds) => {
      rowContainerIds.forEach((containerId) => {
        if (ret.indexOf(containerId) === -1) {
          ret.push(containerId);
        }
      });
    });
    return ret;
  };
  //
  newData.children = virtualCellContainersToChildren(virtualCellContainers);
  editor.updateBlockData(block, newData);
}

export function splitCells(editor: NextEditor, block: BlockElement, cellIndexes: DocTableCellIndex[]) {
  cellIndexes.forEach((index) => {
    const cell = TableGrid.fromBlock(block).getCell(index);
    if (cell.virtual || cell.colSpan > 1 || cell.rowSpan > 1) {
      splitCell(editor, block, index);
    }
  });
}

export function canSplitCell(editor: NextEditor, block: BlockElement, range: SelectionRange) {
  if (range.isSimple()) return false;
  //
  const { start, end } = range;
  if (start.blockId !== end.blockId) return false;
  //
  const testBlock = editor.getBlockById(start.blockId);
  if (testBlock !== block) return false;
  //
  if (getBlockType(block) !== 'table') return false;
  //
  const { startCell, startRow, startCol, endRow, endCol } = getRangeDetails(range);
  if (startRow !== endRow || startCol !== endCol) return false;
  if (startCell.colSpan === 1 && startCell.rowSpan === 1) {
    return false;
  }
  //
  return true;
}
export function splitRangeCells(range: SelectionRange) {
  //
  const { editor, block, startRow, startCol, endRow, endCol } = getRangeDetails(range);
  //
  const indexes: DocTableCellIndex[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      indexes.push({ row, col });
    }
  }
  //
  splitCells(editor, block, indexes);
  return true;
}
