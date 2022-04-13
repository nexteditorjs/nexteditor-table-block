import {
  assert, getContainerId, getLogger, getParentBlock,
  getParentContainer, isEmptyContainer, isRootContainer,
  NextEditor, NextEditorInputHandler, SimpleBlockPosition,
} from '@nexteditorjs/nexteditor-core';
import { isTableBlock } from '../table-dom';
import { TableGrid } from '../table-grid';
import { pasteTableInTableBlock } from './paste-table-in-table';

const logger = getLogger('paste-in-table-block');

class PasteEventHandler implements NextEditorInputHandler {
  constructor(private editor: NextEditor) {
    // editor input has not initialized yet
    setTimeout(() => {
      editor.input.addHandler(this);
    });
  }

  destroy() {
  }

  handleBeforePaste(editor: NextEditor, event: ClipboardEvent): boolean {
    if (!editor.selection.range.isSimple()) {
      return false;
    }
    const start = editor.selection.range.start as SimpleBlockPosition;
    if (start.offset !== 0) {
      return false;
    }
    const startBlock = editor.selection.startBlock;
    const parentContainer = getParentContainer(startBlock);
    if (isRootContainer(parentContainer)) {
      return false;
    }
    if (!isEmptyContainer(editor, parentContainer)) {
      return false;
    }
    const parentBlock = getParentBlock(parentContainer);
    assert(logger, parentBlock, 'no parent block');
    //
    if (!isTableBlock(parentBlock)) {
      return false;
    }
    //
    if (!event.clipboardData) {
      return false;
    }
    //
    const doc = editor.dataConverter.fromData(event.clipboardData);
    if (!doc) {
      return false;
    }
    //
    if (doc.blocks.root.length !== 1) {
      return false;
    }
    const blockData = doc.blocks.root[0];
    if (blockData.type !== 'table') {
      return false;
    }
    //
    logger.debug('paste child table in table');
    const grid = TableGrid.fromBlock(parentBlock);
    const cell = grid.getCellByContainerId(getContainerId(parentContainer)).cell;
    pasteTableInTableBlock(editor, doc, parentBlock, cell);
    return true;
  }
}

export function handlePasteInTableEvent(editor: NextEditor) {
  editor.addCustom('table-block-paste-event', (editor) => new PasteEventHandler(editor));
}
