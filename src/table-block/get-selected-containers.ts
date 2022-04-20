import { NextEditor, ComplexBlockPosition, ContainerElement, assert, BlockElement, getLogger, getBlockId } from '@nexteditorjs/nexteditor-core';
import { getTableSelectionRange } from './selection-range';
import { TableGrid } from './table-grid';

const logger = getLogger('get-selected-containers');

export function getTableSelectedContainers(editor: NextEditor, block: BlockElement, from: ComplexBlockPosition, to: ComplexBlockPosition): ContainerElement[] {
  assert(logger, from.blockId === to.blockId, 'only allow select in single table block');
  assert(logger, getBlockId(block) === from.blockId, 'only allow select in single table block');
  const grid = TableGrid.fromBlock(block);
  //
  const fromCell = grid.getCellByContainerId(from.childContainerId);
  const toCell = grid.getCellByContainerId(to.childContainerId);
  //
  if (from.custom === undefined || to.custom === undefined) {
    //
    const cells = grid.getCells(fromCell, toCell);
    const containers = cells.map((c) => grid.getCellContainer(c));
    //
    return containers;
  }
  //
  const { fromCol, toCol, fromRow, toRow } = getTableSelectionRange(block, from, to);
  //
  const containersSet = new Set<string>();
  const selectedCells: ContainerElement[] = [];
  //
  const subGrid = grid.sub({ row: fromRow, col: fromCol }, { row: toRow, col: toCol });
  subGrid.forEach((row) => {
    row.forEach((cell) => {
      const realCell = grid.getCellByContainerId(cell.containerId);
      if (realCell.col < fromCol || realCell.row < fromRow) {
        return;
      }
      //
      if (realCell.col + realCell.colSpan - 1 > toCol || realCell.row + realCell.rowSpan - 1 > toRow) {
        return;
      }

      if (containersSet.has(cell.containerId)) {
        return;
      }
      containersSet.add(cell.containerId);
      selectedCells.push(realCell.container);
    });
  });
  return selectedCells;
}

export function getEditorSelectedContainers(editor: NextEditor, from: ComplexBlockPosition, to: ComplexBlockPosition): ContainerElement[] {
  assert(logger, from.blockId === to.blockId, 'only allow select in single table block');
  const block = editor.getBlockById(from.blockId);
  return getTableSelectedContainers(editor, block, from, to);
}
