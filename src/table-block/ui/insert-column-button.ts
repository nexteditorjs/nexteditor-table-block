import { createElement } from '@nexteditorjs/nexteditor-core';

export function createInsertColumnButton(parent: HTMLElement) {
  const button = createElement('div', ['table-insert-column-button', 'dropmarker'], parent);
  createElement('span', ['material-icons-outlined'], button, 'add');
  return button;
}
