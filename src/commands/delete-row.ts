import { BlockElement, getBlockType, NextEditor, SelectionRange } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from '../table-block/table-grid';
import { getRangeDetails } from './table-range';

export function canDeleteRows(editor: NextEditor, block: BlockElement, range: SelectionRange): boolean {
  if (range.isSimple()) return false;
  //
  const { start, end } = range;
  if (start.blockId !== end.blockId) return false;
  //
  const testBlock = editor.getBlockById(start.blockId);
  if (testBlock !== block) return false;
  //
  if (getBlockType(block) !== 'table') return false;
  //
  const { startCol, endCol } = getRangeDetails(range);
  //
  const grid = TableGrid.fromBlock(block);
  return startCol === 0 && endCol === grid.colCount - 1;
}
