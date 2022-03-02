import {
  NextEditor, assert, createElement, TextAlign, addClass, ContainerElement, BlockElement, DocBlock, BlockContentElement, createBlockContentElement,
} from '@nexteditorjs/nexteditor-core';
import { DocTableGrid } from './doc-table-grid';
import { DocTableBlockData } from './doc-table-data';
import { bindTableResizeEvent } from './table-resize';

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
        //
        const container = editor.createChildContainer(cellElem, subContainerId);
        //
        const align = tableData[`${subContainerId}_align`] as TextAlign;
        if (align) {
          const className = {
            left: 'align-left',
            right: 'align-right',
            center: 'align-center',
          }[align];
          if (className) {
            addClass(container, className);
          }
        }
        const background = tableData[`${subContainerId}_background`] as string;
        if (background) {
          addClass(cellElem, background);
        }
        const color = tableData[`${subContainerId}_fontColor`] as string;
        if (color) {
          addClass(cellElem, color);
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

export function createBlockContent(editor: NextEditor, container: ContainerElement, blockElement: BlockElement, blockData: DocBlock): BlockContentElement {
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
