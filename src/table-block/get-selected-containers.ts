import { NextEditor, ComplexBlockPosition, ContainerElement, assert, BlockElement, getLogger } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from './table-grid';

const logger = getLogger('get-selected-containers');

export function getEditorSelectedContainers(editor: NextEditor, from: ComplexBlockPosition, to: ComplexBlockPosition): ContainerElement[] {
  assert(logger, from.blockId === to.blockId, 'only allow select in single table block');
  const block = editor.getBlockById(from.blockId);
  const grid = TableGrid.fromBlock(block);
  const fromCell = grid.getCellByContainerId(from.childContainerId);
  const toCell = grid.getCellByContainerId(to.childContainerId);
  //
  const cells = grid.getCells(fromCell, toCell);
  const containers = cells.map((c) => grid.getCellContainer(c));
  //
  return containers;
}

export function getTableSelectedContainers(editor: NextEditor, block: BlockElement, from: ComplexBlockPosition, to: ComplexBlockPosition): ContainerElement[] {
  assert(logger, from.blockId === to.blockId, 'only allow select in single table block');
  const grid = TableGrid.fromBlock(block);
  const fromCell = grid.getCellByContainerId(from.childContainerId);
  const toCell = grid.getCellByContainerId(to.childContainerId);
  //
  const cells = grid.getCells(fromCell, toCell);
  const containers = cells.map((c) => grid.getCellContainer(c));
  //
  return containers;
}
