import { NextEditor, ComplexBlockPosition, ContainerElement, assert, BlockElement, getLogger, getBlockId } from '@nexteditorjs/nexteditor-core';
import { SelectTableCustom } from './doc-table-data';
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
  assert(logger, from.custom && to.custom, 'invalid from and to, no custom');
  const fromCustom = from.custom as SelectTableCustom;
  const toCustom = to.custom as SelectTableCustom;
  //
  const fromRowTemp = fromCustom.rowIndex ?? fromCell.row;
  const fromColTemp = fromCustom.colIndex ?? fromCell.col;
  const toRowTemp = toCustom.rowIndex ?? (toCell.row + toCell.rowSpan - 1);
  const toColTemp = toCustom.colIndex ?? (toCell.col + toCell.colSpan - 1);
  const fromRow = Math.min(fromRowTemp, toRowTemp);
  const toRow = Math.max(fromRowTemp, toRowTemp);
  const fromCol = Math.min(fromColTemp, toColTemp);
  const toCol = Math.max(fromColTemp, toColTemp);
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
