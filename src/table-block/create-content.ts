import {
  NextEditor, assert, createElement, addClass, ContainerElement, BlockElement, DocBlock, BlockContentElement, createBlockContentElement, BlockPath, getContainerId, getLogger,
} from '@nexteditorjs/nexteditor-core';
import { DocTableGrid } from './doc-table-grid';
import { DocTableBlockData } from './doc-table-data';
import { handleTableResizeMouseEvent } from './table-resize/table-resize-events';
import { handlePasteInTableEvent } from './paste';
import { handleTableBorderBar } from './border-bar/table-border-bar-handler';

const logger = getLogger('create-content');
//
function createTable(editor: NextEditor, path: BlockPath, tableData: DocTableBlockData) {
  const grid = new DocTableGrid(tableData);
  //
  const rows = tableData.rows;
  const cols = tableData.cols;
  //
  assert(logger, rows >= 1, `invalid rows: ${rows}`);
  assert(logger, cols >= 1, `invalid cols: ${cols}`);
  assert(logger, tableData.children, 'no table children');
  const table = createElement('table', [], null);
  //
  const widths = tableData.widths;
  //
  const colGroup = createElement('colgroup', [], table);
  for (let i = 0; i < grid.colCount; i++) {
    const col = createElement('col', [], colGroup);
    col.style.width = `${widths[i]}px`;
  }
  //
  const tableBody = createElement('tbody', [], table);
  //
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
        editor.createChildContainer(path, cellElem, subContainerId);
        containerIndex += 1;
      } else {
        assert(logger, cell.colSpan > 1 || cell.rowSpan > 1, 'virtual cell should have colSpan or rowSpan');
      }
    }
  }
  assert(logger, containerIndex === tableData.children.length, 'container count mismatch');
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

export function createBlockContent(editor: NextEditor, path: BlockPath, container: ContainerElement, blockIndex: number, blockElement: BlockElement, blockData: DocBlock): BlockContentElement {
  assert(logger, blockData.type === 'table', 'not table data');
  assert(logger, getContainerId(container) === path[path.length - 1].containerId, 'invalid path');
  assert(logger, blockIndex === path[path.length - 1].blockIndex, 'invalid path');
  const tableData = blockData as DocTableBlockData;
  //
  const content = createBlockContentElement(blockElement, 'div');
  const table = createTable(editor, path, tableData);
  content.appendChild(table);
  //
  handleTableResizeMouseEvent(editor);
  handlePasteInTableEvent(editor);
  handleTableBorderBar(editor);
  //
  return content;
}
