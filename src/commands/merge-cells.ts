import {
  assert, BlockElement, containerToDoc, createBlockSimpleRange, DocBlockAttributes, getBlockType, getChildBlockCount,
  getContainerId, getLogger, NextEditor, SelectionRange,
} from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { TableGrid } from '../table-block/table-grid';
import { splitRangeCells } from './split-cell';
import { getRangeDetails } from './table-range';

const logger = getLogger('merge-cells');

export function canMergeCells(editor: NextEditor, block: BlockElement, range: SelectionRange) {
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
  const { startRow, startCol, endRow, endCol } = getRangeDetails(range);
  if (startRow === endRow && startCol === endCol) return false;
  //
  return true;
}

export function mergeRangeCells(range: SelectionRange) {
  //
  const { editor, block, table, startRow, startCol, endCell } = getRangeDetails(range);
  const endRow = endCell.row + endCell.rowSpan - 1;
  const endCol = endCell.col + endCell.colSpan - 1;
  //
  splitRangeCells(range);
  //
  const blockData = cloneDeep(editor.getBlockData(block));
  assert(logger, blockData.children, 'no table children');
  //
  const grid = TableGrid.fromTable(table);
  //
  const selectedCells = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellData = grid.getCell({ row, col });
      assert(logger, !cellData.virtual, 'cell is virtual');
      selectedCells.push(cellData);
    }
  }
  //
  assert(logger, selectedCells.length > 0, 'no selected cells');
  const firstCellData = selectedCells[0];
  const lastCells = selectedCells.slice(1);
  const firstCellContainer = grid.getCellByContainerId(firstCellData.containerId).container;
  const deletedContainers: string[] = [];
  lastCells.forEach((cellData) => {
    const container = grid.getCellByContainerId(cellData.containerId).container;
    const containerId = getContainerId(container);
    const doc = containerToDoc(editor, containerId);
    editor.insertDocAt(firstCellContainer, getChildBlockCount(firstCellContainer), doc);
    //
    deletedContainers.push(containerId);
  });
  //
  const firstCellContainerId = getContainerId(firstCellContainer);
  const colSpan = endCol - startCol + 1;
  const rowSpan = endRow - startRow + 1;
  blockData[`${firstCellContainerId}/colSpan`] = colSpan;
  blockData[`${firstCellContainerId}/rowSpan`] = rowSpan;
  //
  deletedContainers.forEach((deletedContainerId) => {
    assert(logger, blockData.children, 'no table children');
    const containerIndex = blockData.children.indexOf(deletedContainerId);
    assert(logger, containerIndex > 0, 'no deleted container');
    blockData.children.splice(containerIndex, 1);
  });
  //
  const newBlockData = blockData as DocBlockAttributes;
  delete newBlockData.id;
  delete newBlockData.type;
  const blocks = editor.getChildContainerData(firstCellContainerId);
  const focusedBlock = blocks[0];
  assert(logger, focusedBlock, 'no child block');
  const newRange = createBlockSimpleRange(editor, focusedBlock.id, 0);
  editor.updateBlockData(block, newBlockData, newRange);
  editor.deleteChildContainers(deletedContainers);
}

(window as any).mergeRangeCells = mergeRangeCells;
