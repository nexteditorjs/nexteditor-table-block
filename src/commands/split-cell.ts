import { assert, BlockElement, createBlockSimpleRange, createEmptyContainer, DocBlockAttributes, getBlockType, getLogger, NextEditor, SelectionRange } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { DocTableBlockData } from '../table-block/doc-table-data';
import { DocTableCellIndex } from '../table-block/doc-table-grid';
import { tableData2Grid } from '../table-block/table-data';
import { TableGrid } from '../table-block/table-grid';
import { getRangeDetails } from './table-range';

const logger = getLogger('split-cell');

export function splitCell(editor: NextEditor, block: BlockElement, index: DocTableCellIndex) {
  //
  const grid = TableGrid.fromBlock(block);
  const cellData = grid.getRealCell(index);
  assert(logger, !cellData.virtual, 'should not split virtual cell');
  assert(logger, cellData.colSpan > 1 || cellData.rowSpan > 1, 'cell does not has span data');
  //
  const virtualCellContainers = grid.getVirtualCellContainersGrid();
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
  const oldData = editor.getBlockData(block) as DocTableBlockData;
  const newData = cloneDeep(oldData);
  //
  delete newData[`${cellData.containerId}/colSpan`];
  delete newData[`${cellData.containerId}/rowSpan`];
  //
  newData.children = TableGrid.virtualCellContainersGridToChildren(virtualCellContainers);
  //
  const blocks = editor.getChildContainerData(cellData.containerId);
  const focusedBlock = blocks[0];
  assert(logger, focusedBlock, 'no child block');
  const newRange = createBlockSimpleRange(editor, focusedBlock.id, 0);

  //
  // verify
  tableData2Grid(newData);
  //
  editor.updateBlockData(block, newData, newRange);
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

export function splitColCells(editor: NextEditor, block: BlockElement, colIndex: number, options: { onlyVirtual: boolean }) {
  let grid = TableGrid.fromBlock(block);
  assert(logger, colIndex >= 0 && colIndex < grid.colCount, 'invalid colIndex');
  //
  const rowCount = grid.rowCount;
  const onlyVirtual = options.onlyVirtual;
  //
  for (let row = 0; row < rowCount; row++) {
    const cell = grid.getCell({ row, col: colIndex });
    if (((!onlyVirtual) || cell.virtual) && cell.colSpan > 1) {
      splitCell(editor, block, cell);
      grid = TableGrid.fromBlock(block);
    }
  }
}

export function splitRowCells(editor: NextEditor, block: BlockElement, rowIndex: number, options: { onlyVirtual: boolean }) {
  const onlyVirtual = options.onlyVirtual;
  let grid = TableGrid.fromBlock(block);
  assert(logger, rowIndex >= 0 && rowIndex < grid.rowCount, 'invalid rowIndex');
  //
  const colCount = grid.colCount;
  for (let col = 0; col < colCount; col++) {
    const cell = grid.getCell({ row: rowIndex, col });
    if (((!onlyVirtual) || cell.virtual) && cell.rowSpan > 1) {
      splitCell(editor, block, cell);
      grid = TableGrid.fromBlock(block);
    }
  }
}
