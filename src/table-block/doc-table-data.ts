import { DocBlock } from '@nexteditorjs/nexteditor-core';

export interface DocTableBlockData extends DocBlock {
  rows: number;
  cols: number;
  children: string[];
  widths: number[];
}

export const DEFAULT_COLUMN_WIDTH = 100;
export const MIN_COLUMN_WIDTH = 40;

export type SelectTableCustom = {
  colIndex?: number;
  rowIndex?: number;
};
