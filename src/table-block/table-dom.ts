import { BlockElement, getBlockContent, assert, ContainerElement, getContainerId, getLogger } from '@nexteditorjs/nexteditor-core';
import md5 from 'blueimp-md5';

const logger = getLogger('table-dom');

export function getBlockTable(block: BlockElement): HTMLTableElement {
  const content = getBlockContent(block);
  const table = content.firstElementChild;
  assert(logger, table instanceof HTMLTableElement, 'invalid table');
  return table;
}
export function getTableCells(table: HTMLTableElement): HTMLTableCellElement[] {
  const cells: HTMLTableCellElement[] = [];
  Array.from(table.rows).forEach((r) => {
    cells.push(...Array.from(r.cells));
  });
  return cells;
}

export function getChildContainerInCell(cell: HTMLTableCellElement): ContainerElement {
  const container = cell.querySelector(':scope div[data-type=editor-container]');
  assert(logger, container, 'no child container in cell');
  return container as ContainerElement;
}

export function getTableContainers(table: HTMLTableElement): ContainerElement[] {
  const containers = getTableCells(table).map(getChildContainerInCell);
  return containers;
}

export function getTableKey(table: HTMLTableElement): string {
  const containers = getTableContainers(table);
  const ids = containers.map(getContainerId);
  const keys = ids.join();
  return md5(keys);
}
