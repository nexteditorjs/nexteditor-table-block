import { assert, BlockElement, createElement, getBlockContent, getBlockId, getBlockTools, getLogger, getParentBlock, NextEditor, patchNode } from '@nexteditorjs/nexteditor-core';
import { insertColumn } from '../../commands/insert-column';
import { insertRow } from '../../commands/insert-row';
import { selectColumns } from '../../commands/select-column';
import { selectRows } from '../../commands/select-rows';
import { getTableSelectionRange } from '../selection-range';
import { getBlockTable, isTableBlock } from '../table-dom';
import { TableGrid } from '../table-grid';
import { createInsertColumnButton } from '../ui/insert-column-button';
import { getTableColumnWidthsFromDom } from './column-width';
import { getTableRowHeights } from './row-height';

const logger = getLogger('table-border-bar-dom');

function updateCells(editor: NextEditor, tableBlock: BlockElement) {
  assert(logger, isTableBlock(tableBlock), 'invalid table block');
  const table = getBlockTable(tableBlock);
  const tools = getBlockTools(tableBlock);

  const createInsertRowColumnButton = (parent: HTMLElement, type: 'left' | 'top', index: number) => {
    const buttonRoot = createElement('div', ['button-root', type], parent);
    const buttonContainer = createElement('div', ['button-container', type], buttonRoot);
    buttonRoot.setAttribute(`data-${type}-index`, `${index}`);
    createElement('span', ['insert-indicator'], buttonContainer);
    createInsertColumnButton(buttonContainer);
  };

  //
  const selectedRows = new Set<number>();
  const selectedColumns = new Set<number>();
  //
  const range = editor.selection.range;
  if (!range.isSimple()) {
    if (range.start.blockId === getBlockId(tableBlock)) {
      const grid = TableGrid.fromBlock(tableBlock);
      const { start, end } = range;
      assert(logger, !start.isSimple() && !end.isSimple(), 'invalid range');
      const { fromCol, toCol, fromRow, toRow } = getTableSelectionRange(tableBlock, start, end);
      if (fromRow === 0 && toRow === grid.rowCount - 1) {
        for (let i = fromCol; i <= toCol; i++) {
          selectedColumns.add(i);
        }
      }
      if (fromCol === 0 && toCol === grid.colCount - 1) {
        for (let i = fromRow; i <= toRow; i++) {
          selectedRows.add(i);
        }
      }
    }
  }

  // top
  const blockContent = getBlockContent(tableBlock);
  const scrollLeft = blockContent.scrollLeft;
  //
  const updateTop = () => {
    const exists = tools.querySelector('.table-border-bar-container.top');
    assert(logger, exists, 'no top border bar container');
    const newContainer = createElement('div', ['table-border-bar-container', 'top'], null);
    const bar = createElement('div', ['table-border-bar', 'top'], newContainer);
    //
    const widths = getTableColumnWidthsFromDom(table);
    //
    const tableWidth = Math.min(blockContent.getBoundingClientRect().width, table.getBoundingClientRect().width);
    //
    let x = -scrollLeft;
    // fixed corner
    createElement('span', ['table-border-bar-cell', 'corner'], bar);
    //
    if (x === 0) {
      createInsertRowColumnButton(bar, 'top', 0);
    }
    //
    const grid = TableGrid.fromTable(table);
    const cols = grid.colCount;
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const cellWidth = colIndex === cols - 1 ? widths[colIndex] + 2 : widths[colIndex];
      //
      let left = x;
      let right = x + cellWidth;
      x += cellWidth;
      //
      if (right <= 0 || left >= tableWidth) {
        continue;
      }
      //
      if (left < 0) {
        left = 0;
      }
      //
      let addButton = true;
      if (right - tableWidth > 2.0) {
        right = tableWidth;
        addButton = false;
      }
      //
      //
      const cell = createElement('span', ['table-border-bar-cell', 'top'], bar);
      if (selectedColumns.has(colIndex)) {
        cell.classList.add('selected');
      }
      cell.setAttribute('data-top-index', `${colIndex}`);
      cell.style.width = `${right - left}px`;
      if (addButton) {
        createInsertRowColumnButton(bar, 'top', colIndex + 1);
      }
    }

    patchNode(exists, newContainer);
  };

  //
  const updateLeft = () => {
    const left = tools.querySelector('.table-border-bar-container.left');
    assert(logger, left, 'no left border bar container');
    //
    const newContainer = createElement('div', ['table-border-bar-container', 'left'], null);
    const bar = createElement('div', ['table-border-bar', 'left'], newContainer);
    //
    const heights = getTableRowHeights(table);
    //
    createInsertRowColumnButton(bar, 'left', 0);
    //
    Array.from(table.rows).forEach((row, rowIndex, arr) => {
      const cell = createElement('span', ['table-border-bar-cell', 'left'], bar);
      if (selectedRows.has(rowIndex)) {
        cell.classList.add('selected');
      }
      cell.setAttribute('data-left-index', `${rowIndex}`);
      const height = rowIndex === arr.length - 1 ? heights[rowIndex] + 2 : heights[rowIndex];
      cell.style.height = `${height}px`;
      //
      createInsertRowColumnButton(bar, 'left', rowIndex + 1);
    });
    //
    patchNode(left, newContainer);
  };

  updateTop();
  updateLeft();
}

