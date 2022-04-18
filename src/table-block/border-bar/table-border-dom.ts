import { assert, BlockElement, createElement, getBlockContent, getBlockTools, getLogger, getParentBlock, NextEditor, patchNode } from '@nexteditorjs/nexteditor-core';
import { insertColumn } from '../../commands/insert-column';
import { insertRow } from '../../commands/insert-row';
import { getBlockTable, isTableBlock } from '../table-dom';
import { TableGrid } from '../table-grid';
import { createInsertColumnButton } from '../ui/insert-column-button';

const logger = getLogger('table-border-bar-dom');

function updateCells(editor: NextEditor, tableBlock: BlockElement) {
  assert(logger, isTableBlock(tableBlock), 'invalid table block');
  const table = getBlockTable(tableBlock);
  const tools = getBlockTools(tableBlock);

  const createInsertRowColumnButton = (parent: HTMLElement, type: 'row' | 'col', index: number) => {
    const buttonRoot = createElement('div', ['button-root', type], parent);
    const buttonContainer = createElement('div', ['button-container', type], buttonRoot);
    buttonRoot.setAttribute(`data-${type}-index`, `${index}`);
    createElement('span', ['insert-indicator'], buttonContainer);
    createInsertColumnButton(buttonContainer);
  };

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
    const tableWidth = Math.min(blockContent.getBoundingClientRect().width, table.getBoundingClientRect().width);
    //
    let x = -scrollLeft;
    // fixed corner
    createElement('span', ['table-border-bar-cell', 'corner'], bar);
    //
    if (x === 0) {
      createInsertRowColumnButton(bar, 'col', 0);
    }
    //
    const grid = TableGrid.fromTable(table);
    const cols = grid.colCount;
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const cellData = grid.getCell({ col: colIndex, row: 0 });
      const rect = cellData.cell.getBoundingClientRect();
      const cellWidth = colIndex === cols - 1 ? rect.width + 2 : rect.width;
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
      if (right > tableWidth) {
        right = tableWidth;
        addButton = false;
      }
      //
      //
      const cell = createElement('span', ['table-border-bar-cell', 'top'], bar);
      cell.style.width = `${right - left}px`;
      if (addButton) {
        createInsertRowColumnButton(bar, 'col', colIndex + 1);
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
    createInsertRowColumnButton(bar, 'row', 0);
    //
    Array.from(table.rows).forEach((row, rowIndex, arr) => {
      const rect = row.getBoundingClientRect();
      const cell = createElement('span', ['table-border-bar-cell', 'left'], bar);
      const height = rowIndex === arr.length - 1 ? rect.height + 2 : rect.height;
      cell.style.height = `${height}px`;
      //
      createInsertRowColumnButton(bar, 'row', rowIndex + 1);
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
    if (insertButton.classList.contains('col')) {
      //
      const index = parseInt(insertButton.getAttribute('data-col-index') || '0', 10);
      insertColumn(editor, tableBlock, index);
      updateCells(editor, tableBlock);
      //
    } else if (insertButton.classList.contains('row')) {
      //
      const index = parseInt(insertButton.getAttribute('data-row-index') || '0', 10);
      insertRow(editor, tableBlock, index);
      updateCells(editor, tableBlock);
      //
    }
  }
  //
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
  //
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
