import {
  assert, blockToDoc, cloneChildContainer, createComplexBlockPosition,
  createEmptyContainer,
  createEmptyDoc,
  DocBlock, DocBlockAttributes, DocObject,
  genId, getBlockType, getChildBlocks, getLogger, mergeDocs,
  NextEditor, SelectedBlock,
} from '@nexteditorjs/nexteditor-core';
import { DocTableBlockData, SelectTableCustom } from './doc-table-data';
import { getBlockTable, getTableColumnWidths } from './table-dom';
import { TableGrid } from './table-grid';

const logger = getLogger('table-selection-to-doc');

function pickContainerData(blockData: DocBlock, containerId: string) {
  const ret: DocBlockAttributes = {};
  Object.entries(blockData).forEach(([key, value]) => {
    if (key.startsWith(`${containerId}/`)) {
      ret[key] = value;
    }
  });
  return ret;
}

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
  //
  const from = start;
  const to = end;
  const fromCell = grid.getCellByContainerId(from.childContainerId);
  const toCell = grid.getCellByContainerId(to.childContainerId);

  const fromCustom = from.custom as SelectTableCustom;
  const toCustom = to.custom as SelectTableCustom;
  //
  const fromRowTemp = fromCustom?.rowIndex ?? fromCell.row;
  const fromColTemp = fromCustom?.colIndex ?? fromCell.col;
  const toRowTemp = toCustom?.rowIndex ?? (toCell.row + toCell.rowSpan - 1);
  const toColTemp = toCustom?.colIndex ?? (toCell.col + toCell.colSpan - 1);
  const fromRow = Math.min(fromRowTemp, toRowTemp);
  const toRow = Math.max(fromRowTemp, toRowTemp);
  const fromCol = Math.min(fromColTemp, toColTemp);
  const toCol = Math.max(fromColTemp, toColTemp);
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

  // //
  // const startCell = grid.getCellByContainerId(start.childContainerId);
  // const endCell = grid.getCellByContainerId(end.childContainerId);
  // //
  // const children: string[] = [];
  // let cellData: DocBlockAttributes = {};
  // //
  // const oldDoc = editor.doc.toJSON();
  // let childContainers: { [index: string]: DocBlock[] } = {};
  // //
  // const startRow = startCell.row;
  // const startCol = startCell.col;
  // const endRow = endCell.row + endCell.rowSpan - 1;
  // const endCol = endCell.col + endCell.colSpan - 1;
  // for (let row = startRow; row <= endRow; row++) {
  //   for (let col = startCol; col <= endCol; col++) {
  //     //
  //     const cell = grid.getCell({ row, col });
  //     if (cell.virtual) {
  //       continue;
  //     }
  //     //
  //     children.push(cell.containerId);
  //     cellData = {
  //       ...cellData,
  //       ...pickContainerData(blockData, cell.containerId),
  //     };
  //     //
  //     const childDocs = getChildBlocks(editor.getContainerById(cell.containerId)).map((block) => blockToDoc(editor, block));
  //     const childDoc = mergeDocs(childDocs);
  //     const { root, ...cellChildContainers } = childDoc.blocks;
  //     childContainers = {
  //       ...childContainers,
  //       ...cellChildContainers,
  //       [cell.containerId]: oldDoc.blocks[cell.containerId],
  //     };
  //   }
  // }
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
