import { BlockElement, getBlockContent, assert, ContainerElement, getContainerId, getLogger, getBlockType, getParentContainer, isRootContainer, getParentBlock } from '@nexteditorjs/nexteditor-core';
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

export function isTableBlock(block: BlockElement) {
  return getBlockType(block) === 'table';
}

export function getParentTableBlock(block: BlockElement): BlockElement | null {
  if (isTableBlock(block)) {
    return block;
  }
  const parentContainer = getParentContainer(block);
  if (isRootContainer(parentContainer)) {
    return null;
  }
  const parentBlock = getParentBlock(parentContainer);
  assert(logger, parentBlock, 'no parent block');
  if (isTableBlock(parentBlock)) {
    return parentBlock;
  }
  return getParentTableBlock(parentBlock);
}

function getTableCol(table: HTMLTableElement, colIndex: number) {
  const colGroup = table.querySelector('colgroup');
  assert(logger, colGroup, 'no colgroup');
  const col = colGroup.children[colIndex];
  assert(logger, col, 'no col');
  assert(logger, col instanceof HTMLTableColElement, `invalid col: ${col.tagName}`);
  return col;
}

export function setColumnWidth(table: HTMLTableElement, colIndex: number, width: number) {
  getTableCol(table, colIndex).style.width = `${width}px`;
}

export function getTableColumnWidths(table: HTMLTableElement) {
  const tableCols = Array.from((table.querySelector('colgroup') as HTMLElement).children) as HTMLTableColElement[];
  const widths = tableCols.map((col) => col.getBoundingClientRect().width);
  return widths;
}
