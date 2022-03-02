import { DocBlock } from '@nexteditorjs/nexteditor-core';

export interface DocTableBlockData extends DocBlock {
  rows: number;
  cols: number;
  children: string[];
}
