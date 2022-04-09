import { BlockElement, assert, ContainerElement, MoveDirection, getContainerId, NextContainerOptions, getLogger } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from './table-grid';

const logger = getLogger('table-container');

export function getContainerCell(container: ContainerElement): HTMLTableCellElement {
  const cell = container.closest('td') as HTMLTableCellElement;
  assert(logger, cell, 'no parent cell for a table cell container');
  return cell;
}

export function getTableChildContainers(tableBlock: BlockElement): ContainerElement[] {
  const grid = TableGrid.fromBlock(tableBlock);
  return grid.getAllContainers();
}

// eslint-disable-next-line max-len, consistent-return
export function getTableNextContainer(tableBlock: BlockElement, childContainer: ContainerElement, type: MoveDirection, options?: NextContainerOptions): ContainerElement | null {
  //
  const grid = TableGrid.fromBlock(tableBlock);
  //
  const cell = grid.getCellByContainerId(getContainerId(childContainer));
  //
  if (type === 'ArrowDown') {
    const nextCell = grid.getBottomCell(cell);
    if (!nextCell) {
      return null;
    }
    return nextCell.container;
  }
  //
  if (type === 'ArrowUp') {
    const nextCell = grid.getTopCell(cell);
    if (!nextCell) {
      return null;
    }
    return nextCell.container;
  }
  //
  if (type === 'ArrowLeft') {
    //
    const containers = grid.getAllContainers();
    const index = containers.indexOf(childContainer);
    assert(logger, index >= 0, 'not a valid child container');
    if (index === 0) {
      return null;
    }
    //
    const ret = containers[index - 1];
    if (options?.noWrap) {
      const retCell = grid.getCellByContainerId(getContainerId(ret));
      if (retCell.row !== cell.row) {
        return null;
      }
    }
    return ret;
  }
  //
  if (type === 'ArrowRight') {
    //
    const containers = grid.getAllContainers();
    const index = containers.indexOf(childContainer);
    assert(logger, index >= 0, 'not a valid child container');
    if (index === containers.length - 1) {
      return null;
    }
    //
    const ret = containers[index + 1];
    if (options?.noWrap) {
      const retCell = grid.getCellByContainerId(getContainerId(ret));
      if (retCell.row !== cell.row) {
        return null;
      }
    }
    return ret;
  }
  //
  assert(logger, false, `invalid navigation type: ${type}`);
}
