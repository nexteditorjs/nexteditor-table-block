import { BlockElement, NextEditor } from '@nexteditorjs/nexteditor-core';
import { TableGrid } from '../table-grid';

export function getColumnWidth(editor: NextEditor, tableBlock: BlockElement) {
  const grid = TableGrid.fromBlock(tableBlock);
  //
  const ret: number[] = [];
  //
  for (let i = 0; i < grid.colCount; i++) {
    const cell = grid.getCell({ col: i, row: 0 });
    if (cell.colSpan === 1) {
      const cellWidth = cell.cell.getBoundingClientRect().width;
      ret.push(cellWidth);
    } else {
      //
      //
    }
  }
  //
  //
  //
}