function handleTableScroll(editor: NextEditor, event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const tableBlock = getParentBlock(target);
  assert(logger, tableBlock && isTableBlock(tableBlock), 'invalid table block');
  updateCells(editor, tableBlock);

  // update caret pos
  editor.selection.caret.update();
}

function handleBorderBarClicked(editor: NextEditor, event: Event) {
  //
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  //
  const tableBlock = getParentBlock(target);
  assert(logger, tableBlock && isTableBlock(tableBlock), 'invalid table block');
  //
  const insertButton = target.closest('.button-root');
  if (insertButton) {
    if (insertButton.classList.contains('top')) {
      //
      const index = parseInt(insertButton.getAttribute('data-top-index') || '0', 10);
      insertColumn(editor, tableBlock, index);
      updateCells(editor, tableBlock);
      //
    } else if (insertButton.classList.contains('left')) {
      //
      const index = parseInt(insertButton.getAttribute('data-left-index') || '0', 10);
      insertRow(editor, tableBlock, index);
      updateCells(editor, tableBlock);
      //
    }
    return;
  }
  //
  const cell = target.closest('.table-border-bar-cell');
  if (cell) {
    //
    if (cell.classList.contains('top')) {
      //
      const index = parseInt(cell.getAttribute('data-top-index') || '0', 10);
      selectColumns(editor, tableBlock, index);
      //
    } else if (cell.classList.contains('left')) {
      //
      const index = parseInt(cell.getAttribute('data-left-index') || '0', 10);
      selectRows(editor, tableBlock, index);
      //
    }
  }
}

function createTableBorderBar(editor: NextEditor, tableBlock: BlockElement) {
  assert(logger, isTableBlock(tableBlock), 'invalid table block');
  const tools = getBlockTools(tableBlock);
  const top = createElement('div', ['table-border-bar-container', 'top'], tools);
  const left = createElement('div', ['table-border-bar-container', 'left'], tools);
  updateCells(editor, tableBlock);
  //
  editor.domEvents.addEventListener(getBlockContent(tableBlock), 'scroll', handleTableScroll);
  editor.domEvents.addEventListener(top, 'click', handleBorderBarClicked);
  editor.domEvents.addEventListener(left, 'click', handleBorderBarClicked);
}

export function updateTableBorderBar(editor: NextEditor, tableBlock: BlockElement) {
  const tools = getBlockTools(tableBlock);
  if (tools.querySelector('.table-border-bar-container')) {
    updateCells(editor, tableBlock);
    return;
  }
  //
  createTableBorderBar(editor, tableBlock);
}

export function hideTableBorderBar(editor: NextEditor, tableBlock: BlockElement) {
  assert(logger, isTableBlock(tableBlock), 'invalid table block');
  const tools = getBlockTools(tableBlock);
  const tableBorderBars = tools.querySelectorAll('.table-border-bar-container');
  tableBorderBars.forEach((elem) => {
    editor.domEvents.removeEventListener(elem, 'click', handleBorderBarClicked);
    elem.remove();
  });
  editor.domEvents.removeEventListener(getBlockContent(tableBlock), 'scroll', handleTableScroll);
}

export function getTopBorderHeight(tableBlock: BlockElement) {
  assert(logger, isTableBlock(tableBlock), 'invalid table block');
  const tools = getBlockTools(tableBlock);
  const topTableBorderBar = tools.querySelector('.table-border-bar-container.top');
  if (topTableBorderBar) {
    return topTableBorderBar.getBoundingClientRect().height;
  }
  return 0;
}
