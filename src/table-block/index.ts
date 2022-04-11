import {
  NextEditor, getContainerId, isContainer, assert,
  addClass, removeClass, BlockElement, ComplexBlockPosition, ComplexKindBlock,
  ContainerElement, MoveDirection, BlockPosition, SimpleBlockPosition,
  createComplexBlockPosition, EditorComplexSelectionRange,
  NextContainerOptions, isTextKindBlock, createEmptyContainer, genId, trimChar,
  ConvertBlockResult,
  getLogger,
} from '@nexteditorjs/nexteditor-core';
import { createBlockContent, handleDeleteBlock } from './create-content';
import { DocTableBlockData } from './doc-table-data';
import { getEditorSelectedContainers, getTableSelectedContainers } from './get-selected-containers';
import { selectionToDoc } from './selection-to-doc';
import { getClientRects } from './table-client-rects';
import { getTableChildContainers, getContainerCell, getTableNextContainer } from './table-container';
import { getChildContainerInCell, getBlockTable, getTableCells } from './table-dom';
import { getTableMinWidth } from './table-size';

const logger = getLogger('table-block');

function getBlockTextLength(block: BlockElement): number {
  return 1;
}

function getRangeFromPoint(editor: NextEditor, block: BlockElement, x: number, y: number): EditorComplexSelectionRange | null {
  //
  const elem = document.elementsFromPoint(x, y)[0];
  if (!elem) return null;
  //
  if (!block.contains(elem)) return null;
  if (!editor.contains(block)) return null;
  //
  if (elem instanceof HTMLTableCellElement) {
    const table = getBlockTable(block);
    const cells = getTableCells(table);
    if (cells.indexOf(elem) !== -1) {
      const container = getChildContainerInCell(elem);
      const startPos = createComplexBlockPosition(block, getContainerId(container));
      return new EditorComplexSelectionRange(editor, startPos);
    }
  }
  //
  if (!isContainer(elem)) {
    return null;
  }
  //
  const container = elem as ContainerElement;
  if (getTableChildContainers(block).indexOf(container) === -1) {
    return null;
  }
  //
  const startPos = createComplexBlockPosition(block, getContainerId(container));
  return new EditorComplexSelectionRange(editor, startPos);
}

function moveCaret(editor: NextEditor, block: BlockElement, position: SimpleBlockPosition, direction: MoveDirection): SimpleBlockPosition | null {
  return null;
}

function getCaretRect(block: BlockElement, pos: SimpleBlockPosition): DOMRect {
  return block.getBoundingClientRect();
}

function updateSelection(editor: NextEditor, block: BlockElement, from: BlockPosition, to: BlockPosition): void {
  //
  if (from.isSimple()) {
    assert(logger, to.isSimple(), 'from is simple position but to is not simple position');
    //
    logger.debug('full select table');
    addClass(block, 'full-selected');
    //
    return;
  }
  //
  assert(logger, !to.isSimple(), 'from is complex position but end is simple position');
  //
  const f = from as ComplexBlockPosition;
  const t = to as ComplexBlockPosition;
  assert(logger, f.blockId === t.blockId, 'only allow update one table selection');
  //
  const childContainers = getEditorSelectedContainers(editor, f, t);
  childContainers.forEach((c) => {
    const cell = getContainerCell(c);
    addClass(cell, 'selected');
  });
}

function clearSelection(editor: NextEditor): void {
  editor.rootContainer.querySelectorAll('[data-type="editor-block"][data-block-type="table"]').forEach((block) => {
    removeClass(block, 'full-selected');
    block.querySelectorAll('td.selected').forEach((c) => {
      removeClass(c, 'selected');
    });
  });
}

function getChildContainers(tableBlock: BlockElement): ContainerElement[] {
  return getTableChildContainers(tableBlock);
}

// eslint-disable-next-line max-len
function getNextContainer(tableBlock: BlockElement, childContainer: ContainerElement, type: MoveDirection, options?: NextContainerOptions): ContainerElement | null {
  //
  return getTableNextContainer(tableBlock, childContainer, type, options);
}

function getMinWidth(editor: NextEditor, tableBlock: BlockElement) {
  //
  return getTableMinWidth(editor, tableBlock);
  //
}

function convertFrom(editor: NextEditor, srcBlock: BlockElement): ConvertBlockResult | null {
  //
  if (!isTextKindBlock(editor, srcBlock)) {
    return null;
  }
  //
  const text = trimChar(editor.getBlockString(srcBlock).trim(), '|');
  const columns = text.split('|');
  const colCount = columns.length;
  if (colCount < 2) return null;
  //
  const rows = 3;
  const cols = columns.length;
  //
  const children: string[] = [];
  for (let i = 0; i < 3; i++) {
    //
    columns.forEach((text) => {
      children.push(createEmptyContainer(editor.doc, i === 0 ? text : ''));
    });
    //
  }
  //
  const focusContainerId = children[cols];
  const focusBlockId = editor.doc.getContainerBlocks(focusContainerId)[0].id;
  //
  const blockData: DocTableBlockData = {
    id: genId(),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    type: TableBlock.blockType,
    rows,
    cols,
    children,
  };
  return {
    blockData,
    focusBlockId,
  };
}

// TODO: add selection to block

const TableBlock: ComplexKindBlock = {
  blockType: 'table',
  blockKind: 'complex',
  enableKeyboardSelect: true,
  createBlockContent,
  getBlockTextLength,
  getRangeFromPoint,
  moveCaret,
  getCaretRect,
  updateSelection,
  clearSelection,
  getChildContainers,
  getNextContainer,
  getMinWidth,
  getSelectedContainers: getTableSelectedContainers,
  convertFrom,
  handleDeleteBlock,
  getClientRects,
  selectionToDoc,
};

export default TableBlock;
