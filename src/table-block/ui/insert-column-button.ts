import { createElement } from '@nexteditorjs/nexteditor-core';

export function createInsertColumnButton(parent: HTMLElement) {
  const button = createElement('div', ['insert-column-button', 'drop-marker'], parent);
  createElement('span', ['material-icons-outlined', 'icon'], button, 'add');
  return button;
}
