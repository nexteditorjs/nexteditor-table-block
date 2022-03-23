import {
  assert, BlockElement, containerToDoc, createComplexBlockPosition,
  DocBlockAttributes, getBlockType, getChildBlockCount,
  getContainerId, NextEditor, SelectionRange,
} from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';
import { TableGrid } from '../table-block/table-grid';
import { splitRangeCells } from './split-cells';
import { getRangeDetails } from './table-range';

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

export function mergeCells(range: SelectionRange) {
  //
  const { editor, block, table, startRow, startCol, endRow, endCol } = getRangeDetails(range);
  //
  splitRangeCells(range);
  //
  const blockData = cloneDeep(editor.getBlockData(block));
  assert(blockData.children, 'no table children');
  //
  const grid = TableGrid.fromTable(table);
  //
  const selectedCells = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellData = grid.getCell({ row, col });
      assert(!cellData.virtual);
      selectedCells.push(cellData);
    }
  }
  //
  assert(selectedCells.length > 0);
  const firstCellData = selectedCells[0];
  const lastCells = selectedCells.slice(1);
  const firstCellContainer = grid.getCellByContainerId(firstCellData.cellId).container;
  const deletedContainers: string[] = [];
  lastCells.forEach((cellData) => {
    const container = grid.getCellByContainerId(cellData.cellId).container;
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
  blockData[`${firstCellContainerId}_colSpan`] = colSpan;
  blockData[`${firstCellContainerId}_rowSpan`] = rowSpan;
  //
  deletedContainers.forEach((deletedContainerId) => {
    assert(blockData.children, 'no table children');
    const containerIndex = blockData.children.indexOf(deletedContainerId);
    assert(containerIndex > 0, 'no deleted container');
    blockData.children.splice(containerIndex, 1);
  });
  //
  const newBlockData = blockData as DocBlockAttributes;
  delete newBlockData.id;
  delete newBlockData.type;
  editor.updateBlockData(block, newBlockData);
  //
  editor.deleteChildContainers(deletedContainers);
  //
  const startPos = createComplexBlockPosition(block, firstCellContainerId);
  editor.selection.setSelection(startPos);
}
