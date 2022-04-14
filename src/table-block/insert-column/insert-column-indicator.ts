import { assert, BlockElement, createElement, getBlockTools, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { insertColumn } from '../../commands/insert-column';
import { getBlockTable } from '../table-dom';
import { GRIPPER_SIZE, GRIPPER_SIZE_HALF } from '../table-resize/resize-gripper';
import { createInsertColumnButton } from '../ui/insert-column-button';

const logger = getLogger('insert-column-indicator');

function getExistsInsertColumnIndicator(block: BlockElement): HTMLDivElement | null {
  const tools = getBlockTools(block);
  const indicator = tools.querySelector('.table-insert-column-indicator') as HTMLDivElement;
  return indicator;
}

function createInsertColumnIndicator(editor: NextEditor, block: BlockElement) {
  const exists = getExistsInsertColumnIndicator(block);
  if (exists) {
    return exists;
  }
  const tools = getBlockTools(block);
  const indicator = createElement('div', ['table-insert-column-indicator', 'table-indicator'], tools);
  const button = createInsertColumnButton(indicator);
  button.onclick = (event) => {
    insertColumn(editor, block, 0);
    event.preventDefault();
    event.stopPropagation();
  };
  createElement('div', ['table-insert-column-indicator-content'], indicator);
  return indicator;
}

export function updateInsertColumnIndicator(editor: NextEditor, block: BlockElement) {
  const indicator = createInsertColumnIndicator(editor, block);
  //
  const blockRect = block.getBoundingClientRect();
  //
  const table = getBlockTable(block);
  const tableRect = table.getBoundingClientRect();
  const top = tableRect.top - blockRect.top;
  const height = tableRect.height;
  const left = tableRect.left - blockRect.left;
  //
  indicator.style.left = `${left - GRIPPER_SIZE_HALF}px`;
  indicator.style.top = `${top}px`;
  indicator.style.height = `${height}px`;
  indicator.style.width = `${GRIPPER_SIZE}px`;
}

export function removeInsertColumnIndicator(block: BlockElement) {
  const exists = getExistsInsertColumnIndicator(block);
  if (exists) {
    exists.remove();
  }
}

export function removeAllInsertColumnIndicators(editor: NextEditor) {
  editor.rootContainer.querySelectorAll('.table-insert-column-indicator').forEach((gripper) => {
    gripper.remove();
  });
}
