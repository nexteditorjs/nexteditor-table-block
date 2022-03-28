import {
  assert, isContainer, isChildContainer, ContainerElement, getParentBlock, getContainerId, getBlockId, getBlockType,
} from '@nexteditorjs/nexteditor-core';
import { DocTableBlockData } from './doc-table-data';
import { DocTableGrid } from './doc-table-grid';

function getCellChildContainer(cell: HTMLTableCellElement) {
  const container = cell.firstElementChild;
  assert(container, 'no child element for cell');
  assert(isContainer(container), 'cell first child is not a container');
  assert(isChildContainer(container as ContainerElement), 'cell first child is not a container');
  return container as ContainerElement;
}

export function table2Data(table: HTMLTableElement): DocTableBlockData {
  const block = getParentBlock(table);
  assert(block);
  //
  const cellIds: string[] = [];
  const spanData: {
    [index: string]: number;
  } = {};

  Array.from(table.rows).forEach((row: HTMLTableRowElement) => {
    Array.from(row.cells).forEach((cell: HTMLTableCellElement, col) => {
      //
      const container = getCellChildContainer(cell);
      const containerId = getContainerId(container);
      cellIds.push(containerId);
      if (cell.colSpan > 1 || cell.rowSpan > 1) {
        spanData[`${containerId}/colSpan`] = cell.colSpan;
        spanData[`${containerId}/rowSpan`] = cell.rowSpan;
      }
    });
  });
  //
  const rows = table.rows.length;
  const cols = Array.from(table.rows[0].cells)
    .map((cell) => cell.colSpan)
    .reduce((colSpan1, colSpan2) => colSpan1 + colSpan2, 0);
  //
  const tableData: DocTableBlockData = {
    id: getBlockId(block),
    type: getBlockType(block),
    rows,
    cols,
    children: cellIds,
    ...spanData,
  };
  return tableData;
}

export function tableData2Grid(tableData: DocTableBlockData) {
  return new DocTableGrid(tableData);
}

export function table2Grid(table: HTMLTableElement) {
  return tableData2Grid(table2Data(table));
}
