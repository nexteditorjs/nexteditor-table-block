/* eslint-disable import/no-extraneous-dependencies */
import {
  assert,
  createEditor,
  LocalDoc,
} from '@nexteditorjs/nexteditor-core';
import { MarkdownInputHandler } from '@nexteditorjs/nexteditor-input-handlers';

import TableBlock from '.';
import './style.css';
import testDocData from './samples/test.json';

const app = document.querySelector<HTMLDivElement>('#app');
assert(app, 'app does not exists');


const editor = createEditor(app, new LocalDoc(testDocData as any), {
  components: {
    blocks: [TableBlock],
  }
});

editor.input.addHandler(new MarkdownInputHandler());

(window as any).editor = editor;
