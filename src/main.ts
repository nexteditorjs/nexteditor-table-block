/* eslint-disable import/no-extraneous-dependencies */
import {
  assert,
  createEditor,
  editorBlocks,
  LocalDoc,
} from '@nexteditorjs/nexteditor-core';
import { MarkdownInputHandler } from '@nexteditorjs/nexteditor-input-handlers';

import TableBlock from '.';
import './style.css';
import testDocData from './samples/test.json';

editorBlocks.registerComplexBlockClass(TableBlock);

const app = document.querySelector<HTMLDivElement>('#app');
assert(app, 'app does not exists');


const editor = createEditor(app, new LocalDoc(testDocData as any));

editor.input.addHandler(new MarkdownInputHandler());

(window as any).editor = editor;
