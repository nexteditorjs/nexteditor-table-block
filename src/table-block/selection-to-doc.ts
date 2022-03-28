import {
  assert, blockToDoc, createComplexBlockPosition,
  DocBlock, DocBlockAttributes, DocObject,
  genId, getBlockType, getChildBlocks, mergeDocs,
  NextEditor, SelectedBlock,
} from '@nexteditorjs/nexteditor-core';
import { TableGrid } from './table-grid';

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
  assert(blockType === 'table', `invalid block type: ${blockType}`);
  const blockData = editor.getBlockData(block);

  if (start.isSimple() && end.isSimple()) {
    const children = blockData.children;
    assert(children, 'no table children');
    const first = children[0];
    const last = children[children.length - 1];
    const start = createComplexBlockPosition(block, first);
    const end = createComplexBlockPosition(block, last);
    return selectionToDoc(editor, { block: selectedBlock.block, start, end });
  }
  //
  assert(!start.isSimple() && !end.isSimple(), 'invalid block pos type');
  //
  const grid = TableGrid.fromBlock(block);
  const startCell = grid.getCellByContainerId(start.childContainerId);
  const endCell = grid.getCellByContainerId(end.childContainerId);
  //
  const children: string[] = [];
  let cellData: DocBlockAttributes = {};
  //
  const oldDoc = editor.doc.toJSON();
  let childContainers: { [index: string]: DocBlock[] } = {};
  //
  const startRow = startCell.row;
  const startCol = startCell.col;
  const endRow = endCell.row + endCell.rowSpan - 1;
  const endCol = endCell.col + endCell.colSpan - 1;
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      //
      const cell = grid.getCell({ row, col });
      if (cell.virtual) {
        continue;
      }
      //
      children.push(cell.containerId);
      cellData = {
        ...cellData,
        ...pickContainerData(blockData, cell.containerId),
      };
      //
      const childDocs = getChildBlocks(editor.getContainerById(cell.containerId)).map((block) => blockToDoc(editor, block));
      const childDoc = mergeDocs(childDocs);
      const { root, ...cellChildContainers } = childDoc.blocks;
      childContainers = {
        ...childContainers,
        ...cellChildContainers,
        [cell.containerId]: oldDoc.blocks[cell.containerId],
      };
    }
  }
  //
  const id = genId();
  const type = blockType;
  const newBlock = {
    id,
    type,
    children,
    rows: endRow - startRow + 1,
    cols: endCol - startCol + 1,
    ...cellData,
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
