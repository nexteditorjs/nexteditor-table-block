import { assert, BlockElement, getLogger, getParentBlock, getParentContainer, isChildNode, NextEditor } from '@nexteditorjs/nexteditor-core';
import { getParentTableBlock, isTableBlock } from '../table-dom';
import { TableBorderBar } from './table-border-bar';

const logger = getLogger('table-border-bar');

class TableBlockBorderHandler {
  private activeTableBar: TableBorderBar | null = null;

  constructor(private editor: NextEditor) {
    this.editor.addListener('blockDeleted', this.handleBlockDeleted);
    this.editor.addListener('selectionChanged', this.handleSelectionChanged);
  }

  destroy() {
    this.editor.removeListener('blockDeleted', this.handleBlockDeleted);
    this.editor.removeListener('selectionChanged', this.handleSelectionChanged);
  }

  handleBlockDeleted = (editor: NextEditor, block: BlockElement) => {
    if (!this.activeTableBar) {
      return;
    }
    if (block === this.activeTableBar.tableBlock || isChildNode(block, this.activeTableBar.tableBlock)) {
      this.activeTableBar.destroy();
      this.activeTableBar = null;
    }
  };

  handleSelectionChanged = (editor: NextEditor) => {
    const range = editor.selection.range;
    let activeTableBlock: BlockElement | null = null;
    if (range.isCollapsed() && range.isSimple()) {
      const block = editor.getBlockById(range.start.blockId);
      if (isTableBlock(block)) {
        const parent = getParentContainer(block);
        const parentBlock = getParentBlock(parent);
        if (parentBlock) {
          activeTableBlock = getParentTableBlock(parentBlock);
        }
      } else {
        activeTableBlock = getParentTableBlock(block);
      }
    } else {
      //
      const startBlock = editor.getBlockById(range.start.blockId);
      const startActiveTableBlock = getParentTableBlock(startBlock);
      //
      const endBlock = editor.getBlockById(range.end.blockId);
      const endActiveTableBlock = getParentTableBlock(endBlock);
      if (startActiveTableBlock === endActiveTableBlock) {
        activeTableBlock = startActiveTableBlock;
      }
    }
    if (this.activeTableBar?.tableBlock !== activeTableBlock) {
      if (this.activeTableBar) {
        this.hide();
      }
    }
    if (activeTableBlock) {
      this.show(activeTableBlock);
    }
  };

  show(tableBlock: BlockElement) {
    if (this.activeTableBar) {
      if (this.activeTableBar.tableBlock !== tableBlock) {
        this.hide();
      }
      // update
      this.activeTableBar.update();
    } else {
      this.activeTableBar = new TableBorderBar(this.editor, tableBlock);
    }
  }

  hide() {
    if (!this.activeTableBar) {
      return;
    }
    assert(logger, this.activeTableBar, 'no active table bar');
    this.activeTableBar.destroy();
    this.activeTableBar = null;
  }
}

export function handleTableBorderBar(editor: NextEditor) {
  editor.addCustom('table-border-bar', (editor) => new TableBlockBorderHandler(editor));
}
