import {
  NextEditor, assert, createElement, addClass, ContainerElement, BlockElement, DocBlock, BlockContentElement, createBlockContentElement, setContainerWidth,
} from '@nexteditorjs/nexteditor-core';
import { DocTableGrid } from './doc-table-grid';
import { DocTableBlockData } from './doc-table-data';
import { bindTableResizeEvent, unbindTableResizeEvent } from './table-resize';

//
function createTable(editor: NextEditor, tableData: DocTableBlockData) {
  const grid = new DocTableGrid(tableData);
  //
  const rows = tableData.rows;
  const cols = tableData.cols;
  //
  assert(rows >= 1, `invalid rows: ${rows}`);
  assert(cols >= 1, `invalid cols: ${cols}`);
  assert(tableData.children, 'no table children');
  const table = createElement('table', [], null);
  const tableBody = createElement('tbody', [], table);
  //
  let containerIndex = 0;
  for (let row = 0; row < rows; row++) {
    const rowElem = createElement('tr', [], tableBody);
    for (let col = 0; col < cols; col++) {
      //
      const cell = grid.getCell({ col, row });
      if (!cell.virtual) {
        const subContainerId = tableData.children[containerIndex];
        const cellElem = createElement('td', [], rowElem);
        if (cell.colSpan > 1) {
          cellElem.colSpan = cell.colSpan;
        }
        if (cell.rowSpan > 1) {
          cellElem.rowSpan = cell.rowSpan;
        }
        //
        const container = editor.createChildContainer(cellElem, subContainerId);
        const width = tableData[`${subContainerId}/width`];
        if (width && typeof width === 'number') {
          setContainerWidth(container, width);
        }
        //
        containerIndex += 1;
      } else {
        assert(cell.colSpan > 1 || cell.rowSpan > 1);
      }
    }
  }
  assert(containerIndex === tableData.children.length);
  //
  if (tableData.noBorder) {
    addClass(table, 'no-border');
  }
  //
  if (tableData.chart) {
    addClass(table, 'editor-table-chart');
  }
  //
  if (tableData.isStripeStyle) {
    addClass(table, 'stripe');
  }
  if (tableData.hasRowTitle) {
    addClass(table, 'row-title');
  }
  if (tableData.hasColTitle) {
    addClass(table, 'col-title');
  }
  //
  return table;
}

export function createBlockContent(editor: NextEditor, container: ContainerElement, blockIndex: number, blockElement: BlockElement, blockData: DocBlock): BlockContentElement {
  assert(blockData.type === 'table', 'not table data');
  const tableData = blockData as DocTableBlockData;
  //
  const content = createBlockContentElement(blockElement, 'div');
  const table = createTable(editor, tableData);
  content.appendChild(table);
  //
  bindTableResizeEvent(editor, blockElement);
  //
  return content;
}

export function handleDeleteBlock(editor: NextEditor, block: BlockElement, local: boolean) {
  unbindTableResizeEvent(editor, block);
}
