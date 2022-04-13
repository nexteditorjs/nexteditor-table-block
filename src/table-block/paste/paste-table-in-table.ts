import {
  editorReplaceContainer, assert, BlockElement, cloneChildContainer,
  DocObject, getBlockTextLength, getLastChildBlock, getLogger,
  NextEditor,
} from '@nexteditorjs/nexteditor-core';
import { insertColumn } from '../../commands/insert-column';
import { insertRow } from '../../commands/insert-row';
import { splitCell } from '../../commands/split-cell';
import { DocTableBlockData } from '../doc-table-data';
import { DocTableCellIndex, DocTableGrid } from '../doc-table-grid';
import { TableGrid } from '../table-grid';

const logger = getLogger('paste-table-in-table-block');

export function pasteTableInTableBlock(editor: NextEditor, doc: DocObject, tableBlock: BlockElement, destCell: HTMLTableCellElement) {
  //
  let grid = TableGrid.fromBlock(tableBlock);
  //
  const blockData = doc.blocks.root[0];
  assert(logger, blockData, 'no table data');
  assert(logger, blockData.type === 'table', `table data type is not table, but ${blockData.type}`);
  const tableData = blockData as DocTableBlockData;
  //
  //
  const cellData = grid.getCellByCellElement(destCell);
  //
  const dataCols = tableData.cols;
  const dataRows = tableData.rows;
  //
  const currentCol = cellData.col;
  const currentRow = cellData.row;
  //
  const resultCols = currentCol + dataCols;
  const resultRows = currentRow + dataRows;
  //
  const splitIndexes: DocTableCellIndex[] = [];
  for (let col = currentCol; col < resultCols && col < grid.colCount; col++) {
    for (let row = currentRow; row < resultRows && row < grid.rowCount; row++) {
      //
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const cell = grid.getCell({ col, row });
      if (!cell.virtual) {
        if (cell.colSpan > 1 || cell.rowSpan > 1) {
          splitIndexes.push({ col, row });
        }
      } else if (cell.virtual) {
        splitIndexes.push({ col, row });
      }
    }
  }
  //
  editor.undoManager.runInGroup(() => {
    // split cells
    splitIndexes.forEach((index) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const cellData = TableGrid.fromBlock(tableBlock).getCell(index);
      if (cellData.colSpan > 1 || cellData.rowSpan > 1) {
        splitCell(editor, tableBlock, index);
      }
    });
    //
    // insert cols & rows
    if (resultCols > grid.colCount) {
      for (let i = grid.colCount; i < resultCols; i++) {
        insertColumn(editor, tableBlock, i);
      }
    }
    if (resultRows > grid.rowCount) {
      for (let i = grid.rowCount; i < resultRows; i++) {
        insertRow(editor, tableBlock, i);
      }
    }
    //
    grid = TableGrid.fromBlock(tableBlock); // reset grid data
    const tempGrid = new DocTableGrid(tableData);
    //
    let lastContainer;
    for (let col = 0; col < tempGrid.colCount; col++) {
      for (let row = 0; row < tempGrid.rowCount; row++) {
        //
        const tempCellData = tempGrid.getCell({ col, row });
        if (!tempCellData.virtual) {
          //
          const newDoc = cloneChildContainer(editor.editorBlocks, doc, tempCellData.containerId);
          //
          const destCol = currentCol + col;
          const destRow = currentRow + row;
          const destIndex = { col: destCol, row: destRow };

          const container = grid.getCellContainer(destIndex);
          editorReplaceContainer(editor, container, newDoc);
          lastContainer = container;
        }
      }
    }
    //
    assert(logger, lastContainer, 'no last container');
    const lastBlock = getLastChildBlock(lastContainer);
    editor.selection.selectBlock(lastBlock, getBlockTextLength(editor, lastBlock));
  });
  //
}
