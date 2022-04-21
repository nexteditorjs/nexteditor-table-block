import {
  assert, cloneChildContainer, createComplexBlockPosition,
  createEmptyDoc,
  DocBlock, DocObject,
  genId, getBlockType, getLogger, NextEditor, SelectedBlock,
} from '@nexteditorjs/nexteditor-core';
import { getTableColumnWidths } from './border-bar/column-width';
import { DocTableBlockData } from './doc-table-data';
import { getTableSelectionRange } from './selection-range';
import { getBlockTable } from './table-dom';
import { TableGrid } from './table-grid';

const logger = getLogger('table-selection-to-doc');

export function selectionToDoc(editor: NextEditor, selectedBlock: SelectedBlock): DocObject {
  //
  const { start, end, block } = selectedBlock;
  const blockType = getBlockType(block);
  assert(logger, blockType === 'table', `invalid block type: ${blockType}`);
  const blockData = editor.getBlockData(block);

  if (start.isSimple() && end.isSimple()) {
    const children = blockData.children;
    assert(logger, children, 'no table children');
    const first = children[0];
    const last = children[children.length - 1];
    const start = createComplexBlockPosition(block, first);
    const end = createComplexBlockPosition(block, last);
    return selectionToDoc(editor, { block: selectedBlock.block, start, end });
  }
  //
  assert(logger, !start.isSimple() && !end.isSimple(), 'invalid block pos type');
  //
  const grid = TableGrid.fromBlock(block);
  const { fromCol, toCol, fromRow, toRow } = getTableSelectionRange(block, start, end);
  //
  const spanData: { [key: string]: number } = {};
  const children: string[] = [];
  const oldDoc = editor.doc.toJSON();
  let childContainers: { [key: string]: DocBlock[] } = {};
  //
  const subGrid = grid.sub({ row: fromRow, col: fromCol }, { row: toRow, col: toCol });
  subGrid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const containerId = cell.containerId;
      if (children.indexOf(containerId) !== -1) {
        return;
      }
      children.push(containerId);
      //
      let childDoc: DocObject;
      //
      if (cell.virtual) {
        const realCell = grid.getCellByContainerId(cell.containerId);
        const cellFromCol = fromCol + colIndex;
        let cellToCol = realCell.col + realCell.colSpan - 1;
        if (cellToCol > toCol) {
          cellToCol = toCol;
        }
        const colSpan = cellToCol - cellFromCol + 1;
        if (colSpan > 1) {
          spanData[`${containerId}/colSpan`] = colSpan;
        }
        //
        const cellFromRow = fromRow + rowIndex;
        let cellToRow = realCell.row + realCell.rowSpan - 1;
        if (cellToRow > toRow) {
          cellToRow = toRow;
        }
        const rowSpan = cellToRow - cellFromRow + 1;
        if (rowSpan > 1) {
          spanData[`${containerId}/rowSpan`] = rowSpan;
        }

        childDoc = createEmptyDoc();
      } else {
        childDoc = cloneChildContainer(editor.editorBlocks, oldDoc, containerId);
        //
        if (cell.col + cell.colSpan > toCol + 1) {
          const colSpan = toCol - cell.col + 1;
          if (colSpan > 1) {
            spanData[`${containerId}/colSpan`] = colSpan;
          }
        } else if (cell.colSpan > 1) {
          spanData[`${containerId}/colSpan`] = cell.colSpan;
        }
        if (cell.row + cell.rowSpan > toRow + 1) {
          const rowSpan = toRow - cell.row + 1;
          if (rowSpan > 1) {
            spanData[`${containerId}/rowSpan`] = rowSpan;
          }
        } else if (cell.rowSpan > 1) {
          spanData[`${containerId}/rowSpan`] = cell.rowSpan;
        }
      }
      const { root, ...cellChildContainers } = childDoc.blocks;
      childContainers = {
        ...childContainers,
        ...cellChildContainers,
        [containerId]: root,
      };
    });
  });
  //
  //
  const widths = getTableColumnWidths(getBlockTable(block)).slice(fromCol, toCol + 1);
  //
  const id = genId();
  const type = blockType;
  const newBlock: DocTableBlockData = {
    id,
    type,
    children,
    widths,
    rows: toRow - fromRow + 1,
    cols: toCol - fromCol + 1,
    ...spanData,
  };
  //
  const newDoc = {
    blocks: {
      root: [newBlock],
      ...childContainers,
    },
    meta: {},
  };
  return newDoc;
}
